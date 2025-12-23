import * as db from '../db/learn';
import { UserLearningStats, CourseEnrollment, Badge } from '../types/learn.types';

/**
 * LearnService - Business logic layer for Learn platform
 * Handles complex operations, calculations, and aggregations
 */

// ============================================================================
// PROGRESS & COMPLETION
// ============================================================================

/**
 * Calculate course progress percentage
 * Returns: { completed: number, total: number, percentage: number }
 */
export async function calculateCourseProgress(userId: string, courseId: string) {
  try {
    const result = await db.getCourseProgress(userId, courseId);
    return {
      completedLessons: result.completedLessons,
      totalLessons: result.totalLessons,
      progressPercent: result.progressPercent,
    };
  } catch (error) {
    console.error('Error calculating course progress:', error);
    throw error;
  }
}

/**
 * Update enrollment progress based on lessons completed
 */
export async function updateEnrollmentProgress(
  enrollmentId: string,
  userId: string,
  courseId: string
) {
  try {
    const progress = await calculateCourseProgress(userId, courseId);

    // Determine enrollment status
    let status: string = 'in_progress';
    if (progress.progressPercent === 100) {
      status = 'completed';
    }

    // Update enrollment
    await db.updateEnrollment(enrollmentId, {
      progress_percent: progress.progressPercent,
      lessons_completed: progress.completedLessons,
      status: status as any,
      completion_date: status === 'completed' ? new Date() : null,
    });

    return progress;
  } catch (error) {
    console.error('Error updating enrollment progress:', error);
    throw error;
  }
}

/**
 * Mark lesson as complete and update related progress
 */
export async function completeLessonAndUpdateProgress(
  userId: string,
  lessonId: string,
  courseId: string
) {
  try {
    // Get or create lesson progress
    let progress = await db.getLessonProgress(userId, lessonId);

    if (!progress) {
      progress = await db.createLessonProgress({
        user_id: userId,
        lesson_id: lessonId,
        status: 'completed',
        completion_date: new Date(),
      });
    } else {
      progress = await db.updateLessonProgress(progress.id, {
        status: 'completed',
        completion_date: new Date(),
      });
    }

    // Get enrollment and update progress
    const enrollment = await db.getEnrollment(userId, courseId);
    if (enrollment) {
      await updateEnrollmentProgress(enrollment.id, userId, courseId);
    }

    // Check for badge eligibility
    await checkAndAwardBadges(userId);

    return progress;
  } catch (error) {
    console.error('Error completing lesson:', error);
    throw error;
  }
}

/**
 * Get enrollment completion status
 */
export async function getEnrollmentCompletion(enrollmentId: string) {
  try {
    const enrollment = await db.getEnrollmentById(enrollmentId);

    return {
      courseId: enrollment.course_id,
      userId: enrollment.user_id,
      progress: enrollment.progress_percent,
      lessonsCompleted: enrollment.lessons_completed,
      status: enrollment.status,
      isCompleted: enrollment.status === 'completed',
    };
  } catch (error) {
    console.error('Error getting enrollment completion:', error);
    throw error;
  }
}

// ============================================================================
// BADGE SYSTEM
// ============================================================================

/**
 * Badge criteria checkers
 */
const badgeCriteria: Record<string, (userId: string, badgeValue: number) => Promise<boolean>> = {
  courses_completed: async (userId: string, requiredCount: number) => {
    try {
      const { data: enrollments } = await db.getEnrollments(userId, 1000, 0, 'completed');
      return enrollments.length >= requiredCount;
    } catch {
      return false;
    }
  },

  quizzes_passed: async (userId: string, requiredCount: number) => {
    try {
      const { data: attempts } = await db.supabase
        .from('quiz_attempts')
        .select('id')
        .eq('user_id', userId)
        .eq('passed', true);
      return (attempts?.length || 0) >= requiredCount;
    } catch {
      return false;
    }
  },

  learning_hours: async (userId: string, requiredHours: number) => {
    try {
      const stats = await db.getUserStats(userId);
      return stats.total_learning_hours >= requiredHours;
    } catch {
      return false;
    }
  },

  consecutive_days: async (userId: string, requiredDays: number) => {
    try {
      const stats = await db.getUserStats(userId);
      return stats.current_streak_days >= requiredDays;
    } catch {
      return false;
    }
  },

  articles_read: async (userId: string, requiredCount: number) => {
    try {
      const { data: progress } = await db.supabase
        .from('lesson_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed');
      return (progress?.length || 0) >= requiredCount;
    } catch {
      return false;
    }
  },
};

/**
 * Check all badge criteria and award earned badges
 */
export async function checkAndAwardBadges(userId: string) {
  try {
    const { data: allBadges } = await db.supabase.from('badges').select('*');

    if (!allBadges) return [];

    const awardedBadges = [];

    for (const badge of allBadges) {
      // Check if user already has this badge
      const existing = await db.getUserBadge(userId, badge.id);
      if (existing) continue;

      // Check if user meets criteria
      const checker = badgeCriteria[badge.requirement_type];
      if (!checker) continue;

      const meetsRequirement = await checker(userId, badge.requirement_value);
      if (meetsRequirement) {
        // Award badge
        const awarded = await db.awardBadge(userId, badge.id);
        if (awarded) {
          awardedBadges.push(badge);
        }
      }
    }

    // Update stats
    if (awardedBadges.length > 0) {
      const stats = await db.getUserStats(userId);
      await db.updateUserStats(userId, {
        total_badges_earned: (stats.total_badges_earned || 0) + awardedBadges.length,
      });
    }

    return awardedBadges;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
}

/**
 * Award specific badge to user
 */
export async function awardBadge(userId: string, badgeId: string) {
  try {
    return await db.awardBadge(userId, badgeId);
  } catch (error) {
    console.error('Error awarding badge:', error);
    return null;
  }
}

/**
 * Get user's earned badges with details
 */
export async function getUserBadgesWithDetails(userId: string, limit: number = 50, offset: number = 0) {
  try {
    const { data, total } = await db.getUserBadges(userId, limit, offset);
    return {
      badges: data.map((ub) => ({
        id: ub.id,
        badgeId: ub.badge_id,
        name: ub.badges?.name,
        description: ub.badges?.description,
        icon: ub.badges?.icon_emoji || ub.badges?.icon_url,
        category: ub.badges?.category,
        earnedAt: ub.earned_at,
      })),
      total,
    };
  } catch (error) {
    console.error('Error getting user badges:', error);
    throw error;
  }
}

// ============================================================================
// STATISTICS & AGGREGATION
// ============================================================================

/**
 * Calculate comprehensive learning statistics
 */
export async function calculateUserStats(userId: string) {
  try {
    // Get enrollments
    const { data: enrollments, total: totalEnrolled } = await db.getEnrollments(
      userId,
      1000,
      0
    );

    // Count completed
    const completedCount = enrollments.filter((e) => e.status === 'completed').length;

    // Calculate total hours (estimate from courses)
    let totalHours = 0;
    for (const enrollment of enrollments) {
      if (enrollment.courses?.duration) {
        const match = enrollment.courses.duration.match(/\d+/);
        if (match) {
          totalHours += parseInt(match[0]);
        }
      }
    }

    // Get quiz stats
    const { data: quizzes } = await db.supabase
      .from('quiz_attempts')
      .select('passed')
      .eq('user_id', userId);

    const quizzesPassed = quizzes?.filter((q) => q.passed).length || 0;

    // Get badge count
    const { total: badgeCount } = await db.getUserBadges(userId, 1000, 0);

    // Update stats
    const stats = await db.updateUserStats(userId, {
      total_courses_enrolled: totalEnrolled,
      total_courses_completed: completedCount,
      total_learning_hours: totalHours,
      total_badges_earned: badgeCount,
      last_activity_date: new Date(),
    });

    return stats as UserLearningStats;
  } catch (error) {
    console.error('Error calculating user stats:', error);
    throw error;
  }
}

/**
 * Get comprehensive user learning dashboard data
 */
export async function getUserLearningDashboard(userId: string) {
  try {
    // Get stats (auto-create if missing)
    const stats = await db.getUserStats(userId);

    // Get active courses
    const { data: activeEnrollments } = await db.getEnrollments(userId, 10, 0, 'in_progress');

    // Get recent quizzes
    const { data: recentQuizzes } = await db.supabase
      .from('quiz_attempts')
      .select('*, quizzes(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent badges
    const { data: recentBadges } = await db.getUserBadges(userId, 5, 0);

    // Get roadmap progress
    const { data: roadmapProgress } = await db.supabase
      .from('user_roadmap_progress')
      .select('*, learning_roadmaps(*)')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    return {
      stats: {
        totalCoursesEnrolled: stats.total_courses_enrolled,
        totalCoursesCompleted: stats.total_courses_completed,
        totalLearningHours: stats.total_learning_hours,
        totalBadgesEarned: stats.total_badges_earned,
        currentStreak: stats.current_streak_days,
        totalPoints: stats.total_points,
      },
      activeEnrollments: activeEnrollments.map((e) => ({
        id: e.id,
        courseId: e.course_id,
        courseName: e.courses?.title,
        progress: e.progress_percent,
        status: e.status,
      })),
      recentActivity: recentQuizzes?.map((q) => ({
        type: 'quiz',
        name: q.quizzes?.title,
        score: q.percentage,
        passed: q.passed,
        date: q.created_at,
      })),
      recentBadges: recentBadges?.map((b) => ({
        name: b.badges?.name,
        icon: b.badges?.icon_emoji,
        earnedAt: b.earned_at,
      })),
      roadmaps: roadmapProgress?.map((rp) => ({
        roadmapId: rp.roadmap_id,
        roadmapName: rp.learning_roadmaps?.title,
        progress: rp.progress_percent,
        completedMilestones: rp.completed_milestones,
      })),
    };
  } catch (error) {
    console.error('Error getting learning dashboard:', error);
    throw error;
  }
}

// ============================================================================
// QUIZ & ASSESSMENT
// ============================================================================

/**
 * Submit quiz answers and calculate score
 */
export async function submitQuizAnswers(
  userId: string,
  quizId: string,
  answers: Array<{ questionId: string; answer: string }>
) {
  try {
    // Get quiz with questions
    const quiz = await db.getQuizWithQuestions(quizId);
    if (!quiz) throw new Error('Quiz not found');

    // Create attempt record
    const attempt = await db.createQuizAttempt({
      user_id: userId,
      quiz_id: quizId,
      passed: false,
      attempt_number: 1,
    });

    // Grade answers
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers: Array<{ questionId: string; answer: string; isCorrect: boolean; pointsEarned: number }> = [];

    for (const question of quiz.questions || []) {
      const userAnswer = answers.find((a) => a.questionId === question.id);
      const points = question.points || 1;
      totalPoints += points;

      if (!userAnswer) {
        gradedAnswers.push({
          questionId: question.id,
          answer: '',
          isCorrect: false,
          pointsEarned: 0,
        });
        continue;
      }

      // Check answer
      let isCorrect = false;

      if (question.question_type === 'true_false') {
        isCorrect = userAnswer.answer.toLowerCase() === question.options?.[0]?.is_correct?.toString();
      } else if (question.question_type === 'multiple_choice') {
        const correctOption = (question.options as any[])?.find((opt) => opt.is_correct);
        isCorrect = userAnswer.answer === correctOption?.text;
      } else if (question.question_type === 'short_answer') {
        // Simple string matching (could be enhanced with fuzzy matching)
        isCorrect = userAnswer.answer.toLowerCase().includes(question.question_text.toLowerCase());
      }

      const questionPoints = isCorrect ? points : 0;
      earnedPoints += questionPoints;

      gradedAnswers.push({
        questionId: question.id,
        answer: userAnswer.answer,
        isCorrect,
        pointsEarned: questionPoints,
      });
    }

    // Calculate percentage
    const percentage = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
    const passed = percentage >= (quiz.passing_score || 70);

    // Store answers
    await db.createQuizAnswers(
      gradedAnswers.map((ga) => ({
        attempt_id: attempt.id,
        question_id: ga.questionId,
        user_answer: ga.answer,
        is_correct: ga.isCorrect,
        points_earned: ga.pointsEarned,
      }))
    );

    // Update attempt with score
    const finalAttempt = await db.updateQuizAttempt(attempt.id, {
      score: earnedPoints,
      percentage: percentage,
      passed: passed,
    });

    // Award badge if passed
    if (passed) {
      await checkAndAwardBadges(userId);
    }

    return {
      attemptId: finalAttempt.id,
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      answers: gradedAnswers,
    };
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
}

/**
 * Get quiz attempt with detailed feedback
 */
export async function getQuizAttemptWithFeedback(attemptId: string) {
  try {
    const attempt = await db.supabase
      .from('quiz_attempts')
      .select('*, quizzes(*)')
      .eq('id', attemptId)
      .single();

    if (attempt.error) throw attempt.error;

    const answers = await db.getAttemptAnswers(attemptId);

    // Fetch question details for each answer
    const detailedAnswers = await Promise.all(
      answers.map(async (answer) => {
        const question = await db.getQuestionById(answer.question_id);
        return {
          ...answer,
          questionText: question.question_text,
          explanation: question.explanation,
          correctAnswer: (question.options as any)?.find((opt: any) => opt.is_correct)?.text,
        };
      })
    );

    return {
      attempt: attempt.data,
      answers: detailedAnswers,
    };
  } catch (error) {
    console.error('Error getting quiz feedback:', error);
    throw error;
  }
}

// ============================================================================
// ENROLLMENT & RECOMMENDATIONS
// ============================================================================

/**
 * Get recommended courses for user
 */
export async function getRecommendedCourses(userId: string, limit: number = 10) {
  try {
    // Get user's completed courses
    const { data: enrollments } = await db.getEnrollments(userId, 1000, 0, 'completed');
    const completedCategories = new Set(
      enrollments.map((e) => e.courses?.category).filter(Boolean)
    );

    // Get all published courses
    const { data: courses } = await db.getCourses(1000, 0, { isPublished: true });

    // Filter recommendations
    const recommended = courses
      .filter((c) => {
        // Not already enrolled
        const isEnrolled = enrollments.some((e) => e.course_id === c.id);
        if (isEnrolled) return false;

        // Prefer courses in categories user has taken
        return completedCategories.has(c.category);
      })
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);

    return recommended;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

/**
 * Enroll user in course with duplicate prevention
 */
export async function enrollUserInCourse(
  userId: string,
  courseId: string,
  enrollmentType: 'free' | 'paid' | 'promotional' | 'gifted' = 'free'
) {
  try {
    // Check for existing enrollment
    const existing = await db.getEnrollment(userId, courseId);
    if (existing) {
      return { success: false, message: 'Already enrolled', enrollment: existing };
    }

    // Create enrollment
    const enrollment = await db.createEnrollment({
      user_id: userId,
      course_id: courseId,
      status: 'enrolled',
      enrollment_type: enrollmentType,
    });

    // Update course enrolled count
    const course = await db.getCourseById(courseId);
    await db.updateCourse(courseId, {
      enrolled_count: (course.enrolled_count || 0) + 1,
    });

    return { success: true, message: 'Enrolled successfully', enrollment };
  } catch (error) {
    console.error('Error enrolling user:', error);
    throw error;
  }
}

/**
 * Drop course
 */
export async function dropCourse(userId: string, courseId: string) {
  try {
    const enrollment = await db.getEnrollment(userId, courseId);
    if (!enrollment) throw new Error('Enrollment not found');

    // Delete enrollment
    await db.deleteEnrollment(enrollment.id);

    // Update course enrolled count
    const course = await db.getCourseById(courseId);
    const newCount = Math.max(0, (course.enrolled_count || 1) - 1);
    await db.updateCourse(courseId, { enrolled_count: newCount });

    return { success: true, message: 'Course dropped' };
  } catch (error) {
    console.error('Error dropping course:', error);
    throw error;
  }
}

// ============================================================================
// SEARCH & DISCOVERY
// ============================================================================

/**
 * Search courses, articles, and videos with ranking
 */
export async function searchContent(query: string, limit: number = 20, offset: number = 0) {
  try {
    const results = await db.searchContent(query, limit * 2, offset);

    // Rank results by relevance (simple relevance scoring)
    const rankContent = (items: any[], type: string) => {
      return items
        .map((item) => {
          let score = 0;
          const title = (item.title || '').toLowerCase();
          const queryLower = query.toLowerCase();

          if (title === queryLower) score += 100;
          if (title.startsWith(queryLower)) score += 50;
          if (title.includes(queryLower)) score += 25;

          return { ...item, relevanceScore: score, contentType: type };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
    };

    return {
      courses: rankContent(results.courses, 'course'),
      articles: rankContent(results.articles, 'article'),
      videos: rankContent(results.videos, 'video'),
      total: (results.courses?.length || 0) + (results.articles?.length || 0) + (results.videos?.length || 0),
    };
  } catch (error) {
    console.error('Error searching content:', error);
    throw error;
  }
}

// ============================================================================
// ROADMAP & MILESTONE
// ============================================================================

/**
 * Start a roadmap for user
 */
export async function startRoadmapForUser(userId: string, roadmapId: string) {
  try {
    // Check if already started
    const existing = await db.getUserRoadmapProgress(userId, roadmapId);
    if (existing) {
      return { success: false, message: 'Already started', progress: existing };
    }

    // Start roadmap
    const progress = await db.startRoadmap(userId, roadmapId);
    return { success: true, message: 'Roadmap started', progress };
  } catch (error) {
    console.error('Error starting roadmap:', error);
    throw error;
  }
}

/**
 * Get roadmap with user's progress
 */
export async function getRoadmapWithUserProgress(userId: string, roadmapId: string) {
  try {
    const roadmap = await db.getRoadmapWithMilestones(roadmapId);
    const userProgress = await db.getUserRoadmapProgress(userId, roadmapId);

    // Get user's progress on each milestone's course
    const milestonesWithProgress = await Promise.all(
      (roadmap.milestones || []).map(async (milestone) => {
        if (milestone.courses) {
          const enrollment = await db.getEnrollment(userId, milestone.courses.id);
          return {
            ...milestone,
            userStatus: enrollment?.status || 'not_started',
            userProgress: enrollment?.progress_percent || 0,
          };
        }
        return milestone;
      })
    );

    return {
      roadmap: {
        ...roadmap,
        milestones: milestonesWithProgress,
      },
      userProgress,
    };
  } catch (error) {
    console.error('Error getting roadmap with progress:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sync user stats (call periodically to update)
 */
export async function syncUserStats(userId: string) {
  try {
    return await calculateUserStats(userId);
  } catch (error) {
    console.error('Error syncing stats:', error);
    throw error;
  }
}

/**
 * Get learning streak (consecutive days of activity)
 */
export async function updateLearningStreak(userId: string) {
  try {
    const stats = await db.getUserStats(userId);

    // Get last activity date
    const { data: lastActivity } = await db.supabase
      .from('lesson_progress')
      .select('updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!lastActivity || lastActivity.length === 0) {
      return stats;
    }

    const lastDate = new Date(lastActivity[0].updated_at);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    let newStreak = stats.current_streak_days || 1;
    if (daysDiff === 1) {
      // Consecutive day
      newStreak = (stats.current_streak_days || 0) + 1;
    } else if (daysDiff > 1) {
      // Streak broken
      newStreak = 1;
    }

    // Update longest streak if new streak is longer
    const longestStreak = Math.max(newStreak, stats.longest_streak_days || 0);

    const updated = await db.updateUserStats(userId, {
      current_streak_days: newStreak,
      longest_streak_days: longestStreak,
      last_activity_date: today,
    });

    return updated;
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
}
