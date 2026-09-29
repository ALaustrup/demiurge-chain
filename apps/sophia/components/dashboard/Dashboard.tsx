"use client";

import React from "react";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@components/AnimatedBackground";
import { GlassPanel } from "@components/GlassPanel";
import { useAuth } from "@lib/contexts/AuthContext";
import Link from "next/link";

export const Dashboard: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const systems = [
    {
      id: "mining",
      name: "Mining",
      description: "Participate in network validation",
      icon: "⛏️",
      color: "from-primary-500 to-primary-600",
      url: "/systems/mining",
    },
    {
      id: "wallet",
      name: "Wallet",
      description: "Manage your CGT tokens",
      icon: "💰",
      color: "from-cyan-400 to-cyan-500",
      url: "/systems/wallet",
    },
    {
      id: "nft",
      name: "NFT Portal",
      description: "Create and trade DRC-369s",
      icon: "🎨",
      color: "from-primary-400 to-primary-600",
      url: "/systems/nft",
    },
    {
      id: "games",
      name: "Games",
      description: "Play blockchain experiences",
      icon: "🎮",
      color: "from-purple-400 to-pink-500",
      url: "/systems/games",
    },
    {
      id: "dev",
      name: "Developer Hub",
      description: "Build on Demiurge",
      icon: "💻",
      color: "from-green-400 to-emerald-500",
      url: "/systems/dev",
    },
    {
      id: "knowledge",
      name: "Knowledge Base",
      description: "Learn Web3",
      icon: "📚",
      color: "from-blue-400 to-blue-600",
      url: "/systems/knowledge",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please log in to continue</p>
          <Link href="/auth" className="text-primary-400 hover:text-primary-300">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-navy-900 overflow-hidden">
      {/* Animated background */}
      <AnimatedBackground intensity="high" />

      {/* Content */}
      <div className="relative z-20 w-full">
        {/* Header */}
        <motion.header
          className="backdrop-blur-md border-b border-white/5 sticky top-0 z-40"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <motion.div
              className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-cyan-400"
              whileHover={{ scale: 1.05 }}
            >
              ◇ Sophia
            </motion.div>

            <div className="flex items-center gap-4">
              <GlassPanel className="px-4 py-2 text-sm" blur="sm">
                {user?.username}
              </GlassPanel>
              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </motion.header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome section */}
          <motion.section
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassPanel className="p-8 mb-8" blur="lg">
              <h1 className="text-4xl font-bold mb-3 gradient-text">
                Welcome, {user?.username}
              </h1>
              <p className="text-gray-300 mb-4">
                Enter the Demiurge ecosystem. Choose a system to begin your journey.
              </p>
              <div className="h-1 w-32 bg-gradient-to-r from-primary-500 to-cyan-400 rounded-full" />
            </GlassPanel>
          </motion.section>

          {/* System grid */}
          <motion.section
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {systems.map((system) => (
              <motion.div
                key={system.id}
                variants={itemVariants}
              >
                <Link href={system.url}>
                  <GlassPanel
                    className="h-full p-6 cursor-pointer group"
                    interactive
                    hoverEffect
                    blur="md"
                    border="medium"
                  >
                    <div className="flex flex-col h-full">
                      {/* Icon */}
                      <motion.div
                        className={`text-5xl mb-4 w-16 h-16 rounded-xl bg-gradient-to-br ${system.color} flex items-center justify-center`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {system.icon}
                      </motion.div>

                      {/* Name */}
                      <h3 className="text-xl font-semibold mb-2 text-white group-hover:gradient-text transition-all">
                        {system.name}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-400 text-sm mb-4 flex-grow">
                        {system.description}
                      </p>

                      {/* CTA */}
                      <motion.div
                        className="text-primary-400 text-sm font-medium flex items-center gap-2"
                        whileHover={{ x: 5 }}
                      >
                        Explore
                        <span>→</span>
                      </motion.div>
                    </div>
                  </GlassPanel>
                </Link>
              </motion.div>
            ))}
          </motion.section>

          {/* Stats section */}
          <motion.section
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {[
              { label: "Account Status", value: "Verified", color: "from-green-500 to-emerald-500" },
              { label: "Last Active", value: "Just now", color: "from-blue-500 to-cyan-500" },
              { label: "Network Health", value: "Excellent", color: "from-primary-500 to-purple-500" },
            ].map((stat, index) => (
              <GlassPanel key={index} className="p-6" blur="md" border="subtle">
                <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                <p className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${stat.color}`}>
                  {stat.value}
                </p>
              </GlassPanel>
            ))}
          </motion.section>
        </main>
      </div>

      {/* Floating accent orbs */}
      <motion.div
        className="absolute top-1/4 right-20 w-96 h-96 bg-primary-500 rounded-full filter blur-3xl opacity-10 pointer-events-none"
        animate={{
          y: [0, -30, 0],
          x: [0, 30, 0],
        }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 left-10 w-96 h-96 bg-cyan-400 rounded-full filter blur-3xl opacity-5 pointer-events-none"
        animate={{
          y: [0, 30, 0],
          x: [0, -30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, delay: 2 }}
      />

    </div>
  );
};

export default Dashboard;
