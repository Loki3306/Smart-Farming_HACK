-- Double Check Quiz Setup
-- Run this to see the actual state of the quiz lessons

SELECT 
  c.title as course,
  l.order_index,
  l.title as lesson,
  l.content_type,
  CASE 
    WHEN l.content_url IS NULL THEN '❌ NULL'
    WHEN l.content_url = '' THEN '❌ EMPTY'
    ELSE '✅ ' || l.content_url
  END as content_url_status,
  q.id as actual_quiz_id,
  q.title as quiz_title
FROM course_lessons l
JOIN courses c ON c.id = l.course_id
LEFT JOIN quizzes q ON q.lesson_id = l.id
WHERE l.content_type = 'quiz'
  AND c.language = 'en'
ORDER BY c.title, l.order_index;

-- If content_url is still NULL, run this aggressive update:
UPDATE course_lessons 
SET content_url = (
  SELECT q.id::text 
  FROM quizzes q 
  WHERE q.lesson_id = course_lessons.id
  LIMIT 1
)
WHERE content_type = 'quiz'
AND (content_url IS NULL OR content_url = '' OR content_url = 'null');

-- Final verification
SELECT COUNT(*) as fixed_count 
FROM course_lessons 
WHERE content_type = 'quiz' 
AND content_url IS NOT NULL 
AND content_url != '';
