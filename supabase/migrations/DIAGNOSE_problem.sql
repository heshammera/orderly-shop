-- هذا الاستعلام سيخبرنا بالضبط ما هي المشكلة
-- قم بتنفيذه في Supabase SQL Editor

-- 1. تحقق من وجود is_store_member function
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_store_member';

-- إذا كانت النتيجة فارغة، فالمشكلة هنا!


-- 2. تحقق من عدد Policies الموجودة
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
GROUP BY tablename;

-- النتيجة المتوقعة:
-- orders: 4
-- order_items: 4


-- 3. تحقق من أسماء Policies بالضبط
SELECT tablename, policyname
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;
