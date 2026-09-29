"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DrcSidebar from "../../components/DrcSidebar";
import DrcHeader from "../../components/DrcHeader";
import { Activity, Zap, AlertCircle, Clock } from "lucide-react";
import { Layers, Users, TrendingUp, Package } from "lucide-react";

// Chain Status Component - Inline
function ChainStatus() {
  const [status, setStatus] = useState("checking");
  const [blockHeight, setBlockHeight] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [latency, setLatency] = useState(null);

  useEffect(() => {
    checkChainStatus();
    const interval = setInterval(checkChainStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkChainStatus = async () => {
    const startTime = Date.now();
    try {
      const response = await fetch("/api/chain/status");
      const endTime = Date.now();
      const responseLatency = endTime - startTime;

      if (!response.ok) {
        setStatus("soon");
        setLatency(null);
        setLastChecked(new Date());
        return;
      }

      const data = await response.json();

      if (data.isOnline) {
        setStatus("online");
        setBlockHeight(data.blockHeight || 0);
        setLatency(responseLatency);
      } else if (data.comingSoon) {
        setStatus("soon");
        setLatency(null);
      } else {
        setStatus("offline");
        setLatency(null);
      }

      setLastChecked(new Date());
    } catch (error) {
      setStatus("soon");
      setLatency(null);
      setLastChecked(new Date());
    }
  };

  const statusConfig = {
    online: {
      label: "Chain Status: Online",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      icon: Activity,
      glow: "shadow-green-500/20",
      pulse: true,
    },
    soon: {
      label: "Chain Status: Soon",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-200 dark:border-orange-800",
      icon: Clock,
      glow: "shadow-orange-500/20",
      pulse: false,
    },
    offline: {
      label: "Chain Status: Offline",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      icon: AlertCircle,
      glow: "shadow-red-500/20",
      pulse: false,
    },
    checking: {
      label: "Chain Status: Checking...",
      color: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-50 dark:bg-gray-900/20",
      border: "border-gray-200 dark:border-gray-800",
      icon: Zap,
      glow: "shadow-gray-500/20",
      pulse: false,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-xl p-4 ${config.glow} shadow-lg transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`relative w-10 h-10 rounded-lg bg-gradient-to-br ${
              status === "online"
                ? "from-green-500 to-emerald-600"
                : status === "soon"
                  ? "from-orange-500 to-amber-600"
                  : status === "offline"
                    ? "from-red-500 to-rose-600"
                    : "from-gray-500 to-gray-600"
            } flex items-center justify-center`}
          >
            <Icon size={20} className="text-white" />
            {config.pulse && (
              <span className="absolute inset-0 rounded-lg bg-green-400 animate-ping opacity-75"></span>
            )}
          </div>

          <div>
            <h3
              className={`text-lg font-bold ${config.color} font-sora flex items-center gap-2`}
            >
              {config.label}
              {status === "online" && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </h3>
            {status === "online" && blockHeight && (
              <p className="text-sm text-black/60 dark:text-white/60 font-inter">
                Block Height:{" "}
                <span className="font-mono font-semibold">
                  {blockHeight.toLocaleString()}
                </span>
              </p>
            )}
            {status === "soon" && (
              <p className="text-sm text-black/60 dark:text-white/60 font-inter">
                Mainnet launching soon
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          {status === "online" && latency && (
            <div className="mb-1">
              <p className="text-xs text-black/40 dark:text-white/40 font-inter">
                Latency
              </p>
              <p
                className={`text-sm font-bold font-jetbrains ${
                  latency < 100
                    ? "text-green-600 dark:text-green-400"
                    : latency < 300
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                }`}
              >
                {latency}ms
              </p>
            </div>
          )}
          {lastChecked && (
            <p className="text-xs text-black/40 dark:text-white/40 font-inter">
              {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {status === "online" && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
            <p className="text-xs text-black/60 dark:text-white/60 font-inter">
              Network
            </p>
            <p className="text-sm font-bold text-black dark:text-white font-sora">
              Demiurge
            </p>
          </div>
          <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
            <p className="text-xs text-black/60 dark:text-white/60 font-inter">
              Version
            </p>
            <p className="text-sm font-bold text-black dark:text-white font-jetbrains">
              1.0.0
            </p>
          </div>
          <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
            <p className="text-xs text-black/60 dark:text-white/60 font-inter">
              Peers
            </p>
            <p className="text-sm font-bold text-black dark:text-white font-sora">
              24
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: assetsData } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const response = await fetch("/api/assets");
      if (!response.ok) throw new Error("Failed to fetch assets");
      return response.json();
    },
  });

  const assets = assetsData?.assets || [];
  const totalAssets = assets.length;
  const parentAssets = assets.filter((a) => !a.parent_uuid).length;
  const nestedAssets = assets.filter((a) => a.parent_uuid).length;
  const delegatedAssets = assets.filter((a) => a.delegated_user).length;

  const stats = [
    {
      label: "Total Assets",
      value: totalAssets,
      icon: Layers,
      color: "from-purple-500 to-blue-600",
      change: "+12.5%",
    },
    {
      label: "Parent Assets",
      value: parentAssets,
      icon: Package,
      color: "from-blue-500 to-cyan-600",
      change: "+8.2%",
    },
    {
      label: "Nested Assets",
      value: nestedAssets,
      icon: Activity,
      color: "from-green-500 to-emerald-600",
      change: "+15.3%",
    },
    {
      label: "Delegated",
      value: delegatedAssets,
      icon: Users,
      color: "from-orange-500 to-red-600",
      change: "+5.1%",
    },
  ];

  const recentAssets = assets.slice(0, 5);

  return (
    <div className="flex h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
      `}
      >
        <DrcSidebar
          onClose={() => setSidebarOpen(false)}
          activePage="Dashboard"
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <DrcHeader onMenuClick={() => setSidebarOpen(true)} title="Dashboard" />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-2xl p-8 md:p-12 mb-8 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-sora">
              DRC-369 Asset Platform
            </h2>
            <p className="text-lg md:text-xl opacity-90 mb-6 font-inter max-w-2xl">
              Programmable, evolving NFTs with multi-resource polymorphism,
              native nesting, delegation, and dynamic state management.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-sm opacity-80 font-inter">
                  Total Value Locked
                </p>
                <p className="text-2xl font-bold font-sora">$2.4M</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-sm opacity-80 font-inter">24h Volume</p>
                <p className="text-2xl font-bold font-sora">$156K</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <ChainStatus />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-[#1E1E1E] rounded-xl p-6 border border-[#E6E6E6] dark:border-[#333333] hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                    >
                      <Icon size={24} className="text-white" />
                    </div>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400 font-jetbrains">
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-sm text-black/60 dark:text-white/60 mb-1 font-inter">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-black dark:text-white font-sora">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-black dark:text-white font-sora">
                Recent Assets
              </h3>
              <button
                onClick={() => {
                  if (typeof window !== "undefined")
                    window.location.href = "/explorer";
                }}
                className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline font-inter"
              >
                View All
              </button>
            </div>

            {recentAssets.length === 0 ? (
              <div className="text-center py-12">
                <Layers
                  size={48}
                  className="mx-auto text-black/20 dark:text-white/20 mb-4"
                />
                <p className="text-black/60 dark:text-white/60 font-inter">
                  No assets yet. Create your first asset to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAssets.map((asset) => {
                  const primaryResource = asset.resources?.[0];
                  const imageUrl =
                    primaryResource?.uri || "https://via.placeholder.com/100";

                  return (
                    <button
                      key={asset.uuid}
                      onClick={() => {
                        if (typeof window !== "undefined")
                          window.location.href = `/asset/${asset.uuid}`;
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-[#262626] transition-all duration-150 cursor-pointer"
                    >
                      <img
                        src={imageUrl}
                        alt={asset.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-semibold text-black dark:text-white font-bricolage truncate">
                          {asset.name}
                        </h4>
                        <p className="text-sm text-black/60 dark:text-white/60 font-inter truncate">
                          {asset.description || "No description"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-black dark:text-white font-sora">
                          Level {asset.level}
                        </p>
                        <p className="text-xs text-black/60 dark:text-white/60 font-inter">
                          {asset.experience_points} XP
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
