import React, { useState, useEffect } from "react";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'framer-motion';

interface EnhancedGaugeProps {
    value: number;
    max?: number;
    min?: number;
    label: string;
    unit: string;
    size?: "sm" | "md" | "lg";
    color?: "emerald" | "blue" | "amber" | "red" | "purple";
    showMinMax?: boolean;
}

export const EnhancedGauge: React.FC<EnhancedGaugeProps> = ({
    value,
    max = 100,
    min = 0,
    label,
    unit,
    size = "md",
    color = "emerald",
    showMinMax = true,
}) => {
    const [displayValue, setDisplayValue] = useState(min);

    useEffect(() => {
        // Animate value on mount and when value changes
        const timer = setTimeout(() => {
            setDisplayValue(value);
        }, 100);
        return () => clearTimeout(timer);
    }, [value]);

    const percentage = ((displayValue - min) / (max - min)) * 100;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));

    const sizeStyles = {
        sm: { container: "w-32 h-32", text: "text-lg", label: "text-xs" },
        md: { container: "w-48 h-48", text: "text-3xl", label: "text-sm" },
        lg: { container: "w-64 h-64", text: "text-4xl", label: "text-base" },
    };

    const colorConfig = {
        emerald: {
            pathColor: "rgba(16, 185, 129, 1)",
            trailColor: "rgba(16, 185, 129, 0.15)",
            textColor: "hsl(152, 50%, 32%)",
        },
        blue: {
            pathColor: "rgba(59, 130, 246, 1)",
            trailColor: "rgba(59, 130, 246, 0.15)",
            textColor: "hsl(217, 91%, 60%)",
        },
        amber: {
            pathColor: "rgba(245, 158, 11, 1)",
            trailColor: "rgba(245, 158, 11, 0.15)",
            textColor: "hsl(38, 92%, 50%)",
        },
        red: {
            pathColor: "rgba(239, 68, 68, 1)",
            trailColor: "rgba(239, 68, 68, 0.15)",
            textColor: "hsl(0, 84%, 60%)",
        },
        purple: {
            pathColor: "rgba(168, 85, 247, 1)",
            trailColor: "rgba(168, 85, 247, 0.15)",
            textColor: "hsl(271, 91%, 65%)",
        },
    };

    const currentColor = colorConfig[color];

    return (
        <motion.div
            className="flex flex-col items-center justify-center gap-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className={`${sizeStyles[size].container} relative`}>
                <CircularProgressbar
                    value={clampedPercentage}
                    text={`${displayValue.toFixed(1)}${unit}`}
                    styles={buildStyles({
                        // Rotation of path and trail, in number of turns (0-1)
                        rotation: 0.25,

                        // Whether to use rounded or flat corners on the ends
                        strokeLinecap: 'round',

                        // Text size
                        textSize: '14px',

                        // How long animation takes to go from one percentage to another, in seconds
                        pathTransitionDuration: 1.2,

                        // Colors
                        pathColor: currentColor.pathColor,
                        textColor: currentColor.textColor,
                        trailColor: currentColor.trailColor,

                        // Add glow effect
                        backgroundColor: 'transparent',
                    })}
                    strokeWidth={8}
                />

                {/* Animated glow ring */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        boxShadow: `0 0 20px ${currentColor.pathColor}40`,
                    }}
                    animate={{
                        boxShadow: [
                            `0 0 20px ${currentColor.pathColor}40`,
                            `0 0 30px ${currentColor.pathColor}60`,
                            `0 0 20px ${currentColor.pathColor}40`,
                        ],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>

            {/* Label and min/max */}
            <div className="text-center">
                <div className={`${sizeStyles[size].label} font-semibold text-foreground`}>
                    {label}
                </div>
                {showMinMax && (
                    <div className="text-xs text-muted-foreground mt-1">
                        Min: {min} · Max: {max}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
