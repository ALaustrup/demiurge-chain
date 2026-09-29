"use client";

import { useEffect, useRef, useState } from "react";

interface CursorPosition {
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
}

export const useCursorTracker = (
  elementRef?: React.RefObject<HTMLElement>,
  options = { smooth: true, scale: 1 }
) => {
  const [cursor, setCursor] = useState<CursorPosition>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
  });

  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const element = elementRef?.current || window;
      const isWindow = element === window;

      const x = e.clientX;
      const y = e.clientY;

      const vx = x - lastPosRef.current.x;
      const vy = y - lastPosRef.current.y;

      lastPosRef.current = { x, y };

      if (options.smooth) {
        setCursor((prev) => ({
          x: prev.x + (x - prev.x) * 0.15,
          y: prev.y + (y - prev.y) * 0.15,
          vx: vx * options.scale,
          vy: vy * options.scale,
        }));
      } else {
        setCursor({
          x,
          y,
          vx: vx * options.scale,
          vy: vy * options.scale,
        });
      }
    };

    const target = elementRef?.current || window;
    target.addEventListener("mousemove", handleMouseMove);

    return () => {
      target.removeEventListener("mousemove", handleMouseMove);
    };
  }, [elementRef, options]);

  return cursor;
};

export default useCursorTracker;
