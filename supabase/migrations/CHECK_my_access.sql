-- التحقق النهائي: هل أنت فعلاً Owner أو Member؟
-- نفذ هذا في Supabase SQL Editor وأرسل لي النتيجة

-- 1. تحقق من المتجر الذي تحاول الوصول إليه
-- (استبدل 'YOUR_STORE_ID' بـ ID المتجر من الـ URL)
SELECT 
    id as store_id,
    name,
    owner_id,
    currency
FROM stores 
WHERE id = 'c2177125-f970-4fc8-be6b-ce18a36bf59f'; -- استبدل هذا بـ ID متجرك من URL


-- 2. تحقق من المستخدم الحالي
SELECT auth.uid() as my_user_id;


-- 3. تحقق: هل أنت في store_members؟
SELECT * 
FROM store_members 
WHERE store_id = 'c2177125-f970-4fc8-be6b-ce18a36bf59f'; -- نفس ID المتجر


-- 4. اختبر is_store_member function مباشرة
SELECT is_store_member(
    auth.uid(), 
    'c2177125-f970-4fc8-be6b-ce18a36bf59f'::uuid -- نفس ID المتجر
) as am_i_member;


-- 5. تحقق من الطلبات (هل ترى أي شيء؟)
SELECT id, status, total 
FROM orders 
WHERE store_id = 'c2177125-f970-4fc8-be6b-ce18a36bf59f' -- نفس ID المتجر
LIMIT 5;
