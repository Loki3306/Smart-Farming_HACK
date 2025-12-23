-- Fix Quiz Lessons Content URL
-- This will link quiz lessons to their quiz IDs

UPDATE course_lessons l
SET content_url = q.id::text
FROM quizzes q
WHERE l.id = q.lesson_id 
  AND l.content_type = 'quiz'
  AND (l.content_url IS NULL OR l.content_url = '');

-- Verify the fix
SELECT 
  c.title as course_title,
  l.title as lesson_title,
  l.content_url as quiz_id,
  q.title as quiz_title
FROM course_lessons l
JOIN courses c ON c.id = l.course_id
JOIN quizzes q ON q.id::text = l.content_url
WHERE l.content_type = 'quiz'
  AND c.language = 'en'
ORDER BY c.title;
