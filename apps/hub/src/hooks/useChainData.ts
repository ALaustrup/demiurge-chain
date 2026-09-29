'use client';

/**
 * Chain Data Hooks
 * 
 * React Query hooks for blockchain data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { demiurgeRpc } from '@/lib/demiurge-rpc';
import { queryKeys } from '@/lib/query-client';

/**
 * Hook for chain health status
 */
export function useChainHealth() {
  return useQuery({
    queryKey: queryKeys.chain.health(),
    queryFn: () => demiurgeRpc.getHealth(),
    refetchInterval: 10000, // Poll every 10 seconds
    retry: 2,
    meta: { showErrorToast: false }, // Don't show toast for health checks
  });
}

/**
 * Hook for chain status (era, validators, etc.)
 */
export function useChainStatus() {
  return useQuery({
    queryKey: queryKeys.chain.status(),
    queryFn: () => demiurgeRpc.getConsensusStatus(),
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 15000,
  });
}

/**
 * Hook for latest block
 */
export function useLatestBlock() {
  return useQuery({
    queryKey: queryKeys.chain.latestBlock(),
    queryFn: () => demiurgeRpc.getLatestBlock(),
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 3000,
  });
}

/**
 * Hook for validators list
 */
export function useValidators() {
  return useQuery({
    queryKey: queryKeys.chain.validators(),
    queryFn: () => demiurgeRpc.getValidators(),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for current era info
 */
export function useCurrentEra() {
  return useQuery({
    queryKey: queryKeys.chain.era(),
    queryFn: () => demiurgeRpc.getCurrentEra(),
    staleTime: 30000,
  });
}

/**
 * Hook for a specific block
 */
export function useBlock(blockNumber: number | undefined) {
  return useQuery({
    queryKey: queryKeys.chain.block(blockNumber!),
    queryFn: () => demiurgeRpc.getBlock(blockNumber!),
    enabled: blockNumber !== undefined,
    staleTime: Infinity, // Blocks don't change
  });
}

/**
 * Combined chain info hook for dashboard
 */
export function useChainInfo() {
  const health = useChainHealth();
  const status = useChainStatus();

  return {
    isConnected: health.data?.connected ?? false,
    blockHeight: status.data?.blockNumber ?? 0,
    currentEra: status.data?.currentEra ?? 0,
    validators: status.data?.validators ?? 0,
    totalStake: status.data?.totalStake ?? '0',
    isLoading: health.isLoading || status.isLoading,
    error: health.error || status.error,
    refetch: () => {
      health.refetch();
      status.refetch();
    },
  };
}
