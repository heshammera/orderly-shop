-- تحقق من بيانات المتجر والمستخدم الحالي
-- نفّذ هذا الاستعلام في Supabase SQL Editor

-- 1. تحقق من معلومات المتجر والعملة
SELECT id, name, currency, owner_id 
FROM stores 
LIMIT 5;

-- 2. تحقق من المستخدم الحالي
SELECT auth.uid() as current_user_id;

-- 3. تحقق من الطلبات الموجودة
SELECT id, store_id, status, total, currency, created_at 
FROM orders 
LIMIT 10;

-- 4. تحقق من عدد الطلبات لكل متجر
SELECT store_id, COUNT(*) as order_count, SUM(total) as total_revenue
FROM orders 
GROUP BY store_id;

-- 5. تحقق من صلاحيات RLS الحالية على orders
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'orders';

-- 6. تحقق إذا كان المستخدم الحالي هو مالك المتجر
SELECT 
    s.id as store_id,
    s.name as store_name,
    s.owner_id,
    auth.uid() as current_user,
    (s.owner_id = auth.uid()) as is_owner
FROM stores s
LIMIT 5;
