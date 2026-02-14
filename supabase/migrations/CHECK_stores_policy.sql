-- Check RLS policies on stores table
SELECT * FROM pg_policies WHERE tablename = 'stores';
