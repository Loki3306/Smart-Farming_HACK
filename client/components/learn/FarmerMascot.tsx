import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FarmerMascotProps {
  mood?: 'happy' | 'teaching' | 'celebrating' | 'warning' | 'thinking';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showBubble?: boolean;
  onBubbleClose?: () => void;
}

/**
 * KisaanMitra (किसान मित्र) - The Farmer's Friend
 * A friendly Indian farmer mascot who guides users through their learning journey
 */
export const FarmerMascot: React.FC<FarmerMascotProps> = ({
  mood = 'happy',
  message,
  size = 'md',
  showBubble = true,
  onBubbleClose,
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const bubbleSizeClasses = {
    sm: 'text-xs max-w-[150px]',
    md: 'text-sm max-w-[200px]',
    lg: 'text-base max-w-[280px]',
  };

  // Different expressions based on mood
  const getMoodEmoji = () => {
    switch (mood) {
      case 'happy':
        return '😊';
      case 'teaching':
        return '🤔';
      case 'celebrating':
        return '🎉';
      case 'warning':
        return '⚠️';
      case 'thinking':
        return '💭';
      default:
        return '😊';
    }
  };

  // Animation variants for the mascot
  const mascotVariants = {
    idle: {
      y: [0, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
    celebrating: {
      scale: [1, 1.1, 1],
      rotate: [0, -5, 5, 0],
      transition: {
        duration: 0.5,
        repeat: 3,
      },
    },
    teaching: {
      x: [0, 3, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
      },
    },
    warning: {
      x: [0, -3, 3, 0],
      transition: {
        duration: 0.3,
        repeat: 2,
      },
    },
  };

  const getAnimation = () => {
    switch (mood) {
      case 'celebrating':
        return 'celebrating';
      case 'teaching':
        return 'teaching';
      case 'warning':
        return 'warning';
      default:
        return 'idle';
    }
  };

  return (
    <div className="relative inline-flex items-end">
      {/* Speech Bubble */}
      <AnimatePresence>
        {message && showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-48 sm:w-64`}
          >
            <div className="relative bg-card rounded-2xl shadow-lg border-2 border-green-200 p-4">
              <p className="text-foreground font-medium leading-relaxed text-sm">{message}</p>
              {onBubbleClose && (
                <button
                  onClick={onBubbleClose}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-muted hover:bg-muted rounded-full flex items-center justify-center text-xs"
                >
                  ×
                </button>
              )}
              {/* Speech bubble tail */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-r-2 border-b-2 border-green-200 transform rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Farmer Mascot SVG */}
      <motion.div
        variants={mascotVariants}
        animate={getAnimation()}
        className={`${sizeClasses[size]} relative`}
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg"
        >
          {/* Background circle */}
          <circle cx="60" cy="60" r="56" fill="#E8F5E9" stroke="#4CAF50" strokeWidth="2" />
          
          {/* Body - Kurta */}
          <path
            d="M35 85 C35 70, 45 65, 60 65 C75 65, 85 70, 85 85 L85 100 L35 100 Z"
            fill="#F5F5DC"
            stroke="#8B7355"
            strokeWidth="1.5"
          />
          
          {/* Kurta collar */}
          <path
            d="M50 65 L60 75 L70 65"
            fill="none"
            stroke="#8B7355"
            strokeWidth="1.5"
          />
          
          {/* Gamcha (towel) on shoulder */}
          <path
            d="M40 70 Q30 75, 28 85 Q26 95, 30 98"
            fill="none"
            stroke="#E65100"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M40 70 Q30 75, 28 85 Q26 95, 30 98"
            fill="none"
            stroke="#FF9800"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 4"
          />
          
          {/* Face */}
          <ellipse cx="60" cy="45" rx="22" ry="24" fill="#D7A574" />
          
          {/* Eyes */}
          <ellipse cx="52" cy="42" rx="3" ry="3.5" fill="#2D1B0E" />
          <ellipse cx="68" cy="42" rx="3" ry="3.5" fill="#2D1B0E" />
          
          {/* Eye shine */}
          <circle cx="53" cy="41" r="1" fill="white" />
          <circle cx="69" cy="41" r="1" fill="white" />
          
          {/* Eyebrows */}
          <path
            d="M48 36 Q52 34, 56 36"
            fill="none"
            stroke="#2D1B0E"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M64 36 Q68 34, 72 36"
            fill="none"
            stroke="#2D1B0E"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          
          {/* Nose */}
          <path
            d="M60 44 L58 50 Q60 52, 62 50 L60 44"
            fill="#C49A6C"
          />
          
          {/* Smile - changes with mood */}
          {mood === 'happy' || mood === 'celebrating' ? (
            <path
              d="M50 55 Q60 62, 70 55"
              fill="none"
              stroke="#2D1B0E"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : mood === 'teaching' || mood === 'thinking' ? (
            <ellipse cx="60" cy="56" rx="4" ry="3" fill="#2D1B0E" />
          ) : (
            <path
              d="M52 56 L68 56"
              fill="none"
              stroke="#2D1B0E"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
          
          {/* Mustache */}
          <path
            d="M48 52 Q52 54, 56 52 Q58 51, 60 52 Q62 51, 64 52 Q68 54, 72 52"
            fill="none"
            stroke="#2D1B0E"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Turban/Pagdi */}
          <path
            d="M38 35 Q38 18, 60 15 Q82 18, 82 35 Q82 28, 60 25 Q38 28, 38 35"
            fill="#FF5722"
          />
          <path
            d="M40 30 Q60 20, 80 30"
            fill="none"
            stroke="#E64A19"
            strokeWidth="3"
          />
          <path
            d="M42 35 Q60 28, 78 35"
            fill="none"
            stroke="#FF7043"
            strokeWidth="2"
          />
          
          {/* Turban top knot */}
          <ellipse cx="60" cy="18" rx="8" ry="5" fill="#FF5722" />
          
          {/* Ears */}
          <ellipse cx="36" cy="45" rx="4" ry="6" fill="#D7A574" />
          <ellipse cx="84" cy="45" rx="4" ry="6" fill="#D7A574" />
          
          {/* Hand waving (for celebrating mood) */}
          {mood === 'celebrating' && (
            <motion.g
              animate={{ rotate: [0, 20, 0, 20, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
              style={{ transformOrigin: '90px 70px' }}
            >
              <ellipse cx="95" cy="65" rx="6" ry="8" fill="#D7A574" />
              <circle cx="95" cy="58" r="3" fill="#D7A574" />
            </motion.g>
          )}
        </svg>
        
        {/* Mood indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 text-lg"
        >
          {getMoodEmoji()}
        </motion.div>
      </motion.div>
    </div>
  );
};

// Pre-built messages for different scenarios
export const MASCOT_MESSAGES = {
  welcome: "नमस्ते! मैं आपका किसान मित्र हूं। आइए साथ मिलकर खेती सीखें! 🌱",
  welcomeEn: "Namaste! I'm your KisaanMitra. Let's learn farming together! 🌱",
  levelComplete: "शाबाश! आपने यह चरण पूरा किया! अगले पर चलें! 🎉",
  levelCompleteEn: "Well done! You completed this level! Let's move to the next! 🎉",
  tipSoil: "क्या आप जानते हैं? मिट्टी की जांच हर 6 महीने में करें! 🌍",
  tipSoilEn: "Did you know? Test your soil every 6 months! 🌍",
  tipWater: "सुबह या शाम को पानी देना सबसे अच्छा है! 💧",
  tipWaterEn: "Watering in morning or evening is best! 💧",
  tipWeather: "बारिश से पहले खाद न डालें, बह जाएगी! 🌧️",
  tipWeatherEn: "Don't apply fertilizer before rain, it'll wash away! 🌧️",
  warningSkip: "रुकिए! पहले यह चरण पूरा करें, यह महत्वपूर्ण है! ⚠️",
  warningSkipEn: "Wait! Complete this step first, it's important! ⚠️",
  encouragement: "बहुत अच्छा! आप सही रास्ते पर हैं! 💪",
  encouragementEn: "Great! You're on the right track! 💪",
  firstLesson: "यहाँ से शुरू करें! यह आपकी स्मार्ट खेती की पहली सीढ़ी है! 🚀",
  firstLessonEn: "Start here! This is your first step to smart farming! 🚀",
};

export default FarmerMascot;
