import React, { useEffect, useRef, forwardRef, ReactNode } from 'react';
import anime from 'animejs';
import { createRipple } from '../hooks/useAnime';

// ============================================
// GLASSMORPHIC CARD
// ============================================
interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  delay?: number;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = '', hover = true, onClick, delay = 0 }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const combinedRef = ref || cardRef;

    useEffect(() => {
      if (cardRef.current) {
        anime({
          targets: cardRef.current,
          opacity: [0, 1],
          translateY: [30, 0],
          scale: [0.97, 1],
          duration: 700,
          delay,
          easing: 'easeOutExpo',
        });
      }
    }, [delay]);

    const handleMouseEnter = () => {
      if (hover && cardRef.current) {
        anime({
          targets: cardRef.current,
          scale: 1.02,
          translateY: -4,
          duration: 300,
          easing: 'easeOutCubic',
        });
      }
    };

    const handleMouseLeave = () => {
      if (hover && cardRef.current) {
        anime({
          targets: cardRef.current,
          scale: 1,
          translateY: 0,
          duration: 300,
          easing: 'easeOutCubic',
        });
      }
    };

    return (
      <div
        ref={cardRef}
        className={`
          relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70
          border border-white/20 dark:border-gray-700/30
          rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]
          transition-shadow duration-300
          ${hover ? 'cursor-pointer hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)]' : ''}
          ${className}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

// ============================================
// ANIMATED BUTTON WITH RIPPLE
// ============================================
interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  fullWidth = false,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const variants = {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25',
    secondary: 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-2 border-gray-200 dark:border-gray-600 hover:border-emerald-400 hover:text-emerald-600',
    ghost: 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-lg shadow-red-500/25',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-3',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      createRipple(e);
      onClick?.(e);
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden inline-flex items-center justify-center
        font-semibold rounded-2xl transition-all duration-300
        transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {icon && iconPosition === 'left' && !loading && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && !loading && <span className="flex-shrink-0">{icon}</span>}
    </button>
  );
};

// ============================================
// STAT CARD WITH ANIMATED NUMBER
// ============================================
interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  trend?: { value: number; positive: boolean };
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple';
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  suffix = '',
  prefix = '',
  trend,
  color = 'emerald',
  delay = 0,
}) => {
  const valueRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const colors = {
    emerald: 'from-emerald-500 to-teal-500 bg-emerald-50 dark:bg-emerald-900/20',
    blue: 'from-blue-500 to-cyan-500 bg-blue-50 dark:bg-blue-900/20',
    amber: 'from-amber-500 to-orange-500 bg-amber-50 dark:bg-amber-900/20',
    rose: 'from-rose-500 to-pink-500 bg-rose-50 dark:bg-rose-900/20',
    purple: 'from-purple-500 to-indigo-500 bg-purple-50 dark:bg-purple-900/20',
  };

  useEffect(() => {
    // Animate card entrance
    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        opacity: [0, 1],
        translateY: [40, 0],
        scale: [0.9, 1],
        duration: 800,
        delay,
        easing: 'easeOutExpo',
      });
    }

    // Animate number counter
    if (valueRef.current) {
      const obj = { val: 0 };
      anime({
        targets: obj,
        val: value,
        duration: 1500,
        delay: delay + 200,
        easing: 'easeOutExpo',
        round: 1,
        update: () => {
          if (valueRef.current) {
            valueRef.current.textContent = `${prefix}${obj.val.toLocaleString()}${suffix}`;
          }
        },
      });
    }
  }, [value, prefix, suffix, delay]);

  return (
    <div
      ref={cardRef}
      className="relative p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Background Gradient Blob */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} opacity-10 group-hover:opacity-20 group-hover:scale-150 transition-all duration-700`} />
      
      {/* Icon */}
      <div className={`inline-flex p-3 rounded-2xl ${colors[color].split(' ')[2]} ${colors[color].split(' ')[3]} mb-4`}>
        <div className={`w-6 h-6 bg-gradient-to-br ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} bg-clip-text text-transparent`}>
          {icon}
        </div>
      </div>

      {/* Label */}
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span ref={valueRef} className="text-3xl font-bold text-gray-900 dark:text-white">
          {prefix}0{suffix}
        </span>
        {trend && (
          <span className={`text-sm font-semibold ${trend.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================
// FLOATING ACTION BUTTON
// ============================================
interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick: () => void;
  tooltip?: string;
  color?: 'primary' | 'secondary';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  tooltip,
  color = 'primary',
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      anime({
        targets: buttonRef.current,
        scale: [0, 1],
        rotate: [180, 0],
        duration: 600,
        easing: 'easeOutBack',
      });
    }
  }, []);

  const colors = {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/40',
    secondary: 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/40',
  };

  return (
    <button
      ref={buttonRef}
      onClick={(e) => {
        createRipple(e);
        onClick();
      }}
      title={tooltip}
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        ${colors[color]}
        text-white shadow-2xl
        flex items-center justify-center
        hover:scale-110 active:scale-95
        transition-transform duration-200
        overflow-hidden
      `}
      style={{ transform: 'scale(0)' }}
    >
      {icon}
    </button>
  );
};

// ============================================
// ANIMATED ICON WRAPPER
// ============================================
interface AnimatedIconProps {
  children: ReactNode;
  animation?: 'bounce' | 'pulse' | 'spin' | 'float';
  className?: string;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  children,
  animation = 'float',
  className = '',
}) => {
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!iconRef.current) return;

    const animations = {
      bounce: {
        translateY: [-5, 5, -5],
        duration: 1500,
        loop: true,
        easing: 'easeInOutQuad',
      },
      pulse: {
        scale: [1, 1.1, 1],
        duration: 1000,
        loop: true,
        easing: 'easeInOutQuad',
      },
      spin: {
        rotate: [0, 360],
        duration: 2000,
        loop: true,
        easing: 'linear',
      },
      float: {
        translateY: [-3, 3],
        duration: 2000,
        loop: true,
        direction: 'alternate' as const,
        easing: 'easeInOutSine',
      },
    };

    anime({
      targets: iconRef.current,
      ...animations[animation],
    });
  }, [animation]);

  return (
    <div ref={iconRef} className={className}>
      {children}
    </div>
  );
};

// ============================================
// PROGRESS RING
// ============================================
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showValue?: boolean;
  label?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#10B981',
  bgColor = '#E5E7EB',
  showValue = true,
  label,
}) => {
  const circleRef = useRef<SVGCircleElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    if (circleRef.current) {
      anime({
        targets: circleRef.current,
        strokeDashoffset: [circumference, circumference - (progress / 100) * circumference],
        duration: 1500,
        delay: 300,
        easing: 'easeOutExpo',
      });
    }

    if (valueRef.current) {
      const obj = { val: 0 };
      anime({
        targets: obj,
        val: progress,
        duration: 1500,
        delay: 300,
        easing: 'easeOutExpo',
        round: 1,
        update: () => {
          if (valueRef.current) {
            valueRef.current.textContent = `${obj.val}%`;
          }
        },
      });
    }
  }, [progress, circumference]);

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span ref={valueRef} className="text-2xl font-bold text-gray-900 dark:text-white">0%</span>
          {label && <span className="text-xs text-gray-500 mt-1">{label}</span>}
        </div>
      )}
    </div>
  );
};

// ============================================
// SKELETON LOADER
// ============================================
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: number | string;
  height?: number | string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const variants = {
    text: 'rounded-md h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-2xl',
  };

  return (
    <div
      className={`
        animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700
        bg-[length:200%_100%] animate-shimmer
        ${variants[variant]}
        ${className}
      `}
      style={{ width, height }}
    />
  );
};

// ============================================
// EMPTY STATE
// ============================================
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      anime({
        targets: containerRef.current.children,
        opacity: [0, 1],
        translateY: [30, 0],
        delay: anime.stagger(150),
        duration: 800,
        easing: 'easeOutExpo',
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-6 opacity-0">
        <div className="text-gray-400 dark:text-gray-500">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 opacity-0">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6 opacity-0">{description}</p>
      {action && (
        <div className="opacity-0">
          <AnimatedButton onClick={action.onClick}>{action.label}</AnimatedButton>
        </div>
      )}
    </div>
  );
};

export default {
  GlassCard,
  AnimatedButton,
  StatCard,
  FloatingActionButton,
  AnimatedIcon,
  ProgressRing,
  Skeleton,
  EmptyState,
};
