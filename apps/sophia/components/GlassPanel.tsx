"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRippleEffect, type Ripple } from "@lib/hooks/useRippleEffect";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  interactive?: boolean;
  hoverEffect?: boolean;
  blur?: "sm" | "md" | "lg" | "xl";
  border?: "subtle" | "medium" | "bright";
  variant?: "dark" | "light";
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = "",
  onClick,
  interactive = true,
  hoverEffect = true,
  blur = "md",
  border = "subtle",
  variant = "dark",
}) => {
  const { ripples, createRipple } = useRippleEffect();
  const panelRef = React.useRef<HTMLDivElement>(null);

  const blurMap = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl",
  };

  const borderMap = {
    subtle: "border border-white/5",
    medium: "border border-white/10",
    bright: "border border-white/20",
  };

  const variantMap = {
    dark: "bg-navy-900/40",
    light: "bg-white/10",
  };

  const handleClick = (e: React.MouseEvent) => {
    if (interactive) {
      createRipple(e);
    }
    onClick?.(e);
  };

  return (
    <motion.div
      ref={panelRef}
      className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
        hoverEffect ? "hover:border-white/20 hover:bg-white/15" : ""
      } ${blurMap[blur]} ${borderMap[border]} ${variantMap[variant]} ${className}`}
      whileHover={
        hoverEffect
          ? {
              scale: 1.02,
              boxShadow: "0 25px 50px rgba(124, 58, 237, 0.3)",
            }
          : undefined
      }
      whileTap={
        interactive ? { scale: 0.98 } : undefined
      }
      onClick={handleClick}
      style={{
        WebkitBackdropFilter: "blur(12px)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Ripple effect container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full bg-white pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              opacity: ripple.opacity,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      {/* Reflective shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassPanel;
