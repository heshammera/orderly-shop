-- بعد تنفيذ 20260209140000_FINAL_fix_orders_rls.sql
-- قم بتنفيذ هذا للتحقق من أن كل شيء يعمل:

-- 1. تحقق من Policies الموجودة الآن
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;

-- النتيجة المتوقعة: 8 policies (4 لكل جدول)

-- 2. اختبر الوصول (من داخل التطبيق، ليس SQL Editor)
-- هذا الاستعلام سيعمل تلقائياً في التطبيق
-- SELECT * FROM orders WHERE store_id = 'YOUR_STORE_ID';
