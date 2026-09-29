/**
 * DRC-369 React Hooks
 * 
 * React hooks for interacting with DRC-369 NFTs.
 * Provides reactive state management and real-time updates.
 */

import { useState, useEffect, useCallback, useMemo, useContext, createContext, ReactNode } from 'react';
import { Drc369Client, Drc369ClientConfig } from '../client';
import {
  Drc369Nft,
  NftId,
  Address,
  MintParams,
  TransferParams,
  NftQueryFilters,
  PaginatedResponse,
  TxResult,
  CvpStatus,
  Drc369Event,
  Permission,
  calculateLevel,
  xpToNextLevel,
  levelProgress,
} from '../types';

// =============================================================================
// CONTEXT
// =============================================================================

interface Drc369ContextValue {
  client: Drc369Client;
  isConnected: boolean;
  address: Address | null;
  setAddress: (address: Address | null) => void;
}

const Drc369Context = createContext<Drc369ContextValue | null>(null);

export interface Drc369ProviderProps {
  children: ReactNode;
  config?: Drc369ClientConfig;
  address?: Address | null;
}

/**
 * Provider component for DRC-369 client
 */
export function Drc369Provider({ children, config, address: initialAddress }: Drc369ProviderProps) {
  const [client] = useState(() => new Drc369Client(config));
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<Address | null>(initialAddress ?? null);

  useEffect(() => {
    client.on('connected', () => setIsConnected(true));
    client.on('disconnected', () => setIsConnected(false));
    
    client.connect();
    
    return () => {
      client.disconnect();
    };
  }, [client]);

  useEffect(() => {
    if (address) {
      client.subscribeToAddress(address);
    }
  }, [client, address]);

  const value = useMemo(() => ({
    client,
    isConnected,
    address,
    setAddress,
  }), [client, isConnected, address]);

  return (
    <Drc369Context.Provider value={value}>
      {children}
    </Drc369Context.Provider>
  );
}

/**
 * Hook to access DRC-369 client
 */
export function useDrc369Client(): Drc369Client {
  const context = useContext(Drc369Context);
  if (!context) {
    throw new Error('useDrc369Client must be used within a Drc369Provider');
  }
  return context.client;
}

/**
 * Hook to access connection status
 */
export function useDrc369Connection(): { isConnected: boolean; address: Address | null } {
  const context = useContext(Drc369Context);
  if (!context) {
    throw new Error('useDrc369Connection must be used within a Drc369Provider');
  }
  return { isConnected: context.isConnected, address: context.address };
}

// =============================================================================
// NFT HOOKS
// =============================================================================

interface UseNftResult {
  nft: Drc369Nft | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and subscribe to a single NFT
 */
export function useNft(nftId: NftId | null): UseNftResult {
  const client = useDrc369Client();
  const [nft, setNft] = useState<Drc369Nft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!nftId) {
      setNft(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await client.getNft(nftId);
      setNft(data);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [client, nftId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!nftId) return;

    client.subscribeToNft(nftId);

    const handleEvent = (event: Drc369Event) => {
      if (event.nftId === nftId) {
        refetch();
      }
    };

    client.on('event', handleEvent);

    return () => {
      client.unsubscribeFromNft(nftId);
      client.off('event', handleEvent);
    };
  }, [client, nftId, refetch]);

  return { nft, loading, error, refetch };
}

interface UseNftsResult {
  nfts: Drc369Nft[];
  total: number;
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

/**
 * Hook to fetch and paginate NFTs
 */
export function useNfts(filters: NftQueryFilters = {}): UseNftsResult {
  const client = useDrc369Client();
  const [nfts, setNfts] = useState<Drc369Nft[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(1);

    try {
      const data = await client.listNfts({ ...filters, page: 1 });
      setNfts(data.items);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [client, JSON.stringify(filters)]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    const nextPage = page + 1;

    try {
      const data = await client.listNfts({ ...filters, page: nextPage });
      setNfts(prev => [...prev, ...data.items]);
      setPage(nextPage);
      setHasMore(data.hasMore);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [client, filters, page, hasMore, loading]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { nfts, total, loading, error, hasMore, refetch, loadMore };
}

/**
 * Hook to fetch NFTs owned by current address
 */
export function useMyNfts(filters: Omit<NftQueryFilters, 'owner'> = {}): UseNftsResult {
  const { address } = useDrc369Connection();
  return useNfts({ ...filters, owner: address ?? undefined });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

interface UseMintResult {
  mint: (params: MintParams) => Promise<TxResult<Drc369Nft>>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for minting NFTs
 */
export function useMint(): UseMintResult {
  const client = useDrc369Client();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mint = useCallback(async (params: MintParams): Promise<TxResult<Drc369Nft>> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.mint(params);
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return { mint, loading, error };
}

interface UseTransferResult {
  transfer: (params: TransferParams) => Promise<TxResult>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for transferring NFTs
 */
export function useTransfer(): UseTransferResult {
  const client = useDrc369Client();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const transfer = useCallback(async (params: TransferParams): Promise<TxResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.transfer(params);
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return { transfer, loading, error };
}

interface UseAddXpResult {
  addXp: (nftId: NftId, amount: number, reason?: string) => Promise<TxResult<{ newXp: number; newLevel: number; leveledUp: boolean }>>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for adding XP
 */
export function useAddXp(): UseAddXpResult {
  const client = useDrc369Client();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addXp = useCallback(async (
    nftId: NftId,
    amount: number,
    reason?: string
  ): Promise<TxResult<{ newXp: number; newLevel: number; leveledUp: boolean }>> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.addXp({ nftId, amount, reason });
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return { addXp, loading, error };
}

// =============================================================================
// CVP HOOKS
// =============================================================================

interface UseCvpStatusResult {
  status: CvpStatus | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for CVP status of an NFT
 */
export function useCvpStatus(nftId: NftId | null): UseCvpStatusResult {
  const client = useDrc369Client();
  const [status, setStatus] = useState<CvpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!nftId) {
      setStatus(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await client.getCvpStatus(nftId);
      setStatus(data);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [client, nftId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Subscribe to CVP events
  useEffect(() => {
    client.subscribeToCvp();

    const handleMutation = (event: Drc369Event) => {
      if (event.nftId === nftId) {
        refetch();
      }
    };

    client.on('cvp_mutation', handleMutation);
    client.on('threat_detected', handleMutation);

    return () => {
      client.off('cvp_mutation', handleMutation);
      client.off('threat_detected', handleMutation);
    };
  }, [client, nftId, refetch]);

  return { status, loading, error, refetch };
}

interface UseSystemCvpResult {
  epoch: number;
  blocksRemaining: number;
  totalMutations: number;
  activeThreats: number;
  proofSystem: string;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for system-wide CVP status
 */
export function useSystemCvp(): UseSystemCvpResult {
  const client = useDrc369Client();
  const [data, setData] = useState({
    epoch: 0,
    blocksRemaining: 0,
    totalMutations: 0,
    activeThreats: 0,
    proofSystem: 'unknown',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await client.getSystemCvpStatus();
        setData({
          epoch: status.currentEpoch,
          blocksRemaining: status.epochBlocksRemaining,
          totalMutations: status.totalMutations,
          activeThreats: status.activeThreats,
          proofSystem: status.proofSystem,
        });
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // Poll every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [client]);

  return { ...data, loading, error };
}

// =============================================================================
// LEVELING HOOKS
// =============================================================================

interface UseLevelingResult {
  level: number;
  xp: number;
  xpToNext: number;
  progress: number;
  isMaxLevel: boolean;
}

/**
 * Hook for NFT leveling calculations
 */
export function useLeveling(nft: Drc369Nft | null): UseLevelingResult {
  return useMemo(() => {
    if (!nft) {
      return {
        level: 1,
        xp: 0,
        xpToNext: 100,
        progress: 0,
        isMaxLevel: false,
      };
    }

    const level = calculateLevel(nft.xp);
    const xpToNext = xpToNextLevel(nft.xp);
    const progress = levelProgress(nft.xp);

    return {
      level,
      xp: nft.xp,
      xpToNext,
      progress,
      isMaxLevel: xpToNext === 0,
    };
  }, [nft?.xp]);
}

// =============================================================================
// PERMISSION HOOKS
// =============================================================================

interface UsePermissionResult {
  hasPermission: boolean;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to check if current user has permission on an NFT
 */
export function usePermission(nftId: NftId | null, permission: Permission): UsePermissionResult {
  const client = useDrc369Client();
  const { address } = useDrc369Connection();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!nftId || !address) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    const checkPermission = async () => {
      setLoading(true);
      try {
        const result = await client.hasPermission(nftId, address, permission);
        setHasPermission(result);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [client, nftId, address, permission]);

  return { hasPermission, loading, error };
}

// =============================================================================
// EVENT HOOKS
// =============================================================================

/**
 * Hook to listen for specific DRC-369 events
 */
export function useDrc369Events(
  eventTypes: Array<'mint' | 'transfer' | 'level_up' | 'cvp_mutation' | 'threat_detected'>,
  callback: (event: Drc369Event) => void
): void {
  const client = useDrc369Client();

  useEffect(() => {
    const handler = (event: Drc369Event) => {
      if (eventTypes.includes(event.type as any)) {
        callback(event);
      }
    };

    client.on('event', handler);
    return () => {
      client.off('event', handler);
    };
  }, [client, eventTypes, callback]);
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook for file upload
 */
export function useFileUpload(): {
  upload: (file: File) => Promise<string>;
  loading: boolean;
  error: Error | null;
} {
  const client = useDrc369Client();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(async (file: File): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const uri = await client.uploadFile(file);
      return uri;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return { upload, loading, error };
}

// Re-export types
export * from '../types';
