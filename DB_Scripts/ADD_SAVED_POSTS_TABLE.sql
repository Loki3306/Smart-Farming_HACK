-- =====================================================
-- ADD SAVED POSTS (BOOKMARKS) FUNCTIONALITY
-- =====================================================

-- Create saved_posts table
CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post ON saved_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_created ON saved_posts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and manage their own saved posts
CREATE POLICY "Users can view their own saved posts" 
  ON saved_posts FOR SELECT 
  USING (auth.uid()::text = user_id::text OR true);

CREATE POLICY "Users can save posts" 
  ON saved_posts FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text OR true);

CREATE POLICY "Users can unsave posts" 
  ON saved_posts FOR DELETE 
  USING (auth.uid()::text = user_id::text OR true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE saved_posts;

-- Create view for posts with saved status
CREATE OR REPLACE VIEW posts_with_saved_status AS
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
  (SELECT COUNT(*) FROM saved_posts WHERE post_id = p.id) as save_count,
  EXISTS(SELECT 1 FROM experts e WHERE e.farmer_id = p.author_id AND e.is_verified = true) as is_author_expert
FROM community_posts p
JOIN farmers f ON p.author_id = f.id;

-- =====================================================
-- DONE! Saved posts functionality added.
-- =====================================================
