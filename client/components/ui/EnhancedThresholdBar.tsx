import React from 'react';
import { motion } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface EnhancedThresholdBarProps {
    label: string;
    icon: React.ReactNode;
    value: number;
    range: [number, number];
    unit?: string;
    maxDisplay?: number;
}

export const EnhancedThresholdBar: React.FC<EnhancedThresholdBarProps> = ({
    label,
    icon,
    value,
    range,
    unit = '',
    maxDisplay = 150
}) => {
    const [min, max] = range;
    const percentage = Math.min((value / maxDisplay) * 100, 100);
    const minPercentage = (min / maxDisplay) * 100;
    const maxPercentage = (max / maxDisplay) * 100;

    // Determine status
    let status: 'optimal' | 'warning' | 'critical';
    let statusColor: string;
    let barColor: string;
    let circularColor: string;

    if (value >= min && value <= max * 1.2) {
        status = 'optimal';
        statusColor = 'text-green-600 dark:text-green-400';
        barColor = 'bg-green-500';
        circularColor = 'rgba(34, 197, 94, 1)';
    } else if (value >= min * 0.7 || value <= max * 1.5) {
        status = 'warning';
        statusColor = 'text-amber-600 dark:text-amber-400';
        barColor = 'bg-amber-500';
        circularColor = 'rgba(245, 158, 11, 1)';
    } else {
        status = 'critical';
        statusColor = 'text-red-600 dark:text-red-400';
        barColor = 'bg-red-500';
        circularColor = 'rgba(239, 68, 68, 1)';
    }

    const circularPercentage = Math.min((value / max) * 100, 100);

    return (
        <motion.div
            className="space-y-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Circular mini indicator */}
                    <div className="relative w-12 h-12">
                        <CircularProgressbar
                            value={circularPercentage}
                            styles={buildStyles({
                                strokeLinecap: 'round',
                                pathTransitionDuration: 1,
                                pathColor: circularColor,
                                trailColor: `${circularColor}20`,
                            })}
                            strokeWidth={10}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                {icon}
                            </div>
                        </div>
                    </div>
                    <span className="font-medium text-foreground">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <motion.span
                        className="font-bold text-foreground text-lg"
                        key={value}
                        initial={{ scale: 1.2, color: circularColor }}
                        animate={{ scale: 1, color: 'inherit' }}
                        transition={{ duration: 0.3 }}
                    >
                        {typeof value === 'number' ? value.toFixed(1) : value}{unit}
                    </motion.span>
                    <span className="text-xs text-muted-foreground">[{min}-{max}]</span>
                    <motion.span
                        className={`text-sm font-semibold ${statusColor}`}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: status !== 'optimal' ? Infinity : 0, repeatDelay: 1 }}
                    >
                        {status === 'optimal' ? '✓' : status === 'warning' ? '⚠' : '🚨'}
                    </motion.span>
                </div>
            </div>

            {/* Enhanced Bar visualization */}
            <div className="relative h-4 bg-muted rounded-full overflow-hidden shadow-inner">
                {/* Optimal range indicator */}
                <motion.div
                    className="absolute h-full bg-green-200 dark:bg-green-900/50"
                    style={{
                        left: `${minPercentage}%`,
                        width: `${maxPercentage - minPercentage}%`
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                />

                {/* Current value bar with gradient */}
                <motion.div
                    className={`absolute h-full ${barColor} rounded-full shadow-lg`}
                    style={{
                        background: `linear-gradient(90deg, ${circularColor}80, ${circularColor})`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />

                {/* Animated shimmer effect */}
                <motion.div
                    className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                        x: ['-100%', '300%'],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: 'easeInOut',
                    }}
                />

                {/* Min/Max markers with labels */}
                <div
                    className="absolute h-full w-1 bg-green-600 dark:bg-green-400 shadow-md"
                    style={{ left: `${minPercentage}%` }}
                >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
                        Min
                    </div>
                </div>
                <div
                    className="absolute h-full w-1 bg-green-600 dark:bg-green-400 shadow-md"
                    style={{ left: `${maxPercentage}%` }}
                >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
                        Max
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
