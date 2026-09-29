'use client';

/**
 * Wallet Data Hooks
 * 
 * React Query hooks for wallet-related data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { demiurgeRpc } from '@/lib/demiurge-rpc';
import { queryKeys, invalidateWalletQueries } from '@/lib/query-client';
import { toast } from '@/providers/ToastProvider';

/**
 * Hook for wallet balance
 */
export function useBalance(address: string | undefined) {
  return useQuery({
    queryKey: queryKeys.wallet.balance(address!),
    queryFn: () => demiurgeRpc.getBalance(address!),
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Poll every minute
  });
}

/**
 * Hook for energy info
 */
export function useEnergy(address: string | undefined) {
  return useQuery({
    queryKey: queryKeys.wallet.energy(address!),
    queryFn: () => demiurgeRpc.getEnergy(address!),
    enabled: !!address,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

/**
 * Hook for transaction history
 */
export function useTransactionHistory(address: string | undefined, limit: number = 50) {
  return useQuery({
    queryKey: queryKeys.wallet.transactions(address!),
    queryFn: () => demiurgeRpc.getTransactionHistory(address!, limit),
    enabled: !!address,
    staleTime: 30000,
  });
}

/**
 * Hook for user's NFTs
 */
export function useUserNFTs(address: string | undefined) {
  return useQuery({
    queryKey: queryKeys.user.nfts(address!),
    queryFn: () => demiurgeRpc.getUserNFTs(address!),
    enabled: !!address,
    staleTime: 60000,
  });
}

/**
 * Hook for claiming starter bonus
 */
export function useClaimStarterBonus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (address: string) => demiurgeRpc.claimStarterBonus(address),
    onSuccess: (data, address) => {
      if (data.success) {
        toast.success('Welcome package claimed!', {
          description: `You received ${data.amount} CGT`,
        });
        // Invalidate balance queries
        queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance(address) });
      } else {
        toast.error(data.message || 'Failed to claim welcome package');
      }
    },
    onError: (error) => {
      toast.error('Failed to claim welcome package');
    },
    meta: { showErrorToast: false }, // We handle the toast manually
  });
}

/**
 * Hook for checking if starter bonus was claimed
 */
export function useHasClaimedStarter(address: string | undefined) {
  return useQuery({
    queryKey: ['wallet', 'hasClaimedStarter', address],
    queryFn: () => demiurgeRpc.hasClaimedStarter(address!),
    enabled: !!address,
    staleTime: Infinity, // Once claimed, doesn't change
  });
}

/**
 * Hook for transferring CGT
 */
export function useTransferCGT() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      from,
      to,
      amount,
      nonce,
      signature,
    }: {
      from: string;
      to: string;
      amount: string;
      /** From demiurgeRpc.getNonce(from), bound into the signed payload. */
      nonce: number;
      /** Ed25519 signature over payloads.transfer(from, to, amount, nonce). */
      signature: string;
    }) => demiurgeRpc.transfer(from, to, amount, nonce, signature),
    onSuccess: (txHash, { from, to }) => {
      toast.success('Transfer submitted!', {
        description: `Transaction: ${txHash.slice(0, 10)}...`,
      });
      // Invalidate balances for both sender and receiver
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance(from) });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance(to) });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.transactions(from) });
    },
    meta: { showErrorToast: true },
  });
}

/**
 * Combined wallet data hook
 */
export function useWalletData(address: string | undefined) {
  const balance = useBalance(address);
  const energy = useEnergy(address);
  const nfts = useUserNFTs(address);
  const transactions = useTransactionHistory(address, 10);

  return {
    balance: balance.data,
    energy: energy.data,
    nfts: nfts.data,
    recentTransactions: transactions.data,
    isLoading: balance.isLoading || energy.isLoading,
    error: balance.error || energy.error,
    refetch: () => {
      balance.refetch();
      energy.refetch();
      nfts.refetch();
      transactions.refetch();
    },
  };
}
