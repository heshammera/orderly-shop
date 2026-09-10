BEGIN;
CREATE OR REPLACE FUNCTION public.place_order_atomic(payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
 sid uuid:=(payload->>'store_id')::uuid; rk uuid:=(payload->>'request_key')::uuid;
 st stores%ROWTYPE; p products%ROWTYPE; opt variant_options%ROWTYPE; cp coupons%ROWTYPE; offer upsell_offers%ROWTYPE;
 prior orders%ROWTYPE; line jsonb; choice jsonb; oid uuid:=gen_random_uuid(); cid uuid; n integer; grouped_n integer;
 price numeric; base numeric; subtotal numeric:=0; eligible numeric:=0; disc numeric:=0; shipping numeric:=0; total numeric;
 lines jsonb:='[]'; choices jsonb; seen uuid[]; selected_variant uuid; customer_phone text;
 coupon_input_code text:=nullif(trim(payload->>'couponCode'),''); fingerprint text:=md5(payload::text);
 order_no text:='ORD-'||upper(replace(gen_random_uuid()::text,'-','')); plan jsonb; lim integer; uses integer;
 all_free boolean:=true; gov text:=payload->>'selectedGovernorate'; snap jsonb;
BEGIN
 IF rk IS NULL OR sid IS NULL OR jsonb_typeof(payload->'cart') <> 'array' OR jsonb_array_length(payload->'cart') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'بيانات الطلب غير صالحة'; END IF;
 SELECT * INTO st FROM stores WHERE id=sid FOR UPDATE;
 IF NOT FOUND OR st.status <> 'active' THEN RAISE EXCEPTION 'المتجر غير متاح للشراء'; END IF;
 SELECT * INTO prior FROM orders WHERE store_id=sid AND request_key=rk;
 IF FOUND THEN
   IF prior.request_fingerprint IS DISTINCT FROM fingerprint THEN RAISE EXCEPTION 'تغير الطلب أثناء إعادة المحاولة؛ حدّث الصفحة'; END IF;
   RETURN jsonb_build_object('success',true,'order_id',prior.id,'order_number',prior.order_number,'total',prior.total,'replayed',true);
 END IF;
 IF coalesce((payload->>'redeemPoints')::boolean,false) THEN RAISE EXCEPTION 'استبدال النقاط يحتاج تفعيل التحقق من هوية العميل'; END IF;
 IF coalesce((payload->'bumpOffer'->>'selected')::boolean,false) THEN RAISE EXCEPTION 'أضف منتج العرض للسلة قبل تأكيد الطلب'; END IF;
 IF coalesce(payload->>'paymentMethod','cod') <> 'cod' THEN RAISE EXCEPTION 'طريقة الدفع غير مفعلة'; END IF;
 customer_phone:=regexp_replace(coalesce(payload->'formData'->>'phone',''),'[^0-9+]','','g');
 IF customer_phone !~ '^\+?[0-9]{8,15}$' OR length(trim(coalesce(payload->'formData'->>'name',''))) NOT BETWEEN 2 AND 150 OR length(trim(coalesce(payload->'formData'->>'address',''))) NOT BETWEEN 3 AND 1000 THEN RAISE EXCEPTION 'راجع الاسم ورقم الهاتف والعنوان'; END IF;
 plan:=get_store_effective_plan(sid)::jsonb;
 IF coalesce((plan->>'has_plan')::boolean,false)=false THEN RAISE EXCEPTION 'المتجر يحتاج باقة سارية'; END IF;
 lim:=(plan->'plan'->'features'->>'orders_limit')::integer;
 IF lim IS NOT NULL AND lim>=0 AND (SELECT count(*) FROM orders WHERE store_id=sid AND created_at>=date_trunc('month',now()))>=lim THEN RAISE EXCEPTION 'تم الوصول للحد الأقصى للطلبات'; END IF;
 FOR line IN SELECT value FROM jsonb_array_elements(payload->'cart') LOOP
   n:=(line->>'quantity')::integer;
   IF n IS NULL OR n<1 OR n>1000 THEN RAISE EXCEPTION 'كمية غير صالحة'; END IF;
   SELECT * INTO p FROM products WHERE id=(line->>'productId')::uuid AND store_id=sid AND status='active' FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'المنتج غير متاح'; END IF;
   SELECT sum((x->>'quantity')::integer) INTO grouped_n FROM jsonb_array_elements(payload->'cart') x WHERE x->>'productId'=p.id::text;
   IF p.max_per_order IS NOT NULL AND grouped_n>p.max_per_order THEN RAISE EXCEPTION 'تجاوز الحد الأقصى للمنتج'; END IF;
   IF NOT p.ignore_stock AND p.track_inventory AND p.stock_quantity<n THEN RAISE EXCEPTION 'الكمية المطلوبة غير متوفرة'; END IF;
   base:=CASE WHEN p.sale_price>0 THEN p.sale_price ELSE p.price END; price:=base; choices:='[]';seen:='{}';
   FOR choice IN SELECT value FROM jsonb_array_elements(coalesce(line->'variants','[]')) LOOP
     SELECT o.* INTO opt FROM variant_options o JOIN product_variants v ON v.id=o.variant_id WHERE o.id=(choice->>'optionId')::uuid AND v.product_id=p.id FOR UPDATE OF o;
     IF NOT FOUND OR opt.variant_id=ANY(seen) THEN RAISE EXCEPTION 'خيارات المنتج غير صالحة'; END IF;
     seen:=array_append(seen,opt.variant_id);
     IF NOT p.ignore_stock AND opt.manage_stock AND opt.stock<n THEN RAISE EXCEPTION 'خيار المنتج غير متوفر بالكمية المطلوبة'; END IF;
     price:=price+CASE WHEN opt.price IS NOT NULL THEN opt.price-base ELSE coalesce(opt.price_modifier,0) END;
     choices:=choices||jsonb_build_array(jsonb_build_object('optionId',opt.id,'optionLabel',opt.label,'variantId',opt.variant_id));
     IF NOT p.ignore_stock AND opt.manage_stock THEN UPDATE variant_options SET stock=stock-n WHERE id=opt.id; END IF;
   END LOOP;
   IF EXISTS(SELECT 1 FROM product_variants WHERE product_id=p.id AND required AND NOT(id=ANY(seen))) THEN RAISE EXCEPTION 'اختر الخيارات المطلوبة للمنتج'; END IF;
   SELECT * INTO offer FROM upsell_offers WHERE product_id=p.id AND is_active AND min_quantity<=grouped_n ORDER BY min_quantity DESC,sort_order LIMIT 1;
   IF FOUND THEN price:=greatest(0,price-CASE WHEN offer.discount_type='percentage' THEN price*offer.discount_value/100 ELSE offer.discount_value END); END IF;
   price:=round(price,2);IF price<0 THEN RAISE EXCEPTION 'سعر المنتج غير صالح'; END IF;
   IF NOT p.ignore_stock AND p.track_inventory THEN UPDATE products SET stock_quantity=stock_quantity-n WHERE id=p.id; END IF;
   subtotal:=subtotal+price*n;all_free:=all_free AND p.free_shipping;
   lines:=lines||jsonb_build_array(jsonb_build_object('product_id',p.id,'quantity',n,'unit_price',price,'total_price',price*n,'product_snapshot',jsonb_build_object('name',p.name,'variants',choices)));
 END LOOP;
 IF NOT all_free THEN
   IF st.settings->'shipping'->>'type'='dynamic' THEN
     IF gov IS NULL OR NOT coalesce(st.settings->'shipping'->'governorate_prices','{}') ? gov THEN RAISE EXCEPTION 'اختر منطقة شحن متاحة'; END IF;
     shipping:=(st.settings->'shipping'->'governorate_prices'->>gov)::numeric;
   ELSE shipping:=coalesce((st.settings->'shipping'->>'fixed_price')::numeric,0); END IF;
 END IF;
 IF shipping<0 THEN RAISE EXCEPTION 'إعداد تكلفة الشحن غير صالح'; END IF;
 IF coupon_input_code IS NOT NULL THEN
   SELECT * INTO cp FROM coupons WHERE store_id=sid AND lower(coupons.code)=lower(coupon_input_code) AND is_active FOR UPDATE;
   IF NOT FOUND OR cp.starts_at>now() OR cp.expires_at<now() OR (cp.usage_limit IS NOT NULL AND cp.used_count>=cp.usage_limit) OR subtotal<coalesce(cp.min_order_amount,0) THEN RAISE EXCEPTION 'الكوبون غير صالح لهذا الطلب'; END IF;
   SELECT count(*) INTO uses FROM orders WHERE store_id=sid AND coupon_code=cp.code AND customer_snapshot->>'phone'=customer_phone AND status<>'cancelled';
   IF cp.max_per_customer IS NOT NULL AND uses>=cp.max_per_customer THEN RAISE EXCEPTION 'تم استنفاد استخدامات الكوبون لهذا العميل'; END IF;
   FOR line IN SELECT value FROM jsonb_array_elements(lines) LOOP
     IF (coalesce(cardinality(cp.target_products),0)=0 AND coalesce(cardinality(cp.target_categories),0)=0)
       OR (line->>'product_id')::uuid=ANY(cp.target_products)
       OR EXISTS(SELECT 1 FROM product_categories WHERE product_id=(line->>'product_id')::uuid AND category_id=ANY(cp.target_categories)) THEN eligible:=eligible+(line->>'total_price')::numeric; END IF;
   END LOOP;
   IF eligible<=0 THEN RAISE EXCEPTION 'الكوبون لا ينطبق على منتجات السلة'; END IF;
   disc:=least(eligible,greatest(0,round(CASE WHEN cp.discount_type='percentage' THEN eligible*cp.discount_value/100 ELSE cp.discount_value END,2)));
   UPDATE coupons SET used_count=coalesce(used_count,0)+1 WHERE id=cp.id;coupon_input_code:=cp.code;
 END IF;
 total:=round(subtotal-disc+shipping,2);
 SELECT id INTO cid FROM customers WHERE store_id=sid AND phone=customer_phone LIMIT 1 FOR UPDATE;
 IF NOT FOUND THEN INSERT INTO customers(store_id,name,phone,address,total_orders,total_spent) VALUES(sid,left(payload->'formData'->>'name',150),customer_phone,jsonb_build_object('city',payload->'formData'->>'city','full_address',payload->'formData'->>'address'),0,0) RETURNING id INTO cid; END IF;
 snap:=jsonb_build_object('name',left(payload->'formData'->>'name',150),'phone',customer_phone,'alt_phone',left(payload->'formData'->>'alt_phone',30),'city',left(payload->'formData'->>'city',150),'address',left(payload->'formData'->>'address',1000));
 INSERT INTO orders(id,store_id,customer_id,order_number,status,subtotal,subtotal_amount,discount,discount_amount,total,shipping_cost,currency,customer_snapshot,shipping_address,notes,coupon_code,affiliate_code,request_key,request_fingerprint)
 VALUES(oid,sid,cid,order_no,'pending',subtotal,subtotal,disc,disc,total,shipping,st.currency,snap,jsonb_build_object('city',snap->>'city','address',snap->>'address','governorate_id',gov),left(payload->'formData'->>'notes',2000),coupon_input_code,left(payload->>'affiliate_code',100),rk,fingerprint);
 FOR line IN SELECT value FROM jsonb_array_elements(lines) LOOP
 INSERT INTO order_items(order_id,product_id,quantity,unit_price,total_price,product_snapshot) VALUES(oid,(line->>'product_id')::uuid,(line->>'quantity')::integer,(line->>'unit_price')::numeric,(line->>'total_price')::numeric,line->'product_snapshot');END LOOP;
 UPDATE customers SET total_orders=total_orders+1,total_spent=total_spent+total WHERE id=cid;
 RETURN jsonb_build_object('success',true,'order_id',oid,'order_number',order_no,'total',total,'subtotal',subtotal,'shipping_cost',shipping,'discount',disc,'replayed',false);
END;$$;
REVOKE ALL ON FUNCTION public.place_order_atomic(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_atomic(jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
