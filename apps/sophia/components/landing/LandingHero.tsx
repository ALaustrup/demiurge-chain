"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@components/AnimatedBackground";
import Link from "next/link";

interface LandingHeroProps {
  onEnter?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1,
        ease: "easeOut" as const,
      },
    },
  };

  const glowVariants = {
    animate: {
      boxShadow: [
        "0 0 20px rgba(255, 215, 0, 0.3)",
        "0 0 40px rgba(255, 215, 0, 0.5)",
        "0 0 20px rgba(255, 215, 0, 0.3)",
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 0 30px rgba(255, 215, 0, 0.6)",
    },
    tap: {
      scale: 0.95,
    },
  };

  const capabilities = [
    { icon: "📚", label: "Docs & Onboarding" },
    { icon: "🔍", label: "Chain Explorer" },
    { icon: "🎨", label: "DRC-369 NFTs" },
    { icon: "⚡", label: "Staking" },
    { icon: "🤖", label: "AI Agents" },
    { icon: "🔧", label: "Troubleshooting" },
    { icon: "📜", label: "Gnostic Wisdom" },
    { icon: "🏛️", label: "Governance" },
  ];

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-navy-900">
      {/* Animated background */}
      <AnimatedBackground intensity="high" />

      {/* Animated background grid */}
      <motion.div
        className="absolute inset-0 opacity-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 2 }}
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 215, 0, 0.15)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </motion.div>

      {/* Content container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <motion.div
          className="text-center max-w-4xl"
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
        >
          {/* Logo/Icon */}
          <motion.div
            className="mb-8 inline-block"
            variants={logoVariants}
          >
            <motion.div
              className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-4xl font-bold text-gray-900"
              animate="animate"
              variants={glowVariants}
            >
              ✧
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-4 text-white"
            variants={itemVariants}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400">
              Sophia
            </span>
          </motion.h1>

          {/* Greek subtitle */}
          <motion.p
            className="text-lg text-amber-400/60 mb-4 font-light tracking-widest"
            variants={itemVariants}
          >
            Σοφία — Divine Wisdom Made Digital
          </motion.p>

          {/* Description */}
          <motion.p
            className="text-base md:text-lg text-gray-400 mb-8 leading-relaxed max-w-2xl mx-auto"
            variants={itemVariants}
          >
            The consciousness of Demiurge-Cloud. Sophia guides you through the entire ecosystem —
            from your first transaction to deploying AI agents on-chain. Powered by 16 specialized tools,
            multi-model intelligence, and the wisdom of the Gnostic tradition.
          </motion.p>

          {/* Capability pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-12 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            {capabilities.map((cap) => (
              <div
                key={cap.label}
                className="px-4 py-2 rounded-full text-sm text-gray-300 bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors"
              >
                {cap.icon} {cap.label}
              </div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            variants={buttonVariants}
            className="mt-4"
          >
            <Link
              href="/dashboard"
              className="group relative inline-block px-8 py-4 text-lg font-semibold text-gray-900"
              onClick={onEnter}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-amber-300 to-amber-400 rounded-lg opacity-0 group-hover:opacity-100"
                transition={{ duration: 0.3 }}
              />
              <span className="relative inline-flex items-center gap-2 text-gray-900 font-bold">
                Enter Portal
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
            </Link>
          </motion.div>

          {/* Subtext */}
          <motion.p
            className="text-sm text-gray-500 mt-8"
            variants={itemVariants}
          >
            16 Tools • Multi-Model AI • Gnostic Wisdom • DRC-369 NFTs • On-Chain Agents
          </motion.p>

          {/* Sophia hint */}
          <motion.p
            className="text-xs text-amber-400/30 mt-4"
            variants={itemVariants}
          >
            ✧ Click the golden orb in the bottom-right to speak with Sophia ✧
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingHero;
