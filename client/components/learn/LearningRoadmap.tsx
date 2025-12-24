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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FarmerMascot, MASCOT_MESSAGES } from './FarmerMascot';

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
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mascotMessage, setMascotMessage] = useState<string | null>(null);
  const [mascotMood, setMascotMood] = useState<'happy' | 'teaching' | 'celebrating' | 'warning'>('happy');
  const [showMascot, setShowMascot] = useState(true);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Calculate progress
  const completedCount = Object.values(lessonProgress).filter(s => s === 'completed').length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const currentLevelIndex = completedCount;

  // Find first incomplete lesson
  const firstIncompleteIndex = lessons.findIndex(
    lesson => lessonProgress[lesson.id] !== 'completed'
  );
  const currentLesson = firstIncompleteIndex >= 0 ? lessons[firstIncompleteIndex] : null;

  // Scroll-based animations
  const { scrollYProgress } = useScroll({ container: containerRef });
  const pathProgress = useTransform(scrollYProgress, [0, 1], [0, 100]);

  // Show welcome message on mount
  useEffect(() => {
    if (completedCount === 0 && isEnrolled) {
      setMascotMessage(MASCOT_MESSAGES.firstLessonEn);
      setMascotMood('teaching');
    } else if (completedCount > 0 && completedCount < lessons.length) {
      setMascotMessage(MASCOT_MESSAGES.encouragementEn);
      setMascotMood('happy');
    } else if (completedCount === lessons.length && lessons.length > 0) {
      setMascotMessage(MASCOT_MESSAGES.levelCompleteEn);
      setMascotMood('celebrating');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    const timer = setTimeout(() => setMascotMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [completedCount, isEnrolled, lessons.length]);

  // Handle lesson click
  const handleLessonClick = (lesson: Lesson, index: number) => {
    const isLocked = !isEnrolled && !lesson.is_preview;
    const isPreviousCompleted = index === 0 || lessonProgress[lessons[index - 1]?.id] === 'completed';
    const isCurrentOrPrevious = index <= firstIncompleteIndex || firstIncompleteIndex === -1;

    if (isLocked) {
      setMascotMessage("पहले कोर्स में enroll करें!");
      setMascotMood('warning');
      setTimeout(() => setMascotMessage(null), 3000);
      return;
    }

    if (!isPreviousCompleted && !lesson.is_preview && index !== 0) {
      setMascotMessage(MASCOT_MESSAGES.warningSkipEn);
      setMascotMood('warning');
      setTimeout(() => setMascotMessage(null), 3000);
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
    <div className="relative min-h-screen bg-gradient-to-b from-green-50 via-amber-50/30 to-sky-50 overflow-hidden">
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
          className="absolute top-10 right-10 w-24 h-24 bg-yellow-300 rounded-full blur-sm opacity-60"
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
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-200/50 to-transparent" />
      </div>

      {/* Header with progress */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-green-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/learn')}
                className="text-green-700 hover:bg-green-100"
              >
                ← वापस
              </Button>
              <div>
                <h1 className="text-lg font-bold text-green-900">{courseTitle}</h1>
                <p className="text-sm text-green-600">{completedCount}/{lessons.length} चरण पूरे</p>
              </div>
            </div>
            
            {/* XP Display */}
            <div className="flex items-center gap-2 bg-amber-100 rounded-full px-4 py-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-amber-700">{earnedXP} XP</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative">
            <Progress value={progressPercent} className="h-3 bg-green-100" />
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
              <span className="text-xs text-green-600 whitespace-nowrap">बैज:</span>
              {earnedBadges.map((badge) => (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 bg-white rounded-full px-2 py-1 shadow-sm border border-amber-200"
                >
                  <span className="text-lg">{badge.emoji}</span>
                  <span className="text-xs font-medium text-amber-700 whitespace-nowrap">{badge.nameEn}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mascot */}
      <div className="fixed bottom-6 right-6 z-30">
        <FarmerMascot
          mood={mascotMood}
          message={mascotMessage || undefined}
          size="lg"
          showBubble={!!mascotMessage}
          onBubbleClose={() => setMascotMessage(null)}
        />
      </div>

      {/* Roadmap Container */}
      <div ref={containerRef} className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Start marker */}
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-600 text-white rounded-full px-6 py-2 shadow-lg"
          >
            <span className="flex items-center gap-2">
              <Flame className="w-5 h-5" />
              आपकी स्मार्ट खेती यात्रा शुरू करें!
            </span>
          </motion.div>
        </div>

        {/* Roadmap path with nodes */}
        <div className="relative" style={{ minHeight: `${lessons.length * 150 + 100}px` }}>
          {/* SVG Path */}
          <svg
            className="absolute top-0 left-0 w-full pointer-events-none"
            viewBox={`0 0 500 ${lessons.length * 150 + 100}`}
            style={{ height: `${lessons.length * 150 + 100}px` }}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4CAF50" />
                <stop offset="50%" stopColor="#8BC34A" />
                <stop offset="100%" stopColor="#CDDC39" />
              </linearGradient>
              {/* Glow filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Background path */}
            <path
              d={generatePath(lessons.length)}
              fill="none"
              stroke="#E0E0E0"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="12 8"
            />
            {/* Progress path */}
            <motion.path
              d={generatePath(lessons.length)}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              filter="url(#glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progressPercent / 100 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>

          {/* Lesson Nodes */}
          <div className="relative">
            {lessons.map((lesson, index) => {
              const status = getLessonStatus(lesson, index);
              const isEven = index % 2 === 0;
              const theme = LEVEL_THEMES[index % LEVEL_THEMES.length];
              const yPosition = index * 150 + 30;
              const xOffset = isEven ? '25%' : '75%';

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.15, duration: 0.4 }}
                  className="absolute w-36 sm:w-40"
                  style={{
                    top: `${yPosition}px`,
                    left: xOffset,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <LessonNode
                    lesson={lesson}
                    index={index}
                    status={status}
                    theme={theme}
                    isActive={activeNodeIndex === index}
                    onClick={() => handleLessonClick(lesson, index)}
                    onHover={() => setActiveNodeIndex(index)}
                    onLeave={() => setActiveNodeIndex(null)}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

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
                  <p className="font-bold text-lg">बधाई हो! 🎉</p>
                  <p className="text-sm opacity-90">आपने कोर्स पूरा किया!</p>
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
            className="fixed bottom-24 left-4 right-4 z-20"
          >
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-4 border-2 border-green-500">
              <p className="text-center text-green-800 font-medium mb-3">
                इस यात्रा को शुरू करने के लिए enroll करें!
              </p>
              <Button
                onClick={onEnroll}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-lg py-6"
              >
                <Play className="w-5 h-5 mr-2" />
                अभी शुरू करें - मुफ्त!
              </Button>
            </div>
          </motion.div>
        )}
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
      className={`relative flex flex-col items-center transition-all duration-300 ${
        isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
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
        className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isCompleted
            ? 'bg-gradient-to-br from-green-400 to-green-600 ring-4 ring-green-200'
            : isCurrent
            ? `bg-gradient-to-br ${theme.color} ring-4 ring-offset-2 ring-green-400 animate-pulse`
            : 'bg-gray-200 ring-2 ring-gray-300'
        }`}
      >
        {isCompleted ? (
          <CheckCircle className="w-10 h-10 text-white" />
        ) : isLocked ? (
          <Lock className="w-8 h-8 text-gray-400" />
        ) : (
          <span className="text-4xl">{theme.emoji}</span>
        )}

        {/* Level number badge */}
        <div
          className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
            isCompleted
              ? 'bg-amber-400 text-amber-900'
              : isCurrent
              ? 'bg-green-500 text-white'
              : 'bg-gray-300 text-gray-600'
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
        <p className={`font-semibold text-sm ${isCompleted ? 'text-green-700' : isCurrent ? 'text-green-600' : 'text-gray-500'}`}>
          {theme.nameEn}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{lesson.title}</p>
        {lesson.duration && (
          <p className="text-xs text-gray-400 mt-1">⏱️ {lesson.duration}</p>
        )}
      </div>

      {/* Hover card */}
      <AnimatePresence>
        {isActive && !isLocked && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute top-full mt-2 bg-white rounded-xl shadow-xl p-3 w-48 z-10 border border-green-200"
          >
            <p className="font-medium text-green-800 text-sm mb-1">{lesson.title}</p>
            {lesson.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{lesson.description}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {lesson.content_type === 'video' ? '🎥 वीडियो' : lesson.content_type === 'quiz' ? '📝 क्विज़' : '📖 पाठ'}
              </span>
              <ChevronRight className="w-4 h-4 text-green-500" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Generate SVG path for roadmap (using pixel values for 500px width container)
const generatePath = (nodeCount: number): string => {
  if (nodeCount === 0) return '';
  
  // Assuming container width of ~500px, we'll use proportional values
  const width = 500;
  const leftX = width * 0.25;  // 25% from left
  const rightX = width * 0.75; // 75% from left
  
  let d = '';
  
  for (let i = 0; i < nodeCount; i++) {
    const isEven = i % 2 === 0;
    const currentX = isEven ? leftX : rightX;
    const currentY = i * 150 + 50;
    
    if (i === 0) {
      d = `M ${currentX} ${currentY}`;
    }
    
    if (i < nodeCount - 1) {
      const nextIsEven = (i + 1) % 2 === 0;
      const nextX = nextIsEven ? leftX : rightX;
      const nextY = (i + 1) * 150 + 50;
      const controlY = currentY + 75;
      
      // Create smooth S-curve
      d += ` C ${currentX} ${controlY}, ${nextX} ${controlY}, ${nextX} ${nextY}`;
    }
  }
  
  return d;
};

export default LearningRoadmap;
