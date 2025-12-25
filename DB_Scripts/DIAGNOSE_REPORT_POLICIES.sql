-- =====================================================
-- DIAGNOSE RLS POLICIES FOR post_reports
-- =====================================================

-- Check if post_reports table exists
SELECT EXISTS (
  SELECT FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'post_reports'
) as table_exists;

-- Check RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'post_reports';

-- List all policies on post_reports
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'post_reports';

-- =====================================================
-- Run this to see current state of policies
-- =====================================================
