import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.API_BASE_URL;

/**
 * LearnService - Frontend API client for Learn platform
 * All functions call backend API endpoints with proper error handling
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  lessons: number;
  thumbnail_emoji?: string;
  thumbnail_url?: string;
  language: string;
  rating: number;
  enrolled_count: number;
  price: number;
  currency: string;
  discount_percent: number;
  instructor_name?: string;
  instructor_avatar?: string;
  is_published: boolean;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author_name?: string;
  author_avatar?: string;
  read_time_minutes?: number;
  language: string;
  source_type: 'internal' | 'external' | 'scraped';
  source_url?: string;
  thumbnail_url?: string;
  thumbnail_emoji?: string;
  view_count: number;
  like_count: number;
  is_featured: boolean;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  category: string;
  duration_seconds?: number;
  video_type: 'youtube' | 'vimeo' | 'self_hosted' | 'aws_s3';
  video_url: string;
  video_id?: string;
  thumbnail_url?: string;
  thumbnail_emoji?: string;
  creator_name?: string;
  language: string;
  skill_level?: string;
  view_count: number;
  like_count: number;
  is_featured: boolean;
  created_at: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  lesson_id?: string;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
  shuffle_questions: boolean;
  show_correct_answer: boolean;
  max_attempts?: number;
  total_questions?: number;
  total_points?: number;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  question_text: string;
  question_image_url?: string;
  options?: QuizOption[];
  points: number;
  order_index: number;
  explanation?: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizOption {
  id: string;
  option_text: string;
  option_image_url?: string;
  is_correct?: boolean;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_spent_seconds: number;
  attempt_number: number;
  started_at: string;
  completed_at?: string;
}

export interface QuizAnswer {
  question_id: string;
  selected_option_id?: string;
  user_answer?: string;
}

export interface QuizResult {
  question_id: string;
  question_text: string;
  question_type: string;
  user_answer: QuizAnswer;
  is_correct: boolean;
  points_earned: number;
  max_points: number;
  explanation?: string;
  correct_option?: QuizOption;
}

export interface QuizSubmitResponse {
  attempt: QuizAttempt;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  passing_score: number;
  results: QuizResult[];
  badges_earned: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_emoji?: string;
  icon_url?: string;
  category: string;
  earned_at?: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  progress_percent: number;
  lessons_completed: number;
  enrolled_at: string;
  courses?: Course;
}

export interface LearningStats {
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalLearningHours: number;
  totalBadgesEarned: number;
  currentStreak: number;
  totalPoints: number;
}

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  goal?: string;
  estimated_hours?: number;
  icon_emoji?: string;
  milestones?: RoadmapMilestone[];
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  course_id?: string;
  courses?: Course;
  userStatus?: string;
  userProgress?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    total_pages: number;
    current_page: number;
    per_page: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// ============================================================================
// API CLIENT HELPER
// ============================================================================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  silent: boolean = false
): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    // Only log errors if not in silent mode
    if (!silent) {
      console.error(`API Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

// ============================================================================
// COURSES
// ============================================================================

export async function getCourses(
  page: number = 1,
  limit: number = 20,
  filters?: { category?: string; level?: string; search?: string }
): Promise<PaginatedResponse<Course>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.category && { category: filters.category }),
    ...(filters?.level && { level: filters.level }),
    ...(filters?.search && { search: filters.search }),
  });

  return apiRequest(`/learn/courses?${params}`);
}

export async function getCourseById(id: string): Promise<ApiResponse<Course & { lessons: any[] }>> {
  return apiRequest(`/learn/courses/${id}`);
}

export async function getCourseLessons(
  courseId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResponse<any>> {
  return apiRequest(`/learn/courses/${courseId}/lessons?page=${page}&limit=${limit}`);
}

// ============================================================================
// ARTICLES
// ============================================================================

export async function getArticles(
  page: number = 1,
  limit: number = 20,
  filters?: { category?: string; featured?: boolean; search?: string }
): Promise<PaginatedResponse<Article>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.category && { category: filters.category }),
    ...(filters?.featured && { featured: 'true' }),
    ...(filters?.search && { search: filters.search }),
  });

  return apiRequest(`/learn/articles?${params}`);
}

export async function getArticleById(id: string): Promise<ApiResponse<Article>> {
  return apiRequest(`/learn/articles/${id}`);
}

export async function likeArticle(id: string): Promise<ApiResponse<Article>> {
  return apiRequest(`/learn/articles/${id}/like`, { method: 'POST' });
}

// ============================================================================
// VIDEOS
// ============================================================================

export async function getVideos(
  page: number = 1,
  limit: number = 20,
  filters?: { category?: string; type?: string; featured?: boolean; search?: string }
): Promise<PaginatedResponse<Video>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.category && { category: filters.category }),
    ...(filters?.type && { type: filters.type }),
    ...(filters?.featured && { featured: 'true' }),
    ...(filters?.search && { search: filters.search }),
  });

  return apiRequest(`/learn/videos?${params}`);
}

export async function getVideoById(id: string): Promise<ApiResponse<Video>> {
  return apiRequest(`/learn/videos/${id}`);
}

export async function likeVideo(id: string): Promise<ApiResponse<Video>> {
  return apiRequest(`/learn/videos/${id}/like`, { method: 'POST' });
}

export async function trackVideoView(id: string): Promise<ApiResponse<Video>> {
  return apiRequest(`/learn/videos/${id}/track-view`, { method: 'POST' });
}

// ============================================================================
// QUIZZES
// ============================================================================

export async function getCourseQuizzes(
  courseId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Quiz>> {
  return apiRequest(`/learn/quizzes/${courseId}?page=${page}&limit=${limit}`);
}

export async function getQuizWithQuestions(id: string): Promise<ApiResponse<Quiz>> {
  return apiRequest(`/learn/quizzes/${id}/questions`);
}

export async function submitQuiz(
  quizId: string,
  answers: Array<{ questionId: string; answer: string }>
): Promise<ApiResponse<{
  attemptId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  answers: any[];
}>> {
  return apiRequest(`/learn/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

// ============================================================================
// ENROLLMENTS
// ============================================================================

export async function enrollInCourse(courseId: string): Promise<ApiResponse<Enrollment>> {
  return apiRequest('/learn/enroll', {
    method: 'POST',
    body: JSON.stringify({ course_id: courseId }),
  });
}

export async function getEnrollments(
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<PaginatedResponse<Enrollment>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
  });

  return apiRequest(`/learn/enrollments?${params}`);
}

export async function getEnrollmentById(id: string): Promise<ApiResponse<Enrollment>> {
  return apiRequest(`/learn/enrollments/${id}`);
}

export async function updateEnrollment(
  id: string,
  updates: Partial<Enrollment>
): Promise<ApiResponse<Enrollment>> {
  return apiRequest(`/learn/enrollments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function dropCourse(enrollmentId: string): Promise<ApiResponse<void>> {
  return apiRequest(`/learn/enrollments/${enrollmentId}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// PROGRESS
// ============================================================================

export async function markLessonProgress(
  lessonId: string,
  courseId: string,
  status: 'in_progress' | 'completed',
  timeSpentSeconds?: number
): Promise<ApiResponse<any>> {
  return apiRequest('/learn/progress/lesson', {
    method: 'POST',
    body: JSON.stringify({ 
      lesson_id: lessonId, 
      course_id: courseId, 
      status, 
      time_spent_seconds: timeSpentSeconds 
    }),
  });
}

export async function getCourseProgress(courseId: string): Promise<ApiResponse<{
  enrollment: Enrollment;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  lessonProgress: any[];
}>> {
  // Use silent mode - 401 errors are expected for non-enrolled users
  return apiRequest(`/learn/progress/course/${courseId}`, {}, true);
}

export async function getAllProgress(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<any>> {
  return apiRequest(`/learn/progress?page=${page}&limit=${limit}`);
}

export async function completeCourse(courseId: string): Promise<ApiResponse<{
  enrollment: Enrollment;
  badge: Badge | null;
  message: string;
}>> {
  return apiRequest(`/learn/courses/${courseId}/complete`, {
    method: 'POST',
  });
}

// ============================================================================
// QUIZZES
// ============================================================================

export async function getQuizForLesson(lessonId: string): Promise<ApiResponse<Quiz>> {
  return apiRequest(`/learn/quizzes/lesson/${lessonId}`);
}

export async function getQuizById(quizId: string, includeAnswers: boolean = false): Promise<ApiResponse<Quiz>> {
  const params = includeAnswers ? '?includeAnswers=true' : '';
  return apiRequest(`/learn/quizzes/${quizId}${params}`);
}

export async function startQuizAttempt(quizId: string): Promise<ApiResponse<{
  attempt: QuizAttempt;
  time_limit_minutes?: number;
  max_attempts?: number;
  attempts_remaining?: number;
}>> {
  return apiRequest(`/learn/quizzes/${quizId}/start`, {
    method: 'POST',
  });
}

export async function submitQuizAnswers(
  quizId: string, 
  attemptId: string, 
  answers: QuizAnswer[],
  timeSpentSeconds: number
): Promise<ApiResponse<QuizSubmitResponse>> {
  return apiRequest(`/learn/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({
      attempt_id: attemptId,
      answers,
      time_spent_seconds: timeSpentSeconds,
    }),
  });
}

export async function getQuizAttempts(quizId: string): Promise<ApiResponse<{
  attempts: QuizAttempt[];
  total_attempts: number;
  max_attempts?: number;
  attempts_remaining?: number;
  best_attempt?: QuizAttempt;
  has_passed: boolean;
}>> {
  return apiRequest(`/learn/quizzes/${quizId}/attempts`);
}

export async function getQuizAttemptDetails(quizId: string, attemptId: string): Promise<ApiResponse<{
  attempt: QuizAttempt;
  quiz: { id: string; title: string; passing_score: number };
  results: any[];
  summary: {
    total_questions: number;
    correct_answers: number;
    score: number;
    max_score: number;
    percentage: number;
    passed: boolean;
    time_spent: number;
  };
}>> {
  return apiRequest(`/learn/quizzes/${quizId}/attempts/${attemptId}`);
}

// ============================================================================
// ROADMAPS
// ============================================================================

export async function getRoadmaps(
  page: number = 1,
  limit: number = 20,
  difficulty?: string
): Promise<PaginatedResponse<Roadmap>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(difficulty && { difficulty }),
  });

  return apiRequest(`/learn/roadmaps?${params}`);
}

export async function getRoadmapById(id: string): Promise<ApiResponse<Roadmap>> {
  return apiRequest(`/learn/roadmaps/${id}`);
}

export async function startRoadmap(roadmapId: string): Promise<ApiResponse<any>> {
  return apiRequest(`/learn/roadmaps/${roadmapId}/start`, { method: 'POST' });
}

export async function getRoadmapProgress(roadmapId: string): Promise<ApiResponse<{
  roadmap: Roadmap;
  userProgress: any;
}>> {
  return apiRequest(`/learn/roadmaps/${roadmapId}/progress`);
}

// ============================================================================
// BADGES
// ============================================================================

export async function getBadges(
  page: number = 1,
  limit: number = 20,
  category?: string
): Promise<PaginatedResponse<Badge>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(category && { category }),
  });

  return apiRequest(`/learn/badges?${params}`);
}

export async function getUserBadges(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Badge>> {
  return apiRequest(`/learn/user/badges?page=${page}&limit=${limit}`);
}

// ============================================================================
// SEARCH & STATS
// ============================================================================

export async function searchContent(
  query: string,
  limit: number = 20
): Promise<ApiResponse<{
  courses: Course[];
  articles: Article[];
  videos: Video[];
  total: number;
}>> {
  return apiRequest(`/learn/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

export async function getLearningStats(): Promise<ApiResponse<LearningStats>> {
  const response = await apiRequest<any>('/learn/stats');
  
  // Transform snake_case from backend to camelCase for frontend
  if (response.success && response.data) {
    const d = response.data;
    return {
      ...response,
      data: {
        totalCoursesEnrolled: d.total_courses_enrolled || 0,
        totalCoursesCompleted: d.total_courses_completed || 0,
        totalLearningHours: d.total_learning_hours || 0,
        totalBadgesEarned: d.total_badges_earned || 0,
        currentStreak: d.current_streak_days || 0,
        totalPoints: d.total_points || 0,
      },
    };
  }
  
  return response as ApiResponse<LearningStats>;
}

// ============================================================================
// PURCHASES
// ============================================================================

export async function createPurchase(
  courseId: string,
  paymentMethod: string
): Promise<ApiResponse<any>> {
  return apiRequest('/learn/purchases', {
    method: 'POST',
    body: JSON.stringify({ courseId, paymentMethod }),
  });
}

export async function getPurchases(
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<PaginatedResponse<any>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
  });

  return apiRequest(`/learn/purchases?${params}`);
}

export async function getPurchaseById(id: string): Promise<ApiResponse<any>> {
  return apiRequest(`/learn/purchases/${id}`);
}

export async function updatePurchaseStatus(
  id: string,
  paymentStatus: string,
  paymentId?: string
): Promise<ApiResponse<any>> {
  return apiRequest(`/learn/purchases/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ paymentStatus, paymentId }),
  });
}

// ============================================================================
// DASHBOARD
// ============================================================================

export async function getLearningDashboard(): Promise<ApiResponse<{
  stats: LearningStats;
  activeEnrollments: Array<{
    id: string;
    courseId: string;
    courseName: string;
    progress: number;
    status: string;
  }>;
  recentActivity: Array<{
    type: string;
    name: string;
    score?: number;
    passed?: boolean;
    date: string;
  }>;
  recentBadges: Array<{
    name: string;
    icon: string;
    earnedAt: string;
  }>;
  roadmaps: Array<{
    roadmapId: string;
    roadmapName: string;
    progress: number;
    completedMilestones: number;
  }>;
}>> {
  // Combine multiple API calls for dashboard
  try {
    const [stats, enrollments, badges] = await Promise.all([
      getLearningStats(),
      getEnrollments(1, 5, 'in_progress'),
      getUserBadges(1, 5),
    ]);

    return {
      success: true,
      data: {
        stats: stats.data,
        activeEnrollments: enrollments.data.map((e) => ({
          id: e.id,
          courseId: e.course_id,
          courseName: e.courses?.title || 'Unknown Course',
          progress: e.progress_percent,
          status: e.status,
        })),
        recentActivity: [],
        recentBadges: badges.data.map((b) => ({
          name: b.name,
          icon: b.icon_emoji || '🏆',
          earnedAt: b.earned_at || '',
        })),
        roadmaps: [],
      },
    };
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// INFINITE SCROLL HELPERS
// ============================================================================

export interface InfiniteScrollState<T> {
  items: T[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

export function createInfiniteScrollState<T>(): InfiniteScrollState<T> {
  return {
    items: [],
    page: 1,
    hasMore: true,
    isLoading: false,
    error: null,
  };
}

export async function loadMoreItems<T>(
  state: InfiniteScrollState<T>,
  fetchFn: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  limit: number = 20
): Promise<InfiniteScrollState<T>> {
  if (state.isLoading || !state.hasMore) {
    return state;
  }

  try {
    const response = await fetchFn(state.page, limit);
    const newItems = [...state.items, ...response.data];
    const hasMore = state.page < response.pagination.total_pages;

    return {
      items: newItems,
      page: state.page + 1,
      hasMore,
      isLoading: false,
      error: null,
    };
  } catch (error: any) {
    return {
      ...state,
      isLoading: false,
      error: error.message || 'Failed to load more items',
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatDuration(seconds: number): string {
  if (!seconds) return '0 min';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

export function formatReadTime(minutes: number): string {
  if (!minutes) return '1 min read';
  return `${minutes} min read`;
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'crop-management': '🌾',
    'irrigation': '💧',
    'pest-control': '🐛',
    'soil-health': '🪴',
    'equipment': '🚜',
    'weather': '⛅',
    'general': '📚',
  };
  return icons[category] || '📖';
}

export function getLevelBadgeColor(level: string): string {
  const colors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };
  return colors[level] || 'bg-gray-100 text-gray-800';
}

export function formatPrice(price: number, currency: string = 'INR'): string {
  if (price === 0) return 'Free';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(price);
}
