-- =====================================================
-- ADD POST REPORTING FUNCTIONALITY
-- =====================================================

-- Create post_reports table
CREATE TABLE IF NOT EXISTS post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'misinformation', 'harassment', 'other')),
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES farmers(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, reporter_id) -- Prevent duplicate reports from same user
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_post ON post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON post_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON post_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON post_reports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view reports (for now, can be restricted later)
CREATE POLICY "Anyone can view reports" 
  ON post_reports FOR SELECT 
  USING (true);

-- Policy: Anyone can create reports (validated by application logic)
CREATE POLICY "Anyone can create reports" 
  ON post_reports FOR INSERT 
  WITH CHECK (true);

-- Policy: Anyone can update reports (for future admin features)
CREATE POLICY "Anyone can update reports" 
  ON post_reports FOR UPDATE 
  USING (true);

-- Note: These policies are permissive for custom auth.
-- Application-level validation ensures only authorized actions occur.

-- Add to realtime publication for admin notifications
ALTER PUBLICATION supabase_realtime ADD TABLE post_reports;

-- Function to get report count for a post
CREATE OR REPLACE FUNCTION get_post_report_count(p_post_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM post_reports WHERE post_id = p_post_id AND status = 'pending');
END;
$$ LANGUAGE plpgsql;

-- Function to check if post should be auto-hidden (3+ reports)
CREATE OR REPLACE FUNCTION should_auto_hide_post(p_post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM post_reports WHERE post_id = p_post_id AND status = 'pending') >= 3;
END;
$$ LANGUAGE plpgsql;

-- View for reported posts (admin use)
CREATE OR REPLACE VIEW reported_posts_summary AS
SELECT 
  p.id as post_id,
  p.content,
  p.post_type,
  p.author_id,
  f.name as author_name,
  COUNT(DISTINCT r.id) as report_count,
  jsonb_agg(
    jsonb_build_object(
      'reason', r.reason,
      'details', r.details,
      'reporter_id', r.reporter_id,
      'created_at', r.created_at
    )
  ) as reports,
  MAX(r.created_at) as latest_report_at,
  should_auto_hide_post(p.id) as should_hide
FROM community_posts p
JOIN farmers f ON p.author_id = f.id
JOIN post_reports r ON p.id = r.post_id
WHERE r.status = 'pending'
GROUP BY p.id, p.content, p.post_type, p.author_id, f.name
ORDER BY report_count DESC, latest_report_at DESC;

-- =====================================================
-- DONE! Report system ready.
-- Run this in Supabase SQL Editor
-- =====================================================
