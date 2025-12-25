-- =====================================================
-- VERIFY SAVED POSTS TABLE EXISTS
-- Run this to check if the saved_posts table was created
-- =====================================================

-- Check if saved_posts table exists
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name = 'saved_posts';

-- If the above returns a row, table exists ✅
-- If it returns nothing, run ADD_SAVED_POSTS_TABLE.sql first ❌

-- Check saved_posts structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'saved_posts'
ORDER BY ordinal_position;

-- Check if indexes exist
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'saved_posts';

-- Check if policies exist
SELECT 
  policyname,
  tablename,
  cmd
FROM pg_policies
WHERE tablename = 'saved_posts';

-- Test query (should return empty result, not error)
SELECT * FROM saved_posts LIMIT 1;

-- =====================================================
-- If any of these queries fail, you need to:
-- 1. Open ADD_SAVED_POSTS_TABLE.sql
-- 2. Run the entire script in Supabase SQL Editor
-- 3. Refresh your browser
-- =====================================================
