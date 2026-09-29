/**
 * Analytics Service
 * Aggregate and compute analytics from blockchain data
 */

import {
  blockchainService,
  ValidatorStats,
  AccountBalance,
  Transaction,
  StakingReward,
  NFTMetadata,
} from './blockchain';

// ============================================================================
// Types
// ============================================================================

export interface PortfolioMetrics {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  ytdReturn: number;
  allTimeReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  diversificationScore: number;
  lastUpdated: Date;
}

export interface AssetAllocation {
  liquidCGT: { amount: number; percent: number };
  stakedCGT: { amount: number; percent: number };
  nftValue: { amount: number; percent: number };
  gameAssets: { amount: number; percent: number };
  other: { amount: number; percent: number };
}

export interface PerformanceMetrics {
  totalTransactions: number;
  avgTransactionSize: number;
  totalVolume: number;
  successRate: number; // 0-100%
  avgConfirmationTime: number; // seconds
  totalFeesPaid: number;
  lastTransactionAt: Date;
}

export interface StakingMetrics {
  stakedAmount: number;
  validatorCount: number;
  averageAPY: number;
  totalRewardsEarned: number;
  estimatedAnnualReward: number;
  uptime: number; // 0-100%
  slashingRisk: number; // 0-100%
}

export interface NFTMetrics {
  totalNFTCount: number;
  totalValue: number;
  averageValue: number;
  floorPrice: number;
  highestValue: number;
  rarityDistribution: Record<string, number>; // rarity -> count
  byCollection: Record<string, { count: number; value: number }>;
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  change?: number;
  changePercent?: number;
}

// ============================================================================
// Analytics Service
// ============================================================================

class AnalyticsService {
  private priceCache: Map<
    string,
    { data: number[]; timestamp: Date; price: number }
  > = new Map();
  private metricsCache: Map<string, { data: any; timestamp: Date }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Calculate comprehensive portfolio metrics
   */
  async calculatePortfolioMetrics(qorId: string): Promise<PortfolioMetrics> {
    const cacheKey = `portfolio_metrics_${qorId}`;
    const cached = this.getMetricsCache(cacheKey);
    if (cached) return cached;

    try {
      const balance = await blockchainService.getAccountBalance(qorId);
      const transactions = await blockchainService.getTransactionHistory(qorId, 100);
      const nfts = await blockchainService.getNFTCollection(qorId);

      // Parse values
      const liquidCGT = this.parseCGT(balance.available);
      const stakedCGT = this.parseCGT(balance.staked);
      const nftValue = await this.calculateNFTValue(nfts);

      const totalValue = liquidCGT + stakedCGT + nftValue;

      // Calculate returns
      const dayChange = await this.calculateDayChange(transactions, liquidCGT);
      const ytdReturn = await this.calculateYTDReturn(transactions);
      const allTimeReturn = await this.calculateAllTimeReturn(transactions);

      // Risk metrics
      const prices = await this.getPriceHistory('CGT', 365);
      const volatility = this.calculateVolatility(prices);
      const sharpeRatio = this.calculateSharpeRatio(prices, 0.05); // 5% risk-free rate
      const maxDrawdown = this.calculateMaxDrawdown(prices);

      // Diversification (0-100)
      const diversificationScore = this.calculateDiversification({
        liquidCGT,
        stakedCGT,
        nftValue,
        gameAssets: 0,
      });

      const metrics: PortfolioMetrics = {
        totalValue,
        dayChange,
        dayChangePercent: (dayChange / totalValue) * 100,
        ytdReturn,
        allTimeReturn,
        sharpeRatio,
        maxDrawdown,
        volatility,
        diversificationScore,
        lastUpdated: new Date(),
      };

      this.setMetricsCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to calculate portfolio metrics:', error);
      throw new Error('Unable to calculate portfolio metrics');
    }
  }

  /**
   * Get asset allocation breakdown
   */
  async getAssetAllocation(qorId: string): Promise<AssetAllocation> {
    const cacheKey = `asset_allocation_${qorId}`;
    const cached = this.getMetricsCache(cacheKey);
    if (cached) return cached;

    try {
      const balance = await blockchainService.getAccountBalance(qorId);
      const nfts = await blockchainService.getNFTCollection(qorId);

      const liquidCGT = this.parseCGT(balance.available);
      const stakedCGT = this.parseCGT(balance.staked);
      const nftValue = await this.calculateNFTValue(nfts);
      const gameAssets = 0; // Will be enhanced with game data

      const total = liquidCGT + stakedCGT + nftValue + gameAssets;

      const allocation: AssetAllocation = {
        liquidCGT: {
          amount: liquidCGT,
          percent: (liquidCGT / total) * 100,
        },
        stakedCGT: {
          amount: stakedCGT,
          percent: (stakedCGT / total) * 100,
        },
        nftValue: {
          amount: nftValue,
          percent: (nftValue / total) * 100,
        },
        gameAssets: {
          amount: gameAssets,
          percent: (gameAssets / total) * 100,
        },
        other: {
          amount: 0,
          percent: 0,
        },
      };

      this.setMetricsCache(cacheKey, allocation);
      return allocation;
    } catch (error) {
      console.error('Failed to get asset allocation:', error);
      throw new Error('Unable to calculate asset allocation');
    }
  }

  /**
   * Get performance metrics from transactions
   */
  async getPerformanceMetrics(qorId: string): Promise<PerformanceMetrics> {
    const cacheKey = `performance_metrics_${qorId}`;
    const cached = this.getMetricsCache(cacheKey);
    if (cached) return cached;

    try {
      const transactions = await blockchainService.getTransactionHistory(qorId, 500);

      const confirmedTxs = transactions.filter((tx) => tx.status === 'confirmed');
      const totalFeesPaid = confirmedTxs.reduce((sum, tx) => {
        const fee = tx.fee ? this.parseCGT(tx.fee) : 0;
        return sum + fee;
      }, 0);

      const totalVolume = confirmedTxs.reduce((sum, tx) => {
        return sum + this.parseCGT(tx.amount);
      }, 0);

      const avgTransactionSize =
        confirmedTxs.length > 0
          ? totalVolume / confirmedTxs.length
          : 0;

      const successRate =
        transactions.length > 0
          ? (confirmedTxs.length / transactions.length) * 100
          : 0;

      const avgConfirmationTime = await this.calculateAvgConfirmationTime(transactions);

      const metrics: PerformanceMetrics = {
        totalTransactions: transactions.length,
        avgTransactionSize,
        totalVolume,
        successRate,
        avgConfirmationTime,
        totalFeesPaid,
        lastTransactionAt: transactions[0]?.timestamp || new Date(),
      };

      this.setMetricsCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      throw new Error('Unable to calculate performance metrics');
    }
  }

  /**
   * Get staking-specific metrics
   */
  async getStakingMetrics(qorId: string): Promise<StakingMetrics> {
    const cacheKey = `staking_metrics_${qorId}`;
    const cached = this.getMetricsCache(cacheKey);
    if (cached) return cached;

    try {
      const balance = await blockchainService.getAccountBalance(qorId);
      const validatorStats = await blockchainService.getValidatorStats();
      const rewards = await blockchainService.getStakingRewards(qorId);

      const stakedAmount = this.parseCGT(balance.staked);
      const totalRewardsEarned = rewards.reduce((sum, reward) => {
        return sum + this.parseCGT(reward.amount);
      }, 0);

      // Estimate based on average APY
      const averageAPY = 0.065; // 6.5% (from network stats)
      const estimatedAnnualReward = stakedAmount * averageAPY;

      const metrics: StakingMetrics = {
        stakedAmount,
        validatorCount: validatorStats.activeValidators,
        averageAPY: averageAPY * 100,
        totalRewardsEarned,
        estimatedAnnualReward,
        uptime: 95, // Will query actual uptime
        slashingRisk: 2, // Will calculate from network conditions
      };

      this.setMetricsCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to get staking metrics:', error);
      throw new Error('Unable to calculate staking metrics');
    }
  }

  /**
   * Get NFT collection metrics
   */
  async getNFTMetrics(qorId: string): Promise<NFTMetrics> {
    const cacheKey = `nft_metrics_${qorId}`;
    const cached = this.getMetricsCache(cacheKey);
    if (cached) return cached;

    try {
      const nfts = await blockchainService.getNFTCollection(qorId);

      const totalValue = await this.calculateNFTValue(nfts);
      const averageValue = nfts.length > 0 ? totalValue / nfts.length : 0;

      const rarityDistribution: Record<string, number> = {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
      };

      const byCollection: Record<string, { count: number; value: number }> = {};

      let maxValue = 0;

      for (const nft of nfts) {
        // Count rarity
        rarityDistribution[nft.rarity]++;

        // Group by collection
        if (!byCollection[nft.collection]) {
          byCollection[nft.collection] = { count: 0, value: 0 };
        }
        byCollection[nft.collection].count++;
        byCollection[nft.collection].value += await this.getNFTValue(nft);

        // Track highest value
        const nftValue = await this.getNFTValue(nft);
        if (nftValue > maxValue) {
          maxValue = nftValue;
        }
      }

      const metrics: NFTMetrics = {
        totalNFTCount: nfts.length,
        totalValue,
        averageValue,
        floorPrice: Math.min(...(await Promise.all(nfts.map((n) => this.getNFTValue(n))))),
        highestValue: maxValue,
        rarityDistribution,
        byCollection,
      };

      this.setMetricsCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to get NFT metrics:', error);
      throw new Error('Unable to calculate NFT metrics');
    }
  }

  /**
   * Get time-series chart data
   */
  async getChartData(
    metric: 'balance' | 'rewards' | 'portfolio',
    period: '24h' | '7d' | '30d' | '1y',
    qorId?: string
  ): Promise<ChartDataPoint[]> {
    const intervals = {
      '24h': 24, // hourly
      '7d': 7, // daily
      '30d': 30, // daily
      '1y': 52, // weekly
    };

    const intervalCount = intervals[period];
    const data: ChartDataPoint[] = [];

    // Generate sample data (will be replaced with real data from analytics DB)
    for (let i = 0; i < intervalCount; i++) {
      const date = new Date();
      date.setHours(date.getHours() - (intervalCount - i));

      let value = 1000 + Math.random() * 500;
      let change = (Math.random() - 0.5) * 50;

      data.push({
        timestamp: date,
        value,
        change,
        changePercent: (change / value) * 100,
      });
    }

    return data;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private parseCGT(value: string): number {
    return parseFloat(value.replace(' CGT', ''));
  }

  private async calculateNFTValue(nfts: NFTMetadata[]): Promise<number> {
    let total = 0;
    for (const nft of nfts) {
      total += await this.getNFTValue(nft);
    }
    return total;
  }

  private async getNFTValue(nft: NFTMetadata): Promise<number> {
    // Mock: will query actual market prices
    const rarityMultipliers: Record<string, number> = {
      common: 10,
      uncommon: 25,
      rare: 50,
      epic: 100,
      legendary: 500,
    };
    return rarityMultipliers[nft.rarity] || 10;
  }

  private async calculateDayChange(transactions: Transaction[], currentBalance: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyTransactions = transactions.filter((tx) => tx.timestamp >= today);

    let netChange = 0;
    for (const tx of dailyTransactions) {
      const amount = this.parseCGT(tx.amount);
      if (tx.type === 'received' || tx.type === 'reward') {
        netChange += amount;
      } else if (tx.type === 'sent') {
        netChange -= amount;
      }
    }

    return netChange;
  }

  private async calculateYTDReturn(transactions: Transaction[]): Promise<number> {
    const yearStart = new Date();
    yearStart.setFullYear(yearStart.getFullYear());
    yearStart.setMonth(0, 1);

    const ytdTransactions = transactions.filter((tx) => tx.timestamp >= yearStart);

    let totalReturn = 0;
    for (const tx of ytdTransactions) {
      const amount = this.parseCGT(tx.amount);
      if (tx.type === 'received' || tx.type === 'reward') {
        totalReturn += amount;
      }
    }

    return totalReturn;
  }

  private async calculateAllTimeReturn(transactions: Transaction[]): Promise<number> {
    let totalReturn = 0;
    for (const tx of transactions) {
      const amount = this.parseCGT(tx.amount);
      if (tx.type === 'received' || tx.type === 'reward') {
        totalReturn += amount;
      }
    }
    return totalReturn;
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const mean = prices.reduce((a, b) => a + b) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  }

  private calculateSharpeRatio(prices: number[], riskFreeRate: number): number {
    if (prices.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const avgReturn = returns.reduce((a, b) => a + b) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);

    return volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;
  }

  private calculateMaxDrawdown(prices: number[]): number {
    if (prices.length < 2) return 0;

    let maxPrice = prices[0];
    let maxDrawdown = 0;

    for (const price of prices) {
      if (price > maxPrice) {
        maxPrice = price;
      }
      const drawdown = (maxPrice - price) / maxPrice;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return -maxDrawdown * 100; // Return as negative percentage
  }

  private calculateDiversification(allocation: {
    liquidCGT: number;
    stakedCGT: number;
    nftValue: number;
    gameAssets: number;
  }): number {
    const total = allocation.liquidCGT + allocation.stakedCGT + allocation.nftValue + allocation.gameAssets;

    if (total === 0) return 0;

    const percentages = [
      allocation.liquidCGT / total,
      allocation.stakedCGT / total,
      allocation.nftValue / total,
      allocation.gameAssets / total,
    ].filter((p) => p > 0);

    // Herfindahl-Hirschman Index (HHI) based calculation
    const hhi = percentages.reduce((sum, p) => sum + p * p, 0);
    const diversification = (1 - hhi) * 100;

    return Math.max(0, Math.min(100, diversification));
  }

  private async calculateAvgConfirmationTime(transactions: Transaction[]): Promise<number> {
    // Mock implementation - would calculate real block confirmation times
    return 30; // 30 seconds average
  }

  private async getPriceHistory(token: string, days: number): Promise<number[]> {
    // Mock implementation - would fetch from price oracle
    const prices: number[] = [];
    let price = 100;

    for (let i = 0; i < days; i++) {
      price += (Math.random() - 0.5) * 5;
      prices.push(Math.max(50, price));
    }

    return prices;
  }

  private setMetricsCache(key: string, data: any): void {
    this.metricsCache.set(key, {
      data,
      timestamp: new Date(),
    });
  }

  private getMetricsCache(key: string): any | null {
    const cached = this.metricsCache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp.getTime();
    if (age > this.cacheTimeout) {
      this.metricsCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Clear all analytics cache
   */
  clearCache(): void {
    this.metricsCache.clear();
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
