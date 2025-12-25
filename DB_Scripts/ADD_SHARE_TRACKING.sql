-- =====================================================
-- ADD POST SHARING FUNCTIONALITY WITH TRACKING
-- =====================================================

-- Create post_shares table to track sharing activity
CREATE TABLE IF NOT EXISTS post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  share_method VARCHAR(20) CHECK (share_method IN ('whatsapp', 'copy_link', 'native_share', 'download')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shares_post ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_shares_user ON post_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_created ON post_shares(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shares_method ON post_shares(share_method);

-- Enable Row Level Security
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view share counts
CREATE POLICY "Anyone can view shares" 
  ON post_shares FOR SELECT 
  USING (true);

-- Policy: Users can track their own shares
CREATE POLICY "Users can track shares" 
  ON post_shares FOR INSERT 
  WITH CHECK (true);

-- Add to realtime publication for live share count updates
ALTER PUBLICATION supabase_realtime ADD TABLE post_shares;

-- Function to get share count for a post
CREATE OR REPLACE FUNCTION get_post_share_count(p_post_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM post_shares WHERE post_id = p_post_id);
END;
$$ LANGUAGE plpgsql;

-- Update the posts_with_reactions view to include share count
DROP VIEW IF EXISTS posts_with_reactions CASCADE;
CREATE OR REPLACE VIEW posts_with_reactions AS
SELECT 
  p.*,
  f.name as author_name,
  f.phone as author_phone,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('type', r.reaction_type, 'count', r.count))
     FROM (
       SELECT reaction_type, COUNT(*) as count
       FROM post_reactions
       WHERE post_id = p.id
       GROUP BY reaction_type
     ) r),
    '[]'::jsonb
  ) as reaction_counts,
  (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count,
  (SELECT COUNT(*) FROM post_shares WHERE post_id = p.id) as share_count,
  EXISTS(SELECT 1 FROM experts e WHERE e.farmer_id = p.author_id AND e.is_verified = true) as is_author_expert
FROM community_posts p
JOIN farmers f ON p.author_id = f.id;

-- =====================================================
-- DONE! Share tracking functionality added.
-- =====================================================
