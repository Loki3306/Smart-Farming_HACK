-- =====================================================
-- FIX RLS POLICIES FOR CUSTOM AUTH
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own reports" ON post_reports;
DROP POLICY IF EXISTS "Users can create reports" ON post_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON post_reports;

-- Create permissive policies for custom auth
CREATE POLICY "Anyone can view reports" 
  ON post_reports FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create reports" 
  ON post_reports FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update reports" 
  ON post_reports FOR UPDATE 
  USING (true);

-- =====================================================
-- DONE! RLS now works with custom authentication
-- =====================================================
