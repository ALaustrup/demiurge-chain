/**
 * Game Rewards Integration
 * 
 * Provides CGT reward functionality for games within the Demiurge platform.
 * This is a private utility token system - rewards are platform credits,
 * not cryptocurrency.
 */

import { demiurgeRpc } from './demiurge-rpc';

export interface RewardEvent {
  type: 'achievement' | 'completion' | 'daily' | 'leaderboard' | 'referral' | 'milestone';
  amount: number; // CGT amount
  description: string;
  gameId?: string;
  metadata?: Record<string, any>;
}

export interface RewardResult {
  success: boolean;
  amount: number;
  newBalance?: string;
  message: string;
  transactionId?: string;
}

// Reward amounts for different events (in CGT)
export const REWARD_AMOUNTS = {
  // Daily rewards
  DAILY_LOGIN: 1,
  DAILY_FIRST_GAME: 2,
  DAILY_STREAK_BONUS: 5,
  
  // Gaming rewards
  GAME_COMPLETION: 3,
  GAME_HIGH_SCORE: 5,
  GAME_PERFECT_ROUND: 10,
  
  // Achievement rewards
  ACHIEVEMENT_BRONZE: 5,
  ACHIEVEMENT_SILVER: 15,
  ACHIEVEMENT_GOLD: 50,
  ACHIEVEMENT_PLATINUM: 100,
  
  // Leaderboard rewards
  LEADERBOARD_TOP_100: 10,
  LEADERBOARD_TOP_10: 50,
  LEADERBOARD_TOP_3: 100,
  LEADERBOARD_FIRST: 200,
  
  // Social rewards
  REFERRAL_SIGNUP: 50,
  REFERRAL_FIRST_GAME: 25,
  
  // Milestone rewards
  MILESTONE_10_GAMES: 20,
  MILESTONE_50_GAMES: 50,
  MILESTONE_100_GAMES: 100,
  MILESTONE_FIRST_NFT: 25,
  MILESTONE_FIRST_STAKE: 50,
} as const;

/**
 * Game Rewards Manager
 * Handles CGT rewards for player achievements and actions
 */
export class GameRewardsManager {
  private walletAddress: string | null = null;
  private pendingRewards: RewardEvent[] = [];
  private totalEarned: number = 0;
  
  constructor() {}
  
  /**
   * Initialize with player's wallet address
   */
  setWallet(address: string) {
    this.walletAddress = address;
  }
  
  /**
   * Queue a reward event (for batching)
   */
  queueReward(event: RewardEvent): void {
    this.pendingRewards.push(event);
  }
  
  /**
   * Award CGT immediately
   */
  async awardReward(event: RewardEvent): Promise<RewardResult> {
    if (!this.walletAddress) {
      return {
        success: false,
        amount: 0,
        message: 'No wallet connected',
      };
    }
    
    try {
      // In production, this would call the blockchain to mint/transfer CGT
      // For now, we track locally and would sync with backend
      this.totalEarned += event.amount;
      
      // TODO: Call actual reward RPC endpoint
      // const result = await demiurgeRpc.awardGameReward(this.walletAddress, event);
      
      // Dispatch custom event for UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cgt-reward', {
          detail: {
            amount: event.amount,
            type: event.type,
            description: event.description,
          }
        }));
      }
      
      return {
        success: true,
        amount: event.amount,
        message: `Earned ${event.amount} CGT: ${event.description}`,
      };
    } catch (error: any) {
      return {
        success: false,
        amount: 0,
        message: error.message || 'Failed to award reward',
      };
    }
  }
  
  /**
   * Process all pending rewards
   */
  async processPendingRewards(): Promise<RewardResult[]> {
    const results: RewardResult[] = [];
    
    for (const event of this.pendingRewards) {
      const result = await this.awardReward(event);
      results.push(result);
    }
    
    this.pendingRewards = [];
    return results;
  }
  
  /**
   * Get total CGT earned this session
   */
  getTotalEarned(): number {
    return this.totalEarned;
  }
  
  /**
   * Get pending rewards count
   */
  getPendingCount(): number {
    return this.pendingRewards.length;
  }
  
  // ========== Convenience Methods for Common Rewards ==========
  
  async awardDailyLogin(): Promise<RewardResult> {
    return this.awardReward({
      type: 'daily',
      amount: REWARD_AMOUNTS.DAILY_LOGIN,
      description: 'Daily login bonus',
    });
  }
  
  async awardGameCompletion(gameId: string, gameName: string): Promise<RewardResult> {
    return this.awardReward({
      type: 'completion',
      amount: REWARD_AMOUNTS.GAME_COMPLETION,
      description: `Completed ${gameName}`,
      gameId,
    });
  }
  
  async awardAchievement(
    achievementId: string, 
    achievementName: string, 
    tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  ): Promise<RewardResult> {
    const amounts = {
      bronze: REWARD_AMOUNTS.ACHIEVEMENT_BRONZE,
      silver: REWARD_AMOUNTS.ACHIEVEMENT_SILVER,
      gold: REWARD_AMOUNTS.ACHIEVEMENT_GOLD,
      platinum: REWARD_AMOUNTS.ACHIEVEMENT_PLATINUM,
    };
    
    return this.awardReward({
      type: 'achievement',
      amount: amounts[tier],
      description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Achievement: ${achievementName}`,
      metadata: { achievementId, tier },
    });
  }
  
  async awardLeaderboardPosition(
    gameId: string,
    position: number
  ): Promise<RewardResult> {
    let amount = 0;
    let description = '';
    
    if (position === 1) {
      amount = REWARD_AMOUNTS.LEADERBOARD_FIRST;
      description = '1st Place on Leaderboard!';
    } else if (position <= 3) {
      amount = REWARD_AMOUNTS.LEADERBOARD_TOP_3;
      description = `Top 3 on Leaderboard (#${position})`;
    } else if (position <= 10) {
      amount = REWARD_AMOUNTS.LEADERBOARD_TOP_10;
      description = `Top 10 on Leaderboard (#${position})`;
    } else if (position <= 100) {
      amount = REWARD_AMOUNTS.LEADERBOARD_TOP_100;
      description = `Top 100 on Leaderboard (#${position})`;
    }
    
    if (amount === 0) {
      return {
        success: false,
        amount: 0,
        message: 'Position not eligible for reward',
      };
    }
    
    return this.awardReward({
      type: 'leaderboard',
      amount,
      description,
      gameId,
      metadata: { position },
    });
  }
  
  async awardReferral(referredUserId: string): Promise<RewardResult> {
    return this.awardReward({
      type: 'referral',
      amount: REWARD_AMOUNTS.REFERRAL_SIGNUP,
      description: 'Friend joined Demiurge!',
      metadata: { referredUserId },
    });
  }
  
  async awardMilestone(
    milestone: keyof typeof REWARD_AMOUNTS,
    description: string
  ): Promise<RewardResult> {
    const amount = REWARD_AMOUNTS[milestone] || 10;
    
    return this.awardReward({
      type: 'milestone',
      amount,
      description,
      metadata: { milestone },
    });
  }
}

// Export singleton instance
export const gameRewards = new GameRewardsManager();

/**
 * React hook for game rewards (to be used in game components)
 */
export function useGameRewards() {
  return {
    manager: gameRewards,
    awardDailyLogin: () => gameRewards.awardDailyLogin(),
    awardGameCompletion: (gameId: string, gameName: string) => 
      gameRewards.awardGameCompletion(gameId, gameName),
    awardAchievement: (id: string, name: string, tier: 'bronze' | 'silver' | 'gold' | 'platinum') =>
      gameRewards.awardAchievement(id, name, tier),
    awardLeaderboard: (gameId: string, position: number) =>
      gameRewards.awardLeaderboardPosition(gameId, position),
    getTotalEarned: () => gameRewards.getTotalEarned(),
    REWARD_AMOUNTS,
  };
}
