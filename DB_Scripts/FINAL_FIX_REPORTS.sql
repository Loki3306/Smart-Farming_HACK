-- =====================================================
-- PROPER FIX: Match pattern used in COMMUNITY_SCHEMA
-- =====================================================

-- 1. Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Users can view own reports" ON post_reports;
DROP POLICY IF EXISTS "Users can create reports" ON post_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON post_reports;
DROP POLICY IF EXISTS "Anyone can view reports" ON post_reports;
DROP POLICY IF EXISTS "Anyone can create reports" ON post_reports;
DROP POLICY IF EXISTS "Anyone can update reports" ON post_reports;
DROP POLICY IF EXISTS "Allow all on post_reports" ON post_reports;

-- 2. Create single permissive policy (matches community_posts pattern)
CREATE POLICY "Allow all on post_reports" 
  ON post_reports 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- =====================================================
-- This matches the exact pattern used for:
-- - community_posts
-- - post_reactions  
-- - post_comments
-- - post_shares
-- - saved_posts
-- =====================================================
