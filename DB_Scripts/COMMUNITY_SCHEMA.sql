-- =====================================================
-- COMMUNITY PAGE DATABASE SCHEMA FOR SUPABASE
-- Real-time enabled tables for Smart Farming Platform
-- =====================================================

-- =====================================================
-- STEP 1: DROP EXISTING COMMUNITY TABLES (if any)
-- =====================================================
DROP TABLE IF EXISTS ai_summaries CASCADE;
DROP TABLE IF EXISTS expert_follows CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_reactions CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS experts CASCADE;
DROP TABLE IF EXISTS community_stats CASCADE;

-- =====================================================
-- STEP 2: CREATE COMMUNITY TABLES
-- =====================================================

-- Experts Profile (extends farmers table)
CREATE TABLE IF NOT EXISTS experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE UNIQUE,
  specializations TEXT[] DEFAULT '{}',
  experience VARCHAR(50),
  is_verified BOOLEAN DEFAULT false,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community Posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  post_type VARCHAR(20) NOT NULL CHECK (post_type IN ('success', 'question', 'problem', 'update')),
  content TEXT NOT NULL,
  crop VARCHAR(100),
  method VARCHAR(200),
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_trending BOOLEAN DEFAULT false,
  has_expert_reply BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Reactions (one per user per post per type - prevents duplicates)
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('helpful', 'tried', 'didnt_work', 'new_idea')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id, reaction_type)
);

-- Post Comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_expert_reply BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expert Follows
CREATE TABLE IF NOT EXISTS expert_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
  follower_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(expert_id, follower_id)
);

-- Community Stats (single row, updated periodically)
CREATE TABLE IF NOT EXISTS community_stats (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  active_farmers INTEGER DEFAULT 0,
  posts_today INTEGER DEFAULT 0,
  questions_answered_percent INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Summaries Cache (one per post)
CREATE TABLE IF NOT EXISTS ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE UNIQUE,
  summary TEXT NOT NULL,
  common_solution TEXT,
  warnings TEXT,
  best_practice TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_crop ON community_posts(crop);
CREATE INDEX IF NOT EXISTS idx_posts_trending ON community_posts(is_trending) WHERE is_trending = true;

CREATE INDEX IF NOT EXISTS idx_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON post_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON post_comments(author_id);

CREATE INDEX IF NOT EXISTS idx_expert_follows_expert ON expert_follows(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_follows_follower ON expert_follows(follower_id);

CREATE INDEX IF NOT EXISTS idx_experts_farmer ON experts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_experts_active ON experts(last_active_at DESC);

-- Full-text search index for post content
CREATE INDEX IF NOT EXISTS idx_posts_content_search ON community_posts USING GIN(to_tsvector('english', content));

-- =====================================================
-- STEP 4: CREATE VIEWS FOR AGGREGATED DATA
-- =====================================================

-- View: Post with reaction counts
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
  EXISTS(SELECT 1 FROM experts e WHERE e.farmer_id = p.author_id AND e.is_verified = true) as is_author_expert
FROM community_posts p
JOIN farmers f ON p.author_id = f.id;

-- View: Experts with follower counts
CREATE OR REPLACE VIEW experts_with_stats AS
SELECT 
  e.*,
  f.name as expert_name,
  f.phone as expert_phone,
  (SELECT COUNT(*) FROM expert_follows WHERE expert_id = e.id) as follower_count,
  (SELECT COUNT(*) FROM post_comments c 
   JOIN community_posts p ON c.post_id = p.id 
   WHERE c.author_id = e.farmer_id AND c.is_expert_reply = true) as questions_answered,
  (e.last_active_at > NOW() - INTERVAL '7 days') as is_active_this_week
FROM experts e
JOIN farmers f ON e.farmer_id = f.id;

-- =====================================================
-- STEP 5: CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function: Update expert activity timestamp
CREATE OR REPLACE FUNCTION update_expert_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE experts 
  SET last_active_at = NOW()
  WHERE farmer_id = NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update expert activity on post
DROP TRIGGER IF EXISTS expert_post_activity ON community_posts;
CREATE TRIGGER expert_post_activity
AFTER INSERT ON community_posts
FOR EACH ROW EXECUTE FUNCTION update_expert_activity();

-- Trigger: Update expert activity on comment
DROP TRIGGER IF EXISTS expert_comment_activity ON post_comments;
CREATE TRIGGER expert_comment_activity
AFTER INSERT ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_expert_activity();

-- Function: Mark post as having expert reply
CREATE OR REPLACE FUNCTION mark_expert_reply()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if commenter is an expert
  IF EXISTS (SELECT 1 FROM experts WHERE farmer_id = NEW.author_id AND is_verified = true) THEN
    NEW.is_expert_reply := true;
    -- Also update the post
    UPDATE community_posts SET has_expert_reply = true WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-mark expert replies
DROP TRIGGER IF EXISTS auto_mark_expert_reply ON post_comments;
CREATE TRIGGER auto_mark_expert_reply
BEFORE INSERT ON post_comments
FOR EACH ROW EXECUTE FUNCTION mark_expert_reply();

-- Function: Update community stats
CREATE OR REPLACE FUNCTION update_community_stats()
RETURNS void AS $$
DECLARE
  v_active_farmers INTEGER;
  v_posts_today INTEGER;
  v_questions_answered INTEGER;
  v_total_questions INTEGER;
BEGIN
  -- Active farmers (posted or commented in last 24h)
  SELECT COUNT(DISTINCT author_id) INTO v_active_farmers
  FROM (
    SELECT author_id FROM community_posts WHERE created_at > NOW() - INTERVAL '24 hours'
    UNION
    SELECT author_id FROM post_comments WHERE created_at > NOW() - INTERVAL '24 hours'
  ) active;

  -- Posts today
  SELECT COUNT(*) INTO v_posts_today
  FROM community_posts 
  WHERE created_at > CURRENT_DATE;

  -- Questions answered percentage
  SELECT COUNT(*) INTO v_total_questions
  FROM community_posts WHERE post_type = 'question';

  SELECT COUNT(*) INTO v_questions_answered
  FROM community_posts p
  WHERE p.post_type = 'question'
  AND EXISTS (SELECT 1 FROM post_comments c WHERE c.post_id = p.id);

  -- Update stats table
  INSERT INTO community_stats (id, active_farmers, posts_today, questions_answered_percent, updated_at)
  VALUES (1, v_active_farmers, v_posts_today, 
    CASE WHEN v_total_questions > 0 THEN (v_questions_answered * 100 / v_total_questions) ELSE 0 END,
    NOW())
  ON CONFLICT (id) DO UPDATE SET
    active_farmers = EXCLUDED.active_farmers,
    posts_today = EXCLUDED.posts_today,
    questions_answered_percent = EXCLUDED.questions_answered_percent,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for now (restrict in production)
CREATE POLICY "Allow all on experts" ON experts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on community_posts" ON community_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on post_reactions" ON post_reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on post_comments" ON post_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expert_follows" ON expert_follows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on community_stats" ON community_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ai_summaries" ON ai_summaries FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STEP 7: ENABLE REALTIME
-- =====================================================

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE expert_follows;
ALTER PUBLICATION supabase_realtime ADD TABLE community_stats;

-- =====================================================
-- STEP 8: INSERT INITIAL DATA
-- =====================================================

-- Initialize community stats
INSERT INTO community_stats (id, active_farmers, posts_today, questions_answered_percent)
VALUES (1, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 9: CREATE SEED DATA FOR DEVELOPMENT
-- =====================================================

-- Note: Run this section only once for development setup
-- Comment out in production

-- Create test farmers if they don't exist
INSERT INTO farmers (id, name, phone, password, experience)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Ramesh Patil', '+911111111111', 'test123', '10 years'),
  ('22222222-2222-2222-2222-222222222222', 'Sunita Devi', '+912222222222', 'test123', '5 years'),
  ('33333333-3333-3333-3333-333333333333', 'Mohan Singh', '+913333333333', 'test123', '15 years'),
  ('44444444-4444-4444-4444-444444444444', 'Dr. Anil Sharma', '+914444444444', 'test123', '25 years'),
  ('55555555-5555-5555-5555-555555555555', 'Prof. Meera Patel', '+915555555555', 'test123', '18 years')
ON CONFLICT (phone) DO NOTHING;

-- Create test experts
INSERT INTO experts (farmer_id, specializations, experience, is_verified)
VALUES 
  ('44444444-4444-4444-4444-444444444444', ARRAY['Rice', 'Wheat', 'Soil Health'], '25+ years', true),
  ('55555555-5555-5555-5555-555555555555', ARRAY['Organic Farming', 'Permaculture'], '18 years', true)
ON CONFLICT (farmer_id) DO NOTHING;

-- Create sample posts
INSERT INTO community_posts (author_id, post_type, content, crop, method, tags)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'success', 
   'First time trying drip irrigation for my tomatoes - got 40% more yield this season! The initial investment was ₹15,000 but it paid off. Happy to share my setup with anyone interested. 🍅', 
   'Tomato', 'Drip Irrigation', ARRAY['tomato', 'drip-irrigation', 'yield-increase']),
  ('44444444-4444-4444-4444-444444444444', 'success',
   'Tip: Apply neem oil spray early morning or evening to prevent aphid infestation. Avoid spraying during peak sun hours as it may cause leaf burn. This method is cost-effective and organic!',
   'Multiple Crops', 'Neem Oil Spray', ARRAY['pest-control', 'organic', 'neem']),
  ('22222222-2222-2222-2222-222222222222', 'question',
   'My wheat crop leaves are turning yellow from the tips. Soil pH is 7.2 and I''ve been watering regularly. Could this be iron deficiency? Has anyone faced this before?',
   'Wheat', NULL, ARRAY['wheat', 'yellow-leaves', 'nutrient-deficiency']),
  ('33333333-3333-3333-3333-333333333333', 'problem',
   'Facing severe water shortage this month. My cotton plants are wilting despite mulching. Looking for emergency water conservation tips. Any suggestions from farmers in dry regions?',
   'Cotton', 'Mulching', ARRAY['cotton', 'water-shortage', 'drought'])
ON CONFLICT DO NOTHING;

-- Update stats after seeding
SELECT update_community_stats();

-- =====================================================
-- DONE! Community tables are ready.
-- =====================================================
