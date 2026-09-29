'use client';

import { payloads } from '@demiurge/sdk';
import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { demiurgeRpc } from '@/lib/demiurge-rpc';
import { useChainStore, selectConnectionStatus } from '@/store/chainStore';
import type { EnergyInfo, ConsensusStatus, ValidatorInfo, StakingPoolInfo, EraInfo } from '@/lib/demiurge-rpc';

interface BlockchainContextType {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getBalance: (address: string) => Promise<string>;
  transfer: (fromPair: any, toAddress: string, amount: string) => Promise<string>;
  transferWithWasm: (
    keypairJson: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    signMessage: (keypairJson: string, message: Uint8Array) => Promise<string>
  ) => Promise<string>;
  getUserAssets: (address: string) => Promise<any[]>;
  getTransactions: (address: string) => Promise<any[]>;
  getApi: () => any | null;
  // New Demiurge RPC methods
  getEnergy: (address: string) => Promise<EnergyInfo>;
  getConsensusStatus: () => Promise<ConsensusStatus>;
  getCurrentEra: () => Promise<EraInfo>;
  getValidators: () => Promise<ValidatorInfo[]>;
  getValidator: (account: string) => Promise<ValidatorInfo | null>;
  getStakingPool: (validator: string) => Promise<StakingPoolInfo | null>;
  getBlockNumber: () => Promise<number>;
}

const BlockchainContext = createContext<BlockchainContextType | null>(null);

export function BlockchainProvider({ children }: { children: ReactNode }) {
  // Use chainStore as single source of truth for connection status
  const connectionStatus = useChainStore(selectConnectionStatus);
  const chainConnect = useChainStore(state => state.connect);
  const chainDisconnect = useChainStore(state => state.disconnect);
  
  const isConnected = connectionStatus === 'connected';

  const connect = useCallback(async () => {
    await chainConnect();
  }, [chainConnect]);

  const disconnect = useCallback(async () => {
    chainDisconnect();
  }, [chainDisconnect]);

  useEffect(() => {
    // Auto-connect via chainStore on mount (single source of truth)
    connect();
  }, [connect]);

  const getBalance = async (address: string): Promise<string> => {
    if (!isConnected) {
      await connect();
    }
    return demiurgeRpc.getBalance(address);
  };

  // Transfers must be signed by the account's own key. There is no unsigned or
  // "privileged" transfer path: the node verifies an Ed25519 signature over the
  // canonical payload before touching any balance.
  const transfer = async (
    fromPair: { address: string; sign: (message: Uint8Array) => Uint8Array | Promise<Uint8Array> },
    toAddress: string,
    amount: string
  ): Promise<string> => {
    if (!isConnected) {
      await connect();
    }
    if (typeof fromPair === 'string' || typeof fromPair?.sign !== 'function') {
      throw new Error(
        'transfer() requires a signing keypair. Use transferWithWasm() for WASM-held keys, ' +
        'or pass a wallet object exposing sign(message).'
      );
    }

    const fromAddress = fromPair.address;
    const nonce = await demiurgeRpc.getNonce(fromAddress);
    const message = payloads.transfer(fromAddress, toAddress, amount, nonce);
    const sigBytes = await fromPair.sign(message);
    const signature = Array.from(sigBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    return demiurgeRpc.transfer(fromAddress, toAddress, amount, nonce, signature);
  };

  const transferWithWasm = async (
    keypairJson: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    signMessage: (keypairJson: string, message: Uint8Array) => Promise<string>
  ): Promise<string> => {
    if (!isConnected) {
      await connect();
    }
    // Sign the canonical payload the node will rebuild and verify. This must
    // match payloads.transfer() exactly - an ad-hoc string will be rejected.
    const nonce = await demiurgeRpc.getNonce(fromAddress);
    const message = payloads.transfer(fromAddress, toAddress, amount, nonce);
    const signature = await signMessage(keypairJson, message);
    return demiurgeRpc.transfer(fromAddress, toAddress, amount, nonce, signature);
  };

  const getUserAssets = async (address: string): Promise<any[]> => {
    if (!isConnected) {
      await connect();
    }
    try {
      return await demiurgeRpc.getUserNFTs(address);
    } catch {
      return [];
    }
  };

  const getTransactions = async (address: string): Promise<any[]> => {
    if (!isConnected) {
      await connect();
    }
    return demiurgeRpc.getTransactionHistory(address);
  };

  const getApi = () => {
    return null; // Not using Polkadot API anymore
  };

  // New Demiurge RPC methods
  const getEnergy = async (address: string): Promise<EnergyInfo> => {
    if (!isConnected) {
      await connect();
    }
    return demiurgeRpc.getEnergy(address);
  };

  const getConsensusStatus = async (): Promise<ConsensusStatus> => {
    if (!isConnected) {
      await connect();
    }
    return demiurgeRpc.getConsensusStatus();
  };

  const getCurrentEra = async (): Promise<EraInfo> => {
    if (!isConnected) {
      await connect();
    }
    return demiurgeRpc.getCurrentEra();
  };

  const getValidators = async (): Promise<ValidatorInfo[]> => {
    if (!isConnected) {
      await connect();
    }
    return demiurgeRpc.getValidators();
  };

  const getValidator = async (account: string): Promise<ValidatorInfo | null> => {
    if (!isConnected) {
      await connect();
    }
    return demiurgeRpc.getValidator(account);
  };

  const getStakingPool = async (validator: string): Promise<StakingPoolInfo | null> => {
    if (!isConnected) {
      await connect();
    }
    return demiurgeRpc.getStakingPool(validator);
  };

  const getBlockNumber = async (): Promise<number> => {
    if (!isConnected) {
      await connect();
    }
    return demiurgeRpc.getBlockNumber();
  };

  return (
    <BlockchainContext.Provider
      value={{
        isConnected,
        connect,
        disconnect,
        getBalance,
        transfer,
        transferWithWasm,
        getUserAssets,
        getTransactions,
        getApi,
        // New Demiurge RPC methods
        getEnergy,
        getConsensusStatus,
        getCurrentEra,
        getValidators,
        getValidator,
        getStakingPool,
        getBlockNumber,
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within BlockchainProvider');
  }
  return context;
}
