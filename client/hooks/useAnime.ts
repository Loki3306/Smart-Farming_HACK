import { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';

// Reusable anime.js hook for declarative animations
export const useAnime = (config: anime.AnimeParams, deps: any[] = []) => {
  const ref = useRef<HTMLElement>(null);
  const animationRef = useRef<anime.AnimeInstance | null>(null);

  useEffect(() => {
    if (ref.current) {
      animationRef.current = anime({
        targets: ref.current,
        ...config,
      });
    }
    return () => {
      animationRef.current?.pause();
    };
  }, deps);

  return ref;
};

// Stagger animation hook for lists
export const useStaggerAnime = (selector: string, config: anime.AnimeParams = {}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const animate = useCallback(() => {
    if (containerRef.current) {
      anime({
        targets: containerRef.current.querySelectorAll(selector),
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.95, 1],
        duration: 600,
        delay: anime.stagger(80, { start: 100 }),
        easing: 'easeOutExpo',
        ...config,
      });
    }
  }, [selector, config]);

  useEffect(() => {
    animate();
  }, [animate]);

  return { containerRef, animate };
};

// Hover animation factory
export const createHoverAnimation = (target: HTMLElement, options?: {
  scale?: number;
  duration?: number;
  shadow?: boolean;
}) => {
  const { scale = 1.02, duration = 300, shadow = true } = options || {};

  const enter = () => {
    anime({
      targets: target,
      scale,
      boxShadow: shadow ? '0 20px 40px rgba(0,0,0,0.12)' : undefined,
      duration,
      easing: 'easeOutCubic',
    });
  };

  const leave = () => {
    anime({
      targets: target,
      scale: 1,
      boxShadow: shadow ? '0 4px 12px rgba(0,0,0,0.05)' : undefined,
      duration,
      easing: 'easeOutCubic',
    });
  };

  return { enter, leave };
};

// Page transition animations
export const pageTransitions = {
  fadeIn: {
    opacity: [0, 1],
    duration: 500,
    easing: 'easeOutQuad',
  },
  slideUp: {
    opacity: [0, 1],
    translateY: [40, 0],
    duration: 700,
    easing: 'easeOutExpo',
  },
  scaleIn: {
    opacity: [0, 1],
    scale: [0.9, 1],
    duration: 600,
    easing: 'easeOutBack',
  },
  slideInLeft: {
    opacity: [0, 1],
    translateX: [-50, 0],
    duration: 600,
    easing: 'easeOutExpo',
  },
  slideInRight: {
    opacity: [0, 1],
    translateX: [50, 0],
    duration: 600,
    easing: 'easeOutExpo',
  },
};

// Number counter animation
export const animateNumber = (
  element: HTMLElement,
  endValue: number,
  options?: {
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
  }
) => {
  const { duration = 1200, prefix = '', suffix = '', decimals = 0 } = options || {};
  
  const obj = { value: 0 };
  
  anime({
    targets: obj,
    value: endValue,
    duration,
    easing: 'easeOutExpo',
    round: decimals === 0 ? 1 : Math.pow(10, -decimals),
    update: () => {
      element.textContent = `${prefix}${obj.value.toFixed(decimals)}${suffix}`;
    },
  });
};

// Morphing blob animation for backgrounds
export const createBlobAnimation = (target: SVGPathElement, paths: string[]) => {
  let currentPath = 0;
  
  const morph = () => {
    currentPath = (currentPath + 1) % paths.length;
    anime({
      targets: target,
      d: [{ value: paths[currentPath] }],
      duration: 4000,
      easing: 'easeInOutQuad',
      complete: morph,
    });
  };
  
  morph();
};

// Ripple effect for buttons
export const createRipple = (event: React.MouseEvent<HTMLElement>) => {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    transform: scale(0);
    pointer-events: none;
  `;

  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.appendChild(ripple);

  anime({
    targets: ripple,
    scale: [0, 2.5],
    opacity: [1, 0],
    duration: 600,
    easing: 'easeOutExpo',
    complete: () => ripple.remove(),
  });
};

// Smooth scroll animation
export const smoothScrollTo = (targetY: number, duration = 800) => {
  anime({
    targets: { y: window.scrollY },
    y: targetY,
    duration,
    easing: 'easeInOutQuad',
    update: (anim) => {
      const obj = anim.animations[0].currentValue;
      window.scrollTo(0, Number(obj));
    },
  });
};

// Shake animation for errors
export const shakeElement = (element: HTMLElement) => {
  anime({
    targets: element,
    translateX: [0, -10, 10, -10, 10, -5, 5, 0],
    duration: 500,
    easing: 'easeInOutQuad',
  });
};

// Pulse animation for attention
export const pulseElement = (element: HTMLElement, color = 'rgba(34, 197, 94, 0.3)') => {
  anime({
    targets: element,
    boxShadow: [
      `0 0 0 0 ${color}`,
      `0 0 0 15px transparent`,
    ],
    duration: 1000,
    easing: 'easeOutQuad',
    loop: 2,
  });
};

export default anime;
