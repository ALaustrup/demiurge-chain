/**
 * Demiurge RPC Client
 * 
 * Core client for interacting with the Demiurge blockchain.
 */

import { payloads } from './signing';
import { bytesToHex } from './utils';
import type {
  ChainHealth,
  Block,
  Transaction,
  EraInfo,
  Balance,
  Address,
  TxHash,
  JsonRpcRequest,
  JsonRpcResponse,
  SubmitResult,
  Validator,
} from './types';

export interface DemiurgeClientOptions {
  /** RPC endpoint URL */
  endpoint: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom fetch implementation */
  fetch?: typeof globalThis.fetch;
}

/**
 * Main client for interacting with the Demiurge blockchain
 */
export class DemiurgeClient {
  private endpoint: string;
  private timeout: number;
  private fetchFn: typeof globalThis.fetch;
  private requestId = 0;

  constructor(options: DemiurgeClientOptions) {
    this.endpoint = options.endpoint;
    this.timeout = options.timeout ?? 30000;
    this.fetchFn = options.fetch ?? globalThis.fetch;
  }

  // ============ Chain Methods ============

  /**
   * Get chain health status
   */
  async getHealth(): Promise<ChainHealth> {
    return this.call<ChainHealth>('chain_getHealth');
  }

  /**
   * Get latest block number
   */
  async getBlockNumber(): Promise<number> {
    return this.call<number>('chain_getBlockNumber');
  }

  /**
   * Get block by number
   */
  async getBlock(blockNumber: number): Promise<Block | null> {
    return this.call<Block | null>('chain_getBlockByNumber', [blockNumber]);
  }

  /**
   * Get block by hash
   */
  async getBlockByHash(hash: string): Promise<Block | null> {
    return this.call<Block | null>('chain_getBlockByHash', [hash]);
  }

  /**
   * Get latest block
   */
  async getLatestBlock(): Promise<Block> {
    return this.call<Block>('chain_getLatestBlock');
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: TxHash): Promise<Transaction | null> {
    return this.call<Transaction | null>('chain_getTransaction', [hash]);
  }

  // ============ Balance Methods ============

  /**
   * Get account balance
   */
  async getBalance(address: Address): Promise<Balance> {
    return this.call<Balance>('balances_getBalance', [address]);
  }

  /**
   * Get the next expected request nonce for an account.
   *
   * Every state-changing call binds this nonce into its signature, so a
   * captured request cannot be replayed. Always read it immediately before
   * signing.
   */
  async getNonce(address: Address): Promise<number> {
    return this.call<number>('account_getNonce', [address]);
  }

  /**
   * Transfer CGT.
   *
   * `signer` is anything that can produce a 64-byte Ed25519 signature over a
   * message - typically a `Wallet`. The signature covers the chain domain, the
   * method name, both accounts, the amount and the nonce, so it authorises this
   * transfer and nothing else.
   */
  async transfer(
    from: Address,
    to: Address,
    amount: string,
    signer: { sign(message: Uint8Array): Uint8Array },
  ): Promise<unknown> {
    const nonce = await this.getNonce(from);
    const message = payloads.transfer(from, to, amount, nonce);
    const signature = bytesToHex(signer.sign(message));
    return this.call('balances_transfer', [from, to, amount, nonce, signature]);
  }

  /**
   * Claim starter CGT (for new accounts)
   */
  async claimStarter(address: Address): Promise<{
    success: boolean;
    amount: Balance;
    message: string;
  }> {
    return this.call('balances_claimStarter', [address]);
  }

  // ============ Consensus Methods ============

  /**
   * Get current era information
   */
  async getCurrentEra(): Promise<EraInfo> {
    return this.call<EraInfo>('consensus_getCurrentEra');
  }

  /**
   * Get validator list
   */
  async getValidators(): Promise<Validator[]> {
    return this.call<Validator[]>('consensus_getValidators');
  }

  /**
   * Get validator by account
   */
  async getValidator(account: Address): Promise<Validator | null> {
    return this.call<Validator | null>('consensus_getValidator', [account]);
  }

  /**
   * Get consensus status
   */
  async getConsensusStatus(): Promise<{
    currentEra: number;
    blockNumber: number;
    validators: number;
    totalStake: Balance;
    transactionFees: Balance;
  }> {
    return this.call('consensus_getStatus');
  }

  // ============ Author Methods ============

  /**
   * Submit a signed transaction
   */
  async submitTransaction(txHex: string): Promise<TxHash> {
    return this.call<TxHash>('author_submitExtrinsic', [txHex]);
  }

  /**
   * Submit and watch a transaction
   */
  async submitAndWatch(txHex: string): Promise<SubmitResult> {
    return this.call<SubmitResult>('author_submitAndWatch', [txHex]);
  }

  /**
   * Get pending transactions
   */
  async getPendingTransactions(): Promise<string[]> {
    return this.call<string[]>('author_pendingExtrinsics');
  }

  // ============ Energy Methods ============

  /**
   * Get energy for account
   */
  async getEnergy(address: Address): Promise<{
    current: number;
    max: number;
    regenerationRate: number;
    lastUpdate: number;
  }> {
    return this.call('energy_getEnergy', [address]);
  }

  // ============ Low-level RPC ============

  /**
   * Make a raw RPC call
   */
  async call<T>(method: string, params: unknown[] = []): Promise<T> {
    const id = ++this.requestId;
    
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchFn(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json() as JsonRpcResponse<T>;

      if (json.error) {
        throw new RpcClientError(json.error.code, json.error.message, json.error.data);
      }

      return json.result as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Subscribe to events (WebSocket required)
   */
  subscribe(_method: string, _params: unknown[] = []): void {
    throw new Error('Subscriptions require WebSocket connection - not yet implemented');
  }
}

/**
 * RPC client error
 */
export class RpcClientError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'RpcClientError';
  }
}
