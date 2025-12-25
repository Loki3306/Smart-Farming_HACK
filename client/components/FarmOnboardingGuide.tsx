import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { X, Volume2, VolumeX, Sparkles } from "lucide-react";
import farmerAnimation from "@/assets/farmer-intro.json";

interface FarmGuideMessage {
    greeting: string;
    mainMessage: string;
    tips?: string[];
    encouragement?: string;
    fieldToWatch?: string;
    reactions?: {
        onFocus?: string;
        onValid?: string;
        onInvalid?: string;
        onAction?: string;
    };
}

const farmSetupMessages: FarmGuideMessage[] = [
    // Step 1: Farmer Info
    {
        greeting: "Let's set up your farm! 🌾",
        mainMessage: "Excited to get started? I'll help you set up your farm profile. First, let me know your name and experience level. No need to be shy - whether you've been farming for decades or just starting out, we're here to help. Your experience helps me give you the right advice.",
        tips: [
            "Enter your full name as it appears on documents",
            "Years of experience helps us personalize recommendations",
            "Email is optional but useful for reports",
        ],
        fieldToWatch: "fullName",
        reactions: {
            onFocus: "Go ahead, I'm listening...",
            onValid: "Great! Nice to know you better 👍",
        },
    },
    // Step 2: Phone + OTP Verification
    {
        greeting: "Verify your number 📱",
        mainMessage: "Your mobile number is your lifeline to the farm! I'll send alerts about weather, irrigation needs, and important updates. Let's verify it's really you with a quick OTP code.",
        tips: [
            "Enter your 10-digit Indian mobile number",
            "Click 'Send OTP' to receive verification code",
            "Check your SMS for the 6-digit code",
        ],
        fieldToWatch: "phoneNumber",
        reactions: {
            onFocus: "Type your number carefully...",
            onValid: "Number looks good! Now verify with OTP 🔐",
            onAction: "OTP sent! Check your phone 📲",
        },
    },
    // Step 3: Farm Location
    {
        greeting: "Where is your farm? 🗺️",
        mainMessage: "Now the exciting part - let's find your farm! Use the GPS button to automatically capture your location, or enter it manually. This helps us give you hyperlocal weather forecasts and connect you with nearby farmers.",
        tips: [
            "Click the GPS button for automatic location",
            "Give your farm a memorable name",
            "Enter the total area of your land",
            "Select your soil type for better recommendations",
        ],
        encouragement: "Your land, your legacy - let's map it! 🌍",
        fieldToWatch: "farmName",
        reactions: {
            onFocus: "What do you call your farm?",
            onValid: "Beautiful name! Your farm has identity now 🌻",
            onAction: "Getting GPS location... Stand still!",
        },
    },
    // Step 4: Sensor Connection
    {
        greeting: "Connect your sensors 🔌",
        mainMessage: "Want real-time data from your farm? If you have IoT sensors, connect them now. Don't have sensors yet? No worries - you can skip this and add them later. The app works great either way!",
        tips: [
            "Optional - you can skip this step",
            "Sensors give real-time soil moisture, temperature",
            "Connect anytime from Settings later",
        ],
        encouragement: "Smart farming = smart decisions!",
        reactions: {
            onAction: "Connecting to sensor... Please wait 🔄",
        },
    },
    // Step 5: Review & Complete
    {
        greeting: "Almost there! 🎉",
        mainMessage: "Look at what we've built together! Review all your details below. Everything look good? Click 'Complete Setup' and let's start this farming journey. Your dashboard is waiting with live weather, AI recommendations, and more!",
        encouragement: "Welcome to the future of farming! 🚀",
    },
];

interface FarmOnboardingGuideProps {
    currentStep: number;
    currentField?: string;
    fieldValues?: Record<string, any>;
    onAction?: string; // Track actions like "OTP_SENT", "GPS_CLICKED", "SENSOR_CONNECTING"
}

export const FarmOnboardingGuide = ({ 
    currentStep, 
    currentField, 
    fieldValues = {},
    onAction
}: FarmOnboardingGuideProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showReaction, setShowReaction] = useState(false);
    const [reactionText, setReactionText] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // Safety check for step bounds
    const safeStep = Math.max(1, Math.min(currentStep, farmSetupMessages.length));
    const currentMessage = farmSetupMessages[safeStep - 1];
    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Handle action-based reactions (OTP sent, GPS clicked, etc.)
    useEffect(() => {
        if (onAction && currentMessage.reactions?.onAction) {
            setReactionText(currentMessage.reactions.onAction);
            setShowReaction(true);
            setTimeout(() => setShowReaction(false), 3000);
        }
    }, [onAction, currentMessage]);

    // Auto-react to valid field input
    useEffect(() => {
        if (!currentMessage.fieldToWatch) return;
        
        const watchedField = currentMessage.fieldToWatch;
        const value = fieldValues[watchedField];
        
        if (value && String(value).trim()) {
            // Validate based on field type
            let isValid = false;
            if (watchedField === "phoneNumber") {
                isValid = /^[6-9]\d{9}$/.test(String(value));
            } else if (watchedField === "fullName") {
                isValid = String(value).trim().length >= 2;
            } else if (watchedField === "farmName") {
                isValid = String(value).trim().length >= 2;
            } else {
                isValid = String(value).length > 0;
            }
            
            if (isValid && currentMessage.reactions?.onValid) {
                setReactionText(currentMessage.reactions.onValid);
                setShowReaction(true);
                setTimeout(() => setShowReaction(false), 2500);
            } else if (!isValid && currentMessage.reactions?.onInvalid) {
                setReactionText(currentMessage.reactions.onInvalid);
                setShowReaction(true);
                setTimeout(() => setShowReaction(false), 3000);
            }
        }
    }, [fieldValues, currentMessage]);

    // React to field focus
    useEffect(() => {
        if (!currentMessage.fieldToWatch || !currentField) return;
        
        if (currentField === currentMessage.fieldToWatch && currentMessage.reactions?.onFocus) {
            setReactionText(currentMessage.reactions.onFocus);
            setShowReaction(true);
            setTimeout(() => setShowReaction(false), 2500);
        }
    }, [currentField, currentMessage]);

    // Typing animation effect
    useEffect(() => {
        const fullText = currentMessage.mainMessage;
        setDisplayedText("");
        setIsTyping(true);
        
        let index = 0;
        typingIntervalRef.current = setInterval(() => {
            if (index < fullText.length) {
                setDisplayedText(fullText.slice(0, index + 1));
                index++;
            } else {
                setIsTyping(false);
                if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                }
            }
        }, 25); // Slightly faster typing for farm setup
        
        return () => {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
        };
    }, [currentStep, currentMessage]);

    useEffect(() => {
        const dismissed = sessionStorage.getItem('farm_onboarding_guide_dismissed');
        if (dismissed) {
            setIsDismissed(true);
            return;
        }

        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        sessionStorage.setItem('farm_onboarding_guide_dismissed', 'true');
        if (speechSynthesisRef.current) {
            window.speechSynthesis.cancel();
        }
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
        if (!isMinimized && isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            // Build complete text to speak
            let fullText = `${currentMessage.greeting}. ${currentMessage.mainMessage}`;
            if (currentMessage.tips && currentMessage.tips.length > 0) {
                fullText += '. Quick tips: ' + currentMessage.tips.join('. ');
            }
            if (currentMessage.encouragement) {
                fullText += '. ' + currentMessage.encouragement;
            }
            
            const utterance = new SpeechSynthesisUtterance(fullText);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.lang = 'en-IN';
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            speechSynthesisRef.current = utterance;
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    if (isDismissed) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: -50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="fixed bottom-6 left-6 z-50 max-w-[420px]"
                >
                    {isMinimized ? (
                        // Minimized state
                        <motion.button
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            onClick={toggleMinimize}
                            className="relative group"
                        >
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-2xl flex items-center justify-center ring-4 ring-emerald-500/20">
                                <div className="w-20 h-20">
                                    <Lottie
                                        animationData={farmerAnimation}
                                        loop={true}
                                        initialSegment={[0, 70]}
                                        style={{ width: "100%", height: "100%" }}
                                    />
                                </div>
                            </div>
                            {/* Pulse animation */}
                            <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-20 animate-ping" />
                            {/* Tooltip */}
                            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Click to open farm guide
                            </div>
                        </motion.button>
                    ) : (
                        // Expanded state
                        <div className="w-[420px] max-w-[calc(100vw-48px)] relative">
                            {/* Reaction bubble */}
                            <AnimatePresence>
                                {showReaction && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                        className="absolute -top-16 left-1/2 -translate-x-1/2 w-full px-4"
                                    >
                                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-2xl shadow-xl text-center relative">
                                            <motion.div
                                                animate={{ rotate: [0, 10, -10, 0] }}
                                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                                                className="inline-block mr-1"
                                            >
                                                ✨
                                            </motion.div>
                                            <span className="text-sm font-medium">{reactionText}</span>
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-emerald-600" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Main card */}
                            <div className="relative bg-gradient-to-br from-card/95 via-card/90 to-emerald-50/50 backdrop-blur-xl border-2 border-emerald-200/50 rounded-3xl shadow-2xl overflow-hidden">
                                {/* Animated background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/10 pointer-events-none" />
                                <motion.div
                                    animate={{
                                        backgroundPosition: ["0% 0%", "100% 100%"],
                                    }}
                                    transition={{
                                        duration: 20,
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                    }}
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                        backgroundImage: "radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(5, 150, 105, 0.1) 0%, transparent 50%)",
                                        backgroundSize: "200% 200%",
                                    }}
                                />

                                {/* Header */}
                                <div className="relative flex items-center justify-between px-5 py-3 border-b border-emerald-200/30 bg-card/40 dark:bg-card/40">
                                    <div className="flex items-center gap-3">
                                        <motion.div
                                            animate={{ rotate: isTyping ? [0, -5, 5, 0] : 0 }}
                                            transition={{ duration: 0.5, repeat: isTyping ? Infinity : 0 }}
                                            className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-1.5 shadow-lg ring-2 ring-white"
                                        >
                                            <Lottie
                                                animationData={farmerAnimation}
                                                loop={true}
                                                initialSegment={[0, 70]}
                                                style={{ width: "100%", height: "100%" }}
                                            />
                                        </motion.div>
                                        <div>
                                            <span className="text-sm font-bold text-foreground block leading-tight">
                                                Ravi
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                {isTyping ? (
                                                    <motion.span
                                                        animate={{ opacity: [1, 0.5, 1] }}
                                                        transition={{ duration: 1, repeat: Infinity }}
                                                    >
                                                        typing...
                                                    </motion.span>
                                                ) : (
                                                    "Farm Setup Guide"
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={handleSpeak}
                                            className="p-2 rounded-full hover:bg-emerald-100 text-emerald-600 transition-colors"
                                            title={isSpeaking ? "Stop speaking" : "Listen"}
                                        >
                                            {isSpeaking ? (
                                                <VolumeX className="w-4 h-4" />
                                            ) : (
                                                <Volume2 className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={toggleMinimize}
                                            className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors text-sm"
                                        >
                                            −
                                        </button>
                                        <button
                                            onClick={handleDismiss}
                                            className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="relative p-5 space-y-4">
                                    {/* Greeting with full-size farmer */}
                                    <motion.div
                                        key={`greeting-${currentStep}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-end gap-4"
                                    >
                                        {/* Full-size farmer animation */}
                                        <div className="flex-shrink-0 w-28 h-32">
                                            <Lottie
                                                animationData={farmerAnimation}
                                                loop={true}
                                                initialSegment={[0, 70]}
                                                style={{ width: "100%", height: "100%" }}
                                            />
                                        </div>
                                        {/* Message bubble */}
                                        <div className="flex-1 bg-card/80 dark:bg-card/80 rounded-2xl px-4 py-3 shadow-sm">
                                            <h4 className="text-base font-bold text-emerald-700 mb-1">
                                                {currentMessage.greeting}
                                            </h4>
                                            <p className="text-sm text-foreground leading-relaxed">
                                                {displayedText}
                                                {isTyping && (
                                                    <motion.span
                                                        animate={{ opacity: [1, 0] }}
                                                        transition={{ duration: 0.5, repeat: Infinity }}
                                                        className="inline-block w-1 h-4 bg-emerald-600 ml-1"
                                                    />
                                                )}
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* Tips section */}
                                    {currentMessage.tips && currentMessage.tips.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="bg-emerald-50/80 rounded-xl p-3 space-y-2"
                                        >
                                            <div className="flex items-center gap-2 text-emerald-700 font-medium text-xs mb-2">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span>Quick Tips</span>
                                            </div>
                                            {currentMessage.tips.map((tip, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.4 + index * 0.1 }}
                                                    className="flex items-start gap-2 text-xs text-emerald-800"
                                                >
                                                    <span className="text-emerald-500 flex-shrink-0 mt-0.5">●</span>
                                                    <span>{tip}</span>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}

                                    {/* Encouragement */}
                                    {currentMessage.encouragement && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-center px-4 py-2 rounded-xl text-sm font-medium shadow-md"
                                        >
                                            {currentMessage.encouragement}
                                        </motion.div>
                                    )}

                                    {/* Progress indicator */}
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex gap-1.5">
                                            {farmSetupMessages.map((_, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className={`h-1.5 rounded-full transition-all ${
                                                        index + 1 === currentStep
                                                            ? "bg-emerald-600 w-8"
                                                            : index + 1 < currentStep
                                                            ? "bg-emerald-400 w-1.5"
                                                            : "bg-emerald-200 w-1.5"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs font-medium text-emerald-700">
                                            Step {currentStep} of {farmSetupMessages.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
