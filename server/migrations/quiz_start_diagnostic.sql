-- Check Quiz Start Requirements
-- This will show if the quiz is ready to be started

SELECT 
  q.id,
  q.title,
  q.is_published,
  q.max_attempts,
  q.passing_score,
  q.time_limit_minutes,
  (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
  CASE 
    WHEN q.is_published = false THEN '❌ Not published'
    WHEN (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) = 0 THEN '❌ No questions'
    ELSE '✅ Ready'
  END as status
FROM quizzes q
WHERE q.id = '99d632dc-2671-4593-aa8b-aad53e0f745a';

-- Also check if is_published column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quizzes'
  AND column_name = 'is_published';
