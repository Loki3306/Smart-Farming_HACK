-- All-in-One Quiz Diagnostic
SELECT 
  'SUMMARY' as section,
  'Total Quizzes: ' || (SELECT COUNT(*) FROM quizzes) ||
  ' | With lesson_id: ' || (SELECT COUNT(*) FROM quizzes WHERE lesson_id IS NOT NULL) ||
  ' | Quiz Lessons: ' || (SELECT COUNT(*) FROM course_lessons WHERE content_type = 'quiz') ||
  ' | Lessons missing quiz: ' || (SELECT COUNT(*) FROM course_lessons WHERE content_type = 'quiz' AND (content_url IS NULL OR content_url = '')) as details
UNION ALL
SELECT 
  'BROKEN LESSONS' as section,
  l.title || ' (Course: ' || c.title || ')' as details
FROM course_lessons l
JOIN courses c ON c.id = l.course_id
WHERE l.content_type = 'quiz'
  AND (l.content_url IS NULL OR l.content_url = '')
  AND c.language = 'en';
