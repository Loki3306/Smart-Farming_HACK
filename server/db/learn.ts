import { createClient } from '@supabase/supabase-js';
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
} from '../types/learn.types';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
  }
) {
  let query = supabase.from('courses').select('*', { count: 'exact' });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.level) {
    query = query.eq('level', filters.level);
  }
  if (filters?.isPublished !== undefined) {
    query = query.eq('is_published', filters.isPublished);
  }
  if (filters?.search) {
    query = query.textSearch('search_vector', filters.search);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data as Course[], total: count || 0 };
}

export async function getCourseById(id: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Course;
}

export async function createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'published_at'>) {
  const { data, error } = await supabase
    .from('courses')
    .insert([course])
    .select()
    .single();

  if (error) throw error;
  return data as Course;
}

export async function updateCourse(id: string, updates: Partial<Course>) {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Course;
}

export async function deleteCourse(id: string) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// COURSE LESSONS
// ============================================================================

export async function getCourseLessons(
  courseId: string,
  limit: number = 50,
  offset: number = 0
) {
  const { data, error, count } = await supabase
    .from('course_lessons')
    .select('*', { count: 'exact' })
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data as CourseLesson[], total: count || 0 };
}

export async function getLessonById(id: string) {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as CourseLesson;
}

export async function createLesson(lesson: Omit<CourseLesson, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('course_lessons')
    .insert([lesson])
    .select()
    .single();

  if (error) throw error;
  return data as CourseLesson;
}

export async function updateLesson(id: string, updates: Partial<CourseLesson>) {
  const { data, error } = await supabase
    .from('course_lessons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CourseLesson;
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
  }
) {
  let query = supabase.from('articles').select('*', { count: 'exact' });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.featured) {
    query = query.eq('is_featured', true);
  }
  if (filters?.isPublished !== undefined) {
    query = query.eq('is_published', filters.isPublished);
  }
  if (filters?.search) {
    query = query.textSearch('search_vector', filters.search);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data as Article[], total: count || 0 };
}

export async function getArticleById(id: string) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Article;
}

export async function createArticle(article: Omit<Article, 'id' | 'created_at' | 'updated_at' | 'published_at'>) {
  const { data, error } = await supabase
    .from('articles')
    .insert([article])
    .select()
    .single();

  if (error) throw error;
  return data as Article;
}

export async function updateArticle(id: string, updates: Partial<Article>) {
  const { data, error } = await supabase
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Article;
}

export async function incrementArticleLikes(id: string) {
  const article = await getArticleById(id);
  return updateArticle(id, { like_count: (article.like_count || 0) + 1 });
}

export async function incrementArticleViews(id: string) {
  const article = await getArticleById(id);
  return updateArticle(id, { view_count: (article.view_count || 0) + 1 });
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
  }
) {
  let query = supabase.from('videos').select('*', { count: 'exact' });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.type) {
    query = query.eq('video_type', filters.type);
  }
  if (filters?.featured) {
    query = query.eq('is_featured', true);
  }
  if (filters?.isPublished !== undefined) {
    query = query.eq('is_published', filters.isPublished);
  }
  if (filters?.search) {
    query = query.textSearch('search_vector', filters.search);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data as Video[], total: count || 0 };
}

export async function getVideoById(id: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Video;
}

export async function createVideo(video: Omit<Video, 'id' | 'created_at' | 'updated_at' | 'published_at'>) {
  const { data, error } = await supabase
    .from('videos')
    .insert([video])
    .select()
    .single();

  if (error) throw error;
  return data as Video;
}

export async function updateVideo(id: string, updates: Partial<Video>) {
  const { data, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Video;
}

export async function incrementVideoLikes(id: string) {
  const video = await getVideoById(id);
  return updateVideo(id, { like_count: (video.like_count || 0) + 1 });
}

export async function incrementVideoViews(id: string) {
  const video = await getVideoById(id);
  return updateVideo(id, { view_count: (video.view_count || 0) + 1 });
}

// ============================================================================
// QUIZZES
// ============================================================================

export async function getQuizzesByCourse(
  courseId: string,
  limit: number = 20,
  offset: number = 0
) {
  const { data, error, count } = await supabase
    .from('quizzes')
    .select('*', { count: 'exact' })
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data as Quiz[], total: count || 0 };
}

export async function getQuizById(id: string) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Quiz;
}

export async function getQuizWithQuestions(id: string) {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .single();

  if (quizError) throw quizError;

  const { data: questions, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', id)
    .order('order_index', { ascending: true });

  if (questionsError) throw questionsError;

  return {
    ...quiz,
    questions: questions as QuizQuestion[],
  } as Quiz & { questions: QuizQuestion[] };
}

export async function createQuiz(quiz: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('quizzes')
    .insert([quiz])
    .select()
    .single();

  if (error) throw error;
  return data as Quiz;
}

export async function updateQuiz(id: string, updates: Partial<Quiz>) {
  const { data, error } = await supabase
    .from('quizzes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Quiz;
}

// ============================================================================
// QUIZ QUESTIONS
// ============================================================================

export async function getQuizQuestions(quizId: string) {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data as QuizQuestion[];
}

export async function getQuestionById(id: string) {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as QuizQuestion;
}

export async function createQuestion(question: Omit<QuizQuestion, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert([question])
    .select()
    .single();

  if (error) throw error;
  return data as QuizQuestion;
}

export async function updateQuestion(id: string, updates: Partial<QuizQuestion>) {
  const { data, error } = await supabase
    .from('quiz_questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as QuizQuestion;
}

// ============================================================================
// BADGES
// ============================================================================

export async function getBadges(
  limit: number = 20,
  offset: number = 0,
  category?: string
) {
  let query = supabase.from('badges').select('*', { count: 'exact' });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data as Badge[], total: count || 0 };
}

export async function getBadgeById(id: string) {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Badge;
}

export async function createBadge(badge: Omit<Badge, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('badges')
    .insert([badge])
    .select()
    .single();

  if (error) throw error;
  return data as Badge;
}

// ============================================================================
// COURSE ENROLLMENTS
// ============================================================================

export async function getEnrollments(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  status?: string
) {
  let query = supabase
    .from('course_enrollments')
    .select('*, courses(*)', { count: 'exact' })
    .eq('user_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query
    .order('enrolled_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data as (CourseEnrollment & { courses: Course })[], total: count || 0 };
}

export async function getEnrollmentById(id: string) {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('*, courses(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as CourseEnrollment & { courses: Course };
}

export async function getEnrollment(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (error?.code === 'PGRST116') return null; // not found
  if (error) throw error;
  return data as CourseEnrollment;
}

export async function createEnrollment(enrollment: Omit<CourseEnrollment, 'id' | 'enrolled_at' | 'last_accessed_at'>) {
  const { data, error } = await supabase
    .from('course_enrollments')
    .insert([enrollment])
    .select()
    .single();

  if (error) throw error;
  return data as CourseEnrollment;
}

export async function updateEnrollment(id: string, updates: Partial<CourseEnrollment>) {
  const { data, error } = await supabase
    .from('course_enrollments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CourseEnrollment;
}

export async function deleteEnrollment(id: string) {
  const { error } = await supabase
    .from('course_enrollments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// LESSON PROGRESS
// ============================================================================

export async function getLessonProgress(userId: string, lessonId: string) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();

  if (error?.code === 'PGRST116') return null; // not found
  if (error) throw error;
  return data as LessonProgress;
}

export async function createLessonProgress(progress: Omit<LessonProgress, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .insert([progress])
    .select()
    .single();

  if (error) throw error;
  return data as LessonProgress;
}

export async function updateLessonProgress(id: string, updates: Partial<LessonProgress>) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as LessonProgress;
}

export async function getCourseProgress(userId: string, courseId: string) {
  const { data: enrollments, error: enrollError } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (enrollError) throw enrollError;

  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId);

  if (lessonsError) throw lessonsError;

  const { data: progress, error: progressError } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .in('lesson_id', lessons!.map((l) => l.id))
    .eq('status', 'completed');

  if (progressError) throw progressError;

  const totalLessons = lessons!.length;
  const completedLessons = progress!.length;
  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  return {
    enrollment: enrollments as CourseEnrollment,
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
  offset: number = 0
) {
  const { data, error, count } = await supabase
    .from('quiz_attempts')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data as QuizAttempt[], total: count || 0 };
}

export async function getLatestQuizAttempt(userId: string, quizId: string) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error?.code === 'PGRST116') return null; // not found
  if (error) throw error;
  return data as QuizAttempt;
}

export async function createQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert([attempt])
    .select()
    .single();

  if (error) throw error;
  return data as QuizAttempt;
}

export async function updateQuizAttempt(id: string, updates: Partial<QuizAttempt>) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as QuizAttempt;
}

// ============================================================================
// QUIZ ANSWERS
// ============================================================================

export async function getAttemptAnswers(attemptId: string) {
  const { data, error } = await supabase
    .from('quiz_answers')
    .select('*')
    .eq('attempt_id', attemptId);

  if (error) throw error;
  return data as QuizAnswer[];
}

export async function createQuizAnswer(answer: Omit<QuizAnswer, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('quiz_answers')
    .insert([answer])
    .select()
    .single();

  if (error) throw error;
  return data as QuizAnswer;
}

export async function createQuizAnswers(answers: Omit<QuizAnswer, 'id' | 'created_at'>[]) {
  const { data, error } = await supabase
    .from('quiz_answers')
    .insert(answers)
    .select();

  if (error) throw error;
  return data as QuizAnswer[];
}

// ============================================================================
// USER BADGES
// ============================================================================

export async function getUserBadges(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  category?: string
) {
  let query = supabase
    .from('user_badges')
    .select('*, badges(*)', { count: 'exact' })
    .eq('user_id', userId);

  if (category) {
    query = query.filter('badges.category', 'eq', category);
  }

  const { data, error, count } = await query
    .order('earned_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data as (UserBadge & { badges: Badge })[], total: count || 0 };
}

export async function getUserBadge(userId: string, badgeId: string) {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .single();

  if (error?.code === 'PGRST116') return null; // not found
  if (error) throw error;
  return data as UserBadge;
}

export async function awardBadge(userId: string, badgeId: string) {
  const { data, error } = await supabase
    .from('user_badges')
    .insert([{ user_id: userId, badge_id: badgeId }])
    .select()
    .single();

  if (error?.code === 'PGRST116' || error?.code === '23505') return null; // already exists
  if (error) throw error;
  return data as UserBadge;
}

// ============================================================================
// LEARNING ROADMAPS
// ============================================================================

export async function getRoadmaps(
  limit: number = 20,
  offset: number = 0,
  difficulty?: string,
  isPublished: boolean = true
) {
  let query = supabase.from('learning_roadmaps').select('*', { count: 'exact' });

  if (isPublished) {
    query = query.eq('is_published', true);
  }
  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data as LearningRoadmap[], total: count || 0 };
}

export async function getRoadmapById(id: string) {
  const { data, error } = await supabase
    .from('learning_roadmaps')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as LearningRoadmap;
}

export async function getRoadmapWithMilestones(id: string) {
  const { data: roadmap, error: roadmapError } = await supabase
    .from('learning_roadmaps')
    .select('*')
    .eq('id', id)
    .single();

  if (roadmapError) throw roadmapError;

  const { data: milestones, error: milestonesError } = await supabase
    .from('roadmap_milestones')
    .select('*, courses(*)')
    .eq('roadmap_id', id)
    .order('order_index', { ascending: true });

  if (milestonesError) throw milestonesError;

  return {
    ...roadmap,
    milestones: milestones as (RoadmapMilestone & { courses: Course })[],
  } as LearningRoadmap & { milestones: (RoadmapMilestone & { courses: Course })[] };
}

export async function createRoadmap(roadmap: Omit<LearningRoadmap, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('learning_roadmaps')
    .insert([roadmap])
    .select()
    .single();

  if (error) throw error;
  return data as LearningRoadmap;
}

export async function updateRoadmap(id: string, updates: Partial<LearningRoadmap>) {
  const { data, error } = await supabase
    .from('learning_roadmaps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as LearningRoadmap;
}

// ============================================================================
// ROADMAP MILESTONES
// ============================================================================

export async function getRoadmapMilestones(roadmapId: string) {
  const { data, error } = await supabase
    .from('roadmap_milestones')
    .select('*, courses(*)')
    .eq('roadmap_id', roadmapId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data as (RoadmapMilestone & { courses: Course })[];
}

export async function getMilestoneById(id: string) {
  const { data, error } = await supabase
    .from('roadmap_milestones')
    .select('*, courses(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as RoadmapMilestone & { courses: Course };
}

export async function createMilestone(milestone: Omit<RoadmapMilestone, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('roadmap_milestones')
    .insert([milestone])
    .select()
    .single();

  if (error) throw error;
  return data as RoadmapMilestone;
}

export async function updateMilestone(id: string, updates: Partial<RoadmapMilestone>) {
  const { data, error } = await supabase
    .from('roadmap_milestones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as RoadmapMilestone;
}

// ============================================================================
// USER ROADMAP PROGRESS
// ============================================================================

export async function getUserRoadmapProgress(userId: string, roadmapId: string) {
  const { data, error } = await supabase
    .from('user_roadmap_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('roadmap_id', roadmapId)
    .single();

  if (error?.code === 'PGRST116') return null; // not found
  if (error) throw error;
  return data as UserRoadmapProgress;
}

export async function startRoadmap(userId: string, roadmapId: string) {
  const { data, error } = await supabase
    .from('user_roadmap_progress')
    .insert([{ user_id: userId, roadmap_id: roadmapId }])
    .select()
    .single();

  if (error?.code === '23505') return null; // already started
  if (error) throw error;
  return data as UserRoadmapProgress;
}

export async function updateRoadmapProgress(
  userId: string,
  roadmapId: string,
  updates: Partial<UserRoadmapProgress>
) {
  const { data, error } = await supabase
    .from('user_roadmap_progress')
    .update(updates)
    .eq('user_id', userId)
    .eq('roadmap_id', roadmapId)
    .select()
    .single();

  if (error) throw error;
  return data as UserRoadmapProgress;
}

// ============================================================================
// COURSE PURCHASES
// ============================================================================

export async function getPurchases(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  status?: string
) {
  let query = supabase
    .from('course_purchases')
    .select('*, courses(*)', { count: 'exact' })
    .eq('user_id', userId);

  if (status) {
    query = query.eq('payment_status', status);
  }

  const { data, error, count } = await query
    .order('purchased_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data as (CoursePurchase & { courses: Course })[], total: count || 0 };
}

export async function getPurchaseById(id: string) {
  const { data, error } = await supabase
    .from('course_purchases')
    .select('*, courses(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as CoursePurchase & { courses: Course };
}

export async function createPurchase(purchase: Omit<CoursePurchase, 'id' | 'purchased_at' | 'refunded_at'>) {
  const { data, error } = await supabase
    .from('course_purchases')
    .insert([purchase])
    .select()
    .single();

  if (error) throw error;
  return data as CoursePurchase;
}

export async function updatePurchase(id: string, updates: Partial<CoursePurchase>) {
  const { data, error } = await supabase
    .from('course_purchases')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CoursePurchase;
}

// ============================================================================
// USER LEARNING STATS
// ============================================================================

export async function getUserStats(userId: string) {
  const { data, error } = await supabase
    .from('user_learning_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error?.code === 'PGRST116') {
    // Create default stats if not found
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
  if (error) throw error;
  return data as UserLearningStats;
}

export async function createUserStats(stats: Omit<UserLearningStats, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('user_learning_stats')
    .insert([stats])
    .select()
    .single();

  if (error?.code === '23505') {
    // Already exists, fetch it
    return getUserStats(stats.user_id);
  }
  if (error) throw error;
  return data as UserLearningStats;
}

export async function updateUserStats(userId: string, updates: Partial<UserLearningStats>) {
  const { data, error } = await supabase
    .from('user_learning_stats')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as UserLearningStats;
}

// ============================================================================
// SEARCH & AGGREGATION
// ============================================================================

export async function searchContent(query: string, limit: number = 20, offset: number = 0) {
  const courses = supabase
    .from('courses')
    .select('*')
    .textSearch('search_vector', query)
    .limit(limit);

  const articles = supabase
    .from('articles')
    .select('*')
    .textSearch('search_vector', query)
    .limit(limit);

  const videos = supabase
    .from('videos')
    .select('*')
    .textSearch('search_vector', query)
    .limit(limit);

  const [coursesData, articlesData, videosData] = await Promise.all([
    courses,
    articles,
    videos,
  ]);

  const results = {
    courses: (coursesData.data || []) as Course[],
    articles: (articlesData.data || []) as Article[],
    videos: (videosData.data || []) as Video[],
  };

  return results;
}

export async function getUserLearningProgress(userId: string) {
  // Get stats
  const stats = await getUserStats(userId);

  // Get active enrollments
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('*, courses(*)')
    .eq('user_id', userId)
    .in('status', ['enrolled', 'in_progress']);

  // Get recent activity
  const { data: recentLessons } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(5);

  // Get badges
  const { data: badges } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
    .limit(5);

  return {
    stats: stats as UserLearningStats,
    activeEnrollments: (enrollments || []) as (CourseEnrollment & { courses: Course })[],
    recentActivity: (recentLessons || []) as LessonProgress[],
    recentBadges: (badges || []) as (UserBadge & { badges: Badge })[],
  };
}
