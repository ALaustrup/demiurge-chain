'use client';

/**
 * Demiurge Gatekeeper Component
 * 
 * The security layer that protects Scatter3D engine access.
 * Verifies QOR ID authentication and staking balance before
 * allowing the 3D engine to initialize.
 * 
 * Logic:
 * - Must be authenticated with QOR ID
 * - Must have minimum stake threshold (10,000 CGT smallest units)
 * - Must have minimum stake percentage (0.01% of total assets)
 */

import { ReactNode } from 'react';
import { useQOR } from '@/hooks/useQOR';
import Link from 'next/link';

interface DemiurgeGateProps {
  children: ReactNode;
  /**
   * Minimum stake threshold in smallest units (100 = 1 CGT)
   * Default: 10000 (100 CGT)
   */
  minimumStake?: number;
  
  /**
   * Minimum stake percentage (0.0001 = 0.01%)
   * Default: 0.0001
   */
  minimumStakePercentage?: number;
}

export function DemiurgeGate({
  children,
  minimumStake = 10000,
  minimumStakePercentage = 0.0001,
}: DemiurgeGateProps) {
  const {
    isAuthenticated,
    isLoading,
    qorId,
    stakingBalance,
    stakePercentage,
    hasSufficientStake,
    login,
  } = useQOR();

  // Loading state - checking authentication
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <div className="text-center font-mono">
          <div className="text-demiurge-cyan text-xl mb-4 animate-pulse">
            CONNECTING TO NEURAL LINK...
          </div>
          <div className="text-gray-500 text-sm">
            Verifying QOR ID credentials...
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <div className="text-center font-mono max-w-2xl px-8">
          <div className="text-red-500 text-4xl mb-6 font-bold">
            403 // UNAUTHORIZED
          </div>
          <div className="text-demiurge-cyan text-xl mb-4">
            QOR ID AUTHENTICATION REQUIRED
          </div>
          <div className="text-gray-400 text-sm mb-8 leading-relaxed">
            Access to Scatter3D Engine requires verified QOR ID credentials.
            <br />
            The engine will not initialize without proper authentication.
          </div>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="glass-panel px-6 py-3 rounded-lg hover:chroma-glow transition-all text-demiurge-cyan font-semibold"
            >
              LOGIN WITH QOR ID
            </Link>
            <Link
              href="/dashboard"
              className="glass-panel px-6 py-3 rounded-lg hover:chroma-glow transition-all text-gray-400"
            >
              RETURN TO PORTAL
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check stake threshold
  const hasAbsoluteStake = stakingBalance >= minimumStake;
  const hasPercentageStake = stakePercentage >= minimumStakePercentage * 100;
  const passedStakeCheck = hasAbsoluteStake && hasPercentageStake;

  if (!passedStakeCheck) {
    const formattedBalance = (stakingBalance / 100).toFixed(2);
    const requiredBalance = (minimumStake / 100).toFixed(2);
    const formattedPercentage = stakePercentage.toFixed(4);
    const requiredPercentage = (minimumStakePercentage * 100).toFixed(4);

    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <div className="text-center font-mono max-w-2xl px-8">
          <div className="text-red-500 text-4xl mb-6 font-bold">
            403 // INSUFFICIENT COMPUTING CREDITS
          </div>
          <div className="text-demiurge-cyan text-xl mb-4">
            STAKE VERIFICATION FAILED
          </div>
          
          <div className="text-gray-400 text-sm mb-6 space-y-2 text-left bg-gray-900/50 p-4 rounded border border-gray-800">
            <div className="flex justify-between">
              <span>QOR ID:</span>
              <span className="text-demiurge-cyan">{qorId}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Stake:</span>
              <span className={hasAbsoluteStake ? 'text-green-400' : 'text-red-400'}>
                {formattedBalance} CGT
              </span>
            </div>
            <div className="flex justify-between">
              <span>Required Stake:</span>
              <span className="text-yellow-400">{requiredBalance} CGT</span>
            </div>
            <div className="flex justify-between">
              <span>Stake Percentage:</span>
              <span className={hasPercentageStake ? 'text-green-400' : 'text-red-400'}>
                {formattedPercentage}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Required Percentage:</span>
              <span className="text-yellow-400">{requiredPercentage}%</span>
            </div>
          </div>

          <div className="text-gray-500 text-xs mb-8 leading-relaxed">
            Scatter3D Engine requires minimum stake to initialize.
            <br />
            This ensures only high-value node operators can access the render loop.
            <br />
            <br />
            <span className="text-demiurge-cyan">
              Staking protects the network and grants access to advanced features.
            </span>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/staking"
              className="glass-panel px-6 py-3 rounded-lg hover:chroma-glow transition-all text-demiurge-cyan font-semibold"
            >
              STAKE NOW
            </Link>
            <Link
              href="/dashboard"
              className="glass-panel px-6 py-3 rounded-lg hover:chroma-glow transition-all text-gray-400"
            >
              RETURN TO PORTAL
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed - render the game
  return <>{children}</>;
}
