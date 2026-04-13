/**
 * server/db/learn.ts
 *
 * Learning platform DB layer — previously backed by Supabase JS SDK,
 * now uses raw pg queries via neon.ts.
 * All exported function signatures are UNCHANGED.
 */

import { query as pgQuery } from "./neon.js";
import {
  Course,
  CourseLesson,
  Article,
  Video,
  Quiz,
  QuizQuestion,
  Badge,
  CourseEnrollment,
  LessonProgress,
  QuizAttempt,
  QuizAnswer,
  UserBadge,
  LearningRoadmap,
  RoadmapMilestone,
  UserRoadmapProgress,
  CoursePurchase,
  UserLearningStats,
} from "../types/learn.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a SET clause and values array for UPDATE statements */
function buildSet(updates: Record<string, any>, startIdx = 1) {
  const keys = Object.keys(updates);
  const clause = keys.map((k, i) => `${k} = $${i + startIdx}`).join(", ");
  const values = keys.map((k) => updates[k]);
  return { clause, values };
}

/** Build INSERT columns/placeholders/values from an object */
function buildInsert(obj: Record<string, any>) {
  const keys = Object.keys(obj);
  const cols = keys.join(", ");
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
  const values = keys.map((k) => obj[k]);
  return { cols, placeholders, values };
}

// ============================================================================
// COURSES
// ============================================================================

export async function getCourses(
  limit: number = 20,
  offset: number = 0,
  filters?: {
    category?: string;
    level?: string;
    search?: string;
    isPublished?: boolean;
  },
) {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (filters?.category) {
    conditions.push(`category = $${idx++}`);
    values.push(filters.category);
  }
  if (filters?.level) {
    conditions.push(`level = $${idx++}`);
    values.push(filters.level);
  }
  if (filters?.isPublished !== undefined) {
    conditions.push(`is_published = $${idx++}`);
    values.push(filters.isPublished);
  }
  if (filters?.search) {
    conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
    values.push(`%${filters.search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pgQuery(
    `SELECT COUNT(*) FROM courses ${where}`,
    values,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pgQuery(
    `SELECT * FROM courses ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );

  return { data: result.rows as Course[], total };
}

export async function getCourseById(id: string) {
  const result = await pgQuery(`SELECT * FROM courses WHERE id = $1`, [id]);
  if (!result.rows[0]) throw new Error("Course not found");
  return result.rows[0] as Course;
}

export async function createCourse(
  course: Omit<Course, "id" | "created_at" | "updated_at" | "published_at">,
) {
  const { cols, placeholders, values } = buildInsert(course as any);
  const result = await pgQuery(
    `INSERT INTO courses (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as Course;
}

export async function updateCourse(id: string, updates: Partial<Course>) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE courses SET ${clause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] as Course;
}

export async function deleteCourse(id: string) {
  await pgQuery(`DELETE FROM courses WHERE id = $1`, [id]);
}

// ============================================================================
// COURSE LESSONS
// ============================================================================

export async function getCourseLessons(
  courseId: string,
  limit: number = 50,
  offset: number = 0,
) {
  const count = await pgQuery(
    `SELECT COUNT(*) FROM course_lessons WHERE course_id = $1`,
    [courseId],
  );
  const result = await pgQuery(
    `SELECT * FROM course_lessons WHERE course_id = $1
     ORDER BY order_index ASC LIMIT $2 OFFSET $3`,
    [courseId, limit, offset],
  );
  return {
    data: result.rows as CourseLesson[],
    total: parseInt(count.rows[0].count, 10),
  };
}

export async function getLessonById(id: string) {
  const result = await pgQuery(`SELECT * FROM course_lessons WHERE id = $1`, [
    id,
  ]);
  if (!result.rows[0]) throw new Error("Lesson not found");
  return result.rows[0] as CourseLesson;
}

export async function createLesson(
  lesson: Omit<CourseLesson, "id" | "created_at" | "updated_at">,
) {
  const { cols, placeholders, values } = buildInsert(lesson as any);
  const result = await pgQuery(
    `INSERT INTO course_lessons (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as CourseLesson;
}

export async function updateLesson(
  id: string,
  updates: Partial<CourseLesson>,
) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE course_lessons SET ${clause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] as CourseLesson;
}

// ============================================================================
// ARTICLES
// ============================================================================

export async function getArticles(
  limit: number = 20,
  offset: number = 0,
  filters?: {
    category?: string;
    featured?: boolean;
    search?: string;
    isPublished?: boolean;
  },
) {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (filters?.category) {
    conditions.push(`category = $${idx++}`);
    values.push(filters.category);
  }
  if (filters?.featured) {
    conditions.push(`is_featured = true`);
  }
  if (filters?.isPublished !== undefined) {
    conditions.push(`is_published = $${idx++}`);
    values.push(filters.isPublished);
  }
  if (filters?.search) {
    conditions.push(`(title ILIKE $${idx} OR content ILIKE $${idx})`);
    values.push(`%${filters.search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await pgQuery(
    `SELECT COUNT(*) FROM articles ${where}`,
    values,
  );
  const result = await pgQuery(
    `SELECT * FROM articles ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return {
    data: result.rows as Article[],
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getArticleById(id: string) {
  const result = await pgQuery(`SELECT * FROM articles WHERE id = $1`, [id]);
  if (!result.rows[0]) throw new Error("Article not found");
  return result.rows[0] as Article;
}

export async function createArticle(
  article: Omit<Article, "id" | "created_at" | "updated_at" | "published_at">,
) {
  const { cols, placeholders, values } = buildInsert(article as any);
  const result = await pgQuery(
    `INSERT INTO articles (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as Article;
}

export async function updateArticle(id: string, updates: Partial<Article>) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE articles SET ${clause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] as Article;
}

export async function incrementArticleLikes(id: string) {
  const result = await pgQuery(
    `UPDATE articles SET like_count = COALESCE(like_count, 0) + 1
     WHERE id = $1 RETURNING *`,
    [id],
  );
  return result.rows[0] as Article;
}

export async function incrementArticleViews(id: string) {
  const result = await pgQuery(
    `UPDATE articles SET view_count = COALESCE(view_count, 0) + 1
     WHERE id = $1 RETURNING *`,
    [id],
  );
  return result.rows[0] as Article;
}

// ============================================================================
// VIDEOS
// ============================================================================

export async function getVideos(
  limit: number = 20,
  offset: number = 0,
  filters?: {
    category?: string;
    type?: string;
    featured?: boolean;
    search?: string;
    isPublished?: boolean;
  },
) {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (filters?.category) {
    conditions.push(`category = $${idx++}`);
    values.push(filters.category);
  }
  if (filters?.type) {
    conditions.push(`video_type = $${idx++}`);
    values.push(filters.type);
  }
  if (filters?.featured) {
    conditions.push(`is_featured = true`);
  }
  if (filters?.isPublished !== undefined) {
    conditions.push(`is_published = $${idx++}`);
    values.push(filters.isPublished);
  }
  if (filters?.search) {
    conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
    values.push(`%${filters.search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await pgQuery(
    `SELECT COUNT(*) FROM videos ${where}`,
    values,
  );
  const result = await pgQuery(
    `SELECT * FROM videos ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return {
    data: result.rows as Video[],
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getVideoById(id: string) {
  const result = await pgQuery(`SELECT * FROM videos WHERE id = $1`, [id]);
  if (!result.rows[0]) throw new Error("Video not found");
  return result.rows[0] as Video;
}

export async function createVideo(
  video: Omit<Video, "id" | "created_at" | "updated_at" | "published_at">,
) {
  const { cols, placeholders, values } = buildInsert(video as any);
  const result = await pgQuery(
    `INSERT INTO videos (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as Video;
}

export async function updateVideo(id: string, updates: Partial<Video>) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE videos SET ${clause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] as Video;
}

export async function incrementVideoLikes(id: string) {
  const result = await pgQuery(
    `UPDATE videos SET like_count = COALESCE(like_count, 0) + 1
     WHERE id = $1 RETURNING *`,
    [id],
  );
  return result.rows[0] as Video;
}

export async function incrementVideoViews(id: string) {
  const result = await pgQuery(
    `UPDATE videos SET view_count = COALESCE(view_count, 0) + 1
     WHERE id = $1 RETURNING *`,
    [id],
  );
  return result.rows[0] as Video;
}

// ============================================================================
// QUIZZES
// ============================================================================

export async function getQuizzesByCourse(
  courseId: string,
  limit: number = 20,
  offset: number = 0,
) {
  const countResult = await pgQuery(
    `SELECT COUNT(*) FROM quizzes WHERE course_id = $1`,
    [courseId],
  );
  const result = await pgQuery(
    `SELECT * FROM quizzes WHERE course_id = $1
     ORDER BY order_index ASC LIMIT $2 OFFSET $3`,
    [courseId, limit, offset],
  );
  return {
    data: result.rows as Quiz[],
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getQuizById(id: string) {
  const result = await pgQuery(`SELECT * FROM quizzes WHERE id = $1`, [id]);
  if (!result.rows[0]) throw new Error("Quiz not found");
  return result.rows[0] as Quiz;
}

export async function getQuizWithQuestions(id: string) {
  const [quizResult, questionsResult] = await Promise.all([
    pgQuery(`SELECT * FROM quizzes WHERE id = $1`, [id]),
    pgQuery(
      `SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index ASC`,
      [id],
    ),
  ]);
  if (!quizResult.rows[0]) throw new Error("Quiz not found");
  return {
    ...quizResult.rows[0],
    questions: questionsResult.rows as QuizQuestion[],
  } as Quiz & { questions: QuizQuestion[] };
}

export async function createQuiz(
  quiz: Omit<Quiz, "id" | "created_at" | "updated_at">,
) {
  const { cols, placeholders, values } = buildInsert(quiz as any);
  const result = await pgQuery(
    `INSERT INTO quizzes (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as Quiz;
}

export async function updateQuiz(id: string, updates: Partial<Quiz>) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE quizzes SET ${clause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] as Quiz;
}

// ============================================================================
// QUIZ QUESTIONS
// ============================================================================

export async function getQuizQuestions(quizId: string) {
  const result = await pgQuery(
    `SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index ASC`,
    [quizId],
  );
  return result.rows as QuizQuestion[];
}

export async function getQuestionById(id: string) {
  const result = await pgQuery(
    `SELECT * FROM quiz_questions WHERE id = $1`,
    [id],
  );
  if (!result.rows[0]) throw new Error("Question not found");
  return result.rows[0] as QuizQuestion;
}

export async function createQuestion(
  question: Omit<QuizQuestion, "id" | "created_at" | "updated_at">,
) {
  const { cols, placeholders, values } = buildInsert(question as any);
  const result = await pgQuery(
    `INSERT INTO quiz_questions (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as QuizQuestion;
}

export async function updateQuestion(
  id: string,
  updates: Partial<QuizQuestion>,
) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE quiz_questions SET ${clause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] as QuizQuestion;
}

// ============================================================================
// BADGES
// ============================================================================

export async function getBadges(
  limit: number = 20,
  offset: number = 0,
  category?: string,
) {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (category) {
    conditions.push(`category = $${idx++}`);
    values.push(category);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await pgQuery(
    `SELECT COUNT(*) FROM badges ${where}`,
    values,
  );
  const result = await pgQuery(
    `SELECT * FROM badges ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return {
    data: result.rows as Badge[],
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getBadgeById(id: string) {
  const result = await pgQuery(`SELECT * FROM badges WHERE id = $1`, [id]);
  if (!result.rows[0]) throw new Error("Badge not found");
  return result.rows[0] as Badge;
}

export async function createBadge(badge: Omit<Badge, "id" | "created_at">) {
  const { cols, placeholders, values } = buildInsert(badge as any);
  const result = await pgQuery(
    `INSERT INTO badges (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as Badge;
}

// ============================================================================
// COURSE ENROLLMENTS
// ============================================================================

export async function getEnrollments(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  status?: string,
) {
  const conditions = [`ce.user_id = $1`];
  const values: any[] = [userId];
  let idx = 2;

  if (status) {
    conditions.push(`ce.status = $${idx++}`);
    values.push(status);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  const countResult = await pgQuery(
    `SELECT COUNT(*) FROM course_enrollments ce ${where}`,
    values,
  );
  const result = await pgQuery(
    `SELECT ce.*, row_to_json(c.*) as courses
     FROM course_enrollments ce
     LEFT JOIN courses c ON c.id = ce.course_id
     ${where}
     ORDER BY ce.enrolled_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return {
    data: result.rows as (CourseEnrollment & { courses: Course })[],
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getEnrollmentById(id: string) {
  const result = await pgQuery(
    `SELECT ce.*, row_to_json(c.*) as courses
     FROM course_enrollments ce
     LEFT JOIN courses c ON c.id = ce.course_id
     WHERE ce.id = $1`,
    [id],
  );
  if (!result.rows[0]) throw new Error("Enrollment not found");
  return result.rows[0] as CourseEnrollment & { courses: Course };
}

export async function getEnrollment(userId: string, courseId: string) {
  const result = await pgQuery(
    `SELECT * FROM course_enrollments
     WHERE user_id = $1 AND course_id = $2 LIMIT 1`,
    [userId, courseId],
  );
  return (result.rows[0] as CourseEnrollment) || null;
}

export async function createEnrollment(
  enrollment: Omit<
    CourseEnrollment,
    "id" | "enrolled_at" | "last_accessed_at"
  >,
) {
  const { cols, placeholders, values } = buildInsert(enrollment as any);
  const result = await pgQuery(
    `INSERT INTO course_enrollments (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as CourseEnrollment;
}

export async function updateEnrollment(
  id: string,
  updates: Partial<CourseEnrollment>,
) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE course_enrollments SET ${clause}
     WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] as CourseEnrollment;
}

export async function deleteEnrollment(id: string) {
  await pgQuery(`DELETE FROM course_enrollments WHERE id = $1`, [id]);
}

// ============================================================================
// LESSON PROGRESS
// ============================================================================

export async function getLessonProgress(userId: string, lessonId: string) {
  const result = await pgQuery(
    `SELECT * FROM lesson_progress
     WHERE user_id = $1 AND lesson_id = $2 LIMIT 1`,
    [userId, lessonId],
  );
  return (result.rows[0] as LessonProgress) || null;
}

export async function createLessonProgress(
  progress: Omit<LessonProgress, "id" | "created_at" | "updated_at">,
) {
  const { cols, placeholders, values } = buildInsert(progress as any);
  const result = await pgQuery(
    `INSERT INTO lesson_progress (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as LessonProgress;
}

export async function updateLessonProgress(
  id: string,
  updates: Partial<LessonProgress>,
) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE lesson_progress SET ${clause}
     WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] as LessonProgress;
}

export async function getCourseProgress(userId: string, courseId: string) {
  const enrollResult = await pgQuery(
    `SELECT * FROM course_enrollments
     WHERE user_id = $1 AND course_id = $2 LIMIT 1`,
    [userId, courseId],
  );
  if (!enrollResult.rows[0]) throw new Error("Enrollment not found");

  const lessonsResult = await pgQuery(
    `SELECT id FROM course_lessons WHERE course_id = $1`,
    [courseId],
  );
  const lessonIds = lessonsResult.rows.map((r: any) => r.id);

  let completedLessons = 0;
  if (lessonIds.length > 0) {
    const progressResult = await pgQuery(
      `SELECT COUNT(*) FROM lesson_progress
       WHERE user_id = $1 AND lesson_id = ANY($2) AND status = 'completed'`,
      [userId, lessonIds],
    );
    completedLessons = parseInt(progressResult.rows[0].count, 10);
  }

  const totalLessons = lessonIds.length;
  const progressPercent =
    totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);

  return {
    enrollment: enrollResult.rows[0] as CourseEnrollment,
    totalLessons,
    completedLessons,
    progressPercent,
  };
}

// ============================================================================
// QUIZ ATTEMPTS
// ============================================================================

export async function getQuizAttempts(
  userId: string,
  quizId: string,
  limit: number = 20,
  offset: number = 0,
) {
  const countResult = await pgQuery(
    `SELECT COUNT(*) FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2`,
    [userId, quizId],
  );
  const result = await pgQuery(
    `SELECT * FROM quiz_attempts
     WHERE user_id = $1 AND quiz_id = $2
     ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
    [userId, quizId, limit, offset],
  );
  return {
    data: result.rows as QuizAttempt[],
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getLatestQuizAttempt(userId: string, quizId: string) {
  const result = await pgQuery(
    `SELECT * FROM quiz_attempts
     WHERE user_id = $1 AND quiz_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [userId, quizId],
  );
  return (result.rows[0] as QuizAttempt) || null;
}

export async function createQuizAttempt(
  attempt: Omit<QuizAttempt, "id" | "created_at">,
) {
  const { cols, placeholders, values } = buildInsert(attempt as any);
  const result = await pgQuery(
    `INSERT INTO quiz_attempts (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as QuizAttempt;
}

export async function updateQuizAttempt(
  id: string,
  updates: Partial<QuizAttempt>,
) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE quiz_attempts SET ${clause}
     WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] as QuizAttempt;
}

// ============================================================================
// QUIZ ANSWERS
// ============================================================================

export async function getAttemptAnswers(attemptId: string) {
  const result = await pgQuery(
    `SELECT * FROM quiz_answers WHERE attempt_id = $1`,
    [attemptId],
  );
  return result.rows as QuizAnswer[];
}

export async function createQuizAnswer(
  answer: Omit<QuizAnswer, "id" | "created_at">,
) {
  const { cols, placeholders, values } = buildInsert(answer as any);
  const result = await pgQuery(
    `INSERT INTO quiz_answers (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as QuizAnswer;
}

export async function createQuizAnswers(
  answers: Omit<QuizAnswer, "id" | "created_at">[],
) {
  if (answers.length === 0) return [];
  const results = await Promise.all(answers.map((a) => createQuizAnswer(a)));
  return results as QuizAnswer[];
}

// ============================================================================
// USER BADGES
// ============================================================================

export async function getUserBadges(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  category?: string,
) {
  let baseQuery = `
    SELECT ub.*, row_to_json(b.*) as badges
    FROM user_badges ub
    LEFT JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = $1`;
  const values: any[] = [userId];
  let idx = 2;

  if (category) {
    baseQuery += ` AND b.category = $${idx++}`;
    values.push(category);
  }

  const countResult = await pgQuery(
    `SELECT COUNT(*) FROM user_badges ub
     LEFT JOIN badges b ON b.id = ub.badge_id
     WHERE ub.user_id = $1${category ? ` AND b.category = $2` : ""}`,
    values.slice(0, category ? 2 : 1),
  );

  const result = await pgQuery(
    `${baseQuery} ORDER BY ub.earned_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return {
    data: result.rows as (UserBadge & { badges: Badge })[],
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getUserBadge(userId: string, badgeId: string) {
  const result = await pgQuery(
    `SELECT * FROM user_badges WHERE user_id = $1 AND badge_id = $2 LIMIT 1`,
    [userId, badgeId],
  );
  return (result.rows[0] as UserBadge) || null;
}

export async function awardBadge(userId: string, badgeId: string) {
  try {
    const result = await pgQuery(
      `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING *`,
      [userId, badgeId],
    );
    return (result.rows[0] as UserBadge) || null;
  } catch {
    return null;
  }
}

// ============================================================================
// LEARNING ROADMAPS
// ============================================================================

export async function getRoadmaps(
  limit: number = 20,
  offset: number = 0,
  difficulty?: string,
  isPublished: boolean = true,
) {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (isPublished) {
    conditions.push(`is_published = true`);
  }
  if (difficulty) {
    conditions.push(`difficulty = $${idx++}`);
    values.push(difficulty);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await pgQuery(
    `SELECT COUNT(*) FROM learning_roadmaps ${where}`,
    values,
  );
  const result = await pgQuery(
    `SELECT * FROM learning_roadmaps ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return {
    data: result.rows as LearningRoadmap[],
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getRoadmapById(id: string) {
  const result = await pgQuery(
    `SELECT * FROM learning_roadmaps WHERE id = $1`,
    [id],
  );
  if (!result.rows[0]) throw new Error("Roadmap not found");
  return result.rows[0] as LearningRoadmap;
}

export async function getRoadmapWithMilestones(id: string) {
  const [roadmapResult, milestonesResult] = await Promise.all([
    pgQuery(`SELECT * FROM learning_roadmaps WHERE id = $1`, [id]),
    pgQuery(
      `SELECT rm.*, row_to_json(c.*) as courses
       FROM roadmap_milestones rm
       LEFT JOIN courses c ON c.id = rm.course_id
       WHERE rm.roadmap_id = $1
       ORDER BY rm.order_index ASC`,
      [id],
    ),
  ]);
  if (!roadmapResult.rows[0]) throw new Error("Roadmap not found");
  return {
    ...roadmapResult.rows[0],
    milestones: milestonesResult.rows as (RoadmapMilestone & {
      courses: Course;
    })[],
  } as LearningRoadmap & {
    milestones: (RoadmapMilestone & { courses: Course })[];
  };
}

export async function createRoadmap(
  roadmap: Omit<LearningRoadmap, "id" | "created_at" | "updated_at">,
) {
  const { cols, placeholders, values } = buildInsert(roadmap as any);
  const result = await pgQuery(
    `INSERT INTO learning_roadmaps (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as LearningRoadmap;
}

export async function updateRoadmap(
  id: string,
  updates: Partial<LearningRoadmap>,
) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE learning_roadmaps SET ${clause}
     WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] as LearningRoadmap;
}

// ============================================================================
// ROADMAP MILESTONES
// ============================================================================

export async function getRoadmapMilestones(roadmapId: string) {
  const result = await pgQuery(
    `SELECT rm.*, row_to_json(c.*) as courses
     FROM roadmap_milestones rm
     LEFT JOIN courses c ON c.id = rm.course_id
     WHERE rm.roadmap_id = $1
     ORDER BY rm.order_index ASC`,
    [roadmapId],
  );
  return result.rows as (RoadmapMilestone & { courses: Course })[];
}

export async function getMilestoneById(id: string) {
  const result = await pgQuery(
    `SELECT rm.*, row_to_json(c.*) as courses
     FROM roadmap_milestones rm
     LEFT JOIN courses c ON c.id = rm.course_id
     WHERE rm.id = $1`,
    [id],
  );
  if (!result.rows[0]) throw new Error("Milestone not found");
  return result.rows[0] as RoadmapMilestone & { courses: Course };
}

export async function createMilestone(
  milestone: Omit<RoadmapMilestone, "id" | "created_at" | "updated_at">,
) {
  const { cols, placeholders, values } = buildInsert(milestone as any);
  const result = await pgQuery(
    `INSERT INTO roadmap_milestones (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as RoadmapMilestone;
}

export async function updateMilestone(
  id: string,
  updates: Partial<RoadmapMilestone>,
) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE roadmap_milestones SET ${clause}
     WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] as RoadmapMilestone;
}

// ============================================================================
// USER ROADMAP PROGRESS
// ============================================================================

export async function getUserRoadmapProgress(
  userId: string,
  roadmapId: string,
) {
  const result = await pgQuery(
    `SELECT * FROM user_roadmap_progress
     WHERE user_id = $1 AND roadmap_id = $2 LIMIT 1`,
    [userId, roadmapId],
  );
  return (result.rows[0] as UserRoadmapProgress) || null;
}

export async function startRoadmap(userId: string, roadmapId: string) {
  try {
    const result = await pgQuery(
      `INSERT INTO user_roadmap_progress (user_id, roadmap_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING *`,
      [userId, roadmapId],
    );
    return (result.rows[0] as UserRoadmapProgress) || null;
  } catch {
    return null;
  }
}

export async function updateRoadmapProgress(
  userId: string,
  roadmapId: string,
  updates: Partial<UserRoadmapProgress>,
) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE user_roadmap_progress SET ${clause}
     WHERE user_id = $${values.length + 1} AND roadmap_id = $${values.length + 2}
     RETURNING *`,
    [...values, userId, roadmapId],
  );
  return result.rows[0] as UserRoadmapProgress;
}

// ============================================================================
// COURSE PURCHASES
// ============================================================================

export async function getPurchases(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  status?: string,
) {
  const conditions = [`cp.user_id = $1`];
  const values: any[] = [userId];
  let idx = 2;

  if (status) {
    conditions.push(`cp.payment_status = $${idx++}`);
    values.push(status);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  const countResult = await pgQuery(
    `SELECT COUNT(*) FROM course_purchases cp ${where}`,
    values,
  );
  const result = await pgQuery(
    `SELECT cp.*, row_to_json(c.*) as courses
     FROM course_purchases cp
     LEFT JOIN courses c ON c.id = cp.course_id
     ${where}
     ORDER BY cp.purchased_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return {
    data: result.rows as (CoursePurchase & { courses: Course })[],
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getPurchaseById(id: string) {
  const result = await pgQuery(
    `SELECT cp.*, row_to_json(c.*) as courses
     FROM course_purchases cp
     LEFT JOIN courses c ON c.id = cp.course_id
     WHERE cp.id = $1`,
    [id],
  );
  if (!result.rows[0]) throw new Error("Purchase not found");
  return result.rows[0] as CoursePurchase & { courses: Course };
}

export async function createPurchase(
  purchase: Omit<CoursePurchase, "id" | "purchased_at" | "refunded_at">,
) {
  const { cols, placeholders, values } = buildInsert(purchase as any);
  const result = await pgQuery(
    `INSERT INTO course_purchases (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0] as CoursePurchase;
}

export async function updatePurchase(
  id: string,
  updates: Partial<CoursePurchase>,
) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE course_purchases SET ${clause}
     WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] as CoursePurchase;
}

// ============================================================================
// USER LEARNING STATS
// ============================================================================

export async function getUserStats(userId: string): Promise<any> {
  const result = await pgQuery(
    `SELECT * FROM user_learning_stats WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
  if (!result.rows[0]) {
    return createUserStats({
      user_id: userId,
      total_courses_enrolled: 0,
      total_courses_completed: 0,
      total_learning_hours: 0,
      total_badges_earned: 0,
      current_streak_days: 0,
      longest_streak_days: 0,
      total_points: 0,
      last_activity_date: new Date(),
    });
  }
  return result.rows[0] as UserLearningStats;
}

export async function createUserStats(
  stats: Omit<UserLearningStats, "id" | "created_at" | "updated_at">,
): Promise<any> {
  try {
    const { cols, placeholders, values } = buildInsert(stats as any);
    const result = await pgQuery(
      `INSERT INTO user_learning_stats (${cols}) VALUES (${placeholders})
       ON CONFLICT (user_id) DO NOTHING RETURNING *`,
      values,
    );
    if (!result.rows[0]) {
      // Already existed, fetch it
      return getUserStats(stats.user_id);
    }
    return result.rows[0] as UserLearningStats;
  } catch {
    return getUserStats(stats.user_id);
  }
}

export async function updateUserStats(
  userId: string,
  updates: Partial<UserLearningStats>,
) {
  const { clause, values } = buildSet(updates as any);
  const result = await pgQuery(
    `UPDATE user_learning_stats SET ${clause}
     WHERE user_id = $${values.length + 1} RETURNING *`,
    [...values, userId],
  );
  return result.rows[0] as UserLearningStats;
}

// ============================================================================
// SEARCH & AGGREGATION
// ============================================================================

export async function searchContent(
  searchQuery: string,
  limit: number = 20,
  offset: number = 0,
) {
  const pattern = `%${searchQuery}%`;

  const [coursesResult, articlesResult, videosResult] = await Promise.all([
    pgQuery(
      `SELECT * FROM courses
       WHERE title ILIKE $1 OR description ILIKE $1
       LIMIT $2`,
      [pattern, limit],
    ),
    pgQuery(
      `SELECT * FROM articles
       WHERE title ILIKE $1 OR content ILIKE $1
       LIMIT $2`,
      [pattern, limit],
    ),
    pgQuery(
      `SELECT * FROM videos
       WHERE title ILIKE $1 OR description ILIKE $1
       LIMIT $2`,
      [pattern, limit],
    ),
  ]);

  return {
    courses: coursesResult.rows as Course[],
    articles: articlesResult.rows as Article[],
    videos: videosResult.rows as Video[],
  };
}

export async function getUserLearningProgress(userId: string) {
  const stats = await getUserStats(userId);

  const [enrollmentsResult, recentLessonsResult, badgesResult] =
    await Promise.all([
      pgQuery(
        `SELECT ce.*, row_to_json(c.*) as courses
         FROM course_enrollments ce
         LEFT JOIN courses c ON c.id = ce.course_id
         WHERE ce.user_id = $1 AND ce.status IN ('enrolled', 'in_progress')`,
        [userId],
      ),
      pgQuery(
        `SELECT * FROM lesson_progress
         WHERE user_id = $1
         ORDER BY updated_at DESC LIMIT 5`,
        [userId],
      ),
      pgQuery(
        `SELECT ub.*, row_to_json(b.*) as badges
         FROM user_badges ub
         LEFT JOIN badges b ON b.id = ub.badge_id
         WHERE ub.user_id = $1
         ORDER BY ub.earned_at DESC LIMIT 5`,
        [userId],
      ),
    ]);

  return {
    stats: stats as UserLearningStats,
    activeEnrollments: enrollmentsResult.rows as (CourseEnrollment & {
      courses: Course;
    })[],
    recentActivity: recentLessonsResult.rows as LessonProgress[],
    recentBadges: badgesResult.rows as (UserBadge & { badges: Badge })[],
  };
}

