/**
 * FarmerGuide Component
 * Custom tooltip for react-joyride with elegant, sharp design and voice narration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TooltipRenderProps } from 'react-joyride';
import { ChevronLeft, ChevronRight, X, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface FarmerGuideProps extends TooltipRenderProps {
    // Additional custom props if needed
}

// Staggered text animation component
const AnimatedText: React.FC<{ text: string }> = ({ text }) => {
    const words = text.split(' ');

    return (
        <motion.span>
            {words.map((word, index) => (
                <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.25,
                        delay: index * 0.03,
                        ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    className="inline-block mr-1"
                >
                    {word}
                </motion.span>
            ))}
        </motion.span>
    );
};

// Voice narration hook with Hindi support
const useVoiceNarration = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(true);

    // Get stored language preference
    const getLanguage = (): 'en' | 'hi' => {
        try {
            const stored = localStorage.getItem('smartfarm_preferred_language');
            return stored === 'hi' ? 'hi' : 'en';
        } catch {
            return 'en';
        }
    };

    useEffect(() => {
        // Check if Speech Synthesis is supported
        if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
            setIsSupported(false);
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!isSupported || typeof window === 'undefined') return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const lang = getLanguage();

        // Configure voice settings based on language
        if (lang === 'hi') {
            utterance.lang = 'hi-IN'; // Hindi (India)
            utterance.rate = 0.85; // Slightly slower for Hindi clarity
            utterance.pitch = 1;
        } else {
            utterance.lang = 'en-IN'; // English (India) accent
            utterance.rate = 0.9;
            utterance.pitch = 0.9;
        }
        utterance.volume = 1;

        // Find appropriate voice
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        if (lang === 'hi') {
            // Try to find Hindi voice
            selectedVoice = voices.find(voice =>
                voice.lang.startsWith('hi') || voice.lang === 'hi-IN'
            );
        } else {
            // Try to find male English voice
            selectedVoice = voices.find(voice =>
                voice.lang.startsWith('en') &&
                (voice.name.toLowerCase().includes('male') ||
                    voice.name.toLowerCase().includes('david') ||
                    voice.name.toLowerCase().includes('james') ||
                    voice.name.toLowerCase().includes('rishi') ||
                    voice.name.toLowerCase().includes('google'))
            );
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [isSupported]);

    const stop = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    return { speak, stop, isSpeaking, isSupported };
};

export const FarmerGuide: React.FC<FarmerGuideProps> = ({
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    skipProps,
    tooltipProps,
    isLastStep,
    size,
}) => {
    const progress = ((index + 1) / size) * 100;
    const { speak, stop, isSpeaking, isSupported } = useVoiceNarration();

    // Stop speaking when step changes or component unmounts
    useEffect(() => {
        return () => {
            stop();
        };
    }, [index, stop]);

    // Handle close button click manually to ensure it works
    const handleClose = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        stop(); // Stop any ongoing speech
        if (closeProps.onClick) {
            closeProps.onClick(e as any);
        }
    };

    // Handle voice button click
    const handleVoiceClick = () => {
        if (isSpeaking) {
            stop();
        } else {
            // Combine title and content for narration
            const fullText = `${step.title}. ${step.content}`;
            speak(fullText);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                {...tooltipProps}
                initial={{ scale: 0.95, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 12 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8
                }}
                className="relative max-w-sm"
            >
                {/* Main Card - Sharp, minimal design */}
                <div className="bg-card rounded-xl shadow-lg border border-border/80 overflow-hidden backdrop-blur-sm">
                    {/* Header - Clean, subtle gradient */}
                    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Minimal animated icon */}
                            <motion.div
                                className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30"
                                animate={{
                                    borderColor: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.6)', 'rgba(16, 185, 129, 0.3)'],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <motion.span
                                    className="text-lg select-none"
                                    animate={{
                                        scale: [1, 1.1, 1],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    🌾
                                </motion.span>
                            </motion.div>
                            <div>
                                <h3 className="text-white font-semibold text-base leading-tight tracking-tight">
                                    {step.title}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-emerald-400 text-xs font-medium">
                                        {index + 1}
                                    </span>
                                    <span className="text-muted-foreground text-xs">/</span>
                                    <span className="text-muted-foreground text-xs">
                                        {size}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Header Actions */}
                        <div className="flex items-center gap-1.5">
                            {/* Voice Button */}
                            {isSupported && (
                                <motion.button
                                    onClick={handleVoiceClick}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label={isSpeaking ? "Stop narration" : "Play narration"}
                                    className={`p-1.5 rounded-lg transition-all duration-200 group ${isSpeaking
                                        ? 'bg-emerald-500/30 border border-emerald-500/50'
                                        : 'bg-card/10 dark:bg-card/10 hover:bg-card/20 dark:bg-card/20'
                                        }`}
                                >
                                    {isSpeaking ? (
                                        <VolumeX className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                        <Volume2 className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                                    )}
                                </motion.button>
                            )}

                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                aria-label="Close tour"
                                className="p-1.5 rounded-lg bg-card/10 dark:bg-card/10 hover:bg-card/20 dark:bg-card/20 transition-all duration-200 group"
                            >
                                <X className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar - Thin and elegant */}
                    <div className="h-0.5 bg-muted">
                        <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                    </div>

                    {/* Content */}
                    <div className="px-4 py-4">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            <AnimatedText text={step.content as string} />
                        </p>
                    </div>

                    {/* Actions - Clean button design */}
                    <div className="px-4 pb-4 flex items-center justify-between gap-3">
                        {/* Skip Button */}
                        {index > 0 ? (
                            <button
                                {...skipProps}
                                onClick={(e) => {
                                    stop(); // Stop speech on skip
                                    skipProps.onClick?.(e);
                                }}
                                className="text-xs text-muted-foreground hover:text-muted-foreground transition-colors font-medium"
                            >
                                Skip
                            </button>
                        ) : (
                            <div />
                        )}

                        <div className="flex items-center gap-2">
                            {/* Back Button */}
                            {index > 0 && (
                                <motion.button
                                    {...backProps}
                                    onClick={(e) => {
                                        stop(); // Stop speech on back
                                        backProps.onClick?.(e);
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted transition-colors"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    Back
                                </motion.button>
                            )}

                            {/* Next/Finish Button */}
                            <motion.button
                                {...primaryProps}
                                onClick={(e) => {
                                    stop(); // Stop speech on next
                                    primaryProps.onClick?.(e);
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-white bg-foreground rounded-lg hover:bg-foreground transition-colors"
                            >
                                {isLastStep ? (
                                    <>
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Done
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FarmerGuide;
