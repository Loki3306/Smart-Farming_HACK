-- Simple Working Quiz Seed
-- This will create quizzes directly linked to quiz lessons

-- First, let's see what quiz lessons exist
SELECT 
  l.id as lesson_id,
  c.title as course_title,
  l.title as lesson_title,
  c.id as course_id
FROM course_lessons l
JOIN courses c ON c.id = l.course_id
WHERE l.content_type = 'quiz'
  AND c.language = 'en'
ORDER BY c.title;

-- Now create quizzes for each quiz lesson
-- Quiz 1: Organic Farming
INSERT INTO quizzes (
  course_id,
  lesson_id,
  title,
  description,
  passing_score,
  time_limit_minutes,
  shuffle_questions,
  show_correct_answer,
  max_attempts
)
SELECT 
  c.id,
  l.id,
  'Organic Farming Fundamentals Quiz',
  'Test your understanding of organic farming principles',
  70,
  15,
  true,
  true,
  3
FROM courses c
JOIN course_lessons l ON l.course_id = c.id
WHERE c.title = 'Organic Farming Basics'
  AND l.content_type = 'quiz'
  AND c.language = 'en'
LIMIT 1;

-- Quiz 2: Smart Irrigation
INSERT INTO quizzes (
  course_id,
  lesson_id,
  title,
  description,
  passing_score,
  time_limit_minutes,
  shuffle_questions,
  show_correct_answer,
  max_attempts
)
SELECT 
  c.id,
  l.id,
  'Smart Irrigation Technologies Quiz',
  'Test your knowledge of irrigation systems',
  70,
  12,
  true,
  true,
  3
FROM courses c
JOIN course_lessons l ON l.course_id = c.id
WHERE c.title LIKE '%Smart Irrigation%'
  AND l.content_type = 'quiz'
  AND c.language = 'en'
LIMIT 1;

-- Get the quiz IDs we just created
SELECT 
  q.id as quiz_id,
  q.title as quiz_title,
  c.title as course_title
FROM quizzes q
JOIN courses c ON c.id = q.course_id;
