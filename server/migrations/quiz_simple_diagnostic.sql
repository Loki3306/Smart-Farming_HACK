-- Simple Quiz Diagnostic
-- Check if quizzes have lesson_id set

-- 1. How many quizzes exist?
SELECT 'Total Quizzes' as info, COUNT(*) as count FROM quizzes;

-- 2. How many quizzes have lesson_id?
SELECT 'Quizzes with lesson_id' as info, COUNT(*) as count FROM quizzes WHERE lesson_id IS NOT NULL;

-- 3. How many quiz lessons exist?
SELECT 'Quiz Lessons' as info, COUNT(*) as count FROM course_lessons WHERE content_type = 'quiz';

-- 4. Show the mismatch
SELECT 
  'Quiz without lesson_id' as issue,
  q.id as quiz_id,
  q.title as quiz_title,
  q.course_id
FROM quizzes q
WHERE q.lesson_id IS NULL;

-- 5. Show quiz lessons without content_url
SELECT 
  'Lesson without quiz' as issue,
  l.id as lesson_id,
  l.title as lesson_title,
  c.title as course_title
FROM course_lessons l
JOIN courses c ON c.id = l.course_id
WHERE l.content_type = 'quiz'
  AND (l.content_url IS NULL OR l.content_url = '')
  AND c.language = 'en';
