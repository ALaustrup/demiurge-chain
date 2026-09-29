/**
 * Block Explorer Service
 * 
 * Provides comprehensive blockchain data for the explorer
 * with caching, pagination, and real-time updates.
 * 
 * Supports both polling and WebSocket subscriptions for real-time data.
 */

import { demiurgeRpc, RPC_URL } from './demiurge-rpc';
import type {
  BlockDetails,
  BlockSummary,
  TransactionDetails,
  TransactionSummary,
  AccountDetails,
  NetworkStats,
  NetworkCharts,
  ValidatorDetails,
  ValidatorSummary,
  SearchResult,
  PaginatedResponse,
  BlockFilter,
  TransactionFilter,
  ChartDataPoint,
} from './explorer-types';

class ExplorerService {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private CACHE_TTL = 10000; // 10 seconds

  /**
   * Get cached data or fetch fresh
   */
  private async getCached<T>(key: string, fetcher: () => Promise<T>, ttl = this.CACHE_TTL): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }

    const data = await fetcher();
    this.cache.set(key, { data, expiry: Date.now() + ttl });
    return data;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ============ Network Stats ============

  /**
   * Get comprehensive network statistics
   */
  async getNetworkStats(): Promise<NetworkStats> {
    return this.getCached('networkStats', async () => {
      try {
        const [health, status, era] = await Promise.all([
          demiurgeRpc.getHealth(),
          demiurgeRpc.getConsensusStatus(),
          demiurgeRpc.getCurrentEra(),
        ]);

        // Calculate TPS from recent blocks
        const tps = await this.calculateTPS();

        return {
          blockHeight: status.blockNumber,
          blockTime: health.blockTime,
          lastBlockTime: Date.now(),
          tps: tps.current,
          avgTps24h: tps.avg24h,
          currentEra: status.currentEra,
          eraProgress: this.calculateEraProgress(status.blockNumber, era.blockNumber),
          eraStartBlock: era.blockNumber,
          blocksPerEra: 14400, // ~1 day at 6s blocks
          activeValidators: era.validators.filter(v => v.active).length,
          totalValidators: status.validators,
          validatorSetChanges: 0,
          totalSupply: '1000000000', // 1 billion CGT
          circulatingSupply: '500000000',
          totalStaked: status.totalStake,
          stakingRatio: this.calculateStakingRatio(status.totalStake),
          totalTransactionFees: status.transactionFees,
          finality: health.finality,
          peerCount: 0,
          networkVersion: '1.0.0',
        };
      } catch (error) {
        // Return empty stats when blockchain is unavailable
        return {
          blockHeight: 0,
          blockTime: 0,
          lastBlockTime: 0,
          tps: 0,
          avgTps24h: 0,
          currentEra: 0,
          eraProgress: 0,
          eraStartBlock: 0,
          blocksPerEra: 14400,
          activeValidators: 0,
          totalValidators: 0,
          validatorSetChanges: 0,
          totalSupply: '1000000000',
          circulatingSupply: '500000000',
          totalStaked: '0',
          stakingRatio: 0,
          totalTransactionFees: '0',
          finality: 0,
          peerCount: 0,
          networkVersion: '1.0.0',
        };
      }
    });
  }

  private calculateEraProgress(currentBlock: number, eraStartBlock: number): number {
    const blocksPerEra = 14400;
    const blocksInEra = currentBlock - eraStartBlock;
    return Math.min(100, (blocksInEra / blocksPerEra) * 100);
  }

  private calculateStakingRatio(totalStaked: string): number {
    const staked = parseFloat(totalStaked) || 0;
    const total = 1000000000; // 1 billion
    return (staked / total) * 100;
  }

  private async calculateTPS(): Promise<{ current: number; avg24h: number }> {
    try {
      const blocks = await this.getRecentBlocks(10);
      if (blocks.length < 2) return { current: 0, avg24h: 0 };

      const totalTxs = blocks.reduce((sum, b) => sum + b.transactionCount, 0);
      const timeSpan = (blocks[0].timestamp - blocks[blocks.length - 1].timestamp) / 1000;
      const current = timeSpan > 0 ? totalTxs / timeSpan : 0;

      return { current: Math.round(current * 100) / 100, avg24h: current };
    } catch {
      return { current: 0, avg24h: 0 };
    }
  }

  // ============ Chart Data ============

  /**
   * Get chart data for network visualizations
   */
  async getNetworkCharts(): Promise<NetworkCharts> {
    return this.getCached('networkCharts', async () => {
      try {
        const blocks = await this.getRecentBlocks(100);
        
        // Generate chart data from blocks
        const blockTimes: ChartDataPoint[] = [];
        const tpsHistory: ChartDataPoint[] = [];
        const transactionsPerBlock: ChartDataPoint[] = [];
        const energyUsedHistory: ChartDataPoint[] = [];

        for (let i = 1; i < blocks.length; i++) {
          const block = blocks[i - 1];
          const prevBlock = blocks[i];
          const blockTime = (block.timestamp - prevBlock.timestamp) / 1000;

          blockTimes.push({ timestamp: block.timestamp, value: blockTime });
          transactionsPerBlock.push({ timestamp: block.timestamp, value: block.transactionCount });
          tpsHistory.push({ timestamp: block.timestamp, value: blockTime > 0 ? block.transactionCount / blockTime : 0 });
          energyUsedHistory.push({ timestamp: block.timestamp, value: block.size });
        }

        return {
          blockTimes: blockTimes.reverse(),
          tpsHistory: tpsHistory.reverse(),
          transactionsPerBlock: transactionsPerBlock.reverse(),
          energyUsedHistory: energyUsedHistory.reverse(),
          activeAddresses: [], // Requires historical data aggregation
          stakingHistory: [], // Requires historical data aggregation
        };
      } catch {
        // Return empty charts when blockchain is unavailable
        return {
          blockTimes: [],
          tpsHistory: [],
          transactionsPerBlock: [],
          energyUsedHistory: [],
          activeAddresses: [],
          stakingHistory: [],
        };
      }
    }, 30000); // 30 second cache for charts
  }

  // ============ Blocks ============

  /**
   * Get recent blocks
   */
  async getRecentBlocks(limit: number = 10): Promise<BlockSummary[]> {
    try {
      const latestBlock = await demiurgeRpc.getLatestBlock();
      const blocks: BlockSummary[] = [];

      for (let i = 0; i < limit && latestBlock.number - i >= 0; i++) {
        const block = await demiurgeRpc.getBlock(latestBlock.number - i);
        if (block) {
          const blockAny = block as any;
          blocks.push({
            hash: block.hash,
            number: block.number,
            timestamp: block.timestamp,
            transactionCount: block.transactions?.length || 0,
            validator: blockAny.author || blockAny.validator || '',
            size: blockAny.size || 0,
            finalized: true,
          });
        }
      }

      return blocks;
    } catch (error) {
      // Return empty array when blockchain is unavailable
      return [];
    }
  }

  /**
   * Get block details by number or hash
   */
  async getBlockDetails(blockId: string | number): Promise<BlockDetails | null> {
    try {
      const blockNumber = typeof blockId === 'string' && blockId.startsWith('0x')
        ? parseInt(blockId, 16)
        : typeof blockId === 'string' ? parseInt(blockId) : blockId;

      const block = await demiurgeRpc.getBlock(blockNumber);
      if (!block) return null;

      const blockAny = block as any;
      return {
        hash: block.hash,
        number: block.number,
        parentHash: block.parentHash,
        stateRoot: block.stateRoot,
        extrinsicsRoot: block.extrinsicsRoot,
        timestamp: block.timestamp,
        validator: blockAny.author || blockAny.validator || '',
        size: blockAny.size || 0,
        energyUsed: blockAny.energyUsed || blockAny.gasUsed || 0,
        energyLimit: blockAny.energyLimit || blockAny.gasLimit || 15000000,
        transactionCount: block.transactions?.length || 0,
        transactions: (block.transactions || []).map(tx => {
          const txAny = tx as any;
          return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to || null,
            value: tx.amount || '0',
            type: 'transfer' as const,
            status: txAny.status === 'finalized' ? 'success' as const : 'pending' as const,
            timestamp: block.timestamp,
          };
        }),
        era: Math.floor(block.number / 14400),
        finalized: true,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get paginated blocks
   */
  async getBlocks(page: number = 1, pageSize: number = 25, filter?: BlockFilter): Promise<PaginatedResponse<BlockSummary>> {
    const blocks = await this.getRecentBlocks(page * pageSize + pageSize);
    const start = (page - 1) * pageSize;
    const data = blocks.slice(start, start + pageSize);
    const stats = await this.getNetworkStats();

    return {
      data,
      total: stats.blockHeight || data.length,
      page,
      pageSize,
      hasMore: data.length === pageSize,
    };
  }

  // ============ Transactions ============

  /**
   * Get recent transactions
   */
  async getRecentTransactions(limit: number = 10): Promise<TransactionSummary[]> {
    try {
      const blocks = await this.getRecentBlocks(5);
      const transactions: TransactionSummary[] = [];

      for (const block of blocks) {
        const blockDetails = await demiurgeRpc.getBlock(block.number);
        if (blockDetails?.transactions) {
          for (const tx of blockDetails.transactions) {
            transactions.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to || null,
              value: tx.amount || '0',
              type: 'transfer',
              status: tx.status === 'finalized' ? 'success' : 'pending',
              timestamp: blockDetails.timestamp,
            });
            if (transactions.length >= limit) break;
          }
        }
        if (transactions.length >= limit) break;
      }

      return transactions;
    } catch {
      // Return empty array when blockchain is unavailable
      return [];
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(hash: string): Promise<TransactionDetails | null> {
    try {
      const tx = await demiurgeRpc.getTransaction(hash);
      if (!tx) return null;

      return {
        hash: tx.hash,
        blockHash: '0x...',
        blockNumber: 0,
        from: tx.from,
        to: tx.to || null,
        value: tx.amount || '0',
        energyPrice: '1000000000',
        energyUsed: 21000,
        energyLimit: 21000,
        nonce: tx.nonce,
        input: '0x',
        status: tx.status === 'finalized' ? 'success' : tx.status === 'failed' ? 'failed' : 'pending',
        timestamp: Date.now(),
        type: 'transfer',
        confirmations: 12,
        fee: '0.001',
      };
    } catch {
      return null;
    }
  }

  /**
   * Get paginated transactions
   */
  async getTransactions(page: number = 1, pageSize: number = 25, filter?: TransactionFilter): Promise<PaginatedResponse<TransactionSummary>> {
    const transactions = await this.getRecentTransactions(page * pageSize + pageSize);
    const start = (page - 1) * pageSize;
    const data = transactions.slice(start, start + pageSize);

    return {
      data,
      total: data.length,
      page,
      pageSize,
      hasMore: data.length === pageSize,
    };
  }

  // ============ Validators ============

  /**
   * Get validator list
   */
  async getValidators(): Promise<ValidatorSummary[]> {
    try {
      const validators = await demiurgeRpc.getValidators();
      return validators.map((v, i) => {
        const vAny = v as any;
        return {
          address: v.account,
          name: vAny.name || `Validator ${i + 1}`,
          stake: v.stake,
          commission: v.commission,
          nominators: vAny.nominators || 0,
          active: v.active,
          blocksProducedEra: vAny.blocksProducedEra || 0,
          uptime: vAny.uptime || 0,
        };
      });
    } catch {
      // Return empty array when blockchain is unavailable
      return [];
    }
  }

  /**
   * Get validator details
   */
  async getValidatorDetails(address: string): Promise<ValidatorDetails | null> {
    try {
      const validator = await demiurgeRpc.getValidator(address);
      if (!validator) return null;

      const pool = await demiurgeRpc.getStakingPool(address);

      const vAny = validator as any;
      return {
        address: validator.account,
        stake: validator.stake,
        selfStake: vAny.selfStake || (parseFloat(validator.stake) * 0.3).toFixed(0),
        nominators: pool?.nominators.length || 0,
        nominatorStake: pool ? pool.nominators.reduce((sum: number, n: any) => sum + parseFloat(n.stake || '0'), 0).toFixed(0) : '0',
        commission: validator.commission,
        active: validator.active,
        blocksProduced: vAny.blocksProduced || 0,
        blocksProducedEra: vAny.blocksProducedEra || 0,
        missedBlocks: vAny.missedBlocks || 0,
        uptime: vAny.uptime || 0,
        rewards24h: vAny.rewards24h || '0',
        rewardsTotal: vAny.rewardsTotal || '0',
        slashEvents: vAny.slashEvents || [],
      };
    } catch {
      return null;
    }
  }

  // ============ Accounts ============

  /**
   * Get account details
   */
  async getAccountDetails(address: string): Promise<AccountDetails | null> {
    try {
      const balance = await demiurgeRpc.getBalance(address);
      const txHistory = await demiurgeRpc.getTransactionHistory(address, 10);
      const nfts = await demiurgeRpc.getUserNFTs(address);

      return {
        address,
        balance,
        nonce: txHistory.length > 0 ? txHistory[0].nonce : 0,
        transactionCount: txHistory.length,
        tokenHoldings: [{
          token: 'CGT',
          symbol: 'CGT',
          balance,
          decimals: 18,
        }],
        nfts: nfts.map(nft => ({
          tokenId: nft.id,
          collection: nft.collection || 'DRC-369',
          name: nft.name,
          image: nft.image,
        })),
        isContract: false,
        isValidator: false,
        isNominator: false,
      };
    } catch {
      return null;
    }
  }

  // ============ Search ============

  /**
   * Search for blocks, transactions, or addresses
   */
  async search(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const trimmed = query.trim();

    if (!trimmed) return results;

    // Check if it's a block number
    if (/^\d+$/.test(trimmed)) {
      const blockNumber = parseInt(trimmed);
      const block = await this.getBlockDetails(blockNumber);
      if (block) {
        results.push({
          type: 'block',
          id: block.hash,
          title: `Block #${block.number}`,
          subtitle: `${block.transactionCount} transactions`,
          link: `/explorer/block/${block.number}`,
        });
      }
    }

    // Check if it's a transaction hash
    if (trimmed.startsWith('0x') && trimmed.length === 66) {
      const tx = await this.getTransactionDetails(trimmed);
      if (tx) {
        results.push({
          type: 'transaction',
          id: tx.hash,
          title: `Transaction ${tx.hash.slice(0, 16)}...`,
          subtitle: `${tx.value} CGT`,
          link: `/explorer/tx/${tx.hash}`,
        });
      }
    }

    // Check if it's an address
    if (trimmed.startsWith('0x') && trimmed.length === 42) {
      results.push({
        type: 'address',
        id: trimmed,
        title: `Address ${trimmed.slice(0, 10)}...${trimmed.slice(-8)}`,
        subtitle: 'View account details',
        link: `/explorer/address/${trimmed}`,
      });

      // Also check if it's a validator
      const validator = await this.getValidatorDetails(trimmed);
      if (validator) {
        results.push({
          type: 'validator',
          id: trimmed,
          title: `Validator ${validator.name || trimmed.slice(0, 10)}`,
          subtitle: `${validator.stake} CGT staked`,
          link: `/explorer/validator/${trimmed}`,
        });
      }
    }

    return results;
  }
}

// Export WebSocket URL for subscriptions
export function getWebSocketUrl(): string {
  // Convert HTTP URL to WebSocket URL
  const rpcUrl = RPC_URL || 'http://localhost:9944';
  return rpcUrl.replace('http://', 'ws://').replace('https://', 'wss://');
}

/**
 * Subscribe to new blocks via WebSocket.
 * Returns unsubscribe function.
 */
export function subscribeToBlocks(
  callback: (block: { number: number; hash: string; timestamp: number; transaction_count: number; author: string }) => void
): () => void {
  const wsUrl = getWebSocketUrl();
  const ws = new WebSocket(wsUrl);
  let subId: number | null = null;

  ws.onopen = () => {
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'chain_subscribeNewBlocks',
      params: [],
    }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.result && typeof data.result === 'number') {
        subId = data.result;
      }
      if (data.method === 'chain_newBlock' && data.params?.result) {
        callback(data.params.result);
      }
    } catch {
      // Ignore parse errors
    }
  };

  return () => {
    if (subId !== null && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'chain_unsubscribeNewBlocks',
        params: [subId],
      }));
    }
    ws.close();
  };
}

/**
 * Subscribe to new transactions via WebSocket.
 * Returns unsubscribe function.
 */
export function subscribeToTransactions(
  callback: (tx: { hash: string; from: string; to?: string; nonce: number; status: string; block_number?: number }) => void
): () => void {
  const wsUrl = getWebSocketUrl();
  const ws = new WebSocket(wsUrl);
  let subId: number | null = null;

  ws.onopen = () => {
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'chain_subscribeNewPendingTransactions',
      params: [],
    }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.result && typeof data.result === 'number') {
        subId = data.result;
      }
      const method = data.method;
      const params = data.params?.result ?? data.params;
      if ((method === 'chain_pendingTransaction' || method === 'chain_newPendingTransaction') && params) {
        callback(params);
      }
    } catch {
      // Ignore parse errors
    }
  };

  return () => {
    if (subId !== null && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'chain_unsubscribePendingTransactions',
        params: [subId],
      }));
    }
    ws.close();
  };
}

// Export singleton
export const explorerService = new ExplorerService();

// Re-export RPC_URL for convenience
export { RPC_URL };
