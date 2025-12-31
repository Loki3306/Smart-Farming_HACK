import React from "react";

// Rolling Hills Landscape - For dashboard header
export const RollingHillsLandscape: React.FC<{ className?: string }> = ({
    className = "",
}) => (
    <svg
        viewBox="0 0 1200 200"
        className={`w-full ${className}`}
        preserveAspectRatio="xMidYMax slice"
    >
        <defs>
            {/* Sky Gradient */}
            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(200, 70%, 85%)" />
                <stop offset="100%" stopColor="hsl(45, 40%, 96%)" />
            </linearGradient>

            {/* Hill Gradients */}
            <linearGradient id="hillBack" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(152, 35%, 55%)" />
                <stop offset="100%" stopColor="hsl(152, 40%, 45%)" />
            </linearGradient>

            <linearGradient id="hillMid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(152, 45%, 48%)" />
                <stop offset="100%" stopColor="hsl(152, 50%, 38%)" />
            </linearGradient>

            <linearGradient id="hillFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(95, 50%, 50%)" />
                <stop offset="100%" stopColor="hsl(95, 55%, 40%)" />
            </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="1200" height="200" fill="url(#skyGradient)" />

        {/* Sun */}
        <circle cx="1050" cy="50" r="35" fill="hsl(42, 95%, 65%)" opacity="0.9" />
        <circle cx="1050" cy="50" r="45" fill="hsl(42, 90%, 70%)" opacity="0.3" />

        {/* Clouds */}
        <g fill="white" opacity="0.8">
            <ellipse cx="200" cy="40" rx="50" ry="20" />
            <ellipse cx="230" cy="35" rx="40" ry="18" />
            <ellipse cx="170" cy="38" rx="35" ry="15" />

            <ellipse cx="600" cy="55" rx="45" ry="18" />
            <ellipse cx="625" cy="50" rx="35" ry="15" />
            <ellipse cx="575" cy="52" rx="30" ry="13" />

            <ellipse cx="900" cy="35" rx="40" ry="16" />
            <ellipse cx="925" cy="32" rx="30" ry="13" />
        </g>

        {/* Back Hills */}
        <path
            d="M0 200 Q150 100 300 140 Q450 80 600 120 Q750 70 900 110 Q1050 60 1200 100 L1200 200 Z"
            fill="url(#hillBack)"
            opacity="0.7"
        />

        {/* Middle Hills */}
        <path
            d="M0 200 Q100 130 250 160 Q400 110 550 145 Q700 100 850 135 Q1000 90 1200 130 L1200 200 Z"
            fill="url(#hillMid)"
            opacity="0.85"
        />

        {/* Windmill Silhouette */}
        <g transform="translate(950, 85)">
            <rect x="-3" y="0" width="6" height="50" fill="hsl(25, 30%, 35%)" />
            <polygon
                points="0,-5 -30,8 0,5 30,8"
                fill="hsl(25, 30%, 40%)"
                style={{ transformOrigin: "0 0" }}
            />
        </g>

        {/* Barn Silhouette */}
        <g transform="translate(150, 110)">
            <rect x="0" y="20" width="50" height="35" fill="hsl(15, 60%, 45%)" />
            <polygon points="0,20 25,-5 50,20" fill="hsl(15, 55%, 40%)" />
            <rect x="20" y="35" width="12" height="20" fill="hsl(25, 40%, 30%)" />
            <rect x="5" y="28" width="10" height="8" fill="hsl(45, 40%, 75%)" />
            <rect x="35" y="28" width="10" height="8" fill="hsl(45, 40%, 75%)" />
        </g>

        {/* Front Hills */}
        <path
            d="M0 200 Q80 165 200 180 Q350 145 500 170 Q650 135 800 160 Q950 130 1100 155 Q1150 145 1200 160 L1200 200 Z"
            fill="url(#hillFront)"
        />

        {/* Tractor Silhouette */}
        <g transform="translate(700, 155)">
            <rect x="0" y="10" width="35" height="18" rx="3" fill="hsl(42, 75%, 50%)" />
            <rect x="25" y="2" width="15" height="18" rx="2" fill="hsl(42, 75%, 55%)" />
            <circle cx="8" cy="30" r="10" fill="hsl(25, 30%, 25%)" />
            <circle cx="32" cy="28" r="7" fill="hsl(25, 30%, 25%)" />
            <circle cx="8" cy="30" r="5" fill="hsl(25, 30%, 35%)" />
            <circle cx="32" cy="28" r="4" fill="hsl(25, 30%, 35%)" />
        </g>

        {/* Fence Posts */}
        <g fill="hsl(25, 35%, 40%)">
            <rect x="400" y="170" width="3" height="20" />
            <rect x="430" y="172" width="3" height="18" />
            <rect x="460" y="174" width="3" height="16" />
            <line
                x1="400"
                y1="178"
                x2="460"
                y2="182"
                stroke="hsl(25, 35%, 45%)"
                strokeWidth="2"
            />
        </g>
    </svg>
);

// Decorative Wheat/Crop Pattern
export const WheatPattern: React.FC<{ className?: string }> = ({
    className = "",
}) => (
    <svg viewBox="0 0 100 40" className={className}>
        <g stroke="hsl(42, 70%, 50%)" fill="none" strokeWidth="1.5">
            <path d="M10 40 Q10 25 15 20 Q10 22 10 28" />
            <ellipse cx="15" cy="18" rx="3" ry="6" fill="hsl(42, 75%, 55%)" />

            <path d="M30 40 Q30 22 35 15 Q30 18 30 25" />
            <ellipse cx="35" cy="13" rx="3" ry="6" fill="hsl(42, 75%, 55%)" />

            <path d="M50 40 Q50 20 55 12 Q50 15 50 22" />
            <ellipse cx="55" cy="10" rx="3" ry="6" fill="hsl(42, 75%, 55%)" />

            <path d="M70 40 Q70 23 75 17 Q70 20 70 26" />
            <ellipse cx="75" cy="15" rx="3" ry="6" fill="hsl(42, 75%, 55%)" />

            <path d="M90 40 Q90 26 95 22 Q90 24 90 29" />
            <ellipse cx="95" cy="20" rx="3" ry="6" fill="hsl(42, 75%, 55%)" />
        </g>
    </svg>
);

// Sun Icon with Rays
export const SunIcon: React.FC<{ className?: string; size?: number }> = ({
    className = "",
    size = 24,
}) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <circle cx="12" cy="12" r="5" fill="hsl(42, 90%, 55%)" />
        <g stroke="hsl(42, 85%, 50%)" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="23" />
            <line x1="1" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
            <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
            <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
            <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
        </g>
    </svg>
);

// Friendly Cloud Icon
export const CloudIcon: React.FC<{ className?: string; size?: number }> = ({
    className = "",
    size = 24,
}) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
            d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
            fill="hsl(200, 30%, 85%)"
            stroke="hsl(200, 40%, 70%)"
            strokeWidth="1"
        />
    </svg>
);

// Water Drop Icon
export const WaterDropIcon: React.FC<{ className?: string; size?: number }> = ({
    className = "",
    size = 24,
}) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
            d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
            fill="hsl(200, 70%, 55%)"
            stroke="hsl(200, 75%, 45%)"
            strokeWidth="1"
        />
    </svg>
);

// Plant/Leaf Icon
export const PlantIcon: React.FC<{ className?: string; size?: number }> = ({
    className = "",
    size = 24,
}) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
            d="M12 22V8M12 8C12 8 8 6 8 2c4 0 6 4 6 6M12 14C12 14 16 12 16 8c-4 0-6 4-6 6"
            stroke="hsl(152, 50%, 40%)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
        />
        <path
            d="M12 8C12 8 8 6 8 2c4 0 6 4 6 6"
            fill="hsl(152, 50%, 50%)"
            opacity="0.5"
        />
        <path
            d="M12 14C12 14 16 12 16 8c-4 0-6 4-6 6"
            fill="hsl(95, 50%, 50%)"
            opacity="0.5"
        />
    </svg>
);

// Soil/Ground Icon
export const SoilIcon: React.FC<{ className?: string; size?: number }> = ({
    className = "",
    size = 24,
}) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <rect
            x="2"
            y="14"
            width="20"
            height="8"
            rx="2"
            fill="hsl(25, 40%, 35%)"
        />
        <circle cx="6" cy="17" r="1.5" fill="hsl(25, 35%, 45%)" />
        <circle cx="12" cy="19" r="1" fill="hsl(25, 35%, 45%)" />
        <circle cx="18" cy="17" r="1.5" fill="hsl(25, 35%, 45%)" />
        <path
            d="M8 14V10M8 10C8 10 6 9 6 7c2 0 3 2 3 3M8 10C8 10 10 9 10 7c-2 0-3 2-3 3"
            stroke="hsl(152, 50%, 45%)"
            strokeWidth="1.5"
            fill="none"
        />
        <path
            d="M16 14V11M16 11C16 11 14 10 14 8c2 0 3 2 3 3M16 11C16 11 18 10 18 8c-2 0-3 2-3 3"
            stroke="hsl(95, 50%, 50%)"
            strokeWidth="1.5"
            fill="none"
        />
    </svg>
);

// Barn Icon for Control Center
export const BarnIcon: React.FC<{ className?: string; size?: number }> = ({
    className = "",
    size = 24,
}) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path d="M3 21V10L12 3L21 10V21H3Z" fill="hsl(15, 60%, 50%)" />
        <path d="M3 10L12 3L21 10" fill="hsl(15, 55%, 40%)" />
        <rect x="10" y="14" width="4" height="7" fill="hsl(25, 40%, 30%)" />
        <rect x="5" y="12" width="3" height="3" fill="hsl(45, 40%, 75%)" />
        <rect x="16" y="12" width="3" height="3" fill="hsl(45, 40%, 75%)" />
        <circle cx="12" cy="8" r="2" fill="hsl(45, 40%, 75%)" />
    </svg>
);

// Card Header Decoration - Wavy Line
export const WavyDivider: React.FC<{ className?: string; color?: string }> = ({
    className = "",
    color = "hsl(42, 85%, 55%)",
}) => (
    <svg viewBox="0 0 200 10" className={className} preserveAspectRatio="none">
        <path
            d="M0 5 Q25 0 50 5 T100 5 T150 5 T200 5"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
        />
    </svg>
);
