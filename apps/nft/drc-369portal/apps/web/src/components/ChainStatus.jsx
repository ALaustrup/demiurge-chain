import { useState, useEffect } from "react";
import { Activity, Zap, AlertCircle, Clock } from "lucide-react";

export default function ChainStatus() {
  const [status, setStatus] = useState("checking"); // 'checking', 'online', 'soon', 'offline'
  const [blockHeight, setBlockHeight] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [latency, setLatency] = useState(null);

  useEffect(() => {
    checkChainStatus();
    const interval = setInterval(checkChainStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const checkChainStatus = async () => {
    const startTime = Date.now();
    try {
      const response = await fetch("/api/chain/status", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

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
      console.error("Chain status check failed:", error);
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
