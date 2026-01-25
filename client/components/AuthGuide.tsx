import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { X, Volume2, VolumeX, Sparkles, Globe, Hand, User, Smartphone, Lock, MapPin, Sprout, PartyPopper, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import farmerAnimation from "@/assets/farmer-intro.json";

interface AuthGuideMessage {
    greeting: string;
    mainMessage: string;
    tips?: string[];
    encouragement?: string;
    fieldToWatch?: string;
    reactions?: {
        onFocus?: string;
        onValid?: string;
        onInvalid?: string;
    };
    icon?: React.ElementType;
}

const signupMessagesEn: AuthGuideMessage[] = [
    {
        greeting: "Namaste!",
        mainMessage: "I'm Ravi, your farming companion. I've been farming for 20 years and now I help new friends like you get started. Let me guide you through this - it's easier than planting your first crop!",
        icon: Hand,
    },
    {
        greeting: "What should I call you?",
        mainMessage: "Your name is important to me - it's how we'll build our relationship. Use your real name, just like you'd introduce yourself to a neighbor.",
        tips: [
            "Use your official name from documents",
            "This helps us personalize everything for you",
        ],
        fieldToWatch: "fullName",
        reactions: {
            onFocus: "Ah, you're ready! Go ahead...",
            onValid: "Nice to meet you! That's a good name!",
        },
        icon: User,
    },
    {
        greeting: "Let's connect",
        mainMessage: "Your mobile number is like having a direct line to the farm. I'll send you alerts about weather, crop issues, and important updates - right when you need them.",
        tips: [
            "Enter your 10-digit mobile number",
            "Start with 6, 7, 8, or 9",
            "We'll verify it with OTP",
        ],
        fieldToWatch: "phone",
        reactions: {
            onFocus: "Good! Type carefully...",
            onValid: "Perfect! I can reach you anytime now",
            onInvalid: "Hmm... that doesn't look right. Check the digits?",
        },
        icon: Smartphone,
    },
    {
        greeting: "Security matters",
        mainMessage: "Choose a password you'll remember but others won't guess. Think of it like the lock on your shed - keep it strong to protect your farm data!",
        tips: [
            "At least 6 characters long",
            "Mix letters and numbers if possible",
            "Don't forget to confirm it below!",
        ],
        encouragement: "Make it something memorable but unique!",
        fieldToWatch: "password",
        reactions: {
            onFocus: "Take your time, security first...",
            onValid: "Strong choice! Your data is safe",
        },
        icon: Lock,
    },
    {
        greeting: "Where are you farming?",
        mainMessage: "Your location helps me give you accurate weather forecasts, seasonal advice, and connect you with nearby farmers. Every region has its own farming wisdom!",
        tips: [
            "Select your state from the dropdown",
            "We'll provide region-specific advice",
        ],
        fieldToWatch: "state",
        reactions: {
            onFocus: "Choose your state...",
            onValid: "Ah, great region! I know the soil well there",
        },
        icon: MapPin,
    },
    {
        greeting: "Experience level?",
        mainMessage: "Don't worry if you're new! I've taught many beginners. Whether you're just starting or have years of experience, I'll adjust my guidance to match your needs.",
        tips: [
            "Beginner: Just starting your journey",
            "Intermediate: Have some experience",
            "Advanced: Seasoned farmer",
        ],
        fieldToWatch: "experienceLevel",
        reactions: {
            onFocus: "Be honest, no judgment here!",
            onValid: "Got it! I'll match your pace",
        },
        icon: Sprout,
    },
    {
        greeting: "You're all set!",
        mainMessage: "Look at that - you did great! Now click 'Create Account' and let's start this farming journey together. I'll be with you every step of the way!",
        encouragement: "Welcome to the Krushi Unnati family!",
        icon: PartyPopper,
    },
];

const signupMessagesHi: AuthGuideMessage[] = [
    {
        greeting: "नमस्ते!",
        mainMessage: "मैं रवि हूं, आपका खेती साथी। मैं 20 साल से खेती कर रहा हूं और अब आप जैसे नए दोस्तों की मदद करता हूं। चलिए शुरू करते हैं - ये पहली फसल उगाने से भी आसान है!",
        icon: Hand,
    },
    {
        greeting: "मैं आपको क्या बुलाऊं?",
        mainMessage: "आपका नाम मेरे लिए ज़रूरी है - इससे हमारी दोस्ती बनेगी। अपना असली नाम लिखें, जैसे आप पड़ोसी से मिलते वक्त बताते हैं।",
        tips: [
            "अपने दस्तावेजों वाला नाम लिखें",
            "इससे सब कुछ आपके हिसाब से होगा",
        ],
        fieldToWatch: "fullName",
        reactions: {
            onFocus: "अच्छा, आप तैयार हैं! लिखिए...",
            onValid: "आपसे मिलकर खुशी हुई!",
        },
        icon: User,
    },
    {
        greeting: "जुड़ें हमसे",
        mainMessage: "आपका मोबाइल नंबर खेत की सीधी लाइन है। मौसम, फसल की समस्या, और ज़रूरी अपडेट - सब मैं आपको भेजूंगा।",
        tips: [
            "10 अंकों का मोबाइल नंबर डालें",
            "6, 7, 8, या 9 से शुरू होना चाहिए",
            "OTP से वेरिफाई होगा",
        ],
        fieldToWatch: "phone",
        reactions: {
            onFocus: "अच्छा! ध्यान से लिखें...",
            onValid: "बढ़िया! अब मैं आपसे संपर्क कर सकता हूं",
            onInvalid: "हम्म... ये सही नहीं लग रहा। नंबर चेक करें?",
        },
        icon: Smartphone,
    },
    {
        greeting: "सुरक्षा ज़रूरी है",
        mainMessage: "ऐसा पासवर्ड चुनें जो आप याद रखें पर दूसरे न समझ पाएं। सोचिए जैसे आपके गोदाम का ताला - मज़बूत रखें!",
        tips: [
            "कम से कम 6 अक्षर",
            "अक्षर और नंबर मिलाएं",
            "नीचे फिर से लिखना न भूलें!",
        ],
        encouragement: "कुछ यादगार पर अनोखा चुनें!",
        fieldToWatch: "password",
        reactions: {
            onFocus: "आराम से, सुरक्षा पहले...",
            onValid: "बढ़िया! आपका डेटा सुरक्षित है",
        },
        icon: Lock,
    },
    {
        greeting: "खेती कहां करते हैं?",
        mainMessage: "आपकी लोकेशन से मैं सही मौसम, मौसमी सलाह, और पास के किसानों से जोड़ सकता हूं। हर इलाके की अपनी खेती की समझ होती है!",
        tips: [
            "ड्रॉपडाउन से अपना राज्य चुनें",
            "आपके इलाके के हिसाब से सलाह मिलेगी",
        ],
        fieldToWatch: "state",
        reactions: {
            onFocus: "अपना राज्य चुनें...",
            onValid: "बढ़िया! मुझे वहां की मिट्टी अच्छे से पता है",
        },
        icon: MapPin,
    },
    {
        greeting: "अनुभव कितना है?",
        mainMessage: "नए हों तो चिंता न करें! मैंने कई शुरुआती को सिखाया है। नए हों या पुराने किसान - मैं आपके हिसाब से मदद करूंगा।",
        tips: [
            "Beginner: अभी शुरू कर रहे हैं",
            "Intermediate: थोड़ा अनुभव है",
            "Advanced: पुराने किसान हैं",
        ],
        fieldToWatch: "experienceLevel",
        reactions: {
            onFocus: "सच बताइए, कोई फैसला नहीं!",
            onValid: "समझ गए! आपकी रफ्तार से चलेंगे",
        },
        icon: Sprout,
    },
    {
        greeting: "आप तैयार हैं!",
        mainMessage: "देखा - आपने बढ़िया किया! अब 'Create Account' पर क्लिक करें और खेती का सफर शुरू करें। मैं हर कदम पर साथ हूं!",
        encouragement: "कृषि उन्नति परिवार में आपका स्वागत है!",
        icon: PartyPopper,
    },
];

const loginMessagesEn: AuthGuideMessage[] = [
    {
        greeting: "Welcome back, friend!",
        mainMessage: "Ravi here! Good to see you again. Let's get you back to your farm dashboard. Your crops are waiting!",
        icon: Hand,
    },
    {
        greeting: "Your number?",
        mainMessage: "Enter the mobile number you used when signing up. That's how I know it's really you and not someone else trying to access your farm.",
        tips: [
            "Same 10-digit number from signup",
            "Starts with 6, 7, 8, or 9",
        ],
        fieldToWatch: "phone",
        reactions: {
            onFocus: "Type it carefully...",
            onValid: "Ah yes, I remember you!",
            onInvalid: "Hmm, check those digits again?",
        },
        icon: Smartphone,
    },
    {
        greeting: "And the password?",
        mainMessage: "Enter your secure password. If you've forgotten it, don't worry - there's a reset option below. We all forget things sometimes!",
        fieldToWatch: "password",
        reactions: {
            onFocus: "Take your time...",
            onValid: "Got it! Let's go",
        },
        icon: Lock,
    },
    {
        greeting: "Ready to continue!",
        mainMessage: "Click 'Sign In' and you'll be back at your dashboard with all your farm data, insights, and real-time monitoring. Let's get back to work!",
        encouragement: "Your farm awaits!",
        icon: Unlock,
    },
];

const loginMessagesHi: AuthGuideMessage[] = [
    {
        greeting: "फिर से स्वागत है, दोस्त!",
        mainMessage: "रवि यहां है! फिर से मिलकर अच्छा लगा। चलिए आपको वापस खेत के डैशबोर्ड पर ले चलते हैं। आपकी फसलें इंतज़ार कर रही हैं!",
        icon: Hand,
    },
    {
        greeting: "आपका नंबर?",
        mainMessage: "साइनअप वाला मोबाइल नंबर डालें। इससे मुझे पता चलेगा कि आप ही हैं, कोई और नहीं जो आपके खेत की जानकारी देखने की कोशिश कर रहा।",
        tips: [
            "साइनअप वाला 10 अंकों का नंबर",
            "6, 7, 8, या 9 से शुरू होना चाहिए",
        ],
        fieldToWatch: "phone",
        reactions: {
            onFocus: "ध्यान से लिखें...",
            onValid: "अरे हां, मुझे याद है आप!",
            onInvalid: "हम्म, नंबर फिर चेक करें?",
        },
        icon: Smartphone,
    },
    {
        greeting: "और पासवर्ड?",
        mainMessage: "अपना पासवर्ड डालें। भूल गए तो चिंता नहीं - नीचे रीसेट का ऑप्शन है। सबके साथ होता है कभी-कभी!",
        fieldToWatch: "password",
        reactions: {
            onFocus: "आराम से लिखें...",
            onValid: "मिल गया! चलते हैं",
        },
        icon: Lock,
    },
    {
        greeting: "तैयार हैं!",
        mainMessage: "'Sign In' पर क्लिक करें और वापस डैशबोर्ड पर पहुंचें - सारा डेटा, जानकारी, और लाइव मॉनिटरिंग। काम पर लौटते हैं!",
        encouragement: "आपका खेत इंतज़ार कर रहा है!",
        icon: Unlock,
    },
];

interface AuthGuideProps {
    mode: "signup" | "login";
    currentField?: string;
    fieldValues?: Record<string, any>;
}

export const AuthGuide = ({ mode, currentField, fieldValues = {} }: AuthGuideProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showReaction, setShowReaction] = useState(false);
    const [reactionText, setReactionText] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [lang, setLang] = useState<'en' | 'hi'>(() => {
        const stored = localStorage.getItem('smartfarm_preferred_language');
        return stored === 'hi' ? 'hi' : 'en';
    });

    const toggleLanguage = () => {
        const newLang = lang === 'en' ? 'hi' : 'en';
        setLang(newLang);
        localStorage.setItem('smartfarm_preferred_language', newLang);
    };

    const signupMessages = lang === 'hi' ? signupMessagesHi : signupMessagesEn;
    const loginMessages = lang === 'hi' ? loginMessagesHi : loginMessagesEn;
    const messages = mode === "signup" ? signupMessages : loginMessages;
    const currentMessage = messages[currentStep];
    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Auto-advance to next step when relevant field is filled correctly
    useEffect(() => {
        if (!currentMessage.fieldToWatch) return;

        const watchedField = currentMessage.fieldToWatch;
        const value = fieldValues[watchedField];

        if (value && String(value).trim()) {
            // Validate based on field type
            let isValid = false;
            if (watchedField === "phone") {
                isValid = /^[6-9]\d{9}$/.test(String(value));
            } else if (watchedField === "password") {
                isValid = String(value).length >= 6;
            } else {
                isValid = String(value).length > 0;
            }

            if (isValid && currentMessage.reactions?.onValid) {
                setReactionText(currentMessage.reactions.onValid);
                setShowReaction(true);

                // Auto-advance after showing reaction
                setTimeout(() => {
                    setShowReaction(false);
                    setTimeout(() => {
                        if (currentStep < messages.length - 1) {
                            setCurrentStep(prev => prev + 1);
                        }
                    }, 500);
                }, 2000);
            } else if (!isValid && currentMessage.reactions?.onInvalid) {
                setReactionText(currentMessage.reactions.onInvalid);
                setShowReaction(true);
                setTimeout(() => setShowReaction(false), 3000);
            }
        }
    }, [fieldValues, currentMessage, currentStep, messages.length]);

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
        }, 30); // Typing speed

        return () => {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
        };
    }, [currentStep, currentMessage]);

    useEffect(() => {
        const dismissed = sessionStorage.getItem(`auth_guide_${mode}_dismissed`);
        if (dismissed) {
            setIsDismissed(true);
            return;
        }

        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 800);

        return () => clearTimeout(timer);
    }, [mode]);

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        sessionStorage.setItem(`auth_guide_${mode}_dismissed`, "true");
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

            // Get stored language preference
            const storedLang = localStorage.getItem('smartfarm_preferred_language');
            const isHindi = storedLang === 'hi';

            if (isHindi) {
                utterance.lang = 'hi-IN';
                utterance.rate = 0.85;
            } else {
                utterance.lang = 'en-IN';
                utterance.rate = 0.9;
            }
            utterance.pitch = 1;
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            // Find appropriate voice
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v =>
                isHindi ? (v.lang.startsWith('hi') || v.lang === 'hi-IN') : v.lang.startsWith('en')
            );
            if (voice) utterance.voice = voice;

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
                    initial={{ opacity: 0, x: 50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 50, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-2rem)] sm:max-w-[400px]"
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
                                Click to open guide
                            </div>
                        </motion.button>
                    ) : (
                        // Expanded state
                        <div className="w-full max-w-[380px] sm:w-[380px] relative">
                            {/* Reaction bubble - appears above main card */}
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
                                                className="inline-block mr-2 align-middle"
                                            >
                                                <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                                            </motion.div>
                                            <span className="text-sm font-medium">{reactionText}</span>
                                            {/* Arrow pointing down */}
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-emerald-600" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Main card */}
                            <div className="relative bg-gradient-to-br from-card/95 via-card/90 to-emerald-50/50 backdrop-blur-xl border-2 border-emerald-200/50 rounded-3xl shadow-2xl overflow-hidden">
                                {/* Animated background pattern */}
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
                                                    <>
                                                        <motion.span
                                                            animate={{ opacity: [1, 0.5, 1] }}
                                                            transition={{ duration: 1, repeat: Infinity }}
                                                        >
                                                            typing...
                                                        </motion.span>
                                                    </>
                                                ) : (
                                                    "Farming Guide"
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={toggleLanguage}
                                            className="flex items-center gap-1 px-2 py-1 text-xs rounded-full hover:bg-emerald-100 text-emerald-600 transition-colors"
                                            title={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
                                        >
                                            <Globe className="w-3 h-3" />
                                            {lang === 'en' ? 'हिंदी' : 'EN'}
                                        </button>
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
                                            <h4 className="text-base font-bold text-emerald-700 mb-1 flex items-center gap-2">
                                                {currentMessage.greeting}
                                                {currentMessage.icon && (
                                                    <currentMessage.icon className="w-5 h-5 text-emerald-500" />
                                                )}
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
                                            {messages.map((_, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className={`h-1.5 rounded-full transition-all ${index === currentStep
                                                        ? "bg-emerald-600 w-8"
                                                        : index < currentStep
                                                            ? "bg-emerald-400 w-1.5"
                                                            : "bg-emerald-200 w-1.5"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs font-medium text-emerald-700">
                                            {currentStep + 1} of {messages.length}
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
