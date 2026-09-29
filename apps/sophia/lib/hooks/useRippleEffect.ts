"use client";

import { useState, useCallback, useRef } from "react";

export interface Ripple {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export const useRippleEffect = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleTimeoutRef = useRef<NodeJS.Timeout>();
  const rippleIdRef = useRef(0);

  const createRipple = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e as any).clientX - rect.left;
    const y = (e as any).clientY - rect.top;
    const size = Math.max(rect.width, rect.height);
    const id = `ripple-${++rippleIdRef.current}`;

    const newRipple: Ripple = {
      id,
      x,
      y,
      size: 0,
      opacity: 0.6,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Animate ripple
    const startTime = Date.now();
    const animationDuration = 600;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      setRipples((prev) =>
        prev.map((ripple) =>
          ripple.id === id
            ? {
                ...ripple,
                size: size * progress,
                opacity: 0.6 * (1 - progress),
              }
            : ripple
        )
      );

      if (progress < 1) {
        rippleTimeoutRef.current = requestAnimationFrame(animate);
      } else {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }
    };

    rippleTimeoutRef.current = requestAnimationFrame(animate);
  }, []);

  return { ripples, createRipple };
};

export default useRippleEffect;
