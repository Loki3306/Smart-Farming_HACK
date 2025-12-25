/**
 * DevTourReset Component
 * Hidden developer button to reset all tour progress for testing
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Check } from 'lucide-react';
import { useTour } from '../../context/TourContext';

interface DevTourResetProps {
    /** Show only in development mode */
    devOnly?: boolean;
}

export const DevTourReset: React.FC<DevTourResetProps> = ({ devOnly = true }) => {
    const { resetAllProgress, startTour } = useTour();
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [clickCount, setClickCount] = useState(0);

    // Only render in development mode if devOnly is true
    if (devOnly && import.meta.env.PROD) {
        return null;
    }

    // Triple-click activation
    const handleClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);

        if (newCount >= 3) {
            handleReset();
            setClickCount(0);
        }

        // Reset click count after 1 second
        setTimeout(() => {
            setClickCount(0);
        }, 1000);
    };

    const handleReset = () => {
        resetAllProgress();
        setShowConfirmation(true);

        // Hide confirmation after 2 seconds
        setTimeout(() => {
            setShowConfirmation(false);
        }, 2000);
    };

    const handleRestartTour = () => {
        resetAllProgress();
        setTimeout(() => {
            startTour('main-tour');
        }, 100);
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999]">
            {/* Hidden triple-click target */}
            <div
                onClick={handleClick}
                className="absolute bottom-0 right-0 w-8 h-8 cursor-default"
                title="Triple-click to reset tours (dev only)"
            />

            {/* Visible dev button */}
            {!devOnly && (
                <motion.button
                    onClick={handleReset}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted transition-colors border border-border shadow-sm"
                >
                    <RotateCcw className="w-3 h-3" />
                    Reset Tours
                </motion.button>
            )}

            {/* Restart tour button for testing */}
            <motion.button
                onClick={handleRestartTour}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm"
            >
                <RotateCcw className="w-3 h-3" />
                Restart Tour
            </motion.button>

            {/* Confirmation toast */}
            <AnimatePresence>
                {showConfirmation && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-12 right-0 flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-lg whitespace-nowrap"
                    >
                        <Check className="w-4 h-4" />
                        Tours reset! Refresh to restart.
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DevTourReset;
