import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  CheckCircle,
  Star,
  Play,
  Trophy,
  Zap,
  Flame,
  Award,
  ChevronRight,
  Globe,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { KisaanMitra, MascotContext } from './KisaanMitra';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';

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

interface LearningRoadmapProps {
  courseId: string;
  courseTitle: string;
  lessons: Lesson[];
  lessonProgress: Record<string, string>;
  isEnrolled: boolean;
  onStartLesson: (lessonId: string) => void;
  onEnroll: () => void;
  totalXP?: number;
  earnedXP?: number;
  courseDescription?: string;
  instructor?: string;
  duration?: string;
  level?: string;
}

// Level themes mapping
const LEVEL_THEMES = [
  { emoji: '🌱', name: 'बीज बोना', nameEn: 'Seed Sowing', color: 'from-green-400 to-green-600', bgColor: 'bg-green-50' },
  { emoji: '💧', name: 'सिंचाई', nameEn: 'Irrigation', color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-50' },
  { emoji: '🌦️', name: 'मौसम', nameEn: 'Weather', color: 'from-sky-400 to-indigo-500', bgColor: 'bg-sky-50' },
  { emoji: '🌾', name: 'फसल विकास', nameEn: 'Crop Growth', color: 'from-yellow-400 to-amber-500', bgColor: 'bg-amber-50' },
  { emoji: '🧪', name: 'खाद', nameEn: 'Fertilization', color: 'from-purple-400 to-purple-600', bgColor: 'bg-purple-50' },
  { emoji: '🤖', name: 'स्मार्ट खेती', nameEn: 'Smart Farming', color: 'from-emerald-400 to-teal-600', bgColor: 'bg-teal-50' },
  { emoji: '🏆', name: 'मास्टर', nameEn: 'Master', color: 'from-orange-400 to-red-500', bgColor: 'bg-orange-50' },
];

// Badges that can be earned
const BADGES = [
  { id: 'first_step', name: 'पहला कदम', nameEn: 'First Step', emoji: '👣', requirement: 1 },
  { id: 'water_wise', name: 'जल विशेषज्ञ', nameEn: 'Water Wise', emoji: '💧', requirement: 2 },
  { id: 'soil_expert', name: 'मिट्टी विशेषज्ञ', nameEn: 'Soil Expert', emoji: '🌍', requirement: 3 },
  { id: 'weather_watcher', name: 'मौसम पारखी', nameEn: 'Weather Watcher', emoji: '🌦️', requirement: 4 },
  { id: 'smart_farmer', name: 'स्मार्ट किसान', nameEn: 'Smart Farmer', emoji: '🌟', requirement: 5 },
  { id: 'master_farmer', name: 'मास्टर किसान', nameEn: 'Master Farmer', emoji: '🏆', requirement: 'all' },
];

export const LearningRoadmap: React.FC<LearningRoadmapProps> = ({
  courseId,
  courseTitle,
  lessons,
  lessonProgress,
  isEnrolled,
  onStartLesson,
  onEnroll,
  totalXP = 100,
  earnedXP = 0,
  courseDescription,
  instructor,
  duration,
  level,
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage } = useLanguage();
  const isHindi = language === 'hi';

  // Handle window resize for mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dynamic coordinates based on screen size
  const LEFT_X = isMobile ? 40 : 30;
  const RIGHT_X = isMobile ? 60 : 70;
  const NODE_CENTER_OFFSET = 40;

  // Debug: Log language changes
  useEffect(() => {
    console.log('[LearningRoadmap] Language changed to:', language, 'isHindi:', isHindi);
  }, [language, isHindi]);

  const [mascotContext, setMascotContext] = useState<MascotContext | undefined>(undefined);
  const [mascotMessage, setMascotMessage] = useState<string | undefined>(undefined);
  const [showMascot, setShowMascot] = useState(true);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Handle language toggle
  const handleLanguageToggle = () => {
    const newLanguage = isHindi ? 'en' : 'hi';
    setLanguage(newLanguage);
  };

  // Calculate progress
  const completedCount = Object.values(lessonProgress).filter(s => s === 'completed').length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const currentLevelIndex = completedCount;

  // Find first incomplete lesson
  const firstIncompleteIndex = lessons.findIndex(
    lesson => lessonProgress[lesson.id] !== 'completed'
  );
  const currentLesson = firstIncompleteIndex >= 0 ? lessons[firstIncompleteIndex] : null;

  // Calculate path progress based on actual completed lessons
  // The path should fill up to the first incomplete lesson (or 100% if all complete)
  const pathProgressValue = lessons.length === 0 ? 0 :
    firstIncompleteIndex === -1 ? 1 : // All lessons completed
      firstIncompleteIndex === 0 ? 0 : // No lessons completed
        firstIncompleteIndex / lessons.length; // Fill up to first incomplete lesson

  // Scroll-based animations
  const { scrollYProgress } = useScroll({ container: containerRef });
  const pathProgress = useTransform(scrollYProgress, [0, 1], [0, 100]);

  // Show welcome message on mount
  useEffect(() => {
    if (completedCount === 0 && isEnrolled) {
      setMascotContext('new_level');
    } else if (completedCount > 0 && completedCount < lessons.length) {
      setMascotContext('during_lesson');
    } else if (completedCount === lessons.length && lessons.length > 0) {
      setMascotContext('course_complete');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    const timer = setTimeout(() => {
      setMascotContext(undefined);
      setMascotMessage(undefined);
    }, 6000);
    return () => clearTimeout(timer);
  }, [completedCount, isEnrolled, lessons.length]);

  // Handle lesson click
  const handleLessonClick = (lesson: Lesson, index: number) => {
    const isLocked = !isEnrolled && !lesson.is_preview;
    const isPreviousCompleted = index === 0 || lessonProgress[lessons[index - 1]?.id] === 'completed';
    const isCurrentOrPrevious = index <= firstIncompleteIndex || firstIncompleteIndex === -1;

    if (isLocked) {
      setMascotContext('locked_level');
      setMascotMessage(undefined);
      setTimeout(() => setMascotContext(undefined), 4000);
      return;
    }

    if (!isPreviousCompleted && !lesson.is_preview && index !== 0) {
      setMascotContext('locked_level');
      setMascotMessage(undefined);
      setTimeout(() => setMascotContext(undefined), 4000);
      return;
    }

    onStartLesson(lesson.id);
  };

  // Get lesson status
  const getLessonStatus = (lesson: Lesson, index: number) => {
    if (lessonProgress[lesson.id] === 'completed') return 'completed';
    if (!isEnrolled && !lesson.is_preview) return 'locked';
    if (index === 0) return 'current';
    if (lessonProgress[lessons[index - 1]?.id] === 'completed') return 'current';
    return 'locked';
  };

  // Get earned badges
  const earnedBadges = BADGES.filter(badge => {
    if (badge.requirement === 'all') return completedCount === lessons.length && lessons.length > 0;
    return completedCount >= (badge.requirement as number);
  });

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-green-50 via-amber-50/30 to-sky-50 dark:from-background dark:via-background dark:to-background overflow-hidden">
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  rotate: 0,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: window.innerHeight + 20,
                  rotate: Math.random() * 720 - 360,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  ease: 'linear',
                  delay: Math.random() * 0.5,
                }}
                className="absolute text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                }}
              >
                {['🌾', '🌻', '⭐', '🎉', '✨', '🌱', '💚'][Math.floor(Math.random() * 7)]}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Background farm elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Sun */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-10 right-10 w-24 h-24 bg-yellow-300 dark:bg-yellow-500 rounded-full blur-sm opacity-60 dark:opacity-40"
        />
        {/* Clouds */}
        <motion.div
          animate={{ x: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 left-20 text-6xl opacity-30"
        >
          ☁️
        </motion.div>
        <motion.div
          animate={{ x: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute top-32 right-40 text-4xl opacity-20"
        >
          ☁️
        </motion.div>
        {/* Ground/Field pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-200/50 to-transparent dark:from-green-900/30 dark:to-transparent" />
      </div>

      {/* Header with progress */}
      <div className="sticky top-0 z-20 bg-card/80 dark:bg-card/80 backdrop-blur-md border-b border-green-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-2 md:py-4">

          {/* Mobile Header Layout (Stacked) */}
          <div className="lg:hidden flex flex-col gap-2">
            {/* Top Row: Back, Title (Truncated), Controls */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/learn')}
                className="h-8 w-8 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 shrink-0"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </Button>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleLanguageToggle}
                  className="flex items-center justify-center w-8 h-8 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full transition-colors border border-blue-200 dark:border-blue-700"
                  title={isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
                  aria-label={isHindi ? 'Switch to English' : 'Switch to Hindi'}
                >
                  <Globe className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-full px-2 py-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold text-xs text-amber-700 dark:text-amber-300">{earnedXP} XP</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Title & Progress Stats */}
            <div className="flex flex-col gap-1 px-1">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-lg font-bold text-green-900 dark:text-green-100 leading-tight line-clamp-1">{courseTitle}</h1>
                <span className="text-xs font-medium text-green-600 dark:text-green-400 whitespace-nowrap shrink-0">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedCount}/{lessons.length} {isHindi ? 'चरण' : 'steps'}</span>
                {level && <span className="capitalize">{level}</span>}
              </div>
            </div>
          </div>

          {/* Desktop Header Layout (Original) */}
          <div className="hidden lg:flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/learn')}
                className="text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
              >
                {isHindi ? '← वापस' : '← Back'}
              </Button>
              <div>
                <h1 className="text-lg font-bold text-green-900 dark:text-green-100">{courseTitle}</h1>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {completedCount}/{lessons.length} {isHindi ? 'चरण पूरे' : 'steps complete'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Toggle Button */}
              <button
                onClick={handleLanguageToggle}
                className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full px-3 py-2 transition-colors border border-blue-200 dark:border-blue-700"
                title={isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{isHindi ? 'EN' : 'हिं'}</span>
              </button>

              {/* XP Display */}
              <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/40 rounded-full px-4 py-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-amber-700 dark:text-amber-300">{earnedXP} XP</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative">
            <Progress value={progressPercent} className="h-3 bg-green-100 dark:bg-green-900/50" />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 text-lg"
              style={{ left: `${Math.min(progressPercent, 95)}%` }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🚜
            </motion.div>
          </div>

          {/* Badges row */}
          {earnedBadges.length > 0 && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
              <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">{isHindi ? 'बैज:' : 'Badges:'}</span>
              {earnedBadges.map((badge) => (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 bg-card rounded-full px-2 py-1 shadow-sm border border-amber-200 dark:border-amber-700"
                >
                  <span className="text-lg">{badge.emoji}</span>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300 whitespace-nowrap">
                    {isHindi ? badge.name : badge.nameEn}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Sidebar - Course Info */}
          <div className="lg:col-span-3 space-y-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Course Overview Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-green-100 dark:border-green-800"
              >
                <h3 className="font-bold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {isHindi ? 'कोर्स की जानकारी' : 'Course Info'}
                </h3>

                {courseDescription && (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground line-clamp-4">{courseDescription}</p>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  {level && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{isHindi ? 'स्तर' : 'Level'}:</span>
                      <span className="font-medium text-green-700 dark:text-green-400 capitalize">{level}</span>
                    </div>
                  )}

                  {duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{isHindi ? 'अवधि' : 'Duration'}:</span>
                      <span className="font-medium">{duration}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isHindi ? 'पाठ' : 'Lessons'}:</span>
                    <span className="font-medium">{lessons.length}</span>
                  </div>

                  {instructor && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{isHindi ? 'शिक्षक' : 'Instructor'}:</span>
                      <span className="font-medium">{instructor}</span>
                    </div>
                  )}
                </div>

                {!isEnrolled && (
                  <Button
                    onClick={onEnroll}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  >
                    {isHindi ? 'कोर्स में शामिल हों' : 'Enroll Now'}
                  </Button>
                )}
              </motion.div>

              {/* Learning Objectives */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-blue-100 dark:border-blue-800"
              >
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  {isHindi ? 'आप क्या सीखेंगे' : 'What You\'ll Learn'}
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>{isHindi ? 'व्यावहारिक खेती के तरीके' : 'Practical farming techniques'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>{isHindi ? 'आधुनिक कृषि उपकरण' : 'Modern agricultural tools'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>{isHindi ? 'फसल प्रबंधन' : 'Crop management strategies'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>{isHindi ? 'मौसम के अनुसार योजना' : 'Weather-based planning'}</span>
                  </li>
                </ul>
              </motion.div>

              {/* Farmer Mascot */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <KisaanMitra
                  context={mascotContext}
                  message={mascotMessage}
                  position="inline"
                  size="md"
                  showHelpMenu
                  onDismiss={() => {
                    setMascotContext(undefined);
                    setMascotMessage(undefined);
                  }}
                  enableIdleAnimations
                  lessonContext={{
                    lessonTitle: currentLesson?.title,
                    lessonNumber: firstIncompleteIndex >= 0 ? firstIncompleteIndex + 1 : lessons.length,
                    totalLessons: lessons.length,
                    topic: courseTitle,
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* Center - Roadmap */}
          <div ref={containerRef} className="lg:col-span-6">
            {/* Start marker */}
            <div className="flex justify-center mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-600 text-white rounded-full px-6 py-2 shadow-lg"
              >
                <span className="flex items-center gap-2">
                  <Flame className="w-5 h-5" />
                  {isHindi ? 'आपकी स्मार्ट खेती यात्रा शुरू करें!' : 'Start Your Smart Farming Journey!'}
                </span>
              </motion.div>
            </div>

            {/* Roadmap path with nodes */}
            {lessons && lessons.length > 0 && (
              <div className="relative" style={{ minHeight: `${lessons.length * 180 + 100}px` }}>

                {/* SVG Path */}
                <svg
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  viewBox={`0 0 100 ${lessons.length * 180 + 100}`}
                  preserveAspectRatio="none"
                  style={{ height: `${lessons.length * 180 + 100}px` }}
                >
                  <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4CAF50" />
                      <stop offset="50%" stopColor="#8BC34A" />
                      <stop offset="100%" stopColor="#CDDC39" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="0.3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                    d={generatePath(lessons?.length || 0, LEFT_X, RIGHT_X)}
                    fill="none"
                    stroke="#D1D5DB"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeDasharray="2 1.5"
                  />
                  {generateProgressPath(lessons || [], lessonProgress || {}, LEFT_X, RIGHT_X) && (
                    <motion.path
                      d={generateProgressPath(lessons || [], lessonProgress || {}, LEFT_X, RIGHT_X)}
                      fill="none"
                      stroke="url(#pathGradient)"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      filter="url(#glow)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </svg>

                {/* Lesson Nodes */}
                <div className="relative">
                  {lessons.map((lesson, index) => {
                    const status = getLessonStatus(lesson, index);
                    const isEven = index % 2 === 0;
                    const theme = LEVEL_THEMES[index % LEVEL_THEMES.length];
                    const yPosition = index * 180 + 50;
                    const xPercent = isEven ? LEFT_X : RIGHT_X;

                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        className="absolute w-40 sm:w-44"
                        style={{
                          top: `${yPosition}px`,
                          left: `${xPercent}%`,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <LessonNode
                          lesson={lesson}
                          index={index}
                          status={status}
                          theme={theme}
                          isActive={activeNodeIndex === index}
                          isHindi={isHindi}
                          onClick={() => handleLessonClick(lesson, index)}
                          onHover={() => setActiveNodeIndex(index)}
                          onLeave={() => setActiveNodeIndex(null)}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Finish marker */}
            {progressPercent === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center mt-8"
              >
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl px-8 py-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8" />
                    <div>
                      <p className="font-bold text-lg">{isHindi ? 'बधाई हो!' : 'Congratulations!'} 🎉</p>
                      <p className="text-sm opacity-90">{isHindi ? 'आपने कोर्स पूरा किया!' : 'You completed the course!'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Enroll CTA if not enrolled */}
            {!isEnrolled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-8 left-4 right-4 z-20"
              >
                <div className="max-w-md mx-auto bg-card rounded-2xl shadow-xl p-4 border-2 border-green-500">
                  <p className="text-center text-green-800 dark:text-green-300 font-medium mb-3">
                    {isHindi ? 'इस यात्रा को शुरू करने के लिए enroll करें!' : 'Enroll to start this learning journey!'}
                  </p>
                  <Button
                    onClick={onEnroll}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-lg py-6"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {isHindi ? 'अभी शुरू करें - मुफ्त!' : 'Start Now - Free!'}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Sidebar - Stats & Progress */}
          <div className="lg:col-span-3 space-y-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Progress Stats Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-purple-100 dark:border-purple-800"
              >
                <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  {isHindi ? 'आपकी प्रगति' : 'Your Progress'}
                </h3>

                <div className="space-y-3">
                  {/* Completion Stats */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{isHindi ? 'पूर्ण' : 'Completed'}</span>
                      <span className="text-sm font-bold text-green-700 dark:text-green-400">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {completedCount} / {lessons.length} {isHindi ? 'पाठ' : 'lessons'}
                    </p>
                  </div>

                  {/* XP Stats */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-600" />
                        <span className="text-xs text-muted-foreground">{isHindi ? 'अनुभव अंक' : 'Experience'}</span>
                      </div>
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{earnedXP} XP</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalXP - earnedXP} XP {isHindi ? 'शेष' : 'remaining'}
                    </p>
                  </div>

                  {/* Current Level */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-muted-foreground">{isHindi ? 'वर्तमान स्तर' : 'Current Level'}</span>
                    </div>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                      {LEVEL_THEMES[Math.min(currentLevelIndex, LEVEL_THEMES.length - 1)].emoji}{' '}
                      {isHindi
                        ? LEVEL_THEMES[Math.min(currentLevelIndex, LEVEL_THEMES.length - 1)].name
                        : LEVEL_THEMES[Math.min(currentLevelIndex, LEVEL_THEMES.length - 1)].nameEn}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Achievements Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-amber-100 dark:border-amber-800"
              >
                <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  {isHindi ? 'उपलब्धियां' : 'Achievements'}
                </h3>

                <div className="space-y-2">
                  {earnedBadges.length > 0 ? (
                    earnedBadges.map((badge) => (
                      <motion.div
                        key={badge.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2"
                      >
                        <span className="text-2xl">{badge.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            {isHindi ? badge.name : badge.nameEn}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isHindi ? 'अर्जित' : 'Earned'}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {isHindi ? 'पाठ पूरे करें और बैज अर्जित करें!' : 'Complete lessons to earn badges!'}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Next Milestone */}
              {currentLesson && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-4 shadow-lg"
                >
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    {isHindi ? 'अगला पाठ' : 'Next Up'}
                  </h3>
                  <p className="text-sm opacity-90 mb-3">{currentLesson.title}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onStartLesson(currentLesson.id)}
                    className="w-full"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {isHindi ? 'अभी शुरू करें' : 'Start Now'}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Lesson Node Component
interface LessonNodeProps {
  lesson: Lesson;
  index: number;
  status: 'completed' | 'current' | 'locked';
  theme: typeof LEVEL_THEMES[0];
  isActive: boolean;
  isHindi: boolean;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
}

const LessonNode: React.FC<LessonNodeProps> = ({
  lesson,
  index,
  status,
  theme,
  isActive,
  isHindi,
  onClick,
  onHover,
  onLeave,
}) => {
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';
  const isLocked = status === 'locked';

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      whileHover={{ scale: isLocked ? 1 : 1.05 }}
      whileTap={{ scale: isLocked ? 1 : 0.95 }}
      className={`relative flex flex-col items-center transition-all duration-300 ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
    >
      {/* Glow effect for current */}
      {isCurrent && (
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-green-400 rounded-full blur-xl"
        />
      )}

      {/* Main node */}
      <div
        className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isCompleted
          ? 'bg-gradient-to-br from-green-400 to-green-600 ring-4 ring-green-200'
          : isCurrent
            ? `bg-gradient-to-br ${theme.color} ring-4 ring-offset-2 ring-green-400 animate-pulse`
            : 'bg-muted ring-2 ring-gray-300'
          }`}
      >
        {isCompleted ? (
          <CheckCircle className="w-10 h-10 text-white" />
        ) : isLocked ? (
          <Lock className="w-8 h-8 text-muted-foreground" />
        ) : (
          <span className="text-4xl">{theme.emoji}</span>
        )}

        {/* Level number badge */}
        <div
          className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isCompleted
            ? 'bg-amber-400 text-amber-900'
            : isCurrent
              ? 'bg-green-500 text-white'
              : 'bg-muted text-muted-foreground'
            }`}
        >
          {index + 1}
        </div>

        {/* Star for completed */}
        {isCompleted && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2"
          >
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          </motion.div>
        )}
      </div>

      {/* Label */}
      <div className={`mt-3 text-center ${isLocked ? 'opacity-50' : ''}`}>
        <p className={`font-semibold text-sm ${isCompleted ? 'text-green-700' : isCurrent ? 'text-green-600' : 'text-muted-foreground'}`}>
          {isHindi ? theme.name : theme.nameEn}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{lesson.title}</p>
        {lesson.duration && (
          <p className="text-xs text-muted-foreground mt-1">⏱️ {lesson.duration}</p>
        )}
      </div>

      {/* Hover card */}
      <AnimatePresence>
        {isActive && !isLocked && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute top-full mt-2 bg-card rounded-xl shadow-xl p-3 w-48 z-10 border border-green-200"
          >
            <p className="font-medium text-green-800 text-sm mb-1">{lesson.title}</p>
            {lesson.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{lesson.description}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {lesson.content_type === 'video'
                  ? (isHindi ? '🎥 वीडियो' : '🎥 Video')
                  : lesson.content_type === 'quiz'
                    ? (isHindi ? '📝 प्रश्नोत्तरी' : '📝 Quiz')
                    : (isHindi ? '📖 पाठ' : '📖 Lesson')}
              </span>
              <ChevronRight className="w-4 h-4 text-green-500" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ViewBox is 100 units wide, so X=30 = 30%, X=70 = 70% (matches CSS left positioning)
const LEFT_X = 30;
const RIGHT_X = 70;
const NODE_CENTER_OFFSET = 40; // Half the node height to hit center

// Generate SVG path for roadmap - connects through center of each node
const generatePath = (nodeCount: number, leftX: number, rightX: number): string => {
  if (nodeCount === 0) return '';

  let d = '';

  for (let i = 0; i < nodeCount; i++) {
    const isEven = i % 2 === 0;
    const currentX = isEven ? leftX : rightX;
    const currentY = i * 180 + 50 + NODE_CENTER_OFFSET;

    if (i === 0) {
      d = `M ${currentX} ${currentY}`;
    }

    if (i < nodeCount - 1) {
      const nextIsEven = (i + 1) % 2 === 0;
      const nextX = nextIsEven ? leftX : rightX;
      const nextY = (i + 1) * 180 + 50 + NODE_CENTER_OFFSET;
      const midY = (currentY + nextY) / 2;

      // Smooth S-curve between nodes
      d += ` C ${currentX} ${midY}, ${nextX} ${midY}, ${nextX} ${nextY}`;
    }
  }

  return d;
};

// Generate progress path - only draws up to last completed node
const generateProgressPath = (lessons: Lesson[], lessonProgress: Record<string, string>, leftX: number, rightX: number): string => {
  if (lessons.length === 0) return '';

  // Find the last completed lesson index
  let lastCompletedIndex = -1;
  for (let i = 0; i < lessons.length; i++) {
    if (lessonProgress[lessons[i].id] === 'completed') {
      lastCompletedIndex = i;
    } else {
      break;
    }
  }

  if (lastCompletedIndex === -1) return '';

  let d = '';

  for (let i = 0; i <= lastCompletedIndex; i++) {
    const isEven = i % 2 === 0;
    const currentX = isEven ? leftX : rightX;
    const currentY = i * 180 + 50 + NODE_CENTER_OFFSET;

    if (i === 0) {
      d = `M ${currentX} ${currentY}`;
    }

    if (i < lastCompletedIndex) {
      const nextIsEven = (i + 1) % 2 === 0;
      const nextX = nextIsEven ? leftX : rightX;
      const nextY = (i + 1) * 180 + 50 + NODE_CENTER_OFFSET;
      const midY = (currentY + nextY) / 2;

      d += ` C ${currentX} ${midY}, ${nextX} ${midY}, ${nextX} ${nextY}`;
    }
  }

  return d;
};

export default LearningRoadmap;
