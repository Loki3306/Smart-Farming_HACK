-- Badge Seed Data for Quiz Achievements
-- Run this in Supabase SQL Editor after running the schema migrations

INSERT INTO badges (name, description, category, icon_emoji, requirement_type, requirement_value)
VALUES
  -- Quiz Achievement Badges
  ('first-quiz-passed', 'Passed your first quiz', 'achievement', '🎯', 'quiz_completed', 1),
  ('perfect-score', 'Achieved 100% score on a quiz', 'achievement', '💯', 'perfect_quiz', 1),
  ('quick-learner', 'Completed a quiz in record time', 'achievement', '⚡', 'quiz_speed', 1),
  ('quiz-master', 'Passed 10 quizzes', 'milestone', '🏆', 'quiz_completed', 10),
  ('knowledge-seeker', 'Attempted 5 different quizzes', 'achievement', '📚', 'quiz_attempts', 5),
  
  -- Course Completion Badges (if not already exist)
  ('course-completed', 'Completed your first course', 'completion', '🎓', 'courses_completed', 1)
ON CONFLICT (name) DO NOTHING;
