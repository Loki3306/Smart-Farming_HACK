#!/usr/bin/env node
/**
 * Learn Page Backend API Specification
 * Complete RESTful API endpoints for courses, articles, videos, quizzes, and user progress
 */

// ============================================
// COURSES API
// ============================================

/**
 * GET /api/learn/courses
 * List all published courses with pagination and filtering
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 10, max: 50)
 *   - category: string (optional)
 *   - level: 'beginner' | 'intermediate' | 'advanced' (optional)
 *   - language: string (optional)
 *   - is_free: boolean (optional) - true = price = 0
 *   - search: string (optional) - search by title/description
 *   - sort: string (default: 'created_at') - created_at, rating, enrolled_count, price
 *   - order: 'asc' | 'desc' (default: 'desc')
 * 
 * Response:
 *   {
 *     success: true,
 *     data: Course[],
 *     pagination: { total: number, page: number, limit: number, pages: number }
 *   }
 */

/**
 * GET /api/learn/courses/:id
 * Get a single course with all lessons and related content
 * 
 * Response:
 *   {
 *     course: Course,
 *     lessons: CourseLesson[],
 *     instructor: { id, name, bio, avatar },
 *     stats: { enrollments, completion_rate, avg_rating }
 *   }
 */

/**
 * POST /api/learn/courses
 * Create a new course (Admin only)
 * 
 * Body: CreateCourseRequest
 * Response: { success: true, data: Course }
 */

/**
 * PUT /api/learn/courses/:id
 * Update a course (Admin only)
 * 
 * Body: Partial<CreateCourseRequest>
 * Response: { success: true, data: Course }
 */

/**
 * DELETE /api/learn/courses/:id
 * Archive/delete a course (Admin only)
 * 
 * Response: { success: true, message: "Course archived" }
 */

/**
 * GET /api/learn/courses/:id/lessons
 * Get all lessons for a course
 * 
 * Query Parameters:
 *   - preview_only: boolean - get only preview lessons if not enrolled
 * 
 * Response:
 *   {
 *     success: true,
 *     data: CourseLesson[]
 *   }
 */

/**
 * POST /api/learn/courses/:id/lessons
 * Add a lesson to a course (Admin only)
 * 
 * Body: { title, description?, order_index, duration, content_type, content_url, is_preview? }
 * Response: { success: true, data: CourseLesson }
 */

/**
 * PUT /api/learn/courses/:courseId/lessons/:lessonId
 * Update a lesson (Admin only)
 * 
 * Response: { success: true, data: CourseLesson }
 */

/**
 * DELETE /api/learn/courses/:courseId/lessons/:lessonId
 * Delete a lesson (Admin only)
 * 
 * Response: { success: true, message: "Lesson deleted" }
 */

// ============================================
// ARTICLES API
// ============================================

/**
 * GET /api/learn/articles
 * List all published articles with pagination and filtering
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 10, max: 50)
 *   - category: string (optional)
 *   - language: string (optional)
 *   - featured: boolean (optional)
 *   - search: string (optional)
 *   - sort: string (default: 'created_at') - created_at, view_count, like_count
 *   - order: 'asc' | 'desc' (default: 'desc')
 * 
 * Response:
 *   {
 *     success: true,
 *     data: Article[],
 *     pagination: { total, page, limit, pages }
 *   }
 */

/**
 * GET /api/learn/articles/:id
 * Get a single article
 * 
 * Response:
 *   {
 *     success: true,
 *     data: Article,
 *     author: { id, name, avatar }
 *   }
 */

/**
 * POST /api/learn/articles
 * Create a new article (Admin only)
 * 
 * Body: CreateArticleRequest
 * Response: { success: true, data: Article }
 */

/**
 * PUT /api/learn/articles/:id
 * Update an article (Admin only)
 * 
 * Body: Partial<CreateArticleRequest>
 * Response: { success: true, data: Article }
 */

/**
 * DELETE /api/learn/articles/:id
 * Delete an article (Admin only)
 * 
 * Response: { success: true, message: "Article deleted" }
 */

/**
 * POST /api/learn/articles/:id/like
 * Like an article (Authenticated users)
 * 
 * Response: { success: true, data: { like_count } }
 */

/**
 * DELETE /api/learn/articles/:id/like
 * Unlike an article (Authenticated users)
 * 
 * Response: { success: true, data: { like_count } }
 */

// ============================================
// VIDEOS API
// ============================================

/**
 * GET /api/learn/videos
 * List all published videos with pagination and filtering
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 10, max: 50)
 *   - category: string (optional)
 *   - skill_level: string (optional)
 *   - language: string (optional)
 *   - featured: boolean (optional)
 *   - video_type: string (optional)
 *   - search: string (optional)
 *   - sort: string (default: 'created_at')
 *   - order: 'asc' | 'desc' (default: 'desc')
 * 
 * Response:
 *   {
 *     success: true,
 *     data: Video[],
 *     pagination: { total, page, limit, pages }
 *   }
 */

/**
 * GET /api/learn/videos/:id
 * Get a single video
 * 
 * Response:
 *   {
 *     success: true,
 *     data: Video,
 *     creator: { id, name, avatar }
 *   }
 */

/**
 * POST /api/learn/videos
 * Create a new video (Admin only)
 * 
 * Body: CreateVideoRequest
 * Response: { success: true, data: Video }
 */

/**
 * PUT /api/learn/videos/:id
 * Update a video (Admin only)
 * 
 * Body: Partial<CreateVideoRequest>
 * Response: { success: true, data: Video }
 */

/**
 * DELETE /api/learn/videos/:id
 * Delete a video (Admin only)
 * 
 * Response: { success: true, message: "Video deleted" }
 */

/**
 * POST /api/learn/videos/:id/like
 * Like a video (Authenticated users)
 * 
 * Response: { success: true, data: { like_count } }
 */

/**
 * DELETE /api/learn/videos/:id/like
 * Unlike a video (Authenticated users)
 * 
 * Response: { success: true, data: { like_count } }
 */

/**
 * POST /api/learn/videos/:id/view
 * Record a video view (for analytics)
 * 
 * Body: { time_watched_seconds?: number }
 * Response: { success: true, data: { view_count } }
 */

// ============================================
// QUIZZES API
// ============================================

/**
 * GET /api/learn/quizzes/:courseId
 * Get all quizzes for a course
 * 
 * Response:
 *   {
 *     success: true,
 *     data: Quiz[]
 *   }
 */

/**
 * GET /api/learn/quizzes/:id
 * Get a single quiz with questions
 * 
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       quiz: Quiz,
 *       questions: QuizQuestion[]
 *     }
 *   }
 */

/**
 * POST /api/learn/quizzes
 * Create a new quiz (Admin only)
 * 
 * Body: {
 *   course_id: string,
 *   lesson_id?: string,
 *   title: string,
 *   description?: string,
 *   passing_score: number,
 *   time_limit_minutes?: number,
 *   shuffle_questions?: boolean,
 *   show_correct_answer?: boolean,
 *   questions: QuizQuestion[]
 * }
 * Response: { success: true, data: Quiz }
 */

/**
 * POST /api/learn/quizzes/:id/submit
 * Submit quiz answers (Authenticated users)
 * 
 * Body: SubmitQuizRequest
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       attempt: QuizAttempt,
 *       score: number,
 *       percentage: number,
 *       passed: boolean,
 *       answers: Array<{ question_id, is_correct, explanation? }>
 *     }
 *   }
 */

/**
 * GET /api/learn/quizzes/:id/attempts
 * Get all attempts for a quiz by current user (Authenticated users)
 * 
 * Response:
 *   {
 *     success: true,
 *     data: QuizAttempt[],
 *     stats: { best_score, attempts_count, first_passed_date }
 *   }
 */

/**
 * GET /api/learn/quizzes/:quizId/attempts/:attemptId
 * Get details of a specific quiz attempt
 * 
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       attempt: QuizAttempt,
 *       answers: QuizAnswer[]
 *     }
 *   }
 */

// ============================================
// ENROLLMENTS API
// ============================================

/**
 * POST /api/learn/enrollments
 * Enroll in a course (Authenticated users)
 * 
 * Body: EnrollCourseRequest
 * Response:
 *   {
 *     success: true,
 *     data: CourseEnrollment
 *   }
 */

/**
 * GET /api/learn/enrollments
 * Get all enrollments for current user (Authenticated users)
 * 
 * Query Parameters:
 *   - status: 'enrolled' | 'in_progress' | 'completed' | 'dropped' (optional)
 *   - page: number
 *   - limit: number
 * 
 * Response:
 *   {
 *     success: true,
 *     data: CourseEnrollment[],
 *     pagination: { total, page, limit, pages }
 *   }
 */

/**
 * GET /api/learn/enrollments/:courseId
 * Get enrollment status for a specific course (Authenticated users)
 * 
 * Response:
 *   {
 *     success: true,
 *     data: CourseEnrollment | null
 *   }
 */

/**
 * PUT /api/learn/enrollments/:courseId
 * Update enrollment (e.g., mark as completed) (Authenticated users)
 * 
 * Body: { status?: string, progress_percent?: number }
 * Response: { success: true, data: CourseEnrollment }
 */

/**
 * DELETE /api/learn/enrollments/:courseId
 * Drop a course (Authenticated users)
 * 
 * Response: { success: true, message: "Course dropped" }
 */

// ============================================
// PROGRESS API
// ============================================

/**
 * POST /api/learn/progress
 * Update lesson progress (Authenticated users)
 * 
 * Body: UpdateProgressRequest
 * Response: { success: true, data: LessonProgress }
 */

/**
 * GET /api/learn/progress/:courseId
 * Get all lesson progress for a course (Authenticated users)
 * 
 * Response:
 *   {
 *     success: true,
 *     data: LessonProgress[],
 *     stats: { completed_lessons, total_lessons, progress_percent }
 *   }
 */

/**
 * GET /api/learn/progress/:courseId/:lessonId
 * Get progress for a specific lesson (Authenticated users)
 * 
 * Response: { success: true, data: LessonProgress }
 */

// ============================================
// ROADMAPS API
// ============================================

/**
 * GET /api/learn/roadmaps
 * List all published learning roadmaps
 * 
 * Query Parameters:
 *   - difficulty: string (optional)
 *   - search: string (optional)
 *   - page: number
 *   - limit: number
 * 
 * Response:
 *   {
 *     success: true,
 *     data: LearningRoadmap[],
 *     pagination: { total, page, limit, pages }
 *   }
 */

/**
 * GET /api/learn/roadmaps/:id
 * Get a roadmap with all milestones and linked courses
 * 
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       roadmap: LearningRoadmap,
 *       milestones: Array<RoadmapMilestone & { course: Course }>
 *     }
 *   }
 */

/**
 * POST /api/learn/roadmaps/:id/start
 * Start following a roadmap (Authenticated users)
 * 
 * Response: { success: true, data: UserRoadmapProgress }
 */

/**
 * GET /api/learn/roadmaps/progress/:roadmapId
 * Get current user's progress on a roadmap (Authenticated users)
 * 
 * Response:
 *   {
 *     success: true,
 *     data: UserRoadmapProgress,
 *     milestones_progress: Array<{
 *       milestone: RoadmapMilestone,
 *       course_enrollment?: CourseEnrollment
 *     }>
 *   }
 */

// ============================================
// BADGES API
// ============================================

/**
 * GET /api/learn/badges
 * Get all available badges
 * 
 * Query Parameters:
 *   - category: string (optional)
 * 
 * Response:
 *   {
 *     success: true,
 *     data: Badge[]
 *   }
 */

/**
 * GET /api/learn/badges/user
 * Get badges earned by current user (Authenticated users)
 * 
 * Response:
 *   {
 *     success: true,
 *     data: Array<Badge & { earned_at: Date }>
 *   }
 */

// ============================================
// USER STATS API
// ============================================

/**
 * GET /api/learn/stats
 * Get learning statistics for current user (Authenticated users)
 * 
 * Response:
 *   {
 *     success: true,
 *     data: UserLearningStats,
 *     recent_activity: {
 *       last_enrolled?: Course,
 *       last_completed?: Course,
 *       current_streak_days: number,
 *       badges_earned_this_month: number
 *     }
 *   }
 */

// ============================================
// SEARCH API
// ============================================

/**
 * GET /api/learn/search
 * Unified search across courses, articles, and videos
 * 
 * Query Parameters:
 *   - q: string (required) - search query
 *   - type: 'courses' | 'articles' | 'videos' | 'all' (optional, default: 'all')
 *   - category: string (optional)
 *   - language: string (optional)
 *   - page: number
 *   - limit: number
 * 
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       courses: Course[],
 *       articles: Article[],
 *       videos: Video[]
 *     },
 *     total: number
 *   }
 */

// ============================================
// PURCHASES API (Payment Integration)
// ============================================

/**
 * POST /api/learn/purchases/initiate
 * Initiate a course purchase (Authenticated users)
 * 
 * Body: { course_id: string }
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       course: Course,
 *       amount: number,
 *       payment_details: { razorpay_order_id | stripe_intent_id, etc. }
 *     }
 *   }
 */

/**
 * POST /api/learn/purchases/verify
 * Verify payment and complete purchase (Authenticated users)
 * 
 * Body: {
 *   course_id: string,
 *   payment_id: string,
 *   signature: string // from payment gateway
 * }
 * Response:
 *   {
 *     success: true,
 *     data: CoursePurchase,
 *     enrollment: CourseEnrollment
 *   }
 */

/**
 * GET /api/learn/purchases
 * Get purchase history (Authenticated users)
 * 
 * Response:
 *   {
 *     success: true,
 *     data: CoursePurchase[]
 *   }
 */

/**
 * POST /api/learn/purchases/:id/refund
 * Request refund for a purchase (Authenticated users)
 * 
 * Body: { reason?: string }
 * Response: { success: true, message: "Refund initiated" }
 */

// ============================================
// RECOMMENDATIONS API
// ============================================

/**
 * GET /api/learn/recommendations
 * Get personalized course recommendations (Authenticated users)
 * 
 * Query Parameters:
 *   - limit: number (default: 10)
 * 
 * Response:
 *   {
 *     success: true,
 *     data: Course[],
 *     reason: string // e.g., "Based on your interests in irrigation"
 *   }
 */

// ============================================
// STATISTICS API (Admin)
// ============================================

/**
 * GET /api/learn/admin/stats
 * Get platform-wide learning statistics (Admin only)
 * 
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       total_courses: number,
 *       total_articles: number,
 *       total_videos: number,
 *       total_enrollments: number,
 *       total_completions: number,
 *       avg_completion_time_hours: number,
 *       most_popular_courses: Course[],
 *       most_popular_articles: Article[],
 *       most_popular_videos: Video[]
 *     }
 *   }
 */

/**
 * GET /api/learn/admin/courses/:id/analytics
 * Get analytics for a specific course (Admin only)
 * 
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       enrollments: number,
 *       completions: number,
 *       completion_rate: number,
 *       avg_rating: number,
 *       revenue: number,
 *       top_performing_lessons: CourseLesson[],
 *       quiz_performance: { avg_score, pass_rate }
 *     }
 *   }
 */

export {};
