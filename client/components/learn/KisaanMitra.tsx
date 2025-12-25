import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { HelpCircle, X, MessageCircle, Lightbulb, ChevronRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';

// ============================================
// TYPES & INTERFACES
// ============================================

export type MascotState = 
  | 'idle' 
  | 'speaking' 
  | 'pointing' 
  | 'celebrating' 
  | 'thinking' 
  | 'waving' 
  | 'teaching'
  | 'warning'
  | 'sleeping';

export type MascotContext = 
  | 'welcome'
  | 'new_level'
  | 'during_lesson'
  | 'quiz_correct'
  | 'quiz_wrong'
  | 'level_complete'
  | 'course_complete'
  | 'idle_nudge'
  | 'locked_level'
  | 'tip'
  | 'custom';

interface DialogueItem {
  hindi: string;
  english: string;
  duration?: number;
}

interface KisaanMitraProps {
  /** Current animation state */
  state?: MascotState;
  /** Context for automatic behavior */
  context?: MascotContext;
  /** Custom message to display */
  message?: string;
  /** Whether mascot is visible */
  isVisible?: boolean;
  /** Position on screen */
  position?: 'bottom-left' | 'bottom-right' | 'inline' | 'roadmap-right';
  /** Size of the mascot */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Callback when mascot is clicked */
  onClick?: () => void;
  /** Callback when speech bubble is dismissed */
  onDismiss?: () => void;
  /** Show help menu on click */
  showHelpMenu?: boolean;
  /** Enable idle animations */
  enableIdleAnimations?: boolean;
  /** Custom dialogue content */
  customDialogue?: DialogueItem;
  /** Current lesson/level for context */
  lessonContext?: {
    lessonTitle?: string;
    lessonNumber?: number;
    totalLessons?: number;
    topic?: string;
  };
}

// ============================================
// DIALOGUE CONTENT DATABASE
// ============================================

export const KISAAN_DIALOGUES: Record<MascotContext, DialogueItem[]> = {
  welcome: [
    { hindi: "नमस्ते! मैं किसान मित्र हूं। आज हम मिलकर खेती सीखेंगे! 🌱", english: "Namaste! I'm KisaanMitra. Let's learn farming together today! 🌱" },
    { hindi: "स्वागत है आपका! चलिए स्मार्ट खेती का सफर शुरू करते हैं। 🚜", english: "Welcome! Let's begin your smart farming journey. 🚜" },
  ],
  new_level: [
    { hindi: "नया पाठ! तैयार हैं? यह जानकारी आपकी फसल को बेहतर बनाएगी।", english: "New lesson! Ready? This knowledge will improve your crops." },
    { hindi: "चलिए कुछ नया सीखते हैं! यह बहुत उपयोगी होगा। 📚", english: "Let's learn something new! This will be very useful. 📚" },
  ],
  during_lesson: [
    { hindi: "ध्यान से पढ़ें, यह महत्वपूर्ण जानकारी है! ✍️", english: "Read carefully, this is important information! ✍️" },
    { hindi: "क्या आप जानते थे? यह तरीका पानी की 40% बचत करता है!", english: "Did you know? This method saves 40% water!" },
  ],
  quiz_correct: [
    { hindi: "शाबाश! बिल्कुल सही जवाब! 🎉", english: "Excellent! That's the correct answer! 🎉" },
    { hindi: "वाह! आप तो एक्सपर्ट बन रहे हैं! ⭐", english: "Wow! You're becoming an expert! ⭐" },
    { hindi: "बहुत बढ़िया! आगे बढ़ते रहें! 💪", english: "Very good! Keep going! 💪" },
  ],
  quiz_wrong: [
    { hindi: "कोई बात नहीं, गलती से ही सीखते हैं। फिर से कोशिश करें! 🤔", english: "No problem, we learn from mistakes. Try again! 🤔" },
    { hindi: "अरे! थोड़ा सोचिए... सही जवाब के करीब हैं आप।", english: "Hmm! Think a bit more... You're close to the right answer." },
  ],
  level_complete: [
    { hindi: "बधाई हो! 🎊 आपने यह चरण पूरा कर लिया! अगला स्टेज तैयार है।", english: "Congratulations! 🎊 You completed this level! Next stage is ready." },
    { hindi: "शानदार! एक और कदम स्मार्ट किसान बनने की ओर! 🏆", english: "Fantastic! One more step towards becoming a smart farmer! 🏆" },
  ],
  course_complete: [
    { hindi: "🏆 अद्भुत! आपने पूरा कोर्स पूरा किया! आप अब एक स्मार्ट किसान हैं!", english: "🏆 Amazing! You completed the entire course! You're now a smart farmer!" },
  ],
  idle_nudge: [
    { hindi: "अरे, कहाँ गए? चलिए आगे बढ़ते हैं! 👋", english: "Hey, where did you go? Let's continue! 👋" },
    { hindi: "थक गए क्या? थोड़ा और पढ़ लें, फायदा होगा!", english: "Tired? Read a bit more, it'll help!" },
  ],
  locked_level: [
    { hindi: "रुकिए! पहले पिछला पाठ पूरा करें। क्रम से सीखना ज़रूरी है। 🔒", english: "Wait! Complete the previous lesson first. Learning in order is important. 🔒" },
  ],
  tip: [
    { hindi: "💡 सुझाव: सुबह या शाम को पानी देना सबसे अच्छा है!", english: "💡 Tip: Watering in morning or evening is best!" },
    { hindi: "💡 सुझाव: मिट्टी की जांच हर 6 महीने में करें!", english: "💡 Tip: Test your soil every 6 months!" },
    { hindi: "💡 सुझाव: बारिश से पहले खाद न डालें, बह जाएगी!", english: "💡 Tip: Don't apply fertilizer before rain!" },
  ],
  custom: [],
};

// ============================================
// MAIN COMPONENT
// ============================================

export const KisaanMitra: React.FC<KisaanMitraProps> = ({
  state = 'idle',
  context,
  message,
  isVisible = true,
  position = 'bottom-left',
  size = 'lg',
  onClick,
  onDismiss,
  showHelpMenu = false,
  enableIdleAnimations = true,
  customDialogue,
  lessonContext,
}) => {
  // Use language from context
  const { language } = useLanguage();
  const { setLanguage } = useSettings();
  const currentLanguage = language === 'hi' ? 'hindi' : 'english';
  
  const [currentState, setCurrentState] = useState<MascotState>(state);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [fullText, setFullText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isMouthOpen, setIsMouthOpen] = useState(false);
  
  const bodyControls = useAnimation();
  const armControls = useAnimation();
  const headControls = useAnimation();

  // Size configurations
  const sizeConfig = {
    sm: { width: 80, height: 120, bubbleWidth: 180 },
    md: { width: 100, height: 150, bubbleWidth: 220 },
    lg: { width: 130, height: 195, bubbleWidth: 280 },
    xl: { width: 160, height: 240, bubbleWidth: 320 },
  };

  const config = sizeConfig[size];

  // Position classes
  const positionClasses = {
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'inline': 'relative',
    'roadmap-right': 'fixed top-1/2 right-4 -translate-y-1/2 z-50',
  };

  // ============================================
  // ANIMATION SEQUENCES
  // ============================================

  const runIdleAnimation = useCallback(async () => {
    if (!enableIdleAnimations) return;
    
    // Breathing animation
    bodyControls.start({
      scaleY: [1, 1.015, 1],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    });

    // Subtle arm sway for natural idle stance
    armControls.start({
      rotate: [0, 2, 0, -2, 0],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    });
  }, [bodyControls, armControls, enableIdleAnimations]);

  const runSpeakingAnimation = useCallback(async () => {
    // Mouth movement while speaking
    const mouthInterval = setInterval(() => {
      setIsMouthOpen(prev => !prev);
    }, 150);

    // Head slight nod while speaking
    headControls.start({
      rotate: [0, 2, -2, 0],
      transition: { duration: 0.8, repeat: Infinity },
    });

    return () => {
      clearInterval(mouthInterval);
      setIsMouthOpen(false);
    };
  }, [headControls]);

  const runCelebratingAnimation = useCallback(async () => {
    // Smooth arm wave with natural easing
    armControls.start({
      rotate: [0, -20, 15, -15, 10, -5, 0],
      transition: { 
        duration: 1.2, 
        repeat: 2,
        ease: [0.25, 0.1, 0.25, 1], // Custom cubic bezier for natural movement
      },
    });

    // Body bounce with slight delay
    bodyControls.start({
      y: [0, -8, 0, -4, 0],
      scale: [1, 1.03, 1, 1.02, 1],
      transition: { 
        duration: 0.8, 
        repeat: 2,
        ease: 'easeInOut',
      },
    });
  }, [armControls, bodyControls]);

  const runPointingAnimation = useCallback(async () => {
    armControls.start({
      rotate: -35,
      x: 15,
      transition: { 
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1], // Slight overshoot for natural feel
      },
    });
  }, [armControls]);

  const runWavingAnimation = useCallback(async () => {
    armControls.start({
      rotate: [0, -25, 15, -20, 10, -10, 0],
      transition: { 
        duration: 1.5, 
        repeat: 2,
        ease: 'easeInOut',
      },
    });
  }, [armControls]);

  const runThinkingAnimation = useCallback(async () => {
    headControls.start({
      rotate: [0, 5, 0],
      y: [0, -3, 0],
      transition: { duration: 2, repeat: Infinity },
    });
  }, [headControls]);

  // ============================================
  // TEXT TYPING EFFECT
  // ============================================

  const typeText = useCallback((text: string) => {
    setFullText(text);
    setDisplayedText('');
    setIsTyping(true);
    setShowSpeechBubble(true);
    
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      currentIndex++;
      if (currentIndex <= text.length) {
        setDisplayedText(text.substring(0, currentIndex));
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, []);

  // ============================================
  // STATE & CONTEXT HANDLERS
  // ============================================

  useEffect(() => {
    setCurrentState(state);
  }, [state]);

  // Handle context-based dialogue
  useEffect(() => {
    if (context && context !== 'custom') {
      const dialogues = KISAAN_DIALOGUES[context];
      if (dialogues && dialogues.length > 0) {
        const randomDialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
        const text = currentLanguage === 'hindi' ? randomDialogue.hindi : randomDialogue.english;
        typeText(text);
        
        // Set appropriate animation state
        if (context === 'quiz_correct' || context === 'level_complete' || context === 'course_complete') {
          setCurrentState('celebrating');
        } else if (context === 'quiz_wrong' || context === 'locked_level') {
          setCurrentState('warning');
        } else if (context === 'during_lesson' || context === 'tip') {
          setCurrentState('teaching');
        } else if (context === 'new_level') {
          setCurrentState('pointing');
        } else if (context === 'idle_nudge') {
          setCurrentState('waving');
        }
      }
    }
  }, [context, currentLanguage, typeText]);

  // Handle custom message
  useEffect(() => {
    if (message) {
      typeText(message);
      setCurrentState('speaking');
    }
  }, [message, typeText]);

  // Run animations based on state
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const runAnimation = async () => {
      switch (currentState) {
        case 'idle':
          runIdleAnimation();
          break;
        case 'speaking':
          cleanup = await runSpeakingAnimation();
          break;
        case 'celebrating':
          runCelebratingAnimation();
          break;
        case 'pointing':
          runPointingAnimation();
          break;
        case 'waving':
          runWavingAnimation();
          break;
        case 'thinking':
        case 'teaching':
          runThinkingAnimation();
          break;
      }
    };

    runAnimation();

    return () => {
      if (cleanup) cleanup();
    };
  }, [currentState, runIdleAnimation, runSpeakingAnimation, runCelebratingAnimation, runPointingAnimation, runWavingAnimation, runThinkingAnimation]);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const handleDismiss = () => {
    setShowSpeechBubble(false);
    onDismiss?.();
  };

  const handleMascotClick = () => {
    if (showHelpMenu) {
      setShowMenu(!showMenu);
    }
    onClick?.();
  };

  if (!isVisible) return null;

  return (
    <div className={`${positionClasses[position]} flex flex-col items-start gap-2`}>
      {/* Speech Bubble */}
      <AnimatePresence>
        {showSpeechBubble && (fullText || displayedText) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="relative mb-2"
            style={{ maxWidth: config.bubbleWidth }}
          >
            <div className="bg-card rounded-2xl shadow-xl border-2 border-green-300 p-4 relative">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute -top-2 -right-2 w-6 h-6 bg-muted hover:bg-muted rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              
              {/* Message text with typing effect */}
              <p className="text-foreground leading-relaxed text-sm font-medium whitespace-pre-line">
                {displayedText}
                {isTyping && <span className="animate-pulse">|</span>}
              </p>

              {/* Skip typing button */}
              {isTyping && (
                <button
                  onClick={() => {
                    setDisplayedText(fullText);
                    setIsTyping(false);
                  }}
                  className="mt-2 text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                >
                  Skip <ChevronRight className="w-3 h-3" />
                </button>
              )}
              
              {/* Speech bubble tail */}
              <div className="absolute -bottom-2 left-8 w-4 h-4 bg-card border-r-2 border-b-2 border-green-300 transform rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-card rounded-xl shadow-lg border border-border p-2 mb-2"
            style={{ width: config.bubbleWidth }}
          >
            <div className="space-y-1">
              {/* Language Toggle Button */}
              <button
                onClick={async () => {
                  const newLanguage = language === 'hi' ? 'en' : 'hi';
                  await setLanguage(newLanguage);
                  setShowMenu(false);
                  // Show confirmation message
                  setTimeout(() => {
                    typeText(language === 'hi' 
                      ? "Language changed to English! 🇬🇧" 
                      : "भाषा हिंदी में बदल गई! 🇮🇳");
                  }, 100);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-lg text-left text-sm border-b border-border mb-1"
              >
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="flex-1">{currentLanguage === 'hindi' ? 'Switch to English' : 'हिंदी में बदलें'}</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                  {currentLanguage === 'hindi' ? 'हिं' : 'EN'}
                </span>
              </button>
              
              <button
                onClick={() => {
                  const tips = KISAAN_DIALOGUES.tip;
                  typeText(tips[Math.floor(Math.random() * tips.length)][currentLanguage]);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-green-50 rounded-lg text-left text-sm"
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>{currentLanguage === 'hindi' ? 'कोई टिप दो' : 'Give me a tip'}</span>
              </button>
              <button
                onClick={() => {
                  typeText(currentLanguage === 'hindi' 
                    ? "आप इस पाठ को पूरा करें, फिर अगला अनलॉक होगा। हर पाठ आपकी खेती को बेहतर बनाएगा!"
                    : "Complete this lesson, then the next one unlocks. Every lesson will improve your farming!");
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-green-50 rounded-lg text-left text-sm"
              >
                <HelpCircle className="w-4 h-4 text-blue-500" />
                <span>{currentLanguage === 'hindi' ? 'मुझे क्या करना चाहिए?' : 'What should I do?'}</span>
              </button>
              <button
                onClick={() => {
                  typeText(currentLanguage === 'hindi'
                    ? "यह पाठ आपको सिखाएगा कि कैसे अपनी फसल की उपज बढ़ाएं और पानी की बचत करें।"
                    : "This lesson will teach you how to increase your crop yield and save water.");
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-green-50 rounded-lg text-left text-sm"
              >
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span>{currentLanguage === 'hindi' ? 'इस पाठ को समझाओ' : 'Explain this lesson'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot SVG Character */}
      <motion.div
        onClick={handleMascotClick}
        className="cursor-pointer relative"
        style={{ width: config.width, height: config.height }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg
          viewBox="0 0 130 195"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xl"
        >
          {/* ============ FULL BODY CHARACTER ============ */}
          
          {/* Legs */}
          <motion.g animate={bodyControls}>
            {/* Left Leg */}
            <path
              d="M45 155 L42 185 L38 188 L50 188 L48 155"
              fill="#FFFFFF"
              stroke="#8B7355"
              strokeWidth="1"
            />
            {/* Right Leg */}
            <path
              d="M82 155 L85 185 L80 188 L92 188 L88 155"
              fill="#FFFFFF"
              stroke="#8B7355"
              strokeWidth="1"
            />
            {/* Feet / Chappals */}
            <ellipse cx="44" cy="190" rx="10" ry="4" fill="#8B4513" />
            <ellipse cx="86" cy="190" rx="10" ry="4" fill="#8B4513" />
          </motion.g>

          {/* Body - Kurta (Full length) */}
          <motion.g animate={bodyControls}>
            <path
              d="M35 85 C35 70, 50 65, 65 65 C80 65, 95 70, 95 85 L98 155 L32 155 Z"
              fill="#F5F5DC"
              stroke="#8B7355"
              strokeWidth="1.5"
            />
            {/* Kurta center line */}
            <path d="M65 75 L65 150" stroke="#D4C4A8" strokeWidth="1" />
            {/* Kurta buttons */}
            <circle cx="65" cy="85" r="2" fill="#8B7355" />
            <circle cx="65" cy="100" r="2" fill="#8B7355" />
            <circle cx="65" cy="115" r="2" fill="#8B7355" />
          </motion.g>

          {/* Gamcha (towel) on shoulder - animated */}
          <motion.path
            d="M45 75 Q30 85, 28 105 Q26 125, 32 140"
            fill="none"
            stroke="#E65100"
            strokeWidth="6"
            strokeLinecap="round"
            animate={{ 
              d: currentState === 'celebrating' 
                ? ["M45 75 Q30 85, 28 105 Q26 125, 32 140", "M45 75 Q25 82, 23 105 Q21 128, 28 143", "M45 75 Q30 85, 28 105 Q26 125, 32 140"]
                : "M45 75 Q30 85, 28 105 Q26 125, 32 140"
            }}
            transition={{ duration: 0.5, repeat: currentState === 'celebrating' ? 3 : 0 }}
          />
          <motion.path
            d="M45 75 Q30 85, 28 105 Q26 125, 32 140"
            fill="none"
            stroke="#FF9800"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="6 4"
          />

          {/* Left Arm (static) */}
          <path
            d="M35 85 Q20 95, 22 115 L25 115 Q28 98, 40 90"
            fill="#D7A574"
          />
          {/* Left Hand */}
          <ellipse cx="23" cy="118" rx="6" ry="5" fill="#D7A574" />

          {/* Right Arm (animated for waving/pointing) */}
          <motion.g
            animate={armControls}
            style={{ transformOrigin: '90px 85px' }}
          >
            {/* Upper arm */}
            <motion.path
              d="M95 85 Q108 92, 106 110"
              fill="none"
              stroke="#D7A574"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Forearm */}
            <motion.path
              d="M106 110 Q108 125, 105 130"
              fill="none"
              stroke="#D7A574"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Right Hand */}
            <ellipse cx="105" cy="133" rx="7" ry="6" fill="#D7A574" />
            {/* Fingers */}
            <motion.g
              animate={{
                rotate: currentState === 'waving' || currentState === 'celebrating' 
                  ? [0, 10, -5, 10, 0] 
                  : 0
              }}
              transition={{ duration: 0.4, repeat: currentState === 'waving' || currentState === 'celebrating' ? Infinity : 0 }}
              style={{ transformOrigin: '105px 133px' }}
            >
              <ellipse cx="100" cy="128" rx="2.5" ry="5" fill="#D7A574" />
              <ellipse cx="105" cy="126" rx="2.5" ry="6" fill="#D7A574" />
              <ellipse cx="110" cy="128" rx="2.5" ry="5" fill="#D7A574" />
              <ellipse cx="113" cy="131" rx="2" ry="4" fill="#D7A574" />
            </motion.g>
          </motion.g>

          {/* Neck */}
          <ellipse cx="65" cy="67" rx="10" ry="5" fill="#D7A574" />

          {/* Head Group */}
          <motion.g animate={headControls}>
            {/* Face */}
            <ellipse cx="65" cy="42" rx="26" ry="28" fill="#D7A574" />
            
            {/* Ears */}
            <ellipse cx="37" cy="42" rx="5" ry="7" fill="#D7A574" />
            <ellipse cx="93" cy="42" rx="5" ry="7" fill="#D7A574" />
            
            {/* Hair/Sideburns */}
            <path d="M42 35 Q40 45, 42 55" stroke="#2D1B0E" strokeWidth="2" fill="none" />
            <path d="M88 35 Q90 45, 88 55" stroke="#2D1B0E" strokeWidth="2" fill="none" />

            {/* Turban/Pagdi */}
            <path
              d="M39 30 Q39 10, 65 7 Q91 10, 91 30 Q91 20, 65 17 Q39 20, 39 30"
              fill="#FF5722"
            />
            <path
              d="M42 22 Q65 12, 88 22"
              fill="none"
              stroke="#E64A19"
              strokeWidth="4"
            />
            <path
              d="M44 28 Q65 20, 86 28"
              fill="none"
              stroke="#FF7043"
              strokeWidth="2"
            />
            {/* Turban top knot */}
            <ellipse cx="65" cy="10" rx="10" ry="6" fill="#FF5722" />
            {/* Turban jewel */}
            <circle cx="65" cy="18" r="3" fill="#FFD700" />

            {/* Eyebrows */}
            <motion.path
              d="M50 30 Q55 27, 60 30"
              fill="none"
              stroke="#2D1B0E"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{
                d: currentState === 'warning' 
                  ? "M50 28 Q55 30, 60 28"
                  : currentState === 'celebrating'
                  ? "M50 32 Q55 28, 60 32"
                  : "M50 30 Q55 27, 60 30"
              }}
            />
            <motion.path
              d="M70 30 Q75 27, 80 30"
              fill="none"
              stroke="#2D1B0E"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{
                d: currentState === 'warning'
                  ? "M70 28 Q75 30, 80 28"
                  : currentState === 'celebrating'
                  ? "M70 32 Q75 28, 80 32"
                  : "M70 30 Q75 27, 80 30"
              }}
            />

            {/* Eyes */}
            <motion.ellipse 
              cx="55" cy="38" rx="4" ry="5" fill="#2D1B0E"
              animate={{
                scaleY: currentState === 'celebrating' ? [1, 0.2, 1] : 1,
              }}
              transition={{ duration: 0.3, repeat: currentState === 'celebrating' ? 3 : 0 }}
            />
            <motion.ellipse 
              cx="75" cy="38" rx="4" ry="5" fill="#2D1B0E"
              animate={{
                scaleY: currentState === 'celebrating' ? [1, 0.2, 1] : 1,
              }}
              transition={{ duration: 0.3, repeat: currentState === 'celebrating' ? 3 : 0 }}
            />
            {/* Eye shine */}
            <circle cx="56" cy="36" r="1.5" fill="white" />
            <circle cx="76" cy="36" r="1.5" fill="white" />

            {/* Nose */}
            <path
              d="M65 42 L62 50 Q65 52, 68 50 L65 42"
              fill="#C49A6C"
            />

            {/* Mustache */}
            <path
              d="M50 54 Q55 57, 62 54 Q65 53, 68 54 Q75 57, 80 54"
              fill="none"
              stroke="#2D1B0E"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Mouth - Animated for speaking */}
            <motion.ellipse
              cx="65"
              cy="60"
              rx={isMouthOpen && (currentState === 'speaking' || isTyping) ? 5 : 3}
              ry={isMouthOpen && (currentState === 'speaking' || isTyping) ? 4 : 2}
              fill="#8B4513"
              animate={{
                ry: isMouthOpen ? 4 : 2,
                rx: isMouthOpen ? 5 : 3,
              }}
              transition={{ duration: 0.1 }}
            />
            
            {/* Smile lines for happy states */}
            {(currentState === 'celebrating' || currentState === 'idle') && !isMouthOpen && (
              <path
                d="M58 58 Q65 65, 72 58"
                fill="none"
                stroke="#8B4513"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </motion.g>

          {/* State Indicator Emoji */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={currentState}
          >
            {currentState === 'celebrating' && (
              <text x="100" y="15" fontSize="16">🎉</text>
            )}
            {currentState === 'thinking' && (
              <text x="100" y="15" fontSize="16">💭</text>
            )}
            {currentState === 'teaching' && (
              <text x="100" y="15" fontSize="16">💡</text>
            )}
            {currentState === 'warning' && (
              <text x="100" y="15" fontSize="16">⚠️</text>
            )}
          </motion.g>
        </svg>

        {/* Interactive hint on hover */}
        {showHelpMenu && (
          <motion.div
            className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <HelpCircle className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// ============================================
// PRESET COMPONENTS FOR COMMON USE CASES
// ============================================

export const WelcomeMascot: React.FC<{ onDismiss?: () => void }> = ({ onDismiss }) => (
  <KisaanMitra
    context="welcome"
    position="bottom-left"
    size="lg"
    showHelpMenu
    onDismiss={onDismiss}
  />
);

export const LessonMascot: React.FC<{ 
  context: MascotContext;
  message?: string;
  onDismiss?: () => void;
}> = ({ context, message, onDismiss }) => (
  <KisaanMitra
    context={context}
    message={message}
    position="bottom-left"
    size="lg"
    showHelpMenu
    onDismiss={onDismiss}
  />
);

export default KisaanMitra;
