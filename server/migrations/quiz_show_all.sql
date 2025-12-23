-- Show ALL quizzes that exist
SELECT 
  q.id,
  q.title,
  q.is_published,
  q.course_id,
  c.title as course_title,
  (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
FROM quizzes q
JOIN courses c ON c.id = q.course_id;
