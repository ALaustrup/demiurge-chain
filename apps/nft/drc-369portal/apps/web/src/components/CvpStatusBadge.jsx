"use client";

import { Shield, ShieldAlert, ShieldCheck, Activity, Zap } from "lucide-react";

/**
 * CVP Status Badge Component
 * 
 * Displays the Consensus-Verified Polymorphism protection status
 * with real-time threat monitoring.
 */
export default function CvpStatusBadge({ status, compact = false }) {
  if (!status) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        <Shield size={16} />
        <span className="text-sm font-medium">Loading...</span>
      </div>
    );
  }

  const { isProtected, currentEpoch, recentThreats = [], proofSystem } = status;

  const hasActiveThreats = recentThreats.some(t => 
    Date.now() - t.detectedAt < 3600000 // Last hour
  );

  const criticalThreats = recentThreats.filter(t => t.severity === 'critical').length;
  const highThreats = recentThreats.filter(t => t.severity === 'high').length;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${
        !isProtected
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          : hasActiveThreats
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
      }`}>
        {isProtected ? (
          hasActiveThreats ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />
        ) : (
          <Shield size={12} />
        )}
        <span>CVP {isProtected ? 'Active' : 'Inactive'}</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isProtected ? (
            hasActiveThreats ? (
              <ShieldAlert className="text-red-500" size={20} />
            ) : (
              <ShieldCheck className="text-green-500" size={20} />
            )
          ) : (
            <Shield className="text-gray-400" size={20} />
          )}
          <h3 className="font-semibold text-black dark:text-white">CVP Protection</h3>
        </div>
        
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          isProtected
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
        }`}>
          {isProtected ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626]">
          <div className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60 mb-1">
            <Activity size={12} />
            Current Epoch
          </div>
          <div className="text-lg font-bold text-black dark:text-white">
            #{currentEpoch || 0}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626]">
          <div className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60 mb-1">
            <Zap size={12} />
            Proof System
          </div>
          <div className="text-sm font-semibold text-black dark:text-white capitalize">
            {proofSystem?.replace('_', ' ') || 'Unknown'}
          </div>
        </div>
      </div>

      {/* Threat Summary */}
      {recentThreats.length > 0 && (
        <div className="border-t border-[#E6E6E6] dark:border-[#333333] pt-3">
          <div className="text-xs text-black/60 dark:text-white/60 mb-2">
            Recent Threats ({recentThreats.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {criticalThreats > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                {criticalThreats} Critical
              </span>
            )}
            {highThreats > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                {highThreats} High
              </span>
            )}
            {recentThreats.length - criticalThreats - highThreats > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                {recentThreats.length - criticalThreats - highThreats} Other
              </span>
            )}
          </div>

          {/* Recent threat list */}
          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
            {recentThreats.slice(0, 3).map((threat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-[#F9FAFB] dark:bg-[#262626]">
                <span className={`font-medium ${
                  threat.severity === 'critical' ? 'text-red-500' :
                  threat.severity === 'high' ? 'text-orange-500' :
                  'text-yellow-500'
                }`}>
                  {threat.type.replace('_', ' ')}
                </span>
                <span className="text-black/40 dark:text-white/40">
                  {formatTimeAgo(threat.detectedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protection Description */}
      {isProtected && recentThreats.length === 0 && (
        <div className="text-xs text-black/60 dark:text-white/60 border-t border-[#E6E6E6] dark:border-[#333333] pt-3">
          <p>
            This NFT's bytecode is protected by CVP and automatically mutates 
            each epoch while maintaining semantic equivalence. 
            {proofSystem === 'translation_validation' && (
              <span className="text-green-600 dark:text-green-400 font-medium">
                {' '}ZK proofs verify all mutations.
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
