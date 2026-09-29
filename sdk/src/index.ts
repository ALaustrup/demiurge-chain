/**
 * @demiurge/sdk - TypeScript SDK for Demiurge-Cloud
 * 
 * The Demiurge-Cloud is a next-generation blockchain featuring:
 * - DRC-369: Dynamic NFT standard with soulbound tokens, nesting, and delegation
 * - CVP: Consensus-Verified Polymorphism for real-time security
 * - CGT: Native utility token (Cogito)
 */

// Core exports
export { DemiurgeClient, type DemiurgeClientOptions } from './client';
export { DRC369, type TokenInfo, type DynamicState } from './drc369';
export { CVP, type CvpStatus } from './cvp';
export { Wallet, type KeyPair } from './wallet';
export { 
  DemiurgeAuth, 
  createTestWallet,
  type AuthSession, 
  type DemiurgeAuthOptions,
  type RegistrationResult,
} from './auth';

// Request signing (must stay in lockstep with framework/rpc/src/auth.rs)
export { SigningPayload, payloads, accountBytes, CHAIN_DOMAIN } from './signing';

// Types
export * from './types';

// Utilities
export { hexToBytes, bytesToHex, encodeTransaction } from './utils';

// Version
export const VERSION = '1.0.0';
