-- Learn Page Database Schema for Smart Farming Platform
-- Complete schema with courses, articles, videos, quizzes, rewards, and user progress tracking
-- Uses farmers table from core schema for all user references

-- 1. COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- crop-management, irrigation, pest-control, soil-health, equipment, weather
  level VARCHAR(20) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration VARCHAR(50), -- e.g., "4 hours", "2.5 hours"
  lessons INTEGER NOT NULL DEFAULT 0,
  thumbnail_emoji VARCHAR(10), -- emoji for visual representation
  thumbnail_url VARCHAR(500), -- optional: actual image URL
  language VARCHAR(100) DEFAULT 'English', -- comma-separated: "Hindi, English, Marathi"
  rating DECIMAL(3, 1) DEFAULT 4.5,
  enrolled_count INTEGER DEFAULT 0,
  
  -- Pricing
  price DECIMAL(10, 2) DEFAULT 0, -- 0 for free, >0 for paid
  currency VARCHAR(10) DEFAULT 'INR',
  discount_percent INTEGER DEFAULT 0,
  
  -- Metadata
  instructor_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
  instructor_name VARCHAR(255),
  instructor_bio TEXT,
  instructor_avatar VARCHAR(500),
  
  -- Status & Visibility
  is_published BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0, -- percentage of users who completed
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  
  -- Full-text search support
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || description)
  ) STORED
);

-- 2. COURSE MODULES/LESSONS TABLE
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  duration VARCHAR(50), -- "30 min", "1 hour"
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'text', 'quiz', 'assignment')),
  content_url VARCHAR(500), -- URL to video, article, etc.
  is_preview BOOLEAN DEFAULT false, -- free preview or paid only
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ARTICLES TABLE
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- same as courses
  author_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
  author_name VARCHAR(255),
  author_avatar VARCHAR(500),
  
  read_time_minutes INTEGER, -- estimated read time
  language VARCHAR(100) DEFAULT 'English',
  
  -- Source info (external or internal)
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('internal', 'external', 'scraped')),
  source_url VARCHAR(500), -- original article URL if external
  source_title VARCHAR(255), -- original title if external
  
  -- Metadata
  thumbnail_url VARCHAR(500),
  thumbnail_emoji VARCHAR(10),
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Full-text search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || excerpt || ' ' || content)
  ) STORED,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

-- 4. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  duration_seconds INTEGER, -- in seconds
  
  -- Video source
  video_type VARCHAR(20) NOT NULL CHECK (video_type IN ('youtube', 'vimeo', 'self_hosted', 'aws_s3')),
  video_url VARCHAR(500) NOT NULL,
  video_id VARCHAR(100), -- YouTube video ID or similar
  thumbnail_url VARCHAR(500),
  thumbnail_emoji VARCHAR(10),
  
  -- Content creator
  creator_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
  creator_name VARCHAR(255),
  creator_avatar VARCHAR(500),
  
  -- Metadata
  language VARCHAR(100) DEFAULT 'English',
  skill_level VARCHAR(20), -- beginner, intermediate, advanced
  transcript TEXT, -- optional: video transcript for search
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  
  -- Full-text search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
  ) STORED,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

-- 5. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Quiz settings
  passing_score INTEGER NOT NULL DEFAULT 70, -- percentage
  time_limit_minutes INTEGER, -- NULL = no time limit
  shuffle_questions BOOLEAN DEFAULT false,
  show_correct_answer BOOLEAN DEFAULT true,
  
  -- Metadata
  order_index INTEGER,
  is_required BOOLEAN DEFAULT true, -- must pass to progress
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. QUIZ QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
  question_text TEXT NOT NULL,
  
  -- For multiple choice
  options JSONB, -- array of {text, is_correct} objects
  
  -- Metadata
  points INTEGER DEFAULT 1,
  order_index INTEGER,
  explanation TEXT, -- shown after answer
  difficulty VARCHAR(20) DEFAULT 'medium',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. REWARDS & BADGES TABLE
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_emoji VARCHAR(10),
  icon_url VARCHAR(500),
  category VARCHAR(50) NOT NULL CHECK (category IN ('completion', 'achievement', 'streak', 'milestone', 'special')),
  
  -- Criteria for earning badge
  requirement_type VARCHAR(50) NOT NULL, -- courses_completed, quizzes_passed, consecutive_days, etc.
  requirement_value INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. USER ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Status & Progress
  status VARCHAR(20) NOT NULL CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped')) DEFAULT 'enrolled',
  progress_percent INTEGER DEFAULT 0, -- 0-100
  lessons_completed INTEGER DEFAULT 0,
  
  -- Completion tracking
  completion_date TIMESTAMP,
  certificate_url VARCHAR(500),
  
  -- Pricing & Purchase
  enrollment_type VARCHAR(20) CHECK (enrollment_type IN ('free', 'paid', 'promotional', 'gifted')) DEFAULT 'free',
  amount_paid DECIMAL(10, 2),
  
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP,
  
  UNIQUE(user_id, course_id)
);

-- 9. LESSON PROGRESS TABLE
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  
  status VARCHAR(20) NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  completion_date TIMESTAMP,
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- For video lessons
  video_progress_percent INTEGER,
  last_watched_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, lesson_id)
);

-- 10. QUIZ ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  
  score INTEGER, -- points earned
  percentage DECIMAL(5, 2), -- percentage score
  passed BOOLEAN,
  time_spent_seconds INTEGER,
  
  -- For tracking attempts (can attempt multiple times)
  attempt_number INTEGER DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. QUIZ ANSWERS TABLE
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN,
  points_earned INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. USER BADGES TABLE
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, badge_id)
);

-- 13. ROADMAPS TABLE
CREATE TABLE IF NOT EXISTS learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  goal TEXT, -- what farmers will learn
  estimated_hours INTEGER,
  icon_emoji VARCHAR(10),
  icon_url VARCHAR(500),
  
  -- Roadmap structure
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. ROADMAP MILESTONES TABLE
CREATE TABLE IF NOT EXISTS roadmap_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Content linked to this milestone
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  
  -- Completion tracking
  is_completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. USER ROADMAP PROGRESS TABLE
CREATE TABLE IF NOT EXISTS user_roadmap_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
  
  progress_percent INTEGER DEFAULT 0,
  completed_milestones INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  UNIQUE(user_id, roadmap_id)
);

-- 16. PURCHASES/TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment info
  payment_method VARCHAR(50), -- card, upi, netbanking, wallet
  payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'success', 'failed', 'refunded')) DEFAULT 'pending',
  payment_id VARCHAR(100), -- external payment gateway ID
  
  -- Timestamps
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  refunded_at TIMESTAMP
);

-- 17. USER LEARNING STATS TABLE
CREATE TABLE IF NOT EXISTS user_learning_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE UNIQUE,
  
  -- Stats
  total_courses_enrolled INTEGER DEFAULT 0,
  total_courses_completed INTEGER DEFAULT 0,
  total_learning_hours DECIMAL(10, 2) DEFAULT 0,
  total_badges_earned INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  
  -- Points system (optional gamification)
  total_points INTEGER DEFAULT 0,
  
  -- Milestones
  last_activity_date TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_courses_created ON courses(created_at DESC);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_courses_price ON courses(price);
CREATE INDEX idx_courses_search ON courses USING GIN(search_vector);

CREATE INDEX idx_articles_created ON articles(created_at DESC);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_published ON articles(is_published);
CREATE INDEX idx_articles_featured ON articles(is_featured);
CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

CREATE INDEX idx_videos_created ON videos(created_at DESC);
CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_videos_type ON videos(video_type);
CREATE INDEX idx_videos_published ON videos(is_published);
CREATE INDEX idx_videos_featured ON videos(is_featured);
CREATE INDEX idx_videos_search ON videos USING GIN(search_vector);

CREATE INDEX idx_course_lessons_course ON course_lessons(course_id);
CREATE INDEX idx_course_lessons_order ON course_lessons(course_id, order_index);

CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);

CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_requirement ON badges(requirement_type);

CREATE INDEX idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_status ON course_enrollments(status);
CREATE INDEX idx_enrollments_progress ON course_enrollments(progress_percent);

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);

CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_passed ON quiz_attempts(passed);

CREATE INDEX idx_quiz_answers_attempt ON quiz_answers(attempt_id);
CREATE INDEX idx_quiz_answers_question ON quiz_answers(question_id);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);

CREATE INDEX idx_roadmap_milestones_roadmap ON roadmap_milestones(roadmap_id);
CREATE INDEX idx_roadmap_milestones_order ON roadmap_milestones(roadmap_id, order_index);

CREATE INDEX idx_learning_roadmaps_difficulty ON learning_roadmaps(difficulty);
CREATE INDEX idx_learning_roadmaps_published ON learning_roadmaps(is_published);

CREATE INDEX idx_roadmap_progress_user ON user_roadmap_progress(user_id);
CREATE INDEX idx_roadmap_progress_roadmap ON user_roadmap_progress(roadmap_id);

CREATE INDEX idx_purchases_user ON course_purchases(user_id);
CREATE INDEX idx_purchases_course ON course_purchases(course_id);
CREATE INDEX idx_purchases_status ON course_purchases(payment_status);

CREATE INDEX idx_stats_user ON user_learning_stats(user_id);

-- Create views for common queries
CREATE VIEW published_courses AS
  SELECT * FROM courses WHERE is_published = true AND is_archived = false ORDER BY created_at DESC;

CREATE VIEW featured_articles AS
  SELECT * FROM articles WHERE is_published = true AND is_featured = true ORDER BY created_at DESC;

CREATE VIEW featured_videos AS
  SELECT * FROM videos WHERE is_published = true AND is_featured = true ORDER BY created_at DESC;

-- Add created_at trigger for updated_at fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON course_lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_roadmaps_updated_at BEFORE UPDATE ON learning_roadmaps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE courses IS 'Comprehensive courses for farmers with pricing and progress tracking';
COMMENT ON TABLE articles IS 'Educational articles from internal and external sources';
COMMENT ON TABLE videos IS 'Video tutorials from YouTube, Vimeo, or self-hosted';
COMMENT ON TABLE quizzes IS 'Quizzes linked to courses or lessons for assessment';
COMMENT ON TABLE badges IS 'Badges and achievements for user motivation';
COMMENT ON TABLE learning_roadmaps IS 'Structured learning paths for farmers to master specific skills';
COMMENT ON COLUMN courses.price IS '0 = Free course, >0 = Paid course';
COMMENT ON COLUMN articles.source_type IS 'internal = created by platform, external = linked article, scraped = auto-scraped';
COMMENT ON COLUMN user_badges.earned_at IS 'Timestamp when user earned this badge';
