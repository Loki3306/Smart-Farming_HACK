-- Ultra-Flexible Quiz Creation
-- This will create quizzes for ALL quiz-type lessons, regardless of course title or language

-- Step 1: Show ALL quiz lessons that exist
SELECT 
  l.id as lesson_id,
  c.id as course_id,
  c.title as course_title,
  l.title as lesson_title,
  c.language
FROM course_lessons l
JOIN courses c ON c.id = l.course_id
WHERE l.content_type = 'quiz'
ORDER BY c.title;

-- Step 2: Create a quiz for EACH quiz lesson found
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
  c.id as course_id,
  l.id as lesson_id,
  'Quiz: ' || l.title as title,
  'Test your knowledge from this lesson' as description,
  70 as passing_score,
  15 as time_limit_minutes,
  true as shuffle_questions,
  true as show_correct_answer,
  3 as max_attempts
FROM course_lessons l
JOIN courses c ON c.id = l.course_id
WHERE l.content_type = 'quiz'
  AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id
  );

-- Step 3: Link content_url immediately
UPDATE course_lessons l
SET content_url = q.id::text
FROM quizzes q
WHERE l.id = q.lesson_id 
  AND l.content_type = 'quiz';

-- Step 4: Verify everything worked
SELECT 
  'Created quizzes' as status,
  COUNT(*) as count
FROM quizzes

UNION ALL

SELECT 
  'Linked to lessons' as status,
  COUNT(*) as count
FROM course_lessons
WHERE content_type = 'quiz'
  AND content_url IS NOT NULL;
