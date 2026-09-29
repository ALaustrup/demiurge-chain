"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassPanel } from "@components/GlassPanel";
import { AnimatedBackground } from "@components/AnimatedBackground";
import { useAuth } from "@lib/contexts/AuthContext";
import Link from "next/link";

interface PortalMessage {
  type: "auth" | "data" | "error" | "portal:ready" | "portal:action" | string;
  payload?: any;
  token?: string;
  qorId?: string;
}

export const NFTPortalSystem: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [stats] = useState({
    ownedNFTs: 42,
    totalValue: "$18,250.00 USD",
    floorPrice: "0.5 CGT",
    volume24h: "125,400 CGT",
  });

  useEffect(() => {
    if (!isAuthenticated || !iframeRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      // Validate origin for security
      if (event.origin !== process.env.NEXT_PUBLIC_DEMIURGE_URL) {
        console.warn("Message from untrusted origin:", event.origin);
        return;
      }

      const message: PortalMessage = event.data;

      switch (message.type) {
        case "portal:ready":
          setPortalReady(true);
          // Send auth token to portal
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: "auth:token",
              token: localStorage.getItem("auth_token"),
              qorId: (user as any)?.qorId,
            },
            process.env.NEXT_PUBLIC_DEMIURGE_URL!
          );
          break;

        case "portal:action":
          console.log("Portal action:", message.payload);
          break;

        case "portal:error":
          console.error("Portal error:", message.payload);
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    // Notify portal when iframe loads
    const notifyPortal = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: "parent:ready" },
          process.env.NEXT_PUBLIC_DEMIURGE_URL!
        );
      }
    };

    if (iframeRef.current) {
      iframeRef.current.addEventListener("load", notifyPortal);
    }

    return () => {
      window.removeEventListener("message", handleMessage);
      if (iframeRef.current) {
        iframeRef.current.removeEventListener("load", notifyPortal);
      }
    };
  }, [isAuthenticated, user]);

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
                🖼️ NFT Portal
              </span>
            </Link>

            <div className="text-gray-400 text-sm">
              {portalReady ? "✓ Connected" : "⏳ Connecting..."}
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
          {/* Overview section */}
          <motion.section
            className="mb-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-4xl font-bold gradient-text mb-8">Your NFT Collection</h1>

            {/* Key metrics */}
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "NFTs Owned", value: stats.ownedNFTs, icon: "🎨" },
                { label: "Total Value", value: stats.totalValue, icon: "💎" },
                { label: "Floor Price", value: stats.floorPrice, icon: "📊" },
                { label: "24h Volume", value: stats.volume24h, icon: "📈" },
              ].map((metric, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <GlassPanel className="p-6" blur="md" border="medium">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-gray-400 text-sm">{metric.label}</p>
                      <span className="text-2xl">{metric.icon}</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                  </GlassPanel>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          {/* Portal embedding section */}
          <motion.section
            className="mb-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Browse & Manage NFTs</h2>

            <GlassPanel className="overflow-hidden" blur="lg" border="medium">
              <div className="relative bg-navy-900/50">
                {/* Loading state */}
                {!portalReady && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-navy-900/80 backdrop-blur-sm z-50"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: portalReady ? 0 : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center">
                      <motion.div
                        className="w-12 h-12 border-3 border-primary-500/30 border-t-primary-500 rounded-full mx-auto mb-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <p className="text-white font-semibold">Loading NFT Portal...</p>
                      <p className="text-gray-400 text-sm mt-2">Connecting to DRC-369 collection</p>
                    </div>
                  </motion.div>
                )}

                {/* Embedded iframe */}
                <iframe
                  ref={iframeRef}
                  src={`${process.env.NEXT_PUBLIC_DEMIURGE_URL}/nft/drc-369portal`}
                  title="DRC-369 NFT Portal"
                  className="w-full h-[800px] border-0"
                  allow="camera; microphone; clipboard-read; clipboard-write"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                  onLoad={() => console.log("Portal iframe loaded")}
                />
              </div>
            </GlassPanel>

            <p className="text-gray-400 text-sm mt-4 text-center">
              The DRC-369 portal allows you to mint, trade, and manage stateful NFTs with evolving properties
            </p>
          </motion.section>

          {/* Features section */}
          <motion.section
            className="mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-2xl font-bold text-white mb-6">DRC-369 Features</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Stateful NFTs",
                  description: "NFTs that evolve, gain XP, and change properties over time",
                  icon: "🎮",
                },
                {
                  title: "Cross-Game Assets",
                  description: "Use your NFTs across different games in the ecosystem",
                  icon: "🌐",
                },
                {
                  title: "Trading",
                  description: "Trade your NFTs on the peer-to-peer marketplace",
                  icon: "🔄",
                },
                {
                  title: "Yield Generation",
                  description: "Some NFTs generate passive income over time",
                  icon: "💰",
                },
                {
                  title: "Rarity Tracking",
                  description: "Track rarity scores and historical values",
                  icon: "📊",
                },
                {
                  title: "Collections",
                  description: "Organize and showcase your NFT collections",
                  icon: "🎨",
                },
              ].map((feature, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <GlassPanel className="p-6 h-full" blur="md" border="subtle">
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
        className="absolute top-1/2 -right-40 w-96 h-96 bg-primary-500 rounded-full filter blur-3xl opacity-10 pointer-events-none"
        animate={{
          y: [0, -50, 0],
          x: [0, 40, 0],
        }}
        transition={{ duration: 18, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 -left-40 w-80 h-80 bg-cyan-500 rounded-full filter blur-3xl opacity-5 pointer-events-none"
        animate={{
          y: [0, 40, 0],
          x: [0, -30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, delay: 2 }}
      />
    </div>
  );
};

export default NFTPortalSystem;
