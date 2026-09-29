"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimatedBackgroundProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  className = "",
  intensity = "medium",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
      color: string;
    }> = [];

    const particleCount =
      intensity === "low" ? 30 : intensity === "medium" ? 60 : 100;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? "#7C3AED" : "#06B6D4",
      });
    }

    const mouseTrail: Array<{ x: number; y: number; opacity: number }> = [];

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      // Add to mouse trail
      mouseTrail.push({
        x: e.clientX,
        y: e.clientY,
        opacity: 1,
      });

      // Keep trail limited
      if (mouseTrail.length > 50) {
        mouseTrail.shift();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      // Clear canvas with semi-transparent background for motion trail effect
      ctx.fillStyle = "rgba(15, 23, 42, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "rgba(15, 23, 42, 0)");
      gradient.addColorStop(0.5, "rgba(124, 58, 237, 0.05)");
      gradient.addColorStop(1, "rgba(6, 182, 212, 0.03)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        // Movement
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();

        // Attraction to mouse
        const dx = mousePos.x - particle.x;
        const dy = mousePos.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          const force = (150 - distance) / 150;
          particle.vx += (dx / distance) * force * 0.03;
          particle.vy += (dy / distance) * force * 0.03;

          // Damping
          particle.vx *= 0.95;
          particle.vy *= 0.95;
        }
      });

      // Draw mouse trail with glow
      ctx.globalAlpha = 1;
      mouseTrail.forEach((point, _index) => {
        point.opacity -= 0.02;

        // Glow
        const glowGradient = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          20
        );
        glowGradient.addColorStop(0, `rgba(124, 58, 237, ${point.opacity * 0.3})`);
        glowGradient.addColorStop(1, `rgba(124, 58, 237, 0)`);

        ctx.fillStyle = glowGradient;
        ctx.fillRect(
          point.x - 20,
          point.y - 20,
          40,
          40
        );
      });

      // Remove dead trail points
      for (let i = mouseTrail.length - 1; i >= 0; i--) {
        if (mouseTrail[i].opacity <= 0) {
          mouseTrail.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};

export default AnimatedBackground;
