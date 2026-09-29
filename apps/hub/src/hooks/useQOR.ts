/**
 * QOR ID Authentication Hook
 * 
 * Integrates with QOR Auth SDK to provide authentication state
 * and staking balance for Scatter3D gatekeeper
 */

import { useState, useEffect, useCallback } from 'react';
import { qorAuth, User } from '@demiurge/qor-sdk';
import { demiurgeRpc } from '@/lib/demiurge-rpc';
import { getOrCreateAddressForQorId } from '@/lib/qor-wallet';

export interface QORState {
  isAuthenticated: boolean;
  isLoading: boolean;
  qorId: string | null;
  user: User | null;
  stakingBalance: number; // In CGT (smallest units, 100 = 1 CGT)
  totalAssets: number; // Total staked assets in the system
  stakePercentage: number; // User's stake as percentage of total
}

const MINIMUM_STAKE_THRESHOLD = 10000; // 100 CGT minimum (10000 smallest units)
const MINIMUM_STAKE_PERCENTAGE = 0.0001; // 0.01% of total assets

export function useQOR() {
  const [state, setState] = useState<QORState>({
    isAuthenticated: false,
    isLoading: true,
    qorId: null,
    user: null,
    stakingBalance: 0,
    totalAssets: 0,
    stakePercentage: 0,
  });

  // Load authentication state and staking balance
  const loadAuthState = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Check if authenticated
      const isAuthenticated = qorAuth.isAuthenticated();
      
      if (!isAuthenticated) {
        setState({
          isAuthenticated: false,
          isLoading: false,
          qorId: null,
          user: null,
          stakingBalance: 0,
          totalAssets: 0,
          stakePercentage: 0,
        });
        return;
      }

      // Get user profile
      const user = await qorAuth.getProfile();
      
      // Get or create blockchain address
      const address = await getOrCreateAddressForQorId(user, false);
      
      // Get balance (this is the staking balance for now)
      // In production, you'd query actual staking pools
      const balanceStr = await demiurgeRpc.getBalance(address);
      const stakingBalance = parseInt(balanceStr) || 0;

      // Get total assets (mock for now - in production, query total staked)
      // For now, use a fixed total supply estimate
      const totalAssets = 10000000000; // 100M CGT in smallest units
      
      // Calculate stake percentage
      const stakePercentage = totalAssets > 0 
        ? (stakingBalance / totalAssets) * 100 
        : 0;

      setState({
        isAuthenticated: true,
        isLoading: false,
        qorId: user.qor_id,
        user,
        stakingBalance,
        totalAssets,
        stakePercentage,
      });
    } catch (error) {
      console.error('Failed to load QOR auth state:', error);
      setState({
        isAuthenticated: false,
        isLoading: false,
        qorId: null,
        user: null,
        stakingBalance: 0,
        totalAssets: 0,
        stakePercentage: 0,
      });
    }
  }, []);

  // Login function (redirects to login page)
  const login = useCallback(() => {
    window.location.href = '/login';
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await qorAuth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setState({
      isAuthenticated: false,
      isLoading: false,
      qorId: null,
      user: null,
      stakingBalance: 0,
      totalAssets: 0,
      stakePercentage: 0,
    });
  }, []);

  // Check if user has sufficient stake
  const hasSufficientStake = useCallback((): boolean => {
    if (!state.isAuthenticated) return false;
    
    // Check absolute threshold
    if (state.stakingBalance < MINIMUM_STAKE_THRESHOLD) {
      return false;
    }
    
    // Check percentage threshold
    if (state.stakePercentage < MINIMUM_STAKE_PERCENTAGE) {
      return false;
    }
    
    return true;
  }, [state.isAuthenticated, state.stakingBalance, state.stakePercentage]);

  // Load on mount and when auth state changes
  useEffect(() => {
    loadAuthState();
    
    // Refresh periodically
    const interval = setInterval(loadAuthState, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [loadAuthState]);

  return {
    ...state,
    login,
    logout,
    hasSufficientStake: hasSufficientStake(),
    refresh: loadAuthState,
  };
}
