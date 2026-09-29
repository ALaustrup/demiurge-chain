"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DrcSidebar from "../../components/DrcSidebar";
import DrcHeader from "../../components/DrcHeader";
import {
  Server,
  Database,
  Activity,
  Users,
  Shield,
  Terminal,
  Play,
  Pause,
  RotateCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Cpu,
  HardDrive,
  Zap,
} from "lucide-react";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOutput, setCommandOutput] = useState("");

  const queryClient = useQueryClient();

  // Fetch server stats
  const { data: serverStats } = useQuery({
    queryKey: ["server-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/server-stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Execute server command
  const executeCommand = useMutation({
    mutationFn: async (command) => {
      const response = await fetch("/api/admin/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      if (!response.ok) throw new Error("Command failed");
      return response.json();
    },
    onSuccess: (data) => {
      setCommandOutput(data.output || "Command executed successfully");
      queryClient.invalidateQueries({ queryKey: ["server-stats"] });
    },
  });

  const stats = serverStats?.stats || {};

  const serverControls = [
    {
      label: "Start Node",
      command: "start-node",
      icon: Play,
      color: "green",
      description: "Start the Substrate node",
    },
    {
      label: "Stop Node",
      command: "stop-node",
      icon: Pause,
      color: "red",
      description: "Stop the Substrate node",
    },
    {
      label: "Restart Node",
      command: "restart-node",
      icon: RotateCw,
      color: "blue",
      description: "Restart the Substrate node",
    },
    {
      label: "Check Health",
      command: "health-check",
      icon: Activity,
      color: "purple",
      description: "Run system health check",
    },
  ];

  return (
    <div className="flex h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <DrcSidebar onClose={() => setSidebarOpen(false)} activePage="Admin" />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <DrcHeader
          onMenuClick={() => setSidebarOpen(true)}
          title="Admin Dashboard"
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Hero */}
          <div className="bg-gradient-to-br from-red-600 via-orange-600 to-yellow-600 rounded-2xl p-8 md:p-12 mb-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={40} />
              <h2 className="text-3xl md:text-4xl font-bold font-sora">
                Admin Control Panel
              </h2>
            </div>
            <p className="text-lg md:text-xl opacity-90 font-inter max-w-3xl">
              Monitor and control the Demiurge blockchain infrastructure.
              Server: Monad (51.210.209.112)
            </p>
          </div>

          {/* Server Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-6 border border-[#E6E6E6] dark:border-[#333333]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Activity size={24} className="text-white" />
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    stats.nodeStatus === "online"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  }`}
                >
                  {stats.nodeStatus || "Unknown"}
                </span>
              </div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-1 font-inter">
                Node Status
              </p>
              <p className="text-2xl font-bold text-black dark:text-white font-sora">
                {stats.blockHeight || "0"}
              </p>
              <p className="text-xs text-black/40 dark:text-white/40 font-inter">
                blocks
              </p>
            </div>

            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-6 border border-[#E6E6E6] dark:border-[#333333]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Cpu size={24} className="text-white" />
                </div>
              </div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-1 font-inter">
                CPU Usage
              </p>
              <p className="text-2xl font-bold text-black dark:text-white font-sora">
                {stats.cpuUsage || "0"}%
              </p>
              <p className="text-xs text-black/40 dark:text-white/40 font-inter">
                16 cores
              </p>
            </div>

            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-6 border border-[#E6E6E6] dark:border-[#333333]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Database size={24} className="text-white" />
                </div>
              </div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-1 font-inter">
                Memory Usage
              </p>
              <p className="text-2xl font-bold text-black dark:text-white font-sora">
                {stats.memoryUsage || "0"}%
              </p>
              <p className="text-xs text-black/40 dark:text-white/40 font-inter">
                64 GB RAM
              </p>
            </div>

            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-6 border border-[#E6E6E6] dark:border-[#333333]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <HardDrive size={24} className="text-white" />
                </div>
              </div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-1 font-inter">
                Disk Usage
              </p>
              <p className="text-2xl font-bold text-black dark:text-white font-sora">
                {stats.diskUsage || "0"}%
              </p>
              <p className="text-xs text-black/40 dark:text-white/40 font-inter">
                1.7 TB RAID 0
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Server Controls */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
              <h3 className="text-xl font-bold text-black dark:text-white mb-4 font-sora flex items-center gap-2">
                <Server size={24} />
                Server Controls
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {serverControls.map((control, idx) => {
                  const Icon = control.icon;
                  const colorClasses = {
                    green:
                      "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700",
                    red: "from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700",
                    blue: "from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700",
                    purple:
                      "from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700",
                  };

                  return (
                    <button
                      key={idx}
                      onClick={() => executeCommand.mutate(control.command)}
                      disabled={executeCommand.isPending}
                      className={`p-4 rounded-lg bg-gradient-to-br ${colorClasses[control.color]} text-white font-semibold transition-all duration-150 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Icon size={24} className="mx-auto mb-2" />
                      <p className="text-sm font-inter">{control.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Terminal Output */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
              <h3 className="text-xl font-bold text-black dark:text-white mb-4 font-sora flex items-center gap-2">
                <Terminal size={24} />
                Command Output
              </h3>

              <div className="bg-[#0D1117] rounded-lg p-4 h-[200px] overflow-y-auto">
                <pre className="text-sm font-jetbrains text-[#E6EDF3] whitespace-pre-wrap">
                  {commandOutput || "> Waiting for commands..."}
                </pre>
              </div>
            </div>
          </div>

          {/* Monad Server Info */}
          <div className="mt-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <h3 className="text-xl font-bold text-black dark:text-white mb-4 font-sora flex items-center gap-2">
              <Server size={24} />
              Monad Server Configuration
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-black/60 dark:text-white/60 font-inter mb-1">
                  Hostname
                </p>
                <p className="font-mono font-semibold text-black dark:text-white">
                  Pleroma
                </p>
              </div>
              <div>
                <p className="text-xs text-black/60 dark:text-white/60 font-inter mb-1">
                  IP Address
                </p>
                <p className="font-mono font-semibold text-black dark:text-white">
                  51.210.209.112
                </p>
              </div>
              <div>
                <p className="text-xs text-black/60 dark:text-white/60 font-inter mb-1">
                  OS
                </p>
                <p className="font-mono font-semibold text-black dark:text-white">
                  Ubuntu 24.04
                </p>
              </div>
              <div>
                <p className="text-xs text-black/60 dark:text-white/60 font-inter mb-1">
                  Kernel
                </p>
                <p className="font-mono font-semibold text-black dark:text-white">
                  6.8.x HWE
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <p className="text-sm text-black/80 dark:text-white/80 font-inter">
                <strong>Storage:</strong> 1.7 TiB NVMe RAID 0 (3-5 GB/s
                throughput) •<strong className="ml-2">RAM:</strong> 64 GB DDR5 •
                <strong className="ml-2">CPU:</strong> 16 cores / 32 threads
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
