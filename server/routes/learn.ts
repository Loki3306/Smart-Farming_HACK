import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import {
  Course,
  Article,
  Video,
  Quiz,
  QuizQuestion,
  Badge,
  CourseEnrollment,
  LessonProgress,
  QuizAttempt,
  LearningRoadmap,
  CoursePurchase,
  UserLearningStats,
  PaginatedResponse,
  ApiResponse,
} from '../types/learn.types';

const router = Router();

// ============================================
// MIDDLEWARE & HELPERS
// ============================================

// Middleware: Parse auth token and set user
const parseAuthToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Parse mock token format: "mock-jwt-{uuid}-{timestamp}"
    // UUID has format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars with dashes)
    // So token is: mock-jwt-{36 char uuid}-{timestamp}
    if (token.startsWith('mock-jwt-')) {
      const afterPrefix = token.substring(9); // Remove "mock-jwt-"
      // UUID is 36 characters (8-4-4-4-12 with dashes)
      // Find the last dash that separates UUID from timestamp
      const lastDashIndex = afterPrefix.lastIndexOf('-');
      if (lastDashIndex > 0) {
        const userId = afterPrefix.substring(0, lastDashIndex);
        (req as any).user = { id: userId };
      }
    }
  }
  
  next();
};

// Apply parseAuthToken middleware to all routes
router.use(parseAuthToken);

// Middleware: Check authentication (requires parseAuthToken to be called first)
const checkAuth = (req: Request, res: Response, next: Function) => {
  // In development/demo, allow a fallback user id if no auth token is present
  const farmerId = (req as any).user?.id || process.env.DEMO_FARMER_ID;
  if (!farmerId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Please login first',
      data: null,
    });
  }
  (req as any).farmerId = farmerId;
  next();
};

// Helper: Standard error response
const errorResponse = (res: Response, statusCode: number, message: string, error?: any) => {
  console.error('API Error:', { message, error });
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
  });
};

// Helper: Standard success response
const successResponse = (res: Response, data: any, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};

// Helper: Get pagination params
const getPaginationParams = (req: Request): { limit: number; offset: number } => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 per page
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const offset = (page - 1) * limit;
  return { limit, offset };
};

// Helper: Update user learning stats
const updateUserStats = async (userId: string) => {
  try {
    console.log('[Stats] Updating stats for user:', userId);

    // Get enrollment counts
    const { data: enrollments, error: enrollError } = await supabase
      .from('course_enrollments')
      .select('id, status')
      .eq('user_id', userId);

    if (enrollError) {
      console.error('[Stats] Error fetching enrollments:', enrollError);
    }

    const totalEnrolled = enrollments?.length || 0;
    const totalCompleted = enrollments?.filter(e => e.status === 'completed').length || 0;
    
    console.log('[Stats] Enrollments:', { totalEnrolled, totalCompleted, enrollments });

    // Get badge count
    const { count: badgeCount, error: badgeError } = await supabase
      .from('user_badges')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (badgeError) {
      console.error('[Stats] Error fetching badges:', badgeError);
    }

    // Calculate learning hours from completed lessons
    const { data: progress, error: progressError } = await supabase
      .from('lesson_progress')
      .select('time_spent_seconds')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (progressError) {
      console.error('[Stats] Error fetching progress:', progressError);
    }

    const completedLessonsCount = progress?.length || 0;
    const totalSeconds = progress?.reduce((sum, p) => sum + (p.time_spent_seconds || 300), 0) || 0;
    const totalHours = Math.max(1, Math.ceil(totalSeconds / 3600)); // At least 1 hour if any progress

    // Calculate streak - get existing stats first
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const { data: existingStats } = await supabase
      .from('user_learning_stats')
      .select('current_streak_days, longest_streak_days, last_activity_date')
      .eq('user_id', userId)
      .maybeSingle();

    let currentStreak = 1; // At least 1 for today's activity
    let longestStreak = existingStats?.longest_streak_days || 0;

    if (existingStats?.last_activity_date) {
      const lastActivity = existingStats.last_activity_date;
      if (lastActivity === yesterday) {
        // Consecutive day - increment streak
        currentStreak = (existingStats.current_streak_days || 0) + 1;
      } else if (lastActivity === today) {
        // Same day - keep current streak
        currentStreak = existingStats.current_streak_days || 1;
      }
      // Otherwise streak resets to 1
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    const statsToUpsert = {
      user_id: userId,
      total_courses_enrolled: totalEnrolled,
      total_courses_completed: totalCompleted,
      total_learning_hours: completedLessonsCount > 0 ? totalHours : 0,
      total_badges_earned: badgeCount || 0,
      current_streak_days: currentStreak,
      longest_streak_days: longestStreak,
      total_points: (totalCompleted * 100) + (completedLessonsCount * 10), // 100 per course, 10 per lesson
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    };

    console.log('[Stats] Upserting:', statsToUpsert);

    const { error: upsertError } = await supabase
      .from('user_learning_stats')
      .upsert(statsToUpsert, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('[Stats] Upsert error:', upsertError);
    } else {
      console.log('[Stats] Successfully updated stats');
    }

  } catch (err) {
    console.error('[Stats] Failed to update user stats:', err);
    // Don't throw - stats update failure shouldn't break the main operation
  }
};

// ============================================
// COURSES ENDPOINTS (8)
// ============================================

// GET /learn/courses - List all published courses with pagination
router.get('/courses', async (req: Request, res: Response) => {
  try {
    const { limit, offset } = getPaginationParams(req);
    const { category, level, search } = req.query;

    let query = supabase
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (level) query = query.eq('level', level);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,instructor_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) return errorResponse(res, 500, 'Failed to fetch courses', error);

    // Update lesson count for each course by counting actual lessons in course_lessons table
    const coursesWithLessonCount = await Promise.all(
      (data || []).map(async (course: any) => {
        const { count: lessonCount } = await supabase
          .from('course_lessons')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id);
        
        return {
          ...course,
          lessons: lessonCount || 0
        };
      })
    );

    // Return flat paginated response (not wrapped in successResponse)
    // Always return success even if page is beyond available data
    return res.status(200).json({
      success: true,
      data: coursesWithLessonCount,
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.max(Math.ceil((count || 0) / limit), 0),
        per_page: limit,
        total: count || 0,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/courses/:id - Get single course with lessons
router.get('/courses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (courseError || !course) {
      return errorResponse(res, 404, 'Course not found', courseError);
    }

    // Fetch lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('course_id', id)
      .order('order_index', { ascending: true });

    if (lessonsError) return errorResponse(res, 400, 'Failed to fetch lessons', lessonsError);

    const courseData = {
      ...course,
      lessons: lessons || [],
    };

    return successResponse(res, courseData, 'Course fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// POST /learn/courses - Create new course (Admin only)
router.post('/courses', checkAuth, async (req: Request, res: Response) => {
  try {
    const { title, description, category, level, duration, language, price } = req.body;
    const farmerId = (req as any).farmerId;

    if (!title || !description || !category || !level) {
      return errorResponse(res, 400, 'Missing required fields: title, description, category, level');
    }

    const { data, error } = await supabase
      .from('courses')
      .insert([
        {
          title,
          description,
          category,
          level,
          duration,
          language,
          price: price || 0,
          instructor_id: farmerId,
          is_published: false,
        },
      ])
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to create course', error);

    return successResponse(res, data, 'Course created successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// PUT /learn/courses/:id - Update course (Admin only)
router.put('/courses/:id', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to update course', error);

    return successResponse(res, data, 'Course updated successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// DELETE /learn/courses/:id - Delete course (Admin only)
router.delete('/courses/:id', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('courses').delete().eq('id', id);

    if (error) return errorResponse(res, 400, 'Failed to delete course', error);

    return successResponse(res, { id }, 'Course deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// POST /learn/courses/:id/lessons - Add lesson to course
router.post('/courses/:id/lessons', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, content_type, content_url, duration, order_index } = req.body;

    if (!title || !content_type) {
      return errorResponse(res, 400, 'Missing required fields: title, content_type');
    }

    const { data, error } = await supabase
      .from('course_lessons')
      .insert([
        {
          course_id: id,
          title,
          description,
          content_type,
          content_url,
          duration,
          order_index: order_index || 0,
        },
      ])
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to create lesson', error);

    return successResponse(res, data, 'Lesson created successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/courses/:id/lessons - Get lessons for course
router.get('/courses/:id/lessons', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit, offset } = getPaginationParams(req);

    const { data, error, count } = await supabase
      .from('course_lessons')
      .select('*', { count: 'exact' })
      .eq('course_id', id)
      .order('order_index', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) return errorResponse(res, 400, 'Failed to fetch lessons', error);

    const response: PaginatedResponse<any> = {
      data: data || [],
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil((count || 0) / limit),
        per_page: limit,
        total: count || 0,
      },
    };

    return successResponse(res, response, 'Lessons fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/lessons/:lessonId/content - Get rich content for a lesson
router.get('/lessons/:lessonId/content', async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    
    // First get the lesson to know its title
    const { data: lesson, error } = await supabase
      .from('course_lessons')
      .select('id, title, description, content_type')
      .eq('id', lessonId)
      .single();
    
    if (error || !lesson) {
      return errorResponse(res, 404, 'Lesson not found');
    }
    
    // Import and find matching content - use dynamic import for the ts file
    const contentModule = await import('../data/lesson-rich-content');
    const LESSON_RICH_CONTENT = contentModule.LESSON_RICH_CONTENT || contentModule.default;
    
    // Find content by matching title
    const normalizedTitle = lesson.title.toLowerCase().trim();
    let content = null;
    let matchedKey = null;
    
    // Exact match first
    for (const [key, value] of Object.entries(LESSON_RICH_CONTENT)) {
      if (normalizedTitle === key.toLowerCase()) {
        content = value;
        matchedKey = key;
        break;
      }
    }
    
    // Partial match (title contains key or key contains title)
    if (!content) {
      for (const [key, value] of Object.entries(LESSON_RICH_CONTENT)) {
        const keyLower = key.toLowerCase();
        if (normalizedTitle.includes(keyLower) || keyLower.includes(normalizedTitle)) {
          content = value;
          matchedKey = key;
          break;
        }
      }
    }
    
    // Word-based fuzzy matching
    if (!content) {
      const titleWords = normalizedTitle.split(/[\s&,()-]+/).filter(w => w.length > 2);
      let bestMatch = { key: '', value: null as any, score: 0 };
      
      for (const [key, value] of Object.entries(LESSON_RICH_CONTENT)) {
        const keyWords = key.toLowerCase().split(/[\s&,()-]+/).filter(w => w.length > 2);
        const matches = titleWords.filter(tw => 
          keyWords.some(kw => kw.includes(tw) || tw.includes(kw))
        );
        const score = matches.length;
        if (score >= 2 && score > bestMatch.score) {
          bestMatch = { key, value, score };
        }
      }
      
      if (bestMatch.value) {
        content = bestMatch.value;
        matchedKey = bestMatch.key;
      }
    }
    
    console.log(`[Lesson Content] "${lesson.title}" → Matched: "${matchedKey || 'none'}"`);
    
    return successResponse(res, {
      lesson_id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      content_type: lesson.content_type,
      article: content || null,
      hasRichContent: !!content
    }, 'Lesson content fetched');
  } catch (error) {
    console.error('[Lesson Content Error]', error);
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// ============================================
// ARTICLES ENDPOINTS (6)
// ============================================

// GET /learn/articles - List articles with pagination
router.get('/articles', async (req: Request, res: Response) => {
  try {
    const { limit, offset } = getPaginationParams(req);
    const { category, featured } = req.query;

    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (featured === 'true') query = query.eq('is_featured', true);
    const search = req.query.search as string;
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%,author_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) return errorResponse(res, 500, 'Failed to fetch articles', error);

    // Return flat paginated response
    // Always return success even if page is beyond available data
    return res.status(200).json({
      success: true,
      data: data || [],
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.max(Math.ceil((count || 0) / limit), 0),
        per_page: limit,
        total: count || 0,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/articles/:id - Get single article
router.get('/articles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse(res, 404, 'Article not found', error);
    }

    return successResponse(res, data, 'Article fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// POST /learn/articles - Create article (Admin only)
router.post('/articles', checkAuth, async (req: Request, res: Response) => {
  try {
    const { title, excerpt, content, category, source_type } = req.body;
    const farmerId = (req as any).farmerId;

    if (!title || !excerpt || !content || !category) {
      return errorResponse(res, 400, 'Missing required fields');
    }

    const { data, error } = await supabase
      .from('articles')
      .insert([
        {
          title,
          excerpt,
          content,
          category,
          source_type: source_type || 'internal',
          author_id: farmerId,
          is_published: false,
        },
      ])
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to create article', error);

    return successResponse(res, data, 'Article created successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// PUT /learn/articles/:id - Update article
router.put('/articles/:id', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to update article', error);

    return successResponse(res, data, 'Article updated successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// DELETE /learn/articles/:id - Delete article
router.delete('/articles/:id', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('articles').delete().eq('id', id);

    if (error) return errorResponse(res, 400, 'Failed to delete article', error);

    return successResponse(res, { id }, 'Article deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// POST /learn/articles/:id/like - Like article
router.post('/articles/:id/like', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Increment like count
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('like_count')
      .eq('id', id)
      .single();

    if (fetchError) return errorResponse(res, 404, 'Article not found', fetchError);

    const { data, error } = await supabase
      .from('articles')
      .update({ like_count: (article?.like_count || 0) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to like article', error);

    return successResponse(res, data, 'Article liked successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// ============================================
// VIDEOS ENDPOINTS (7)
// ============================================

// GET /learn/videos - List videos with pagination
router.get('/videos', async (req: Request, res: Response) => {
  try {
    const { limit, offset } = getPaginationParams(req);
    const { category, video_type } = req.query;

    let query = supabase
      .from('videos')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (video_type) query = query.eq('video_type', video_type);
    const search = req.query.search as string;
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,creator_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) return errorResponse(res, 500, 'Failed to fetch videos', error);

    // Return flat paginated response
    // Always return success even if page is beyond available data
    return res.status(200).json({
      success: true,
      data: data || [],
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.max(Math.ceil((count || 0) / limit), 0),
        per_page: limit,
        total: count || 0,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/videos/:id - Get single video
router.get('/videos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse(res, 404, 'Video not found', error);
    }

    return successResponse(res, data, 'Video fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// POST /learn/videos - Create video (Admin only)
router.post('/videos', checkAuth, async (req: Request, res: Response) => {
  try {
    const { title, description, category, video_type, video_url } = req.body;
    const farmerId = (req as any).farmerId;

    if (!title || !category || !video_type || !video_url) {
      return errorResponse(res, 400, 'Missing required fields');
    }

    const { data, error } = await supabase
      .from('videos')
      .insert([
        {
          title,
          description,
          category,
          video_type,
          video_url,
          creator_id: farmerId,
          is_published: false,
        },
      ])
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to create video', error);

    return successResponse(res, data, 'Video created successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// PUT /learn/videos/:id - Update video
router.put('/videos/:id', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to update video', error);

    return successResponse(res, data, 'Video updated successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// DELETE /learn/videos/:id - Delete video
router.delete('/videos/:id', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('videos').delete().eq('id', id);

    if (error) return errorResponse(res, 400, 'Failed to delete video', error);

    return successResponse(res, { id }, 'Video deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// POST /learn/videos/:id/like - Like video
router.post('/videos/:id/like', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: video, error: fetchError } = await supabase
      .from('videos')
      .select('like_count')
      .eq('id', id)
      .single();

    if (fetchError) return errorResponse(res, 404, 'Video not found', fetchError);

    const { data, error } = await supabase
      .from('videos')
      .update({ like_count: (video?.like_count || 0) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to like video', error);

    return successResponse(res, data, 'Video liked successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// POST /learn/videos/:id/track-view - Track video view
router.post('/videos/:id/track-view', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: video, error: fetchError } = await supabase
      .from('videos')
      .select('view_count')
      .eq('id', id)
      .single();

    if (fetchError) return errorResponse(res, 404, 'Video not found', fetchError);

    const { data, error } = await supabase
      .from('videos')
      .update({ view_count: (video?.view_count || 0) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to track view', error);

    return successResponse(res, data, 'View tracked successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// ============================================
// QUIZZES ENDPOINTS (6)
// ============================================

// GET /learn/quizzes/:courseId - Get quizzes for course
router.get('/quizzes/:courseId', async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { limit, offset } = getPaginationParams(req);

    const { data, error, count } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact' })
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) return errorResponse(res, 400, 'Failed to fetch quizzes', error);

    const response: PaginatedResponse<Quiz> = {
      data: data || [],
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil((count || 0) / limit),
        per_page: limit,
        total: count || 0,
      },
    };

    return successResponse(res, response, 'Quizzes fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/quizzes/:id/questions - Get quiz with questions
router.get('/quizzes/:id/questions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();

    if (quizError || !quiz) {
      return errorResponse(res, 404, 'Quiz not found', quizError);
    }

    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', id)
      .order('order_index', { ascending: true });

    if (questionsError) return errorResponse(res, 400, 'Failed to fetch questions', questionsError);

    const quizData = {
      ...quiz,
      questions: questions || [],
    };

    return successResponse(res, quizData, 'Quiz fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// POST /learn/quizzes - Create quiz
router.post('/quizzes', checkAuth, async (req: Request, res: Response) => {
  try {
    const { course_id, title, description, passing_score } = req.body;

    if (!course_id || !title) {
      return errorResponse(res, 400, 'Missing required fields: course_id, title');
    }

    const { data, error } = await supabase
      .from('quizzes')
      .insert([
        {
          course_id,
          title,
          description,
          passing_score: passing_score || 70,
        },
      ])
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to create quiz', error);

    return successResponse(res, data, 'Quiz created successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// POST /learn/quizzes/:id/submit - Submit quiz answers
router.post('/quizzes/:id/submit', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // Array of { question_id, user_answer }
    const farmerId = (req as any).farmerId;

    if (!answers || !Array.isArray(answers)) {
      return errorResponse(res, 400, 'Invalid answers format');
    }

    // Create quiz attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert([
        {
          user_id: farmerId,
          quiz_id: id,
          attempt_number: 1,
        },
      ])
      .select()
      .single();

    if (attemptError) return errorResponse(res, 400, 'Failed to create attempt', attemptError);

    // Store answers and calculate score
    let totalPoints = 0;
    let earnedPoints = 0;

    for (const answer of answers) {
      const { data: question, error: qError } = await supabase
        .from('quiz_questions')
        .select('options, points')
        .eq('id', answer.question_id)
        .single();

      if (qError) continue;

      // Check if answer is correct
      const options = question?.options || [];
      const isCorrect = options.some((opt: any) => opt.is_correct && opt.text === answer.user_answer);
      const points = question?.points || 1;

      totalPoints += points;
      if (isCorrect) earnedPoints += points;

      // Store answer
      await supabase.from('quiz_answers').insert([
        {
          attempt_id: attempt.id,
          question_id: answer.question_id,
          user_answer: answer.user_answer,
          is_correct: isCorrect,
          points_earned: isCorrect ? points : 0,
        },
      ]);
    }

    // Calculate percentage and update attempt
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= 70;

    const { data: updatedAttempt, error: updateError } = await supabase
      .from('quiz_attempts')
      .update({
        score: earnedPoints,
        percentage: Math.round(percentage),
        passed,
      })
      .eq('id', attempt.id)
      .select()
      .single();

    if (updateError) return errorResponse(res, 400, 'Failed to update attempt', updateError);

    return successResponse(res, updatedAttempt, 'Quiz submitted successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/quizzes/:id/attempts - Get user's quiz attempts
router.get('/quizzes/:id/attempts', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const farmerId = (req as any).farmerId;
    const { limit, offset } = getPaginationParams(req);

    const { data, error, count } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact' })
      .eq('quiz_id', id)
      .eq('user_id', farmerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return errorResponse(res, 400, 'Failed to fetch attempts', error);

    const response: PaginatedResponse<QuizAttempt> = {
      data: data || [],
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil((count || 0) / limit),
        per_page: limit,
        total: count || 0,
      },
    };

    return successResponse(res, response, 'Attempts fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// ============================================
// ENROLLMENTS ENDPOINTS (5)
// ============================================

// POST /learn/enroll - Enroll in course
router.post('/enroll', checkAuth, async (req: Request, res: Response) => {
  try {
    const { course_id } = req.body;
    const farmerId = (req as any).farmerId;

    if (!course_id) {
      return errorResponse(res, 400, 'Missing required field: course_id');
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', farmerId)
      .eq('course_id', course_id)
      .single();

    if (existing) {
      return errorResponse(res, 409, 'Already enrolled in this course');
    }

    const { data, error } = await supabase
      .from('course_enrollments')
      .insert([
        {
          user_id: farmerId,
          course_id,
          status: 'enrolled',
          enrollment_type: 'free',
        },
      ])
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to enroll', error);

    // Update user learning stats
    await updateUserStats(farmerId);

    return successResponse(res, data, 'Enrolled successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/enrollments - Get user's enrollments
router.get('/enrollments', checkAuth, async (req: Request, res: Response) => {
  try {
    const farmerId = (req as any).farmerId;
    const { limit, offset } = getPaginationParams(req);
    const { status } = req.query;

    let query = supabase
      .from('course_enrollments')
      .select('*, courses(*)', { count: 'exact' })
      .eq('user_id', farmerId)
      .order('enrolled_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;

    if (error) return errorResponse(res, 400, 'Failed to fetch enrollments', error);

    const response: PaginatedResponse<any> = {
      data: data || [],
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil((count || 0) / limit),
        per_page: limit,
        total: count || 0,
      },
    };

    return successResponse(res, response, 'Enrollments fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/enrollments/:id - Get enrollment details
router.get('/enrollments/:id', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const farmerId = (req as any).farmerId;

    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*, courses(*)')
      .eq('id', id)
      .eq('user_id', farmerId)
      .single();

    if (error || !data) {
      return errorResponse(res, 404, 'Enrollment not found', error);
    }

    return successResponse(res, data, 'Enrollment fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// PUT /learn/enrollments/:id - Update enrollment progress
router.put('/enrollments/:id', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, progress_percent } = req.body;

    const { data, error } = await supabase
      .from('course_enrollments')
      .update({ status, progress_percent })
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to update enrollment', error);

    return successResponse(res, data, 'Enrollment updated successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// DELETE /learn/enrollments/:id - Drop course
router.delete('/enrollments/:id', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('course_enrollments').delete().eq('id', id);

    if (error) return errorResponse(res, 400, 'Failed to drop course', error);

    return successResponse(res, { id }, 'Course dropped successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// POST /learn/courses/:courseId/complete - Complete a course and award badge
router.post('/courses/:courseId/complete', checkAuth, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const farmerId = (req as any).farmerId;

    // Verify enrollment exists
    const { data: enrollment, error: enrollError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', farmerId)
      .eq('course_id', courseId)
      .single();

    if (enrollError || !enrollment) {
      return errorResponse(res, 404, 'Enrollment not found');
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*, course_lessons(id)')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return errorResponse(res, 404, 'Course not found');
    }

    // Check if all lessons are completed
    const lessonIds = course.course_lessons?.map((l: any) => l.id) || [];
    const { data: lessonProgress, error: progressError } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', farmerId)
      .in('lesson_id', lessonIds)
      .eq('status', 'completed');

    const completedCount = lessonProgress?.length || 0;
    const totalLessons = lessonIds.length;
    const isFullyCompleted = completedCount >= totalLessons;

    if (!isFullyCompleted) {
      return errorResponse(res, 400, `Complete all lessons first (${completedCount}/${totalLessons})`);
    }

    // Update enrollment status to completed
    const { error: updateError } = await supabase
      .from('course_enrollments')
      .update({
        status: 'completed',
        progress_percent: 100,
        completion_date: new Date().toISOString(),
      })
      .eq('id', enrollment.id);

    if (updateError) {
      return errorResponse(res, 400, 'Failed to update enrollment', updateError);
    }

    // Award course completion badge
    // First check if a "Course Completion" badge exists, create if not
    let { data: badge } = await supabase
      .from('badges')
      .select('*')
      .eq('requirement_type', 'courses_completed')
      .eq('requirement_value', 1)
      .single();

    if (!badge) {
      // Create a default course completion badge
      const { data: newBadge, error: createBadgeError } = await supabase
        .from('badges')
        .insert({
          name: 'First Course Completed',
          name_hi: 'पहला कोर्स पूरा',
          name_mr: 'पहिला कोर्स पूर्ण',
          description: 'Awarded for completing your first course',
          description_hi: 'अपना पहला कोर्स पूरा करने पर सम्मानित',
          description_mr: 'तुमचा पहिला कोर्स पूर्ण केल्याबद्दल सन्मानित',
          icon: '🎓',
          color: '#22c55e',
          requirement_type: 'courses_completed',
          requirement_value: 1,
          points: 100,
        })
        .select()
        .single();

      badge = newBadge;
    }

    let awardedBadge = null;
    if (badge) {
      // Check if user already has this badge
      const { data: existingUserBadge } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', farmerId)
        .eq('badge_id', badge.id)
        .single();

      if (!existingUserBadge) {
        // Award the badge
        const { data: newUserBadge, error: awardError } = await supabase
          .from('user_badges')
          .insert({
            user_id: farmerId,
            badge_id: badge.id,
          })
          .select('*, badges(*)')
          .single();

        if (!awardError) {
          awardedBadge = newUserBadge;
        }
      }
    }

    // Update user learning stats
    await updateUserStats(farmerId);

    return successResponse(res, {
      enrollment: { ...enrollment, status: 'completed', progress_percent: 100 },
      badge: awardedBadge,
      message: awardedBadge ? 'Course completed! You earned a badge!' : 'Course completed!',
    }, 'Course completed successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// ============================================
// PROGRESS ENDPOINTS (3)
// ============================================

// POST /learn/progress/lesson - Mark lesson as complete
router.post('/progress/lesson', checkAuth, async (req: Request, res: Response) => {
  try {
    const { lesson_id, status, time_spent_seconds } = req.body;
    const farmerId = (req as any).farmerId;

    if (!lesson_id || !status) {
      return errorResponse(res, 400, 'Missing required fields');
    }

    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(
        [
          {
            user_id: farmerId,
            lesson_id,
            status,
            time_spent_seconds,
            completion_date: status === 'completed' ? new Date().toISOString() : null,
          },
        ],
        { onConflict: 'user_id,lesson_id' }
      )
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to update progress', error);

    // Update user learning stats
    if (status === 'completed') {
      await updateUserStats(farmerId);
    }

    return successResponse(res, data, 'Progress updated successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/progress/course/:courseId - Get user's progress in course
router.get('/progress/course/:courseId', checkAuth, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const farmerId = (req as any).farmerId;

    // Get enrollment (may not exist if user hasn't enrolled)
    const { data: enrollment, error: enrollError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', farmerId)
      .eq('course_id', courseId)
      .maybeSingle(); // Use maybeSingle() instead of single() to allow null

    // If user is not enrolled, return success with null enrollment
    if (!enrollment) {
      return successResponse(res, {
        enrollment: null,
        lessons_completed: 0,
        total_lessons: 0,
        progress_percent: 0,
        lessons_progress: [],
        is_enrolled: false,
      }, 'User not enrolled in this course');
    }

    // Get lesson progress
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('id')
      .eq('course_id', courseId);

    if (lessonsError) return errorResponse(res, 400, 'Failed to fetch lessons', lessonsError);

    const { data: progress, error: progressError } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', farmerId)
      .in('lesson_id', lessons?.map((l: any) => l.id) || []);

    if (progressError) return errorResponse(res, 400, 'Failed to fetch progress', progressError);

    const completedLessons = progress?.filter((p: any) => p.status === 'completed') || [];
    const progressPercent = lessons?.length ? Math.round((completedLessons.length / lessons.length) * 100) : 0;

    return successResponse(res, {
      enrollment,
      lessons_completed: completedLessons.length,
      total_lessons: lessons?.length || 0,
      progress_percent: progressPercent,
      lessons_progress: progress || [],
      is_enrolled: true,
    }, 'Progress fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/progress - Get all user's progress
router.get('/progress', checkAuth, async (req: Request, res: Response) => {
  try {
    const farmerId = (req as any).farmerId;
    const { limit, offset } = getPaginationParams(req);

    const { data, error, count } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact' })
      .eq('user_id', farmerId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return errorResponse(res, 400, 'Failed to fetch progress', error);

    const response: PaginatedResponse<LessonProgress> = {
      data: data || [],
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil((count || 0) / limit),
        per_page: limit,
        total: count || 0,
      },
    };

    return successResponse(res, response, 'Progress fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// ============================================
// ROADMAPS ENDPOINTS (4)
// ============================================

// GET /learn/roadmaps - List learning roadmaps
router.get('/roadmaps', async (req: Request, res: Response) => {
  try {
    const { limit, offset } = getPaginationParams(req);
    const { difficulty } = req.query;

    let query = supabase
      .from('learning_roadmaps')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (difficulty) query = query.eq('difficulty', difficulty);

    const { data, error, count } = await query;

    if (error) return errorResponse(res, 400, 'Failed to fetch roadmaps', error);

    const response: PaginatedResponse<LearningRoadmap> = {
      data: data || [],
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil((count || 0) / limit),
        per_page: limit,
        total: count || 0,
      },
    };

    return successResponse(res, response, 'Roadmaps fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/roadmaps/:id - Get roadmap with milestones
router.get('/roadmaps/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: roadmap, error: roadmapError } = await supabase
      .from('learning_roadmaps')
      .select('*')
      .eq('id', id)
      .single();

    if (roadmapError || !roadmap) {
      return errorResponse(res, 404, 'Roadmap not found', roadmapError);
    }

    const { data: milestones, error: milestonesError } = await supabase
      .from('roadmap_milestones')
      .select('*, courses(*)')
      .eq('roadmap_id', id)
      .order('order_index', { ascending: true });

    if (milestonesError) return errorResponse(res, 400, 'Failed to fetch milestones', milestonesError);

    const roadmapData = {
      ...roadmap,
      milestones: milestones || [],
    };

    return successResponse(res, roadmapData, 'Roadmap fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// POST /learn/roadmaps/:id/start - Start roadmap
router.post('/roadmaps/:id/start', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const farmerId = (req as any).farmerId;

    const { data, error } = await supabase
      .from('user_roadmap_progress')
      .upsert(
        [
          {
            user_id: farmerId,
            roadmap_id: id,
            started_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id,roadmap_id' }
      )
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to start roadmap', error);

    return successResponse(res, data, 'Roadmap started successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/roadmaps/:id/progress - Get user's roadmap progress
router.get('/roadmaps/:id/progress', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const farmerId = (req as any).farmerId;

    const { data, error } = await supabase
      .from('user_roadmap_progress')
      .select('*')
      .eq('user_id', farmerId)
      .eq('roadmap_id', id)
      .single();

    if (error || !data) {
      return errorResponse(res, 404, 'Progress not found', error);
    }

    return successResponse(res, data, 'Progress fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// ============================================
// BADGES ENDPOINTS (2)
// ============================================

// GET /learn/badges - Get all badges
router.get('/badges', async (req: Request, res: Response) => {
  try {
    const { limit, offset } = getPaginationParams(req);
    const { category } = req.query;

    let query = supabase
      .from('badges')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;

    if (error) return errorResponse(res, 400, 'Failed to fetch badges', error);

    const response: PaginatedResponse<Badge> = {
      data: data || [],
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil((count || 0) / limit),
        per_page: limit,
        total: count || 0,
      },
    };

    return successResponse(res, response, 'Badges fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/user/badges - Get user's earned badges
router.get('/user/badges', checkAuth, async (req: Request, res: Response) => {
  try {
    const farmerId = (req as any).farmerId;
    const { limit, offset } = getPaginationParams(req);

    const { data, error, count } = await supabase
      .from('user_badges')
      .select('*, badges(*)', { count: 'exact' })
      .eq('user_id', farmerId)
      .order('earned_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return errorResponse(res, 400, 'Failed to fetch badges', error);

    const response: PaginatedResponse<any> = {
      data: data || [],
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil((count || 0) / limit),
        per_page: limit,
        total: count || 0,
      },
    };

    return successResponse(res, response, 'User badges fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// ============================================
// SEARCH & STATS ENDPOINTS (2)
// ============================================

// GET /learn/search - Global search across all content
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const { limit, offset } = getPaginationParams(req);

    if (!q) {
      return errorResponse(res, 400, 'Missing search query parameter');
    }

    // Search courses
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('id, title, description, category, level, "course" as type')
      .eq('is_published', true)
      .textSearch('search_vector', q as string)
      .limit(5);

    // Search articles
    const { data: articles, error: articleError } = await supabase
      .from('articles')
      .select('id, title, excerpt, category, "article" as type')
      .eq('is_published', true)
      .textSearch('search_vector', q as string)
      .limit(5);

    // Search videos
    const { data: videos, error: videoError } = await supabase
      .from('videos')
      .select('id, title, description, category, "video" as type')
      .eq('is_published', true)
      .textSearch('search_vector', q as string)
      .limit(5);

    if (courseError || articleError || videoError) {
      return errorResponse(res, 400, 'Search failed');
    }

    const results = [
      ...(courses || []),
      ...(articles || []),
      ...(videos || []),
    ];

    return successResponse(res, results, 'Search results fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/stats - Get user's learning statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const farmerId = (req as any).user?.id;

    // Default stats object
    const defaultStats = {
      id: null,
      user_id: farmerId || null,
      total_courses_enrolled: 0,
      total_courses_completed: 0,
      total_learning_hours: 0,
      total_badges_earned: 0,
      current_streak_days: 0,
      longest_streak_days: 0,
      total_points: 0,
      last_activity_date: null,
    };

    // Return default stats for unauthenticated users
    if (!farmerId) {
      return successResponse(res, defaultStats, 'Stats fetched successfully');
    }

    // Try to fetch stats - use maybeSingle to avoid errors on missing data
    const { data, error } = await supabase
      .from('user_learning_stats')
      .select('*')
      .eq('user_id', farmerId)
      .maybeSingle();

    // If table doesn't exist or other error, return default stats
    if (error) {
      console.log('Stats fetch error (returning defaults):', error.message);
      return successResponse(res, defaultStats, 'Stats fetched successfully');
    }

    // If no stats exist, return default stats (don't try to create - table might not exist)
    if (!data) {
      return successResponse(res, defaultStats, 'Stats fetched successfully');
    }

    return successResponse(res, data, 'Stats fetched successfully');
  } catch (error) {
    // On any error, return default stats instead of failing
    console.error('Stats error:', error);
    return successResponse(res, {
      id: null,
      user_id: null,
      total_courses_enrolled: 0,
      total_courses_completed: 0,
      total_learning_hours: 0,
      total_badges_earned: 0,
      current_streak_days: 0,
      longest_streak_days: 0,
      total_points: 0,
      last_activity_date: null,
    }, 'Stats fetched successfully');
  }
});

// ============================================
// PURCHASES ENDPOINTS (4)
// ============================================

// POST /learn/purchases - Create purchase
router.post('/purchases', checkAuth, async (req: Request, res: Response) => {
  try {
    const { course_id, amount, payment_method } = req.body;
    const farmerId = (req as any).farmerId;

    if (!course_id || !amount) {
      return errorResponse(res, 400, 'Missing required fields');
    }

    const { data, error } = await supabase
      .from('course_purchases')
      .insert([
        {
          user_id: farmerId,
          course_id,
          amount,
          final_amount: amount,
          payment_method,
          payment_status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to create purchase', error);

    return successResponse(res, data, 'Purchase created successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/purchases - Get user's purchases
router.get('/purchases', checkAuth, async (req: Request, res: Response) => {
  try {
    const farmerId = (req as any).farmerId;
    const { limit, offset } = getPaginationParams(req);
    const { status } = req.query;

    let query = supabase
      .from('course_purchases')
      .select('*, courses(*)', { count: 'exact' })
      .eq('user_id', farmerId)
      .order('purchased_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('payment_status', status);

    const { data, error, count } = await query;

    if (error) return errorResponse(res, 400, 'Failed to fetch purchases', error);

    const response: PaginatedResponse<any> = {
      data: data || [],
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil((count || 0) / limit),
        per_page: limit,
        total: count || 0,
      },
    };

    return successResponse(res, response, 'Purchases fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// PUT /learn/purchases/:id - Update purchase status
router.put('/purchases/:id', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { payment_status, payment_id } = req.body;

    const { data, error } = await supabase
      .from('course_purchases')
      .update({ payment_status, payment_id })
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(res, 400, 'Failed to update purchase', error);

    return successResponse(res, data, 'Purchase updated successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/purchases/:id - Get purchase details
router.get('/purchases/:id', checkAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const farmerId = (req as any).farmerId;

    const { data, error } = await supabase
      .from('course_purchases')
      .select('*, courses(*)')
      .eq('id', id)
      .eq('user_id', farmerId)
      .single();

    if (error || !data) {
      return errorResponse(res, 404, 'Purchase not found', error);
    }

    return successResponse(res, data, 'Purchase fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// ============================================
// QUIZZES ENDPOINTS
// ============================================

// GET /learn/quizzes/lesson/:lessonId - Get quiz for a specific lesson
router.get('/quizzes/lesson/:lessonId', async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('is_published', true)
      .single();

    if (error || !quiz) {
      return errorResponse(res, 404, 'Quiz not found for this lesson', error);
    }

    return successResponse(res, quiz, 'Quiz fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/quizzes/:quizId - Get quiz details with questions
router.get('/quizzes/:quizId', async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const includeAnswers = req.query.includeAnswers === 'true';

    // Fetch quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('is_published', true)
      .single();

    if (quizError || !quiz) {
      return errorResponse(res, 404, 'Quiz not found', quizError);
    }

    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });

    if (questionsError) {
      return errorResponse(res, 400, 'Failed to fetch questions', questionsError);
    }

    // Fetch options for all questions
    const questionIds = (questions || []).map((q: any) => q.id);
    const { data: options, error: optionsError } = await supabase
      .from('quiz_options')
      .select('*')
      .in('question_id', questionIds)
      .order('order_index', { ascending: true });

    if (optionsError) {
      return errorResponse(res, 400, 'Failed to fetch options', optionsError);
    }

    // Combine questions with their options
    const questionsWithOptions = (questions || []).map((question: any) => {
      const questionOptions = (options || [])
        .filter((opt: any) => opt.question_id === question.id)
        .map((opt: any) => ({
          id: opt.id,
          option_text: opt.option_text,
          option_image_url: opt.option_image_url,
          order_index: opt.order_index,
          // Only include is_correct if specifically requested (for results)
          ...(includeAnswers && { is_correct: opt.is_correct }),
        }));

      return {
        ...question,
        options: questionOptions,
        // Don't include explanation unless answers are requested
        ...(includeAnswers ? {} : { explanation: undefined }),
      };
    });

    // Shuffle questions if enabled
    const finalQuestions = quiz.shuffle_questions
      ? questionsWithOptions.sort(() => Math.random() - 0.5)
      : questionsWithOptions;

    return successResponse(res, {
      ...quiz,
      questions: finalQuestions,
      total_questions: finalQuestions.length,
      total_points: finalQuestions.reduce((sum: number, q: any) => sum + (q.points || 1), 0),
    }, 'Quiz fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// POST /learn/quizzes/:quizId/start - Start a quiz attempt
router.post('/quizzes/:quizId/start', checkAuth, async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const farmerId = (req as any).farmerId;

    // Check if quiz exists
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('is_published', true)
      .single();

    if (quizError || !quiz) {
      return errorResponse(res, 404, 'Quiz not found', quizError);
    }

    // Count previous attempts
    const { count: attemptCount } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
      .eq('user_id', farmerId);

    // Check max attempts
    if (quiz.max_attempts && (attemptCount || 0) >= quiz.max_attempts) {
      return errorResponse(res, 400, `Maximum attempts (${quiz.max_attempts}) reached for this quiz`);
    }

    // Get total possible points
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('points')
      .eq('quiz_id', quizId);

    const maxScore = (questions || []).reduce((sum: number, q: any) => sum + (q.points || 1), 0);

    // Create new attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: farmerId,
        quiz_id: quizId,
        attempt_number: (attemptCount || 0) + 1,
        max_score: maxScore,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError) {
      return errorResponse(res, 400, 'Failed to start quiz', attemptError);
    }

    return successResponse(res, {
      attempt,
      time_limit_minutes: quiz.time_limit_minutes,
      max_attempts: quiz.max_attempts,
      attempts_remaining: quiz.max_attempts ? quiz.max_attempts - (attemptCount || 0) - 1 : null,
    }, 'Quiz started successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// POST /learn/quizzes/:quizId/submit - Submit quiz answers
router.post('/quizzes/:quizId/submit', checkAuth, async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const farmerId = (req as any).farmerId;
    const { attempt_id, answers, time_spent_seconds } = req.body;

    // Validate attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', attempt_id)
      .eq('user_id', farmerId)
      .eq('quiz_id', quizId)
      .is('completed_at', null)
      .single();

    if (attemptError || !attempt) {
      return errorResponse(res, 400, 'Invalid or already completed attempt', attemptError);
    }

    // Get quiz and questions with correct answers
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*, quiz_options(*)')
      .eq('quiz_id', quizId);

    if (!quiz || !questions) {
      return errorResponse(res, 404, 'Quiz or questions not found');
    }

    // Score the answers
    let totalScore = 0;
    const answersToInsert: any[] = [];
    const results: any[] = [];

    for (const question of questions) {
      const userAnswer = answers.find((a: any) => a.question_id === question.id);
      let isCorrect = false;
      let pointsEarned = 0;

      if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
        const correctOption = question.quiz_options.find((opt: any) => opt.is_correct);
        isCorrect = userAnswer?.selected_option_id === correctOption?.id;
        pointsEarned = isCorrect ? (question.points || 1) : 0;
      } else if (question.question_type === 'short_answer') {
        // For short answer, simple case-insensitive match
        const correctOption = question.quiz_options.find((opt: any) => opt.is_correct);
        isCorrect = correctOption && 
          userAnswer?.user_answer?.toLowerCase().trim() === correctOption.option_text.toLowerCase().trim();
        pointsEarned = isCorrect ? (question.points || 1) : 0;
      }

      totalScore += pointsEarned;

      answersToInsert.push({
        attempt_id,
        question_id: question.id,
        selected_option_id: userAnswer?.selected_option_id || null,
        user_answer: userAnswer?.user_answer || null,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      });

      // Build result with explanation
      results.push({
        question_id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        user_answer: userAnswer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        max_points: question.points || 1,
        explanation: quiz.show_correct_answer ? question.explanation : null,
        correct_option: quiz.show_correct_answer 
          ? question.quiz_options.find((opt: any) => opt.is_correct)
          : null,
      });
    }

    // Insert all answers
    await supabase.from('quiz_answers').insert(answersToInsert);

    // Calculate final score
    const percentage = attempt.max_score > 0 
      ? Math.round((totalScore / attempt.max_score) * 100) 
      : 0;
    const passed = percentage >= quiz.passing_score;

    // Update attempt with final results
    const { data: finalAttempt, error: updateError } = await supabase
      .from('quiz_attempts')
      .update({
        score: totalScore,
        percentage,
        passed,
        time_spent_seconds: time_spent_seconds || 0,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attempt_id)
      .select()
      .single();

    if (updateError) {
      return errorResponse(res, 400, 'Failed to update attempt', updateError);
    }

    // Award badges for quiz achievements
    const badgesToAward: string[] = [];
    
    if (passed) {
      // Check for first quiz passed
      const { count: passedCount } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', farmerId)
        .eq('passed', true);

      if (passedCount === 1) {
        badgesToAward.push('first-quiz-passed');
      }

      // Perfect score badge
      if (percentage === 100) {
        badgesToAward.push('perfect-score');
      }

      // Quick learner - passed in less than half the time limit
      if (quiz.time_limit_minutes && time_spent_seconds < (quiz.time_limit_minutes * 30)) {
        badgesToAward.push('quick-learner');
      }
    }

    // Award any earned badges
    for (const badgeName of badgesToAward) {
      const { data: badge } = await supabase
        .from('badges')
        .select('id')
        .eq('name', badgeName)
        .single();

      if (badge) {
        // Check if already awarded
        const { data: existing } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', farmerId)
          .eq('badge_id', badge.id)
          .single();

        if (!existing) {
          await supabase.from('user_badges').insert({
            user_id: farmerId,
            badge_id: badge.id,
          });
        }
      }
    }

    // Update user learning stats
    await updateUserStats(farmerId);

    return successResponse(res, {
      attempt: finalAttempt,
      score: totalScore,
      max_score: attempt.max_score,
      percentage,
      passed,
      passing_score: quiz.passing_score,
      results: quiz.show_correct_answer ? results : results.map((r: any) => ({
        ...r,
        explanation: null,
        correct_option: null,
      })),
      badges_earned: badgesToAward,
    }, passed ? 'Congratulations! You passed the quiz!' : 'Quiz completed. Keep learning!');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/quizzes/:quizId/attempts - Get user's attempts for a quiz
router.get('/quizzes/:quizId/attempts', checkAuth, async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const farmerId = (req as any).farmerId;

    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', farmerId)
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse(res, 400, 'Failed to fetch attempts', error);
    }

    // Get quiz details for context
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('max_attempts, passing_score')
      .eq('id', quizId)
      .single();

    const bestAttempt = (attempts || []).reduce((best: any, curr: any) => {
      if (!best || (curr.percentage || 0) > (best.percentage || 0)) return curr;
      return best;
    }, null);

    return successResponse(res, {
      attempts: attempts || [],
      total_attempts: (attempts || []).length,
      max_attempts: quiz?.max_attempts || null,
      attempts_remaining: quiz?.max_attempts ? Math.max(0, quiz.max_attempts - (attempts || []).length) : null,
      best_attempt: bestAttempt,
      has_passed: (attempts || []).some((a: any) => a.passed),
    }, 'Attempts fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/quizzes/:quizId/attempts/:attemptId - Get detailed attempt results
router.get('/quizzes/:quizId/attempts/:attemptId', checkAuth, async (req: Request, res: Response) => {
  try {
    const { quizId, attemptId } = req.params;
    const farmerId = (req as any).farmerId;

    // Get attempt with answers
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('quiz_id', quizId)
      .eq('user_id', farmerId)
      .single();

    if (attemptError || !attempt) {
      return errorResponse(res, 404, 'Attempt not found', attemptError);
    }

    // Get answers for this attempt
    const { data: answers, error: answersError } = await supabase
      .from('quiz_answers')
      .select('*')
      .eq('attempt_id', attemptId);

    if (answersError) {
      return errorResponse(res, 400, 'Failed to fetch answers', answersError);
    }

    // Get quiz with questions
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*, quiz_options(*)')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });

    // Build detailed results
    const detailedResults = (questions || []).map((question: any) => {
      const userAnswer = (answers || []).find((a: any) => a.question_id === question.id);
      const selectedOption = question.quiz_options.find((opt: any) => opt.id === userAnswer?.selected_option_id);
      const correctOption = question.quiz_options.find((opt: any) => opt.is_correct);

      return {
        question: {
          id: question.id,
          text: question.question_text,
          type: question.question_type,
          points: question.points,
          difficulty: question.difficulty,
        },
        user_answer: {
          selected_option: selectedOption ? {
            id: selectedOption.id,
            text: selectedOption.option_text,
          } : null,
          text_answer: userAnswer?.user_answer,
          is_correct: userAnswer?.is_correct || false,
          points_earned: userAnswer?.points_earned || 0,
        },
        correct_answer: quiz?.show_correct_answer ? {
          option: correctOption ? {
            id: correctOption.id,
            text: correctOption.option_text,
          } : null,
          explanation: question.explanation,
        } : null,
        all_options: question.quiz_options.map((opt: any) => ({
          id: opt.id,
          text: opt.option_text,
          is_correct: quiz?.show_correct_answer ? opt.is_correct : undefined,
        })),
      };
    });

    return successResponse(res, {
      attempt,
      quiz: {
        id: quiz?.id,
        title: quiz?.title,
        passing_score: quiz?.passing_score,
      },
      results: detailedResults,
      summary: {
        total_questions: detailedResults.length,
        correct_answers: detailedResults.filter((r: any) => r.user_answer.is_correct).length,
        score: attempt.score,
        max_score: attempt.max_score,
        percentage: attempt.percentage,
        passed: attempt.passed,
        time_spent: attempt.time_spent_seconds,
      },
    }, 'Attempt details fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

// GET /learn/lessons/:lessonId/quiz - Get quiz with questions for a lesson (simplified for our JSONB structure)
router.get('/lessons/:lessonId/quiz', async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;

    // Get quiz for this lesson
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .single();

    if (quizError || !quiz) {
      return errorResponse(res, 404, 'Quiz not found for this lesson', quizError);
    }

    // Get questions (our structure has options as JSONB)
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('order_index', { ascending: true });

    if (questionsError) {
      return errorResponse(res, 400, 'Failed to fetch questions', questionsError);
    }

    // Transform to the format our QuizPlayer expects
    const formattedQuestions = (questions || []).map((q: any) => {
      const options = q.options || [];
      const correctIndex = options.findIndex((opt: any) => opt.is_correct);
      
      return {
        question: q.question_text,
        options: options.map((opt: any) => opt.text),
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        explanation: q.explanation || '',
      };
    });

    return successResponse(res, {
      questions: formattedQuestions,
    }, 'Quiz fetched successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error', error);
  }
});

export default router;
