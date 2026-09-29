/**
 * ScatterTXT SDK Types
 */

/**
 * Configuration for initializing the ScatterTXT engine
 */
export interface ScatterConfig {
  /** Canvas element or ID for rendering */
  canvas?: HTMLCanvasElement | string;
  /** RPC endpoint URL */
  rpcUrl?: string;
  /** WebSocket endpoint URL for real-time events */
  wsUrl?: string;
  /** Game ID for this session */
  gameId?: string;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Authenticated player information
 */
export interface Player {
  /** QOR ID (username#discriminator) */
  qorId: string;
  /** On-chain address derived from QOR ID */
  address: string;
  /** Active session key */
  sessionKey: string;
  /** Player's DRC-369 assets */
  assets: import('./blockchain/DRC369Handler').GameAsset[];
  /** Current energy information */
  energy: import('./blockchain/EnergyManager').EnergyInfo;
  /** CGT balance (smallest units) */
  balance: string;
}

/**
 * Active game session
 */
export interface GameSession {
  /** Unique session ID */
  id: string;
  /** Player's QOR ID */
  playerId: string;
  /** Game ID */
  gameId: string;
  /** Session key ID used for this session */
  sessionKeyId: string;
  /** When the session started (ISO timestamp) */
  startedAt: string;
  /** Current game state */
  state: GameState;
}

/**
 * Game state tracked on-chain
 */
export interface GameState {
  /** Current score */
  score: number;
  /** Current level */
  level: number;
  /** Checkpoints reached */
  checkpoints: Checkpoint[];
  /** Items in inventory */
  inventory: string[];
  /** Custom game-specific data */
  custom?: Record<string, unknown>;
}

/**
 * Checkpoint information
 */
export interface Checkpoint {
  /** Checkpoint ID */
  id: string;
  /** When checkpoint was reached */
  timestamp: number;
  /** Score at checkpoint */
  score: number;
}

/**
 * Game action to be recorded on-chain
 */
export interface GameAction {
  /** Action type (e.g., 'COLLECT_ITEM', 'DEFEAT_ENEMY') */
  type: string;
  /** Action-specific data */
  data?: Record<string, unknown>;
  /** Client-side timestamp */
  timestamp: number;
  /** Optional target entity ID */
  targetId?: string;
  /** Optional amount (for currency/XP) */
  amount?: number;
}

/**
 * Signed action ready for submission
 */
export interface SignedAction extends GameAction {
  /** Cryptographic signature */
  signature: string;
  /** Session key ID that signed this action */
  sessionKeyId: string;
}

/**
 * Result of a game action
 */
export interface ActionResult {
  /** Whether the action succeeded */
  success: boolean;
  /** Transaction hash (if applicable) */
  txHash?: string;
  /** Updated game state */
  state?: Partial<GameState>;
  /** Rewards earned from this action */
  rewards?: {
    cgt?: number;
    xp?: number;
    items?: string[];
  };
  /** NFT state changes (if any) */
  nftUpdates?: Array<{
    tokenId: string;
    changes: Record<string, unknown>;
  }>;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Real-time game event from blockchain
 */
export interface GameEvent {
  /** Event type */
  type: string;
  /** Session ID this event belongs to */
  sessionId: string;
  /** Event-specific data */
  data: Record<string, unknown>;
  /** Block number where event occurred */
  blockNumber: number;
  /** Event timestamp */
  timestamp: number;
}

/**
 * Game rewards summary
 */
export interface GameRewards {
  /** CGT tokens earned */
  cgt: number;
  /** Experience points earned */
  xp: number;
  /** Items received */
  items: string[];
  /** NFT experience updates */
  nftExperience: Array<{
    tokenId: string;
    xpGained: number;
  }>;
}
