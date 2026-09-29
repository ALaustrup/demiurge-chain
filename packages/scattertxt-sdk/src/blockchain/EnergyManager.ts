/**
 * Energy Manager
 * 
 * Manages the regenerating energy system.
 * Energy is consumed when performing game actions and regenerates over time.
 */

import type { BlockchainBridge } from './BlockchainBridge';

/**
 * Energy information
 */
export interface EnergyInfo {
  /** Current energy amount */
  current: number;
  /** Maximum energy capacity */
  max: number;
  /** Energy regeneration rate (per second) */
  regenerationRate: number;
  /** Last update timestamp */
  lastUpdate: number;
}

/**
 * Energy Manager for game sessions
 */
export class EnergyManager {
  private blockchain: BlockchainBridge;
  private cachedEnergy: Map<string, EnergyInfo> = new Map();

  constructor(blockchain: BlockchainBridge) {
    this.blockchain = blockchain;
  }

  /**
   * Get current energy for a player
   */
  async getEnergy(qorId: string): Promise<EnergyInfo> {
    const energy = await this.blockchain.call<{
      current: number;
      max: number;
      regeneration_rate: number;
      last_update: number;
    }>('energy_getEnergy', qorId);

    const energyInfo: EnergyInfo = {
      current: energy.current,
      max: energy.max,
      regenerationRate: energy.regeneration_rate,
      lastUpdate: energy.last_update,
    };

    this.cachedEnergy.set(qorId, energyInfo);
    return energyInfo;
  }

  /**
   * Calculate current energy with regeneration
   */
  calculateCurrentEnergy(energy: EnergyInfo): number {
    const now = Date.now() / 1000; // Convert to seconds
    const elapsed = now - energy.lastUpdate;
    const regenerated = elapsed * energy.regenerationRate;
    return Math.min(energy.max, energy.current + regenerated);
  }

  /**
   * Check if player has enough energy
   */
  async hasEnough(qorId: string, amount: number): Promise<boolean> {
    const energy = await this.getEnergy(qorId);
    const current = this.calculateCurrentEnergy(energy);
    return current >= amount;
  }

  /**
   * Consume energy (called automatically by game engine)
   */
  async consume(qorId: string, amount: number): Promise<{
    success: boolean;
    remaining: number;
    error?: string;
  }> {
    const result = await this.blockchain.call<{
      success: boolean;
      remaining: number;
      error?: string;
    }>('energy_consume', {
      qorId,
      amount,
    });

    // Update cache
    if (result.success && this.cachedEnergy.has(qorId)) {
      const cached = this.cachedEnergy.get(qorId)!;
      cached.current = result.remaining;
      cached.lastUpdate = Date.now() / 1000;
    }

    return result;
  }

  /**
   * Get time until energy is full
   */
  getTimeToFull(energy: EnergyInfo): number {
    const current = this.calculateCurrentEnergy(energy);
    if (current >= energy.max) return 0;
    
    const deficit = energy.max - current;
    return deficit / energy.regenerationRate; // Time in seconds
  }

  /**
   * Get cached energy (if available)
   */
  getCached(qorId: string): EnergyInfo | undefined {
    return this.cachedEnergy.get(qorId);
  }

  /**
   * Clear the energy cache
   */
  clearCache(): void {
    this.cachedEnergy.clear();
  }
}
