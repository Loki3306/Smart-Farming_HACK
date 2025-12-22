import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import { X, ArrowRight, LogIn, UserPlus, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import farmerAnimation from "@/assets/farmer-intro.json";

interface LandingIntroDialogProps {
    isAuthenticated: boolean;
}

// Content in both languages
const content = {
    en: {
        title: "Welcome to Krushi Mitra! 🌾",
        description: "Your AI-powered smart farming companion. Get real-time insights, weather forecasts, and expert recommendations for better yields.",
        dashboard: "Go to Dashboard",
        signup: "Get Started Free",
        login: "Already have an account? Login",
        scrollHint: "Scroll down to explore our features ↓",
        langSwitch: "हिंदी",
    },
    hi: {
        title: "कृषि मित्र में आपका स्वागत है! 🌾",
        description: "आपका AI-संचालित स्मार्ट खेती साथी। रियल-टाइम जानकारी, मौसम के पूर्वानुमान और बेहतर उपज के लिए विशेषज्ञ सुझाव पाएं।",
        dashboard: "डैशबोर्ड पर जाएं",
        signup: "मुफ्त में शुरू करें",
        login: "पहले से खाता है? लॉगिन करें",
        scrollHint: "हमारी सुविधाएं देखने के लिए नीचे स्क्रॉल करें ↓",
        langSwitch: "English",
    },
};

export const LandingIntroDialog = ({ isAuthenticated }: LandingIntroDialogProps) => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [lang, setLang] = useState<'en' | 'hi'>(() => {
        const stored = localStorage.getItem('smartfarm_preferred_language');
        return stored === 'hi' ? 'hi' : 'en';
    });

    const t = content[lang];

    // Show dialog after a short delay for smooth entrance
    useEffect(() => {
        const dismissed = sessionStorage.getItem("landing_intro_dismissed");
        if (dismissed) {
            setIsDismissed(true);
            return;
        }

        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const toggleLanguage = () => {
        const newLang = lang === 'en' ? 'hi' : 'en';
        setLang(newLang);
        localStorage.setItem('smartfarm_preferred_language', newLang);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        sessionStorage.setItem("landing_intro_dismissed", "true");
    };

    const handleLogin = () => {
        navigate("/login");
    };

    const handleSignup = () => {
        navigate("/signup");
    };

    const handleDashboard = () => {
        navigate("/dashboard");
    };

    if (isDismissed) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="fixed bottom-6 right-6 z-50 w-[340px] max-w-[calc(100vw-48px)]"
                >
                    {/* Glassmorphism Card */}
                    <div className="relative bg-gradient-to-br from-card/95 via-card/90 to-primary/10 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />

                        {/* Language toggle & Close button */}
                        <div className="absolute top-3 right-3 z-10 flex gap-2">
                            <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Globe className="w-3 h-3" />
                                {t.langSwitch}
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="p-1.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="relative p-5 pt-4">
                            {/* Lottie Animation */}
                            <div className="flex justify-center mb-3">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    className="w-28 h-28"
                                >
                                    <Lottie
                                        animationData={farmerAnimation}
                                        loop={true}
                                        initialSegment={[0, 70]}
                                        style={{ width: "100%", height: "100%" }}
                                    />
                                </motion.div>
                            </div>

                            {/* Welcome Text */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.4 }}
                                className="text-center mb-4"
                            >
                                <h3 className="text-lg font-bold text-foreground mb-1.5">
                                    {t.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {t.description}
                                </p>
                            </motion.div>

                            {/* CTA Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.4 }}
                                className="space-y-2.5"
                            >
                                {isAuthenticated ? (
                                    <Button
                                        onClick={handleDashboard}
                                        className="w-full rounded-xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                                    >
                                        {t.dashboard}
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleSignup}
                                            className="w-full rounded-xl h-11 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-primary-foreground font-semibold gap-2 shadow-lg"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            {t.signup}
                                        </Button>
                                        <Button
                                            onClick={handleLogin}
                                            variant="outline"
                                            className="w-full rounded-xl h-10 border-border/50 hover:bg-muted/50 font-medium gap-2"
                                        >
                                            <LogIn className="w-4 h-4" />
                                            {t.login}
                                        </Button>
                                    </>
                                )}
                            </motion.div>

                            {/* Bottom hint */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7, duration: 0.4 }}
                                className="text-center text-xs text-muted-foreground/70 mt-3"
                            >
                                {t.scrollHint}
                            </motion.p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
