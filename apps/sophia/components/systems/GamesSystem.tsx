"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { GlassPanel } from "@components/GlassPanel";
import { AnimatedBackground } from "@components/AnimatedBackground";
import { useAuth } from "@lib/contexts/AuthContext";
import Link from "next/link";

interface Game {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  genre: string;
  players: number;
  rating: number;
  isInstalled: boolean;
  playtime: number; // minutes
  status: "available" | "launching" | "playing" | "maintenance";
}

export const GamesSystem: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [games, setGames] = useState<Game[]>([
    {
      id: "1",
      name: "Demiurge Quest",
      description: "Epic fantasy RPG with blockchain-based progression",
      thumbnail: "🎮",
      genre: "RPG",
      players: 15240,
      rating: 4.8,
      isInstalled: true,
      playtime: 2480,
      status: "available",
    },
    {
      id: "2",
      name: "Chain Tactics",
      description: "Turn-based strategy game with NFT units",
      thumbnail: "♟️",
      genre: "Strategy",
      players: 8650,
      rating: 4.6,
      isInstalled: true,
      playtime: 1240,
      status: "available",
    },
    {
      id: "3",
      name: "Cosmic Traders",
      description: "Space trading simulator with DeFi mechanics",
      thumbnail: "🚀",
      genre: "Simulation",
      players: 12300,
      rating: 4.5,
      isInstalled: false,
      playtime: 0,
      status: "available",
    },
    {
      id: "4",
      name: "Ethereal Realms",
      description: "Multiplayer dungeon crawler with social features",
      thumbnail: "🏰",
      genre: "Action",
      players: 18900,
      rating: 4.9,
      isInstalled: true,
      playtime: 3850,
      status: "available",
    },
    {
      id: "5",
      name: "Nexus Protocol",
      description: "Competitive PvP arena with blockchain rankings",
      thumbnail: "⚡",
      genre: "Esports",
      players: 22100,
      rating: 4.7,
      isInstalled: true,
      playtime: 5200,
      status: "available",
    },
    {
      id: "6",
      name: "Idle Miner",
      description: "Passive income game with NFT mining rigs",
      thumbnail: "⛏️",
      genre: "Idle",
      players: 31400,
      rating: 4.4,
      isInstalled: false,
      playtime: 0,
      status: "maintenance",
    },
  ]);

  const [launchingGameId, setLaunchingGameId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const handleLaunchGame = async (gameId: string) => {
    setLaunchingGameId(gameId);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Launching game:", gameId);
      // In production, would open game with session key
    } finally {
      setLaunchingGameId(null);
    }
  };

  const categories = ["all", "RPG", "Strategy", "Action", "Simulation", "Idle", "Esports"];
  const filteredGames =
    selectedCategory === "all"
      ? games
      : games.filter((game) => game.genre === selectedCategory);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <Link href="/auth" className="text-primary-400 hover:text-primary-300">
          Please log in to continue
        </Link>
      </div>
    );
  }

  const installedCount = games.filter((g) => g.isInstalled).length;
  const totalPlaytime = games.reduce((sum, g) => sum + g.playtime, 0);

  return (
    <div className="relative w-full min-h-screen bg-navy-900 overflow-hidden">
      <AnimatedBackground intensity="medium" />

      <div className="relative z-20 w-full">
        {/* Header */}
        <motion.header
          className="backdrop-blur-md border-b border-white/5 sticky top-0 z-40"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-cyan-400 group-hover:scale-110 transition-transform">
                🎮 Games
              </span>
            </Link>

            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <span>{installedCount} Installed</span>
              <span>•</span>
              <span>{(totalPlaytime / 60).toFixed(1)}h Playtime</span>
            </div>

            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              ← Back
            </Link>
          </div>
        </motion.header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero section */}
          <motion.section
            className="mb-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-4xl font-bold gradient-text mb-2">Game Launcher</h1>
            <p className="text-gray-400 mb-8">
              Discover and play blockchain-integrated games in the Demiurge ecosystem
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                {
                  label: "Games Available",
                  value: games.length.toString(),
                  icon: "🎮",
                },
                {
                  label: "Total Players",
                  value: games.reduce((sum, g) => sum + g.players, 0).toLocaleString(),
                  icon: "👥",
                },
                {
                  label: "Your Games",
                  value: installedCount.toString(),
                  icon: "⭐",
                },
              ].map((stat, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <GlassPanel className="p-6" blur="md" border="medium">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                      </div>
                      <span className="text-3xl">{stat.icon}</span>
                    </div>
                  </GlassPanel>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Category filter */}
          <motion.section className="mb-12" variants={containerVariants} initial="hidden" animate="visible">
            <h2 className="text-lg font-semibold text-white mb-4">Category</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all capitalize ${
                    selectedCategory === category
                      ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.section>

          {/* Games grid */}
          <motion.section
            className="mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGames.map((game) => (
                <motion.div
                  key={game.id}
                  variants={itemVariants}
                  layout
                >
                  <GlassPanel
                    className="overflow-hidden h-full flex flex-col"
                    blur="md"
                    border="medium"
                    interactive
                  >
                    {/* Game header with thumbnail */}
                    <div className="relative bg-gradient-to-br from-primary-600/20 to-cyan-600/20 p-8 flex items-center justify-center min-h-48 border-b border-white/10">
                      <motion.span
                        className="text-8xl"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        {game.thumbnail}
                      </motion.span>

                      {/* Status badge */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            game.status === "available"
                              ? "bg-green-500/20 text-green-400"
                              : game.status === "maintenance"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-cyan-500/20 text-cyan-400"
                          }`}
                        >
                          {game.status === "available"
                            ? "Available"
                            : game.status === "maintenance"
                              ? "Maintenance"
                              : "Launching"}
                        </span>
                      </div>

                      {/* Installed indicator */}
                      {game.isInstalled && (
                        <div className="absolute top-3 left-3 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                          ✓ Installed
                        </div>
                      )}
                    </div>

                    {/* Game info */}
                    <div className="flex-1 p-6 flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
                      <p className="text-gray-400 text-sm mb-4 flex-1">{game.description}</p>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-white/10">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Genre</p>
                          <p className="text-white font-semibold text-sm">{game.genre}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Players</p>
                          <p className="text-white font-semibold text-sm">
                            {(game.players / 1000).toFixed(1)}K
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Rating</p>
                          <p className="text-cyan-400 font-semibold text-sm">★ {game.rating}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Playtime</p>
                          <p className="text-primary-400 font-semibold text-sm">
                            {game.playtime > 0 ? `${(game.playtime / 60).toFixed(1)}h` : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Launch button */}
                      <button
                        onClick={() => handleLaunchGame(game.id)}
                        disabled={game.status !== "available" || launchingGameId === game.id}
                        className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-50 text-white font-semibold rounded-lg transition"
                      >
                        {launchingGameId === game.id
                          ? "Launching..."
                          : game.isInstalled
                            ? "Play"
                            : "Install & Play"}
                      </button>
                    </div>
                  </GlassPanel>
                </motion.div>
              ))}
            </div>

            {filteredGames.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  No games found in this category. Try another!
                </p>
              </div>
            )}
          </motion.section>

          {/* Featured section */}
          <motion.section
            className="mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Why Play with Demiurge?</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Earn While Playing",
                  description: "Play games and earn CGT tokens or NFT rewards",
                  icon: "💎",
                },
                {
                  title: "Own Your Assets",
                  description: "All in-game items are blockchain-based NFTs you can trade",
                  icon: "🏆",
                },
                {
                  title: "Cross-Game Progress",
                  description: "Your items and achievements work across multiple games",
                  icon: "🌐",
                },
                {
                  title: "True Web3 Gaming",
                  description: "No accounts, no launchers—just connect your QOR ID",
                  icon: "🔐",
                },
              ].map((feature, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <GlassPanel className="p-6" blur="md" border="subtle">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </GlassPanel>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </main>
      </div>

      {/* Floating accent orbs */}
      <motion.div
        className="absolute top-1/3 -right-32 w-96 h-96 bg-primary-500 rounded-full filter blur-3xl opacity-10 pointer-events-none"
        animate={{
          y: [0, -40, 0],
          x: [0, 30, 0],
        }}
        transition={{ duration: 16, repeat: Infinity }}
      />
    </div>
  );
};

export default GamesSystem;
