import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Star,
  Users,
  Play,
  CheckCircle,
  Lock,
  Loader2,
  AlertCircle,
  GraduationCap,
  Trophy,
  ChevronRight,
  Map,
  List,
  Globe,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import * as LearnService from "@/services/LearnService";
import { LearningRoadmap } from "@/components/learn/LearningRoadmap";
import { useLanguage } from "@/context/LanguageContext";

interface Lesson {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  duration?: string;
  content_type: 'video' | 'text' | 'quiz' | 'assignment';
  content_url?: string;
  is_preview: boolean;
}

interface CourseWithLessons extends Omit<LearnService.Course, 'lessons'> {
  lessons: Lesson[];
  lesson_count?: number;
}

export const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const isHindi = language === 'hi';
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<LearnService.Enrollment | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'roadmap' | 'classic'>('roadmap');

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
      // Only check enrollment if user is logged in
      const token = localStorage.getItem('auth_token');
      if (token) {
        checkEnrollmentStatus(courseId);
      }
    }
  }, [courseId]);

  // Refetch progress when component regains focus (returning from lesson)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && courseId) {
        const token = localStorage.getItem('auth_token');
        if (token) {
          checkEnrollmentStatus(courseId);
        }
      }
    };

    const handleFocus = () => {
      if (courseId) {
        const token = localStorage.getItem('auth_token');
        if (token) {
          checkEnrollmentStatus(courseId);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [courseId]);

  const fetchCourse = async (cId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await LearnService.getCourseById(cId);
      if (response.success && response.data) {
        setCourse(response.data as CourseWithLessons);
      } else {
        setError("Course not found");
      }
    } catch (err: any) {
      console.error("Failed to load course:", err);
      setError(err.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async (cId: string) => {
    try {
      const response = await LearnService.getCourseProgress(cId);
      if (response.success && response.data) {
        const data = response.data as any;
        // Check if enrolled - handle both response formats
        if (data.enrollment || data.is_enrolled) {
          setIsEnrolled(true);
          setEnrollment(data.enrollment);
          // Build lesson progress map - handle both camelCase and snake_case
          const progressMap: Record<string, string> = {};
          const progressData = data.lessonProgress || data.lessons_progress || [];
          progressData.forEach((lp: any) => {
            progressMap[lp.lesson_id] = lp.status;
          });
          setLessonProgress(progressMap);
        } else {
          setIsEnrolled(false);
        }
      } else {
        setIsEnrolled(false);
      }
    } catch (err) {
      // Not enrolled - silently handle
      setIsEnrolled(false);
    }
  };

  const handleEnroll = async () => {
    if (!courseId) return;
    try {
      setEnrolling(true);
      const response = await LearnService.enrollInCourse(courseId);
      if (response.success) {
        setIsEnrolled(true);
        setEnrollment(response.data);
        // Refresh course data
        fetchCourse(courseId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLearning = () => {
    if (!courseId || !course?.lessons?.length) return;
    // Navigate to first lesson or continue where left off
    const firstIncompleteLesson = course.lessons.find(
      (l) => lessonProgress[l.id] !== 'completed'
    ) || course.lessons[0];
    navigate(`/learn/courses/${courseId}/lesson/${firstIncompleteLesson.id}`);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-700";
      case "intermediate":
        return "bg-yellow-100 text-yellow-700";
      case "advanced":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-4 h-4" />;
      case "text":
        return <BookOpen className="w-4 h-4" />;
      case "quiz":
        return <Trophy className="w-4 h-4" />;
      case "assignment":
        return <GraduationCap className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getLessonStatus = (lessonId: string) => {
    const status = lessonProgress[lessonId];
    if (status === 'completed') return 'completed';
    if (status === 'in_progress') return 'in_progress';
    return 'not_started';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Course Not Found</h2>
        <p className="text-muted-foreground mb-6">{error || "The course you're looking for doesn't exist."}</p>
        <Button onClick={() => navigate("/learn")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Learn
        </Button>
      </div>
    );
  }

  // Calculate progress from lesson completion
  const completedLessons = Object.values(lessonProgress).filter(s => s === 'completed').length;
  const totalLessons = course.lessons?.length || 1;
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  // Handler for starting a lesson from roadmap
  const handleStartLesson = (lessonId: string) => {
    navigate(`/learn/courses/${courseId}/lesson/${lessonId}`);
  };

  // Refetch progress data (called from child components or after navigation)
  const refetchProgress = async () => {
    if (courseId) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await checkEnrollmentStatus(courseId);
      }
    }
  };

  // Show gamified roadmap view by default
  if (viewMode === 'roadmap' && course.lessons && course.lessons.length > 0) {
    return (
      <LearningRoadmap
        courseId={courseId!}
        courseTitle={course.title}
        lessons={course.lessons}
        lessonProgress={lessonProgress}
        isEnrolled={isEnrolled}
        onStartLesson={handleStartLesson}
        onEnroll={handleEnroll}
        totalXP={course.lessons.length * 20}
        earnedXP={completedLessons * 20}
        courseDescription={course.description}
        instructor={course.instructor_name || 'Krushi Unnati Team'}
        duration={course.duration || `${course.lessons.length * 15} min`}
        level={course.level}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        {/* Back Button & View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/learn")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isHindi ? 'सीखने पर वापसें' : 'Back to Learn'}
          </Button>
          
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              {language === 'en' ? 'हिंदी' : 'English'}
            </Button>

            {/* View Mode Toggle */}
            {course.lessons && course.lessons.length > 0 && (
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'roadmap' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('roadmap')}
                  className="gap-2"
                >
                  <Map className="w-4 h-4" />
                  <span className="hidden sm:inline">{isHindi ? 'रोडमैप' : 'Roadmap'}</span>
                </Button>
                <Button
                  variant={viewMode === 'classic' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('classic')}
                  className="gap-2"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">{isHindi ? 'क्लासिक' : 'Classic'}</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-6xl">{course.thumbnail_emoji || "📚"}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelBadge(course.level)}`}>
                        {course.level}
                      </span>
                      <span className="text-xs text-muted-foreground">{course.language}</span>
                      {course.price === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Free
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      {course.title}
                    </h1>
                    <p className="text-muted-foreground mb-4">{course.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.lessons?.length || course.lesson_count || 0} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.enrolled_count.toLocaleString()} enrolled
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {course.rating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instructor */}
                {course.instructor_name && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{course.instructor_name}</p>
                        <p className="text-sm text-muted-foreground">Instructor</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Bar (if enrolled) */}
                {isEnrolled && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Your Progress</span>
                      <span className="text-sm text-muted-foreground">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {completedLessons} of {totalLessons} lessons completed
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Course Content / Lessons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Course Content
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {course.lessons?.length || 0} lessons • {course.duration}
                </p>

                <div className="space-y-2">
                  {course.lessons && course.lessons.length > 0 ? (
                    course.lessons.map((lesson, index) => {
                      const status = getLessonStatus(lesson.id);
                      const isLocked = !isEnrolled && !lesson.is_preview;
                      
                      return (
                        <div
                          key={lesson.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            isLocked
                              ? "bg-muted/50 cursor-not-allowed"
                              : "hover:bg-muted/50 cursor-pointer"
                          }`}
                          onClick={() => {
                            if (!isLocked && isEnrolled) {
                              navigate(`/learn/courses/${courseId}/lesson/${lesson.id}`);
                            }
                          }}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                            {status === 'completed' ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : isLocked ? (
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {getContentTypeIcon(lesson.content_type)}
                              </span>
                              <span className={`font-medium ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                                {lesson.title}
                              </span>
                              {lesson.is_preview && !isEnrolled && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                  Preview
                                </span>
                              )}
                            </div>
                            {lesson.duration && (
                              <p className="text-xs text-muted-foreground mt-0.5">{lesson.duration}</p>
                            )}
                          </div>
                          {!isLocked && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No lessons available yet</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Enroll CTA */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="sticky top-6"
            >
              <Card className="p-6">
                {/* Price */}
                <div className="text-center mb-6">
                  {course.price === 0 ? (
                    <p className="text-3xl font-bold text-green-600">Free</p>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        ₹{course.price}
                      </p>
                      {course.discount_percent > 0 && (
                        <p className="text-sm text-muted-foreground line-through">
                          ₹{Math.round(course.price / (1 - course.discount_percent / 100))}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                {isEnrolled ? (
                  <Button className="w-full mb-4" size="lg" onClick={handleStartLearning}>
                    <Play className="w-4 h-4 mr-2" />
                    {progressPercent > 0 ? "Continue Learning" : "Start Learning"}
                  </Button>
                ) : (
                  <Button
                    className="w-full mb-4"
                    size="lg"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Enroll Now
                      </>
                    )}
                  </Button>
                )}

                {/* Course Includes */}
                <div className="space-y-3 pt-4 border-t">
                  <p className="font-medium text-foreground">This course includes:</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {course.lessons?.length || 0} lessons
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {course.duration} of content
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Certificate on completion
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Lifetime access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Mobile friendly
                    </li>
                  </ul>
                </div>

                {/* Enrolled Status */}
                {isEnrolled && enrollment && (
                  <div className="mt-4 pt-4 border-t text-center">
                    <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      You're enrolled
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enrolled on {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
