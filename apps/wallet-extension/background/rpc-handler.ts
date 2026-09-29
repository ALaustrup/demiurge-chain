// Demiurge Wallet Extension - RPC Handler
// Manages communication with Demiurge blockchain nodes

import type { NetworkConfig, TransactionRequest, TransactionResult } from '../shared/types';
import { NETWORKS } from '../shared/types';

export class RpcHandler {
  private currentNetwork: NetworkConfig = NETWORKS.mainnet;
  private requestId = 0;

  // Set the current network
  setNetwork(networkId: string): void {
    const network = NETWORKS[networkId];
    if (!network) {
      throw new Error(`Unknown network: ${networkId}`);
    }
    this.currentNetwork = network;
  }

  // Get the current network
  getNetwork(): NetworkConfig {
    return this.currentNetwork;
  }

  // Make an RPC call
  private async call<T>(method: string, params: any[] = []): Promise<T> {
    const id = ++this.requestId;
    
    const response = await fetch(this.currentNetwork.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC request failed: ${response.statusText}`);
    }

    const json = await response.json();
    
    if (json.error) {
      throw new Error(json.error.message || 'RPC error');
    }

    return json.result as T;
  }

  // Get account balance
  async getBalance(address: string): Promise<{ balance: string; formatted: string }> {
    const balance = await this.call<string>('balances_getBalance', [address]);
    
    // Format balance (1 CGT = 10^18 Sparks)
    const balanceBigInt = BigInt(balance);
    const cgt = balanceBigInt / BigInt(10 ** 18);
    const sparks = balanceBigInt % BigInt(10 ** 18);
    
    let formatted: string;
    if (cgt > 0) {
      formatted = `${cgt.toString()}.${sparks.toString().padStart(18, '0').slice(0, 4)} CGT`;
    } else {
      formatted = `${balance} Sparks`;
    }

    return { balance, formatted };
  }

  // Get chain health
  async getHealth(): Promise<{ syncing: boolean; peers: number; blockNumber: number }> {
    const health = await this.call<any>('chain_getHealth');
    return health;
  }

  // Get current block number
  async getBlockNumber(): Promise<number> {
    return await this.call<number>('chain_getBlockNumber');
  }

  // Submit a signed transaction.
  //
  // `nonce` must come from getAccountNonce() and must be the same value that
  // was bound into the signed payload; the node verifies the signature over
  // (domain, method, from, to, amount, nonce).
  async submitTransaction(
    from: string,
    to: string,
    amount: string,
    nonce: number,
    signature: string
  ): Promise<TransactionResult> {
    const result = await this.call<TransactionResult>('balances_transfer', [
      from,
      to,
      amount,
      nonce,
      signature,
    ]);
    return result;
  }

  // Get the next expected request nonce for an account.
  async getAccountNonce(address: string): Promise<number> {
    return await this.call<number>('account_getNonce', [address]);
  }

  // Get pending transaction count (nonce)
  async getPendingNonce(address: string): Promise<number> {
    try {
      const count = await this.call<number>('chain_pendingTransactionCount', [address]);
      return count;
    } catch {
      // If method not available, return 0
      return 0;
    }
  }

  // Get transaction by hash
  async getTransaction(hash: string): Promise<any> {
    return await this.call<any>('chain_getTransaction', [hash]);
  }

  // Get transaction history for an address
  async getTransactionHistory(address: string, limit: number = 20): Promise<any[]> {
    try {
      const history = await this.call<any[]>('chain_getTransactionHistory', [address, limit]);
      return history;
    } catch {
      return [];
    }
  }

  // Get consensus status
  async getConsensusStatus(): Promise<any> {
    return await this.call<any>('consensus_getStatus');
  }

  // Get validators
  async getValidators(): Promise<any[]> {
    return await this.call<any[]>('consensus_getValidators');
  }

  // Claim starter bonus (faucet)
  async claimStarter(address: string): Promise<{ success: boolean; amount: string }> {
    return await this.call<{ success: boolean; amount: string }>('balances_claimStarter', [address]);
  }

  // Check if starter bonus was claimed
  async hasClaimedStarter(address: string): Promise<boolean> {
    return await this.call<boolean>('balances_hasClaimedStarter', [address]);
  }
}

// Singleton instance
export const rpcHandler = new RpcHandler();
