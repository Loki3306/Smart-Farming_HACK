// Database Models and Types for Learn Page
// Matches the complete database schema for courses, articles, videos, quizzes, rewards, and user progress

// ============================================
// COURSES
// ============================================
export interface Course {
  id: string;
  title: string;
  description: string;
  category: 'crop-management' | 'irrigation' | 'pest-control' | 'soil-health' | 'equipment' | 'weather';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  lessons: number;
  thumbnail_emoji: string;
  thumbnail_url?: string;
  language: string;
  rating: number;
  enrolled_count: number;
  
  // Pricing
  price: number; // 0 for free, >0 for paid
  currency: string;
  discount_percent: number;
  
  // Instructor
  instructor_id?: string;
  instructor_name: string;
  instructor_bio?: string;
  instructor_avatar?: string;
  
  // Status
  is_published: boolean;
  is_archived: boolean;
  view_count: number;
  completion_rate: number;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

export interface CourseLesson {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  duration: string;
  content_type: 'video' | 'text' | 'quiz' | 'assignment';
  content_url: string;
  is_preview: boolean;
  
  created_at: Date;
  updated_at: Date;
}

// ============================================
// ARTICLES
// ============================================
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author_id?: string;
  author_name: string;
  author_avatar?: string;
  
  read_time_minutes: number;
  language: string;
  
  // Source
  source_type: 'internal' | 'external' | 'scraped';
  source_url?: string;
  source_title?: string;
  
  // Metadata
  thumbnail_url?: string;
  thumbnail_emoji?: string;
  view_count: number;
  like_count: number;
  is_published: boolean;
  is_featured: boolean;
  
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

// ============================================
// VIDEOS
// ============================================
export interface Video {
  id: string;
  title: string;
  description?: string;
  category: string;
  duration_seconds: number;
  
  // Video source
  video_type: 'youtube' | 'vimeo' | 'self_hosted' | 'aws_s3';
  video_url: string;
  video_id?: string;
  thumbnail_url?: string;
  thumbnail_emoji?: string;
  
  // Creator
  creator_id?: string;
  creator_name: string;
  creator_avatar?: string;
  
  // Metadata
  language: string;
  skill_level?: 'beginner' | 'intermediate' | 'advanced';
  transcript?: string;
  is_published: boolean;
  view_count: number;
  like_count: number;
  is_featured: boolean;
  
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

// ============================================
// QUIZZES
// ============================================
export interface Quiz {
  id: string;
  course_id: string;
  lesson_id?: string;
  title: string;
  description?: string;
  
  passing_score: number; // percentage
  time_limit_minutes?: number;
  shuffle_questions: boolean;
  show_correct_answer: boolean;
  
  order_index?: number;
  is_required: boolean;
  
  created_at: Date;
  updated_at: Date;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question_text: string;
  
  options?: Array<{ text: string; is_correct: boolean }>;
  
  points: number;
  order_index: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  
  created_at: Date;
  updated_at: Date;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  
  score: number;
  percentage: number;
  passed: boolean;
  time_spent_seconds: number;
  attempt_number: number;
  
  created_at: Date;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  
  user_answer: string;
  is_correct: boolean;
  points_earned: number;
  
  created_at: Date;
}

// ============================================
// REWARDS & BADGES
// ============================================
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  icon_url?: string;
  category: 'completion' | 'achievement' | 'streak' | 'milestone' | 'special';
  
  requirement_type: string;
  requirement_value: number;
  
  created_at: Date;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: Date;
}

// ============================================
// ROADMAPS
// ============================================
export interface LearningRoadmap {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  goal: string;
  estimated_hours: number;
  icon_emoji: string;
  icon_url?: string;
  
  is_published: boolean;
  view_count: number;
  
  created_at: Date;
  updated_at: Date;
}

export interface RoadmapMilestone {
  id: string;
  roadmap_id: string;
  order_index: number;
  title: string;
  description?: string;
  
  course_id?: string;
  is_completed: boolean;
  
  created_at: Date;
  updated_at: Date;
}

export interface UserRoadmapProgress {
  id: string;
  user_id: string;
  roadmap_id: string;
  
  progress_percent: number;
  completed_milestones: number;
  started_at: Date;
  completed_at?: Date;
}

// ============================================
// ENROLLMENTS & PROGRESS
// ============================================
export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  progress_percent: number;
  lessons_completed: number;
  
  completion_date?: Date;
  certificate_url?: string;
  
  enrollment_type: 'free' | 'paid' | 'promotional' | 'gifted';
  amount_paid?: number;
  
  enrolled_at: Date;
  last_accessed_at?: Date;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  
  status: 'not_started' | 'in_progress' | 'completed';
  completion_date?: Date;
  time_spent_seconds: number;
  
  // For videos
  video_progress_percent?: number;
  last_watched_at?: Date;
  
  created_at: Date;
  updated_at: Date;
}

// ============================================
// PURCHASES
// ============================================
export interface CoursePurchase {
  id: string;
  user_id: string;
  course_id: string;
  
  amount: number;
  currency: string;
  discount_amount: number;
  final_amount: number;
  
  payment_method: string;
  payment_status: 'pending' | 'success' | 'failed' | 'refunded';
  payment_id?: string;
  
  purchased_at: Date;
  refunded_at?: Date;
}

// ============================================
// LEARNING STATISTICS
// ============================================
export interface UserLearningStats {
  id: string;
  user_id: string;
  
  total_courses_enrolled: number;
  total_courses_completed: number;
  total_learning_hours: number;
  total_badges_earned: number;
  current_streak_days: number;
  longest_streak_days: number;
  
  total_points: number;
  
  last_activity_date?: Date;
  
  created_at: Date;
  updated_at: Date;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

// Create/Update Course Request
export interface CreateCourseRequest {
  title: string;
  description: string;
  category: string;
  level: string;
  duration?: string;
  lessons?: number;
  thumbnail_emoji?: string;
  thumbnail_url?: string;
  language?: string;
  rating?: number;
  price?: number;
  currency?: string;
  discount_percent?: number;
  instructor_id?: string;
  instructor_name?: string;
  instructor_bio?: string;
  instructor_avatar?: string;
}

// Create/Update Article Request
export interface CreateArticleRequest {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author_id?: string;
  author_name: string;
  author_avatar?: string;
  read_time_minutes?: number;
  language?: string;
  source_type: string;
  source_url?: string;
  source_title?: string;
  thumbnail_url?: string;
  thumbnail_emoji?: string;
  is_featured?: boolean;
}

// Create/Update Video Request
export interface CreateVideoRequest {
  title: string;
  description?: string;
  category: string;
  duration_seconds: number;
  video_type: string;
  video_url: string;
  video_id?: string;
  thumbnail_url?: string;
  thumbnail_emoji?: string;
  creator_id?: string;
  creator_name: string;
  creator_avatar?: string;
  language?: string;
  skill_level?: string;
  transcript?: string;
  is_featured?: boolean;
}

// Enroll in Course Request
export interface EnrollCourseRequest {
  course_id: string;
  enrollment_type: 'free' | 'paid' | 'promotional' | 'gifted';
  amount_paid?: number;
}

// Submit Quiz Request
export interface SubmitQuizRequest {
  quiz_id: string;
  answers: Array<{
    question_id: string;
    user_answer: string;
  }>;
  time_spent_seconds: number;
}

// Update Progress Request
export interface UpdateProgressRequest {
  lesson_id?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  time_spent_seconds?: number;
  video_progress_percent?: number;
}

// Search Request
export interface SearchRequest {
  query: string;
  category?: string;
  type?: 'courses' | 'articles' | 'videos';
  language?: string;
  level?: string;
  price_range?: { min: number; max: number };
  offset?: number;
  limit?: number;
}

// Generic Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination Response
export interface PaginatedResponse<T> {
  success?: boolean;
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    per_page: number;
    total: number;
  };
}
