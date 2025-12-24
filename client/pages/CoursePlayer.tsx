import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Play,
  BookOpen,
  Trophy,
  GraduationCap,
  Loader2,
  AlertCircle,
  Menu,
  X,
  Clock,
  Timer,
  Video,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import * as LearnService from "@/services/LearnService";
import { RichArticleViewer, QuizPlayer } from "@/components/learn";
import type { ArticleContent, QuizData } from "@/components/learn";

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

export const CoursePlayer: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [badgeEarned, setBadgeEarned] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [articleContent, setArticleContent] = useState<ArticleContent | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);

  // Extract YouTube video ID for thumbnail
  const getYouTubeThumbnail = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
    return null;
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseData(courseId);
    }
  }, [courseId]);

  useEffect(() => {
    if (course?.lessons && lessonId) {
      const lesson = course.lessons.find((l) => l.id === lessonId);
      setCurrentLesson(lesson || null);
      
      // Fetch quiz data if this is a quiz lesson
      if (lesson && lesson.content_type === 'quiz') {
        fetchQuizData(lesson.id);
        setArticleContent(null);
      } else if (lesson && lesson.content_type === 'text') {
        // Fetch article content for text lessons
        fetchArticleContent(lesson.id);
        setQuizData(null);
      } else {
        setQuizData(null);
        setArticleContent(null);
      }
    }
  }, [course, lessonId]);

  const fetchArticleContent = async (lessonId: string) => {
    try {
      setLoadingArticle(true);
      const response = await fetch(`/api/learn/lessons/${lessonId}/content`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.hasRichContent) {
          setArticleContent(data.data.article);
        } else {
          setArticleContent(null);
        }
      } else {
        setArticleContent(null);
      }
    } catch (err) {
      console.error('Failed to fetch article content:', err);
      setArticleContent(null);
    } finally {
      setLoadingArticle(false);
    }
  };

  const fetchQuizData = async (lessonId: string) => {
    try {
      setLoadingQuiz(true);
      const response = await fetch(`/api/learn/lessons/${lessonId}/quiz`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setQuizData(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch quiz:', err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const fetchCourseData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course with lessons
      const courseResponse = await LearnService.getCourseById(id);
      if (courseResponse.success) {
        setCourse(courseResponse.data as CourseWithLessons);
      }

      // Fetch progress
      try {
        const progressResponse = await LearnService.getCourseProgress(id);
        if (progressResponse.success && progressResponse.data) {
          const data = progressResponse.data as any;
          setProgressPercent(data.progressPercent || data.progress_percent || 0);
          const progressMap: Record<string, string> = {};
          // Handle both camelCase and snake_case from API
          const lessonProgressData = data.lessonProgress || data.lessons_progress || [];
          lessonProgressData.forEach((lp: any) => {
            progressMap[lp.lesson_id] = lp.status;
          });
          setLessonProgress(progressMap);
        }
      } catch (err) {
        // Progress fetch failed - continue without it
      }
    } catch (err: any) {
      setError(err.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentLesson || !courseId) return;

    try {
      setCompleting(true);
      await LearnService.markLessonProgress(currentLesson.id, courseId, 'completed');
      
      // Update local state
      setLessonProgress((prev) => ({
        ...prev,
        [currentLesson.id]: 'completed',
      }));

      // Calculate new progress
      const completedCount = Object.values({
        ...lessonProgress,
        [currentLesson.id]: 'completed',
      }).filter((s) => s === 'completed').length;
      const totalLessons = course?.lessons?.length || 1;
      const newProgress = Math.round((completedCount / totalLessons) * 100);
      setProgressPercent(newProgress);

      // Check if there's a next lesson
      const currentIndex = course?.lessons?.findIndex((l) => l.id === currentLesson.id) || 0;
      const nextLesson = course?.lessons?.[currentIndex + 1];
      
      if (nextLesson) {
        // Start 5-second countdown before navigating
        setCountdown(5);
      } else if (newProgress === 100) {
        // Course completed - call complete API to award badge
        try {
          const completeResponse = await LearnService.completeCourse(courseId);
          if (completeResponse.success && completeResponse.data?.badge) {
            const badgeData = completeResponse.data.badge as any;
            setBadgeEarned(badgeData.badges?.name || badgeData.name || 'Course Completion Badge');
          }
        } catch (e) {
          // Badge awarding failed, but course is still complete
          console.log('Badge award failed:', e);
        }
        setShowCelebration(true);
      }
    } catch (err: any) {
      console.error("Failed to mark lesson complete:", err);
    } finally {
      setCompleting(false);
    }
  };

  // Handle course completion button click
  const handleCompleteCourse = async () => {
    if (!courseId) return;
    
    // Check if all lessons are completed before allowing course completion
    if (!allLessonsCompleted()) {
      const totalLessons = course?.lessons?.length || 0;
      const completedCount = Object.values(lessonProgress).filter(s => s === 'completed').length;
      alert(`Please complete all lessons first. You've completed ${completedCount} out of ${totalLessons} lessons.`);
      return;
    }
    
    try {
      setCompleting(true);
      console.log('[CoursePlayer] Calling completeCourse API for:', courseId);
      const response = await LearnService.completeCourse(courseId);
      console.log('[CoursePlayer] completeCourse response:', response);
      
      if (response.success) {
        if (response.data?.badge) {
          const badgeData = response.data.badge as any;
          setBadgeEarned(badgeData.badges?.name || badgeData.name || 'Course Completion Badge');
        }
        setProgressPercent(100);
        setShowCelebration(true);
      } else {
        console.error('[CoursePlayer] Course completion failed:', response);
        // Show error to user
        alert(response.message || 'Failed to complete course. Please try again.');
      }
    } catch (err: any) {
      console.error("[CoursePlayer] Failed to complete course:", err);
      // Show error message
      alert(err.message || 'Failed to complete course. Please complete all lessons first.');
    } finally {
      setCompleting(false);
    }
  };

  // Countdown effect for auto-navigation
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    
    const timer = setTimeout(() => {
      if (countdown === 1) {
        // Navigate to next lesson
        const currentIndex = course?.lessons?.findIndex((l) => l.id === currentLesson?.id) || 0;
        const nextLesson = course?.lessons?.[currentIndex + 1];
        if (nextLesson) {
          setCountdown(null);
          navigate(`/learn/courses/${courseId}/lesson/${nextLesson.id}`);
        }
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, course, currentLesson, courseId, navigate]);

  const cancelCountdown = () => {
    setCountdown(null);
  };

  const navigateLesson = (direction: 'prev' | 'next') => {
    if (!course?.lessons || !currentLesson) return;
    const currentIndex = course.lessons.findIndex((l) => l.id === currentLesson.id);
    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    const targetLesson = course.lessons[targetIndex];
    if (targetLesson) {
      navigate(`/learn/courses/${courseId}/lesson/${targetLesson.id}`);
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

  const isLessonCompleted = (lessonId: string) => lessonProgress[lessonId] === 'completed';
  const currentIndex = course?.lessons?.findIndex((l) => l.id === currentLesson?.id) ?? -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < (course?.lessons?.length || 0) - 1;
  
  // Check if all lessons are completed
  const allLessonsCompleted = () => {
    if (!course?.lessons) return false;
    return course.lessons.every(lesson => isLessonCompleted(lesson.id));
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
        <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Course</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => navigate("/learn")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Learn
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Lesson List */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-80 bg-card border-r border-border flex flex-col fixed h-full z-20 lg:relative"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/learn/courses/${courseId}`)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Course
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <h2 className="font-semibold text-foreground line-clamp-2">{course.title}</h2>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>

            {/* Lesson List */}
            <div className="flex-1 overflow-y-auto p-2">
              {course.lessons?.map((lesson, index) => {
                const isActive = lesson.id === currentLesson?.id;
                const isCompleted = isLessonCompleted(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => navigate(`/learn/courses/${courseId}/lesson/${lesson.id}`)}
                    className={`w-full text-left p-3 rounded-lg mb-1 flex items-start gap-3 transition-colors ${
                      isActive
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                        {getContentTypeIcon(lesson.content_type)}
                        <span className="text-xs capitalize">{lesson.content_type}</span>
                      </div>
                      <p className={`text-sm font-medium line-clamp-2 ${isActive ? "text-primary" : "text-foreground"}`}>
                        {lesson.title}
                      </p>
                      {lesson.duration && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {lesson.duration}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-card border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div>
              <p className="text-sm text-muted-foreground">
                Lesson {currentIndex + 1} of {course.lessons?.length}
              </p>
              <h1 className="font-semibold text-foreground">{currentLesson?.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!hasPrev} onClick={() => navigateLesson('prev')}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => navigateLesson('next')}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </header>

        {/* Lesson Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentLesson ? (
            <motion.div
              key={currentLesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="p-6">
                {/* Video Content - Show thumbnail with link */}
                {currentLesson.content_type === 'video' && (
                  <div className="mb-6">
                    {currentLesson.content_url && getYouTubeThumbnail(currentLesson.content_url) ? (
                      // YouTube video with thumbnail
                      <a 
                        href={currentLesson.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="aspect-video rounded-lg overflow-hidden relative group cursor-pointer">
                          <img 
                            src={getYouTubeThumbnail(currentLesson.content_url)!}
                            alt={currentLesson.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              // Fallback to standard quality if maxres fails
                              const target = e.target as HTMLImageElement;
                              const url = currentLesson.content_url!;
                              const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
                              if (match) {
                                target.src = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                            <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-10 h-10 text-white ml-1" fill="white" />
                            </div>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <span className="bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                              Click to watch on YouTube
                            </span>
                          </div>
                        </div>
                      </a>
                    ) : (
                      // No video URL - show placeholder
                      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex flex-col items-center justify-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/20" />
                        <Video className="w-16 h-16 mb-4 opacity-80" />
                        <h3 className="text-xl font-semibold mb-2 relative z-10">{currentLesson.title}</h3>
                        <p className="text-gray-300 text-sm mb-4 relative z-10">Video Lesson</p>
                        {currentLesson.duration && (
                          <p className="text-muted-foreground text-xs flex items-center gap-1 relative z-10">
                            <Clock className="w-3 h-3" />
                            Duration: {currentLesson.duration}
                          </p>
                        )}
                      </div>
                    )}
                    {currentLesson.description && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="font-medium text-blue-900 mb-2">What you'll learn:</h4>
                        <p className="text-blue-800">{currentLesson.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Content - Rich Articles */}
                {currentLesson.content_type === 'text' && (
                  <div className="mb-6">
                    {loadingArticle ? (
                      <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading lesson content...</p>
                      </div>
                    ) : articleContent ? (
                      <RichArticleViewer 
                        title={currentLesson.title}
                        article={articleContent}
                        onComplete={() => handleMarkComplete()}
                      />
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">{currentLesson.title}</h2>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {currentLesson.description || "Lesson content will be displayed here."}
                        </p>
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-blue-800">
                            💡 <strong>Coming Soon:</strong> Rich interactive content with tips, examples, and step-by-step guides will be available here!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quiz Content */}
                {currentLesson.content_type === 'quiz' && (
                  <div>
                    {loadingQuiz ? (
                      <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading quiz...</p>
                      </div>
                    ) : quizData && quizData.questions && quizData.questions.length > 0 ? (
                      <QuizPlayer
                        title={currentLesson.title}
                        description={currentLesson.description}
                        quiz={quizData}
                        passingScore={60}
                        onComplete={(score, passed) => {
                          console.log(`Quiz completed: ${score}% - ${passed ? 'Passed' : 'Failed'}`);
                          if (passed) {
                            // Automatically mark lesson as complete on passing
                            handleMarkComplete();
                          }
                        }}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Quiz Time!</h2>
                        <p className="text-muted-foreground mb-6">
                          Test your knowledge and earn badges for great performance!
                        </p>
                        <p className="text-sm text-muted-foreground">Quiz is being prepared...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Assignment Content */}
                {currentLesson.content_type === 'assignment' && (
                  <div className="text-center py-12">
                    <GraduationCap className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Assignment</h2>
                    <p className="text-muted-foreground mb-6">
                      {currentLesson.description || "Complete this assignment to proceed."}
                    </p>
                  </div>
                )}
              </Card>

              {/* Mark Complete Button */}
              <div className="mt-6 flex flex-col items-center gap-4">
                {/* Countdown Timer */}
                {countdown !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-4"
                  >
                    <div className="flex items-center gap-2 text-primary">
                      <Timer className="w-5 h-5" />
                      <span className="font-medium">Next lesson in {countdown} seconds...</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={cancelCountdown}>
                      Stay Here
                    </Button>
                  </motion.div>
                )}

                {isLessonCompleted(currentLesson.id) ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Lesson Completed</span>
                    </div>
                    
                    {/* Show "Next Lesson" or "Complete Course" based on position */}
                    {hasNext ? (
                      <Button size="lg" onClick={() => navigateLesson('next')}>
                        Next Lesson
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        size="lg" 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        onClick={handleCompleteCourse}
                        disabled={completing || !allLessonsCompleted()}
                        title={!allLessonsCompleted() ? "Complete all lessons first" : "Complete the course"}
                      >
                        {completing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trophy className="w-4 h-4 mr-2" />
                        )}
                        Complete Course
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button size="lg" onClick={handleMarkComplete} disabled={completing}>
                    {completing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Course Completion Celebration */}
              <AnimatePresence>
                {showCelebration && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="mt-8"
                  >
                    <Card className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                      <div className="text-center">
                        <motion.div
                          animate={{ rotate: [0, -10, 10, -10, 0] }}
                          transition={{ duration: 0.5, repeat: 2 }}
                        >
                          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-green-800 mb-2">
                          🎉 Congratulations!
                        </h2>
                        <p className="text-green-700 mb-4 max-w-md mx-auto">
                          You've completed <span className="font-semibold">"{course.title}"</span>!
                        </p>
                        
                        {/* Show earned badge */}
                        {badgeEarned && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mb-6 inline-block"
                          >
                            <div className="bg-card rounded-xl p-4 shadow-lg border-2 border-yellow-400">
                              <div className="flex items-center gap-3">
                                <div className="text-4xl">🎓</div>
                                <div className="text-left">
                                  <p className="text-xs text-yellow-600 font-medium uppercase tracking-wide">Badge Earned!</p>
                                  <p className="text-lg font-bold text-foreground">{badgeEarned}</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        
                        {!badgeEarned && (
                          <p className="text-green-600 mb-6">
                            You've earned recognition for your achievement! 🏆
                          </p>
                        )}
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                          <Button onClick={() => navigate(`/learn/courses/${courseId}`)}>
                            View Course Summary
                          </Button>
                          <Button variant="outline" onClick={() => navigate('/learn')}>
                            Explore More Courses
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a lesson to start learning</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
