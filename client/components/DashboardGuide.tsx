import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { ArrowLeft, X, Volume2, VolumeX, HelpCircle, Play, Languages, BookOpen, MessageCircle, Phone } from "lucide-react";
import farmerAnimation from "@/assets/farmer-intro.json";
import { useTour } from "@/context/TourContext";
import { useLocation } from "react-router-dom";

type GuideMode = "welcome" | "language-select" | "help-menu" | "tour-starting";

interface HelpOption {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    action: () => void;
}

interface GuideMessage {
    greeting: string;
    mainMessage: string;
    tips?: string[];
}

export const DashboardGuide = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [mode, setMode] = useState<GuideMode>("welcome");
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<"english" | "hindi" | null>(null);

    const location = useLocation();
    const { startTour, resetTourProgress } = useTour();
    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Map routes to their tour IDs and page names
    const routeTourMap: Record<string, { tourId: string; pageName: string }> = {
        '/dashboard': { tourId: 'main-tour', pageName: 'Dashboard' },
        '/farm': { tourId: 'farm-tour', pageName: 'Farm Management' },
        '/weather': { tourId: 'weather-tour', pageName: 'Weather' },
        '/recommendations': { tourId: 'recommendations-tour', pageName: 'Recommendations' },
        '/marketplace': { tourId: 'marketplace-tour', pageName: 'Marketplace' },
        '/learn': { tourId: 'learn-tour', pageName: 'Learning Center' },
        '/community': { tourId: 'community-tour', pageName: 'Community' },
        '/notifications': { tourId: 'notifications-tour', pageName: 'Notifications' },
    };

    const currentRoute = routeTourMap[location.pathname] || { tourId: 'main-tour', pageName: 'this page' };

    // Messages for different modes
    const messages: Record<"welcome" | "languageSelect" | "helpMenu" | "tourStarting", GuideMessage> = {
        welcome: {
            greeting: "Namaste! Welcome to your Smart Farm Dashboard! 🌾",
            mainMessage: "I'm here to help you make the most of your dashboard! I can give you a guided tour of all the features, answer your questions, and help you navigate through the system. What would you like to do?",
            tips: [
                "Get a step-by-step tour of the dashboard",
                "Learn about specific features",
                "Get help with common tasks",
                "Contact support for technical issues",
            ],
        },
        languageSelect: {
            greeting: "Choose your language 🌍",
            mainMessage: "Would you like the tour in English or Hindi? Don't worry, you can change this anytime from settings!",
        },
        helpMenu: {
            greeting: "How can I help you? 🤝",
            mainMessage: "I'm here to assist! Choose what you need help with, and I'll guide you through it.",
        },
        tourStarting: {
            greeting: "Let's begin the tour! 🚀",
            mainMessage: "Great choice! I'll walk you through each section of this page. Feel free to skip or pause anytime. Ready? Let's go!",
        },
    };

    const stopTyping = () => {
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
        }
        setIsTyping(false);
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    const resetGuideState = () => {
        stopTyping();
        stopSpeaking();
        setMode("welcome");
        setSelectedLanguage(null);
        setDisplayedText("");
    };

    const helpOptions: HelpOption[] = [
        {
            id: "tour",
            icon: <Play className="w-5 h-5" />,
            title: `Tour ${currentRoute.pageName}`,
            description: "Step-by-step walkthrough of this page",
            action: () => setMode("language-select"),
        },
        {
            id: "learn",
            icon: <BookOpen className="w-5 h-5" />,
            title: "Feature Documentation",
            description: "View detailed guides and tutorials",
            action: () => {
                // Show information about where to find help
                alert(`📚 Feature Documentation\n\nFor detailed guides and tutorials:\n• Check the Learning Center page from the navigation\n• Use the tour feature to learn interactively\n• Contact support for specific questions\n\nTip: Each page has its own guided tour - just click the tour button!`);
            },
        },
        {
            id: "faq",
            icon: <MessageCircle className="w-5 h-5" />,
            title: "Common Questions",
            description: "Quick answers to frequent queries",
            action: () => {
                // Show FAQ modal or navigate to FAQ
                alert("FAQ section coming soon! For now, use the help menu or contact support.");
            },
        },
        {
            id: "support",
            icon: <Phone className="w-5 h-5" />,
            title: "Contact Support",
            description: "Get help from our team",
            action: () => {
                // Open support contact modal
                alert("Support: Email us at support@smartfarm.com or call 1800-FARM-HELP");
            },
        },
    ];

    // Get current message based on mode
    const getCurrentMessage = () => {
        switch (mode) {
            case "welcome":
                return messages.welcome;
            case "language-select":
                return messages.languageSelect;
            case "help-menu":
                return messages.helpMenu;
            case "tour-starting":
                return messages.tourStarting;
            default:
                return messages.welcome;
        }
    };

    const currentMessage = getCurrentMessage();

    // Message rendering (typing animation removed to avoid glitchy restarts)
    useEffect(() => {
        stopTyping();
        setDisplayedText(currentMessage.mainMessage);
        setIsTyping(false);
    }, [mode]);

    // Show guide on first visit
    useEffect(() => {
        const dismissed = sessionStorage.getItem('dashboard_guide_dismissed');
        if (!dismissed) {
            setTimeout(() => setIsVisible(true), 1000);
        }
    }, []);

    const handleDismiss = () => {
        stopTyping();
        stopSpeaking();
        setIsDismissed(true);
        sessionStorage.setItem('dashboard_guide_dismissed', 'true');
        setTimeout(() => setIsVisible(false), 300);
    };

    const handleMinimize = () => {
        stopSpeaking();
        setIsMinimized(!isMinimized);
    };

    const handleReopen = () => {
        resetGuideState();
        setIsVisible(true);
        setIsDismissed(false);
        setIsMinimized(false);
    };

    const handleSpeak = () => {
        if (isSpeaking) {
            stopSpeaking();
            return;
        }

        const textToSpeak = `${currentMessage.greeting}. ${currentMessage.mainMessage}`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);

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

        // Try to find appropriate voice
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v =>
            isHindi ? (v.lang.startsWith('hi') || v.lang === 'hi-IN') : v.lang.startsWith('en')
        );
        if (voice) utterance.voice = voice;

        speechSynthesisRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    const canGoBack = mode !== "welcome";
    const handleBack = () => {
        stopTyping();
        stopSpeaking();
        if (mode === "tour-starting") {
            setMode("language-select");
            return;
        }
        setMode("welcome");
    };

    const handleLanguageSelect = (language: "english" | "hindi") => {
        setSelectedLanguage(language);

        // Save language preference to localStorage
        const langCode = language === "hindi" ? "hi" : "en";
        localStorage.setItem('smartfarm_preferred_language', langCode);

        setMode("tour-starting");

        // Reset only the current page's tour so user can re-watch it
        setTimeout(() => {
            resetTourProgress(currentRoute.tourId);
            setTimeout(() => {
                startTour(currentRoute.tourId);
                // Important: reset state before hiding so reopening never gets stuck on "Starting tour..."
                resetGuideState();
                handleDismiss();
            }, 100);
        }, 1200);
    };

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            stopTyping();
            stopSpeaking();
        };
    }, []);

    if (!isVisible && !isMinimized) {
        // Floating help button to reopen
        return (
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleReopen}
                className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-lg flex items-center justify-center bg-emerald-50/70 backdrop-blur-xl border border-emerald-100/60 text-foreground hover:bg-emerald-50/80 transition-colors"
                title="Dashboard Help Guide"
            >
                <HelpCircle className="w-8 h-8" />
            </motion.button>
        );
    }

    if (isMinimized) {
        // Minimized state - just the farmer icon
        return (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="fixed bottom-6 right-6 z-50"
            >
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleMinimize}
                    className="w-20 h-20 rounded-full shadow-lg flex items-center justify-center bg-emerald-50/70 backdrop-blur-xl border border-emerald-100/60 hover:bg-emerald-50/80 transition-colors"
                >
                    <Lottie
                        animationData={farmerAnimation}
                        loop
                        className="w-16 h-16"
                    />
                </motion.button>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            {isVisible && !isDismissed && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 50 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 50 }}
                    className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)]"
                >
                    <div className="rounded-2xl shadow-xl overflow-hidden bg-emerald-50/55 backdrop-blur-xl border border-emerald-100/60">
                        {/* Header */}
                        <div className="p-4 flex items-center justify-between bg-emerald-50/45 backdrop-blur-xl border-b border-emerald-100/50">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-50/70 border border-emerald-100/60">
                                    <Lottie
                                        animationData={farmerAnimation}
                                        loop
                                        className="w-10 h-10"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground text-lg">Farm Guide</h3>
                                    <p className="text-xs text-muted-foreground">Your farming assistant</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {canGoBack && (
                                    <button
                                        onClick={handleBack}
                                        className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                                        title="Back"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-foreground" />
                                    </button>
                                )}
                                <button
                                    onClick={handleSpeak}
                                    className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                                    title={isSpeaking ? "Stop speaking" : "Read aloud"}
                                >
                                    {isSpeaking ? (
                                        <VolumeX className="w-5 h-5 text-foreground" />
                                    ) : (
                                        <Volume2 className="w-5 h-5 text-foreground" />
                                    )}
                                </button>
                                <button
                                    onClick={handleMinimize}
                                    className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                                    title="Minimize"
                                >
                                    <div className="w-5 h-0.5 bg-foreground/70 rounded"></div>
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                                    title="Close guide"
                                >
                                    <X className="w-5 h-5 text-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Greeting */}
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-emerald-50/60 border border-emerald-100/60">
                                    <Lottie
                                        animationData={farmerAnimation}
                                        loop
                                        className="w-6 h-6"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground mb-2">
                                        {currentMessage.greeting}
                                    </p>
                                    <div className="rounded-lg p-4 leading-relaxed bg-emerald-50/55 border border-emerald-100/60 text-foreground">
                                        {displayedText}
                                    </div>
                                </div>
                            </div>

                            {/* Mode-specific content */}
                            {mode === "welcome" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="space-y-3"
                                >
                                    {/* Help Options Grid */}
                                    <div className="grid grid-cols-1 gap-2">
                                        {helpOptions.map((option) => (
                                            <motion.button
                                                key={option.id}
                                                whileHover={{ scale: 1.02, x: 4 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={option.action}
                                                className="flex items-start gap-3 p-3 rounded-lg text-left transition-colors bg-emerald-50/55 backdrop-blur border border-emerald-100/60 hover:bg-emerald-50/65"
                                            >
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-100/40 text-emerald-700 border border-emerald-100/60">
                                                    {option.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900 text-sm">
                                                        {option.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-600 mt-0.5">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>

                                    {/* Tips */}
                                    {currentMessage.tips && (
                                        <div className="mt-4 p-3 rounded-lg border border-emerald-100/60 bg-emerald-50/45">
                                            <p className="text-xs font-semibold text-foreground mb-2">
                                                💡 I can help you with:
                                            </p>
                                            <ul className="space-y-1">
                                                {currentMessage.tips.map((tip, i) => (
                                                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                                        <span className="text-foreground/60 flex-shrink-0">✓</span>
                                                        <span>{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {mode === "language-select" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="space-y-3"
                                >
                                    <div className="grid grid-cols-2 gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleLanguageSelect("english")}
                                            className="p-4 rounded-xl font-semibold shadow-sm hover:shadow transition-shadow flex flex-col items-center gap-2 bg-emerald-50/60 backdrop-blur border border-emerald-100/60 text-foreground"
                                        >
                                            <Languages className="w-8 h-8" />
                                            <span>English</span>
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleLanguageSelect("hindi")}
                                            className="p-4 rounded-xl font-semibold shadow-sm hover:shadow transition-shadow flex flex-col items-center gap-2 bg-emerald-50/60 backdrop-blur border border-emerald-100/60 text-foreground"
                                        >
                                            <Languages className="w-8 h-8" />
                                            <span>हिंदी</span>
                                        </motion.button>
                                    </div>
                                    <p className="text-xs text-gray-500 text-center">
                                        You can change this anytime from settings
                                    </p>
                                </motion.div>
                            )}

                            {mode === "tour-starting" && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-center py-6"
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="w-16 h-16 mx-auto mb-4"
                                    >
                                        <Lottie
                                            animationData={farmerAnimation}
                                            loop
                                        />
                                    </motion.div>
                                    <p className="text-muted-foreground font-semibold">
                                        Starting tour in {selectedLanguage === "english" ? "English" : "Hindi"}...
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
