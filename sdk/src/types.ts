/**
 * Core types for the Demiurge SDK
 */

/** 32-byte address type */
export type Address = string;

/** Transaction hash */
export type TxHash = string;

/** Block hash */
export type BlockHash = string;

/** Numeric string for large numbers */
export type Balance = string;

/** Token ID (can be numeric or hex) */
export type TokenId = string | number;

/**
 * Chain health status
 */
export interface ChainHealth {
  connected: boolean;
  blockNumber: number;
  blockTime: number;
  finality: number;
}

/**
 * Block information
 */
export interface Block {
  number: number;
  hash: BlockHash;
  parentHash: BlockHash;
  stateRoot: string;
  timestamp: number;
  transactions: Transaction[];
}

/**
 * Transaction information
 */
export interface Transaction {
  hash: TxHash;
  from: Address;
  to?: Address;
  amount?: Balance;
  nonce: number;
  status: 'pending' | 'in_block' | 'finalized' | 'failed';
}

/**
 * Validator information
 */
export interface Validator {
  account: Address;
  stake: Balance;
  commission: number;
  active: boolean;
  publicKey: string;
}

/**
 * Era information (consensus epoch)
 */
export interface EraInfo {
  era: number;
  blockNumber: number;
  totalRewards: Balance;
  transactionFees: Balance;
  validators: Validator[];
}

/**
 * Account balance information
 */
export interface AccountBalance {
  free: Balance;
  reserved: Balance;
  total: Balance;
}

/**
 * RPC error
 */
export interface RpcError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * JSON-RPC request
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: unknown[];
}

/**
 * JSON-RPC response
 */
export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: RpcError;
}

/**
 * Transaction submission result
 */
export interface SubmitResult {
  txHash: TxHash;
  subscriptionId: string;
  status: string;
}

/**
 * Energy information for an account
 */
export interface EnergyInfo {
  current: number;
  max: number;
  regenerationRate: number;
  lastUpdate: number;
}
