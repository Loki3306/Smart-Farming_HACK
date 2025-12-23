-- Diagnostic Query: Check Quiz Setup
-- Run this in Supabase SQL Editor to verify quiz creation

-- 1. Check if quizzes were created
SELECT 
  'Total Quizzes' as check_type,
  COUNT(*) as count
FROM quizzes;

-- 2. Check if quizzes have lesson_id
SELECT 
  'Quizzes with lesson_id' as check_type,
  COUNT(*) as count
FROM quizzes
WHERE lesson_id IS NOT NULL;

-- 3. Check quiz lessons and their content_url
SELECT 
  c.title as course_title,
  l.id as lesson_id,
  l.title as lesson_title,
  l.content_type,
  l.content_url,
  q.id as quiz_id,
  q.title as quiz_title
FROM course_lessons l
JOIN courses c ON c.id = l.course_id
LEFT JOIN quizzes q ON q.lesson_id = l.id
WHERE l.content_type = 'quiz'
  AND c.language = 'en'
ORDER BY c.title, l.order_index;

-- 4. If content_url is NULL, manually update it
-- Uncomment and run this if needed:
/*
UPDATE course_lessons l
SET content_url = q.id::text
FROM quizzes q
WHERE l.id = q.lesson_id 
  AND l.content_type = 'quiz'
  AND l.content_url IS NULL;
*/

-- 5. Verify the update
SELECT 
  'Quiz lessons without content_url' as issue,
  COUNT(*) as count
FROM course_lessons
WHERE content_type = 'quiz'
  AND (content_url IS NULL OR content_url = '');
