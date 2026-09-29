/**
 * React Query Client Configuration
 * 
 * Centralized query client with:
 * - Sensible defaults for caching
 * - Global error handling
 * - Automatic refetching on window focus
 * - Stale-while-revalidate pattern
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { AppError, getUserFriendlyError } from './api-client';
import { toast } from 'sonner';

// ============================================================================
// Query Client Configuration
// ============================================================================

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show error toast if query doesn't have its own error handling
      if (query.meta?.showErrorToast !== false) {
        const message = getUserFriendlyError(error);
        
        // Don't show toast for auth errors (handled by AuthContext)
        if (error instanceof AppError && error.isAuthError) {
          return;
        }
        
        toast.error(message);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Only show error toast if mutation doesn't have its own error handling
      if (mutation.meta?.showErrorToast !== false) {
        const message = getUserFriendlyError(error);
        toast.error(message);
      }
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      // Show success toast if configured
      if (mutation.meta?.successMessage) {
        toast.success(mutation.meta.successMessage as string);
      }
    },
  }),
  defaultOptions: {
    queries: {
      // Data is considered fresh for 1 minute
      staleTime: 60 * 1000,
      
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      
      // Retry failed requests 3 times
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (user comes back to tab)
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
      
      // Network mode - always try to fetch
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations once on network errors
      retry: 1,
      retryDelay: 1000,
      
      networkMode: 'offlineFirst',
    },
  },
});

// ============================================================================
// Query Key Factories
// ============================================================================

/**
 * Centralized query keys for consistency and easy invalidation
 */
export const queryKeys = {
  // User related
  user: {
    all: ['user'] as const,
    profile: (qorId: string) => ['user', 'profile', qorId] as const,
    stats: (qorId: string) => ['user', 'stats', qorId] as const,
    nfts: (address: string) => ['user', 'nfts', address] as const,
    activity: (qorId: string) => ['user', 'activity', qorId] as const,
  },
  
  // Wallet related
  wallet: {
    all: ['wallet'] as const,
    balance: (address: string) => ['wallet', 'balance', address] as const,
    transactions: (address: string) => ['wallet', 'transactions', address] as const,
    energy: (address: string) => ['wallet', 'energy', address] as const,
  },
  
  // VYB Social
  vyb: {
    all: ['vyb'] as const,
    feed: (type: 'global' | 'following') => ['vyb', 'feed', type] as const,
    profile: (qorId: string) => ['vyb', 'profile', qorId] as const,
    gallery: (qorId: string) => ['vyb', 'gallery', qorId] as const,
    post: (postId: string) => ['vyb', 'post', postId] as const,
  },
  
  // Blockchain
  chain: {
    all: ['chain'] as const,
    health: () => ['chain', 'health'] as const,
    block: (number: number) => ['chain', 'block', number] as const,
    latestBlock: () => ['chain', 'latestBlock'] as const,
    validators: () => ['chain', 'validators'] as const,
    era: () => ['chain', 'era'] as const,
    status: () => ['chain', 'status'] as const,
  },
  
  // NFTs / DRC-369
  nft: {
    all: ['nft'] as const,
    list: (address: string) => ['nft', 'list', address] as const,
    detail: (tokenId: string) => ['nft', 'detail', tokenId] as const,
    state: (tokenId: string, path: string) => ['nft', 'state', tokenId, path] as const,
  },
  
  // Music
  music: {
    all: ['music'] as const,
    releases: () => ['music', 'releases'] as const,
    release: (id: string) => ['music', 'release', id] as const,
    artist: (id: string) => ['music', 'artist', id] as const,
    playlists: () => ['music', 'playlists'] as const,
  },
  
  // Games
  games: {
    all: ['games'] as const,
    list: () => ['games', 'list'] as const,
    game: (id: string) => ['games', 'game', id] as const,
    leaderboard: (gameId: string) => ['games', 'leaderboard', gameId] as const,
  },
};

// ============================================================================
// Invalidation Helpers
// ============================================================================

/**
 * Invalidate all user-related queries
 */
export function invalidateUserQueries(qorId?: string) {
  if (qorId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.profile(qorId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.user.stats(qorId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.vyb.profile(qorId) });
  } else {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
  }
}

/**
 * Invalidate all wallet-related queries
 */
export function invalidateWalletQueries(address?: string) {
  if (address) {
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance(address) });
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet.transactions(address) });
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet.energy(address) });
    queryClient.invalidateQueries({ queryKey: queryKeys.user.nfts(address) });
  } else {
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
  }
}

/**
 * Invalidate VYB feed
 */
export function invalidateFeed() {
  queryClient.invalidateQueries({ queryKey: queryKeys.vyb.feed('global') });
  queryClient.invalidateQueries({ queryKey: queryKeys.vyb.feed('following') });
}

/**
 * Prefetch user profile (for hover cards, etc.)
 */
export async function prefetchUserProfile(qorId: string, fetchFn: () => Promise<unknown>) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.vyb.profile(qorId),
    queryFn: fetchFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
