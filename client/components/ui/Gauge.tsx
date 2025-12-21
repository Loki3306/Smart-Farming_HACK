import React, { useState, useEffect } from "react";

interface GaugeProps {
  value: number;
  max?: number;
  min?: number;
  label: string;
  unit: string;
  size?: "sm" | "md" | "lg";
  color?: "emerald" | "blue" | "amber" | "red";
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  max = 100,
  min = 0,
  label,
  unit,
  size = "md",
  color = "emerald",
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue((prev) => {
        const diff = value - prev;
        if (Math.abs(diff) < 0.5) return value;
        return prev + diff * 0.1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [value]);

  const percentage = ((displayValue - min) / (max - min)) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  const sizeStyles = {
    sm: { container: "w-32 h-32", text: "text-lg", label: "text-xs" },
    md: { container: "w-48 h-48", text: "text-3xl", label: "text-sm" },
    lg: { container: "w-64 h-64", text: "text-4xl", label: "text-base" },
  };

  const colorStyles = {
    emerald: "from-emerald-600 to-emerald-400",
    blue: "from-blue-600 to-blue-400",
    amber: "from-amber-600 to-amber-400",
    red: "from-red-600 to-red-400",
  };

  const rotation = (clampedPercentage / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizeStyles[size].container} relative rounded-full bg-gradient-to-br from-muted to-muted/50 p-2 border border-border`}
      >
        {/* Background circle */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 200 200"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(46, 125, 50, 0.2)" />
              <stop offset="100%" stopColor="rgba(76, 175, 80, 0.1)" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d="M 40 180 A 80 80 0 0 1 160 180"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Filled arc */}
          <path
            d="M 40 180 A 80 80 0 0 1 160 180"
            fill="none"
            stroke={`url(#gaugeGradient)`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(clampedPercentage / 100) * 251.2} 251.2`}
            style={{
              filter: `drop-shadow(0 0 3px rgba(46, 125, 50, 0.5))`,
              transition: "stroke-dasharray 0.3s ease-out",
            }}
            opacity="0.9"
          />

          {/* Needle */}
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "100px 100px",
              transition: "transform 0.3s ease-out",
            }}
          >
            <circle cx="100" cy="100" r="6" fill="hsl(var(--primary))" />
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>

          {/* Center dot */}
          <circle cx="100" cy="100" r="4" fill="hsl(var(--primary))" />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`${sizeStyles[size].text} font-bold text-primary`}>
            {displayValue.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">{unit}</div>
        </div>
      </div>

      {/* Label and min/max */}
      <div className="text-center">
        <div className={`${sizeStyles[size].label} font-semibold text-foreground`}>
          {label}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Min: {min} · Max: {max}
        </div>
      </div>
    </div>
  );
};
