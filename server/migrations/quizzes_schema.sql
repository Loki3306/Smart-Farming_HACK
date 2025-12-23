-- Quizzes Schema Migration
-- Run this in Supabase SQL Editor to create quiz-related tables

-- ============================================
-- QUIZZES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  passing_score INTEGER NOT NULL DEFAULT 70, -- percentage required to pass
  time_limit_minutes INTEGER, -- NULL means no time limit
  shuffle_questions BOOLEAN DEFAULT false,
  show_correct_answer BOOLEAN DEFAULT true,
  max_attempts INTEGER DEFAULT 3, -- NULL means unlimited
  
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='quizzes' AND column_name='is_published') THEN
    ALTER TABLE quizzes ADD COLUMN is_published BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='quizzes' AND column_name='max_attempts') THEN
    ALTER TABLE quizzes ADD COLUMN max_attempts INTEGER DEFAULT 3;
  END IF;
END $$;

-- ============================================
-- QUIZ QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  
  question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
  -- Valid types: 'multiple_choice', 'true_false', 'short_answer'
  
  question_text TEXT NOT NULL,
  question_image_url TEXT, -- Optional image for the question
  
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT, -- Shown after answering
  hint TEXT, -- Optional hint
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing quiz_questions table)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='quiz_questions' AND column_name='hint') THEN
    ALTER TABLE quiz_questions ADD COLUMN hint TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='quiz_questions' AND column_name='difficulty') THEN
    ALTER TABLE quiz_questions ADD COLUMN difficulty VARCHAR(20) DEFAULT 'medium';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='quiz_questions' AND column_name='question_image_url') THEN
    ALTER TABLE quiz_questions ADD COLUMN question_image_url TEXT;
  END IF;
END $$;

-- ============================================
-- QUIZ OPTIONS TABLE (for multiple choice questions)
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  
  option_text TEXT NOT NULL,
  option_image_url TEXT, -- Optional image for the option
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing quiz_options table)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='quiz_options' AND column_name='option_image_url') THEN
    ALTER TABLE quiz_options ADD COLUMN option_image_url TEXT;
  END IF;
END $$;

-- ============================================
-- QUIZ ATTEMPTS TABLE (tracks user attempts)
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  
  score INTEGER NOT NULL DEFAULT 0, -- Total points earned
  max_score INTEGER NOT NULL DEFAULT 0, -- Maximum possible points
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0, -- Score percentage
  passed BOOLEAN NOT NULL DEFAULT false,
  
  time_spent_seconds INTEGER DEFAULT 0,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUIZ ANSWERS TABLE (tracks individual answers)
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  
  selected_option_id UUID REFERENCES quiz_options(id) ON DELETE SET NULL,
  user_answer TEXT, -- For short_answer type
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_earned INTEGER NOT NULL DEFAULT 0,
  
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt_id ON quiz_answers(attempt_id);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Public read access for published quizzes
CREATE POLICY "Anyone can view published quizzes" ON quizzes
  FOR SELECT USING (is_published = true);

-- Public read access for quiz questions
CREATE POLICY "Anyone can view quiz questions" ON quiz_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.is_published = true)
  );

-- Public read access for quiz options
CREATE POLICY "Anyone can view quiz options" ON quiz_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_questions q 
      JOIN quizzes qz ON qz.id = q.quiz_id 
      WHERE q.id = quiz_options.question_id AND qz.is_published = true
    )
  );

-- Users can view their own attempts
CREATE POLICY "Users can view own attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can create own attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own answers
CREATE POLICY "Users can view own answers" ON quiz_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = quiz_answers.attempt_id AND quiz_attempts.user_id = auth.uid())
  );

-- Users can insert their own answers
CREATE POLICY "Users can create own answers" ON quiz_answers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = quiz_answers.attempt_id AND quiz_attempts.user_id = auth.uid())
  );

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON quiz_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
