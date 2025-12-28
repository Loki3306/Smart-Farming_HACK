import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { useFarmContext } from '../../context/FarmContext';
import { SystemStatusChart } from './SystemStatusChart';

/**
 * Floating Action Button that opens the System Status Chart
 * Shows current AI mode with subtle animations
 */
export const SystemStatusFab: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { systemStatus } = useFarmContext();

    const isAutonomous = systemStatus?.isAutonomous ?? false;

    return (
        <>
            {/* FAB Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-colors ${isAutonomous
                    ? 'bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'
                    : 'bg-gradient-to-br from-muted to-muted/80 hover:from-muted/90 hover:to-muted/70 border border-border'
                    }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                {/* Pulse animation for autonomous mode */}
                {isAutonomous && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-primary/30"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                )}

                <Brain
                    className={`w-6 h-6 ${isAutonomous ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                />
            </motion.button>

            {/* Tooltip */}
            <motion.div
                className="fixed bottom-[88px] right-6 z-[9999] px-3 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-lg shadow-lg border border-border pointer-events-none"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? 10 : 0 }}
                transition={{ delay: 1 }}
            >
                {isAutonomous ? '🤖 AI Status' : '🔒 Manual Mode'}
            </motion.div>

            {/* Chart Modal */}
            <SystemStatusChart isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};
