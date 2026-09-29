/**
 * ScatterTXT SDK
 * 
 * The official game engine SDK for building on-chain games on Demiurge-Cloud.
 * 
 * Features:
 * - Session key authentication (no wallet popups during gameplay)
 * - DRC-369 stateful NFT integration
 * - Real-time blockchain event subscriptions
 * - Energy system management
 * - Cross-game asset interoperability
 */

export { ScatterEngine } from './engine/Engine';
export { BlockchainBridge } from './blockchain/BlockchainBridge';
export { SessionKeyManager } from './blockchain/SessionKeyManager';
export { DRC369Handler } from './blockchain/DRC369Handler';
export { EnergyManager } from './blockchain/EnergyManager';

// Types
export type {
  ScatterConfig,
  Player,
  GameSession,
  GameAction,
  SignedAction,
  ActionResult,
  GameEvent,
} from './types';

export type {
  GameAsset,
  AssetState,
  AssetStats,
  EvolutionResult,
} from './blockchain/DRC369Handler';

export type {
  SessionKey,
  SessionKeyPermission,
} from './blockchain/SessionKeyManager';

export type {
  EnergyInfo,
} from './blockchain/EnergyManager';
