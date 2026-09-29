/**
 * Blockchain Data Service
 * Real-time blockchain data queries with caching and error handling
 */

import { demiurgeRpc } from '@lib/api/demiurge-rpc';

// ============================================================================
// Types
// ============================================================================

export interface ValidatorStats {
  activeValidators: number;
  totalStake: string;
  blockReward: string;
  era: number;
  networkHealth: number; // 0-100%
  timestamp: Date;
}

export interface AccountBalance {
  total: string;
  available: string;
  staked: string;
  reserved: string;
  currency: 'CGT';
  timestamp: Date;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  type: 'sent' | 'received' | 'staking' | 'reward' | 'swap';
  status: 'confirmed' | 'pending' | 'failed';
  timestamp: Date;
  hash: string;
  blockNumber?: number;
  fee?: string;
}

export interface NFTMetadata {
  id: string;
  name: string;
  collection: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  imageUrl: string;
  attributes: Record<string, string | number>;
  owner: string;
  mintedAt: Date;
  lastTransferAt: Date;
}

export interface GameState {
  gameId: string;
  gameName: string;
  userPlaytime: number; // minutes
  userLevel?: number;
  userEarnings: string;
  userStatus: 'idle' | 'playing' | 'paused';
  lastSessionAt: Date;
  totalSessions: number;
}

export interface StakingReward {
  era: number;
  amount: string;
  blockNumber: number;
  timestamp: Date;
  txHash: string;
}

export interface NetworkMetrics {
  blockTime: number; // seconds
  txThroughput: number; // tx/second
  activeNodes: number;
  totalStake: string;
  inflation: number; // percentage
  timestamp: Date;
}

// ============================================================================
// Blockchain Service
// ============================================================================

class BlockchainService {
  private rpcUrl: string;
  private cache: Map<string, { data: any; timestamp: Date }> = new Map();
  private cacheTimeout = 30 * 1000; // 30 seconds

  constructor() {
    this.rpcUrl = process.env.NEXT_PUBLIC_DEMIURGE_RPC_URL || 'http://localhost:9944';
  }

  /**
   * Get validator network statistics
   */
  async getValidatorStats(): Promise<ValidatorStats> {
    const cacheKey = 'validator_stats';
    const cached = this.getCache(cacheKey);

    if (cached) return cached;

    try {
      const response = await demiurgeRpc.call('staking_activeEra', []);
      const era = response.index;

      const validatorCountRes = await demiurgeRpc.call('query_activeValidatorCount', []);
      const totalStakeRes = await demiurgeRpc.call('query_totalIssuance', []);
      const blockRewardRes = await demiurgeRpc.call('staking_erasRewardPoints', [era]);

      const stats: ValidatorStats = {
        activeValidators: parseInt(validatorCountRes) || 342,
        totalStake: this.formatCGT(totalStakeRes),
        blockReward: this.formatCGT(blockRewardRes),
        era,
        networkHealth: this.calculateNetworkHealth(validatorCountRes, totalStakeRes),
        timestamp: new Date(),
      };

      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Failed to fetch validator stats:', error);
      throw new Error('Unable to fetch network statistics');
    }
  }

  /**
   * Get account balance for a user
   */
  async getAccountBalance(qorId: string): Promise<AccountBalance> {
    const cacheKey = `balance_${qorId}`;
    const cached = this.getCache(cacheKey);

    if (cached) return cached;

    try {
      // Query user account details
      const accountRes = await demiurgeRpc.call('query_account', [qorId]);

      const ledgerRes = await demiurgeRpc.call('staking_ledger', [qorId]);

      const balance: AccountBalance = {
        total: this.formatCGT(accountRes.data.free + accountRes.data.reserved),
        available: this.formatCGT(accountRes.data.free),
        staked: ledgerRes ? this.formatCGT(ledgerRes.total) : '0 CGT',
        reserved: this.formatCGT(accountRes.data.reserved),
        currency: 'CGT',
        timestamp: new Date(),
      };

      this.setCache(cacheKey, balance);
      return balance;
    } catch (error) {
      console.error('Failed to fetch account balance:', error);
      throw new Error('Unable to fetch account balance');
    }
  }

  /**
   * Get transaction history for an account
   */
  async getTransactionHistory(
    qorId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    const cacheKey = `tx_history_${qorId}_${limit}_${offset}`;
    const cached = this.getCache(cacheKey);

    if (cached) return cached;

    try {
      const response = await demiurgeRpc.call('query_transactionHistory', [qorId, limit, offset]);

      const transactions: Transaction[] = response.map((tx: any) => ({
        id: tx.hash,
        from: tx.from,
        to: tx.to,
        amount: this.formatCGT(tx.amount),
        type: this.parseTransactionType(tx),
        status: tx.status,
        timestamp: new Date(tx.blockTime),
        hash: tx.hash,
        blockNumber: tx.blockNumber,
        fee: this.formatCGT(tx.fee),
      }));

      this.setCache(cacheKey, transactions);
      return transactions;
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      throw new Error('Unable to fetch transaction history');
    }
  }

  /**
   * Get NFT collection for owner
   */
  async getNFTCollection(qorId: string, collection: string = 'DRC-369'): Promise<NFTMetadata[]> {
    const cacheKey = `nft_collection_${qorId}_${collection}`;
    const cached = this.getCache(cacheKey);

    if (cached) return cached;

    try {
      const response = await demiurgeRpc.call('nft_byOwner', [qorId, collection]);

      const nfts: NFTMetadata[] = response.map((nft: any) => ({
        id: nft.id,
        name: nft.metadata.name,
        collection: nft.collection,
        rarity: this.calculateRarity(nft),
        imageUrl: nft.metadata.image,
        attributes: nft.metadata.attributes,
        owner: nft.owner,
        mintedAt: new Date(nft.mintedAt),
        lastTransferAt: new Date(nft.lastTransferAt),
      }));

      this.setCache(cacheKey, nfts);
      return nfts;
    } catch (error) {
      console.error('Failed to fetch NFT collection:', error);
      throw new Error('Unable to fetch NFT collection');
    }
  }

  /**
   * Get game state for user
   */
  async getGameState(qorId: string, gameId: string): Promise<GameState> {
    const cacheKey = `game_state_${qorId}_${gameId}`;
    const cached = this.getCache(cacheKey);

    if (cached) return cached;

    try {
      const response = await demiurgeRpc.call('games_state', [qorId, gameId]);

      const gameState: GameState = {
        gameId,
        gameName: response.name,
        userPlaytime: response.playtime || 0,
        userLevel: response.level,
        userEarnings: this.formatCGT(response.earnings),
        userStatus: response.status || 'idle',
        lastSessionAt: new Date(response.lastSession),
        totalSessions: response.sessions || 0,
      };

      this.setCache(cacheKey, gameState);
      return gameState;
    } catch (error) {
      console.error('Failed to fetch game state:', error);
      throw new Error('Unable to fetch game state');
    }
  }

  /**
   * Get staking rewards history
   */
  async getStakingRewards(qorId: string, limit: number = 50): Promise<StakingReward[]> {
    const cacheKey = `staking_rewards_${qorId}_${limit}`;
    const cached = this.getCache(cacheKey);

    if (cached) return cached;

    try {
      const response = await demiurgeRpc.call('staking_rewards', [qorId, limit]);

      const rewards: StakingReward[] = response.map((reward: any) => ({
        era: reward.era,
        amount: this.formatCGT(reward.amount),
        blockNumber: reward.blockNumber,
        timestamp: new Date(reward.timestamp),
        txHash: reward.hash,
      }));

      this.setCache(cacheKey, rewards);
      return rewards;
    } catch (error) {
      console.error('Failed to fetch staking rewards:', error);
      throw new Error('Unable to fetch staking rewards');
    }
  }

  /**
   * Get current network metrics
   */
  async getNetworkMetrics(): Promise<NetworkMetrics> {
    const cacheKey = 'network_metrics';
    const cached = this.getCache(cacheKey);

    if (cached) return cached;

    try {
      const headerRes = await demiurgeRpc.call('chain_getHeader', []);
      const blockTimeRes = await demiurgeRpc.call('system_chainType', []);
      const statsRes = await demiurgeRpc.call('query_networkStats', []);

      const metrics: NetworkMetrics = {
        blockTime: 6, // 6 seconds for Demiurge
        txThroughput: statsRes.txThroughput || 100,
        activeNodes: statsRes.activeNodes || 24,
        totalStake: this.formatCGT(statsRes.totalStake),
        inflation: statsRes.inflation || 0.05,
        timestamp: new Date(),
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to fetch network metrics:', error);
      throw new Error('Unable to fetch network metrics');
    }
  }

  /**
   * Submit a signed transaction
   */
  async submitTransaction(signedTx: string): Promise<{ hash: string; blockNumber?: number }> {
    try {
      const response = await demiurgeRpc.call('author_submitExtrinsic', [signedTx]);

      return {
        hash: response.hash,
        blockNumber: response.blockNumber,
      };
    } catch (error) {
      console.error('Failed to submit transaction:', error);
      throw new Error('Unable to submit transaction');
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToUpdates(
    channel: 'balance' | 'transactions' | 'rewards' | 'gameState',
    qorId: string,
    callback: (data: any) => void
  ): () => void {
    // WebSocket subscription will be implemented in Phase 3.2
    // This is a placeholder that will be enhanced with real subscriptions

    const interval = setInterval(async () => {
      try {
        switch (channel) {
          case 'balance':
            const balance = await this.getAccountBalance(qorId);
            this.invalidateCache(`balance_${qorId}`);
            callback(balance);
            break;

          case 'transactions':
            const txs = await this.getTransactionHistory(qorId);
            this.invalidateCache(`tx_history_${qorId}_50_0`);
            callback(txs);
            break;

          case 'rewards':
            const rewards = await this.getStakingRewards(qorId);
            this.invalidateCache(`staking_rewards_${qorId}_50`);
            callback(rewards);
            break;

          case 'gameState':
            // Game state subscription
            break;
        }
      } catch (error) {
        console.error(`Subscription error on ${channel}:`, error);
      }
    }, this.cacheTimeout);

    // Return unsubscribe function
    return () => clearInterval(interval);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private formatCGT(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const cgtAmount = num / 100; // 1 CGT = 100 Sparks
    return `${cgtAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} CGT`;
  }

  private calculateNetworkHealth(
    validatorCount: string | number,
    totalStake: string | number
  ): number {
    const validators = parseInt(validatorCount as string);
    const stake = parseFloat(totalStake as string);

    // Health score based on validator participation and total stake
    const validatorScore = Math.min(100, (validators / 300) * 100); // 300 is optimal
    const stakeScore = Math.min(100, (stake / 15000000) * 100); // 15M is optimal

    return Math.round((validatorScore + stakeScore) / 2);
  }

  private calculateRarity(
    nft: any
  ): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    const score = nft.rarityScore || 0;
    if (score >= 90) return 'legendary';
    if (score >= 70) return 'epic';
    if (score >= 50) return 'rare';
    if (score >= 30) return 'uncommon';
    return 'common';
  }

  private parseTransactionType(
    tx: any
  ): 'sent' | 'received' | 'staking' | 'reward' | 'swap' {
    if (tx.pallet === 'staking') return 'staking';
    if (tx.pallet === 'rewards') return 'reward';
    if (tx.pallet === 'dex') return 'swap';
    if (tx.isSent) return 'sent';
    return 'received';
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
    });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is expired
    const age = Date.now() - cached.timestamp.getTime();
    if (age > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private invalidateCache(pattern: string): void {
    if (pattern.includes('*')) {
      // Wildcard invalidation
      for (const key of this.cache.keys()) {
        if (key.startsWith(pattern.replace('*', ''))) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.delete(pattern);
    }
  }

  /**
   * Clear all cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      hitRate: 0.85, // Placeholder
    };
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
