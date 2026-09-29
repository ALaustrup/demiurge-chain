// Demiurge Wallet Extension - State Management
import { create } from 'zustand';
import type { Account } from '../shared/types';
import type { Message, MessageResponse, WalletStateResponse } from '../shared/messages';

interface PopupState {
  // Wallet state
  isLoading: boolean;
  isLocked: boolean;
  isInitialized: boolean;
  accounts: Account[];
  activeAccount: string | null;
  network: string;
  balance: string | null;
  formattedBalance: string | null;
  pendingRequestCount: number;
  
  // Auth state
  isAuthenticated: boolean;
  authToken: string | null;
  authUser: { qorId: string; address?: string; displayName?: string } | null;
  
  // UI state
  view: 'loading' | 'login' | 'unlock' | 'main' | 'send' | 'receive' | 'approve' | 'settings';
  error: string | null;
  success: string | null;
  
  // Transfer limits
  accountLimits: {
    tier: string;
    dailyLimit: number;
    dailyUsed: number;
    maxSingleCGT: string;
    canSend: boolean;
    accountAgeHours: number;
  } | null;
  
  // Actions
  initialize: () => Promise<void>;
  createWallet: (password: string, mnemonic?: string) => Promise<string>;
  importWallet: (password: string, mnemonic: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshLimits: () => Promise<void>;
  switchNetwork: (network: string) => Promise<void>;
  sendTransaction: (to: string, amount: string) => Promise<string>;
  setView: (view: PopupState['view']) => void;
  clearMessages: () => void;
  
  // Auth actions
  authLogin: (identifier: string, password: string) => Promise<void>;
  authLogout: () => Promise<void>;
  detachWallet: () => Promise<void>;
}

// Send message to background script
async function sendMessage<T = any>(message: Partial<Message>): Promise<MessageResponse<T>> {
  return chrome.runtime.sendMessage(message);
}

export const useStore = create<PopupState>((set, get) => ({
  // Initial state
  isLoading: true,
  isLocked: true,
  isInitialized: false,
  accounts: [],
  activeAccount: null,
  network: 'mainnet',
  balance: null,
  formattedBalance: null,
  pendingRequestCount: 0,
  isAuthenticated: false,
  authToken: null,
  authUser: null,
  view: 'loading',
  error: null,
  success: null,
  accountLimits: null,

  // Initialize from background state
  initialize: async () => {
    try {
      const response = await sendMessage<WalletStateResponse>({ type: 'WALLET_GET_STATE' });
      
      if (response.success && response.data) {
        const { isLocked, isInitialized, accounts, activeAccount, network, pendingRequestCount, auth } = response.data;
        
        const isAuthenticated = auth?.isAuthenticated || false;
        
        // Determine initial view: QOR ID auth is the gate
        let view: PopupState['view'] = 'login';
        if (isAuthenticated) {
          // Authenticated — go to main wallet view
          view = pendingRequestCount > 0 ? 'approve' : 'main';
        }

        set({
          isLoading: false,
          isLocked,
          isInitialized: isInitialized || isAuthenticated,
          accounts,
          activeAccount,
          network,
          pendingRequestCount,
          isAuthenticated,
          authToken: auth?.token || null,
          authUser: auth?.user || null,
          view,
        });

        // Fetch balance and limits if authenticated with an account
        if (isAuthenticated && activeAccount) {
          get().refreshBalance();
          get().refreshLimits();
        }
      }
    } catch (error) {
      set({ isLoading: false, error: 'Failed to initialize wallet' });
    }
  },

  // QOR ID Login
  authLogin: async (identifier: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await sendMessage<{ token: string; user: any }>({
        type: 'AUTH_LOGIN',
        payload: { identifier, password },
      });

      if (response.success && response.data) {
        const user = response.data.user;
        const displayName = user?.displayName || user?.qorId || identifier.split('#')[0];

        // Re-read the full wallet state from background to ensure activeAccount is synced
        const stateResponse = await sendMessage<WalletStateResponse>({ type: 'WALLET_GET_STATE' });
        const resolvedAccount = stateResponse?.data?.activeAccount || user?.address || null;

        set({
          isLoading: false,
          isAuthenticated: true,
          authToken: response.data.token,
          authUser: user,
          activeAccount: resolvedAccount,
          isInitialized: true,
          view: 'main',
          success: `Welcome, ${displayName}!`,
        });

        // Fetch balance and limits immediately
        if (resolvedAccount) {
          get().refreshBalance();
          get().refreshLimits();
        }
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  },

  // Logout (clears auth and resets to login)
  authLogout: async () => {
    await sendMessage({ type: 'AUTH_LOGOUT' });
    set({
      isAuthenticated: false,
      authToken: null,
      authUser: null,
      activeAccount: null,
      accounts: [],
      balance: null,
      formattedBalance: null,
      accountLimits: null,
      isInitialized: false,
      isLocked: true,
      view: 'login',
    });
  },

  // Full detach: clears ALL local data (keystores, accounts, auth, etc.)
  detachWallet: async () => {
    await sendMessage({ type: 'DETACH_WALLET' });
    set({
      isAuthenticated: false,
      authToken: null,
      authUser: null,
      activeAccount: null,
      accounts: [],
      balance: null,
      formattedBalance: null,
      accountLimits: null,
      isInitialized: false,
      isLocked: true,
      pendingRequestCount: 0,
      error: null,
      success: null,
      view: 'login',
    });
  },

  // Create new wallet
  createWallet: async (password: string, mnemonic?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await sendMessage<{ mnemonic: string; address: string }>({
        type: 'WALLET_CREATE',
        payload: { password, mnemonic },
      });

      if (response.success && response.data) {
        set({
          isLoading: false,
          isLocked: false,
          isInitialized: true,
          activeAccount: response.data.address,
          view: 'main',
          success: 'Wallet created successfully!',
        });
        
        get().refreshBalance();
        return response.data.mnemonic;
      } else {
        throw new Error(response.error || 'Failed to create wallet');
      }
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  },

  // Import wallet from mnemonic
  importWallet: async (password: string, mnemonic: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await sendMessage<{ address: string }>({
        type: 'WALLET_IMPORT',
        payload: { password, mnemonic },
      });

      if (response.success && response.data) {
        set({
          isLoading: false,
          isLocked: false,
          isInitialized: true,
          activeAccount: response.data.address,
          view: 'main',
          success: 'Wallet imported successfully!',
        });
        
        get().refreshBalance();
      } else {
        throw new Error(response.error || 'Failed to import wallet');
      }
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  },

  // Unlock wallet
  unlock: async (password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await sendMessage<WalletStateResponse>({
        type: 'WALLET_UNLOCK',
        payload: { password },
      });

      if (response.success && response.data) {
        set({
          isLoading: false,
          isLocked: false,
          accounts: response.data.accounts,
          activeAccount: response.data.activeAccount,
          view: 'main',
        });
        
        get().refreshBalance();
      } else {
        throw new Error(response.error || 'Invalid password');
      }
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  // Lock wallet (returns to login since QOR ID is required)
  lock: async () => {
    await sendMessage({ type: 'WALLET_LOCK' });
    set({
      isLocked: true,
      view: 'login',
      balance: null,
      formattedBalance: null,
    });
  },

  // Refresh balance
  refreshBalance: async () => {
    const { activeAccount } = get();
    if (!activeAccount) return;

    try {
      const response = await sendMessage<{ balance: string; formatted: string }>({
        type: 'GET_BALANCE',
        payload: { address: activeAccount },
      });

      if (response.success && response.data) {
        set({
          balance: response.data.balance,
          formattedBalance: response.data.formatted,
        });
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  },

  // Refresh account transfer limits
  refreshLimits: async () => {
    try {
      const response = await sendMessage<any>({ type: 'GET_ACCOUNT_LIMITS' });
      if (response.success && response.data) {
        set({ accountLimits: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch limits:', error);
    }
  },

  // Switch network
  switchNetwork: async (network: string) => {
    try {
      const response = await sendMessage({ 
        type: 'NETWORK_SWITCH', 
        payload: { network } 
      });

      if (response.success) {
        set({ network });
        get().refreshBalance();
      }
    } catch (error) {
      set({ error: 'Failed to switch network' });
    }
  },

  // Send transaction
  sendTransaction: async (to: string, amount: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await sendMessage<{ hash: string }>({
        type: 'SEND_TRANSACTION',
        payload: {
          transaction: { to, value: amount },
        },
      });

      if (response.success && response.data) {
        set({
          isLoading: false,
          view: 'main',
          success: `Transaction sent! Hash: ${response.data.hash.slice(0, 16)}...`,
        });
        
        get().refreshBalance();
        return response.data.hash;
      } else {
        throw new Error(response.error || 'Transaction failed');
      }
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  },

  // Set view
  setView: (view) => set({ view }),

  // Clear messages
  clearMessages: () => set({ error: null, success: null }),
}));
