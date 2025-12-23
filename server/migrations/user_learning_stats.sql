-- User Learning Stats Table
-- Run this in Supabase SQL Editor if the table doesn't exist

CREATE TABLE IF NOT EXISTS user_learning_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES farmers(id) ON DELETE CASCADE,
  total_courses_enrolled INTEGER DEFAULT 0,
  total_courses_completed INTEGER DEFAULT 0,
  total_learning_hours INTEGER DEFAULT 0,
  total_badges_earned INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_learning_stats_user_id ON user_learning_stats(user_id);

-- Enable RLS
ALTER TABLE user_learning_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own stats
CREATE POLICY "Users can read own stats" ON user_learning_stats
  FOR SELECT USING (auth.uid() = user_id OR true);  -- Allow all reads for now

-- Policy: Service can insert/update stats  
CREATE POLICY "Service can manage stats" ON user_learning_stats
  FOR ALL USING (true);
