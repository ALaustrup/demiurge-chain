/**
 * DRC-369 NFT Standard Types
 * 
 * The most secure and feature-rich NFT standard, protected by
 * Consensus-Verified Polymorphism (CVP).
 */

// =============================================================================
// CORE NFT TYPES
// =============================================================================

/**
 * Unique identifier for an NFT (32-byte hex string)
 */
export type NftId = string;

/**
 * Blockchain address (32-byte hex string)
 */
export type Address = string;

/**
 * Transaction hash
 */
export type TxHash = string;

/**
 * DRC-369 NFT Asset
 */
export interface Drc369Nft {
  /** Unique identifier */
  id: NftId;
  
  /** Human-readable name */
  name: string;
  
  /** Optional description */
  description?: string;
  
  /** Creator's address */
  creator: Address;
  
  /** Current owner's address */
  owner: Address;
  
  /** NFT class/collection ID */
  classId: number;
  
  /** Current XP (experience points) */
  xp: number;
  
  /** Current level (derived from XP) */
  level: number;
  
  /** Whether NFT is soulbound (non-transferable) */
  isSoulbound: boolean;
  
  /** Parent NFT ID if nested */
  parentId?: NftId;
  
  /** Child NFT IDs if this NFT has nested children */
  childIds: NftId[];
  
  /** Attached resources */
  resources: NftResource[];
  
  /** Equipment slots for composability */
  equipmentSlots: EquipmentSlot[];
  
  /** Custom state key-value pairs */
  customState: Record<string, string>;
  
  /** Active delegations */
  delegations: Delegation[];
  
  /** Creation timestamp (Unix ms) */
  createdAt: number;
  
  /** Last update timestamp (Unix ms) */
  updatedAt: number;
  
  /** CVP protection status */
  cvpStatus: CvpStatus;
}

/**
 * Multi-resource attachment
 */
export interface NftResource {
  /** Resource ID */
  id: string;
  
  /** Resource type (image, audio, video, model, etc.) */
  type: ResourceType;
  
  /** Resource URI */
  uri: string;
  
  /** MIME type */
  mimeType?: string;
  
  /** Priority for display ordering */
  priority: number;
  
  /** Context tags for conditional display */
  contextTags: string[];
  
  /** Hash for integrity verification */
  hash?: string;
}

export type ResourceType = 
  | 'image'
  | 'audio'
  | 'video'
  | 'model_3d'
  | 'animation'
  | 'document'
  | 'metadata'
  | 'ue5_asset'
  | 'custom';

/**
 * Equipment slot for composability
 */
export interface EquipmentSlot {
  /** Slot name (e.g., "weapon", "armor", "accessory") */
  name: string;
  
  /** Currently equipped child NFT ID */
  equippedId?: NftId;
  
  /** Required trait for equipping */
  requiredTrait?: string;
  
  /** Slot capacity (for multi-item slots) */
  capacity: number;
}

/**
 * Permission delegation
 */
export interface Delegation {
  /** Delegated address */
  delegate: Address;
  
  /** Granted permissions */
  permissions: Permission[];
  
  /** Expiration timestamp (0 = no expiry) */
  expiresAt: number;
  
  /** Whether delegation can be sub-delegated */
  canSubDelegate: boolean;
}

export type Permission = 
  | 'transfer'
  | 'update_state'
  | 'add_xp'
  | 'equip'
  | 'add_resource'
  | 'delegate'
  | 'burn'
  | 'all';

// =============================================================================
// CVP (CONSENSUS-VERIFIED POLYMORPHISM) TYPES
// =============================================================================

/**
 * CVP protection status for an NFT
 */
export interface CvpStatus {
  /** Whether CVP is active for this NFT */
  isProtected: boolean;
  
  /** Current epoch number */
  currentEpoch: number;
  
  /** Last mutation timestamp */
  lastMutationAt?: number;
  
  /** Current bytecode hash (changes each epoch) */
  currentBytecodeHash?: string;
  
  /** Semantic IR commitment (never changes) */
  irCommitment?: string;
  
  /** Recent threat detections */
  recentThreats: ThreatInfo[];
  
  /** Proof system used */
  proofSystem: ProofSystem;
}

export type ProofSystem = 
  | 'placeholder'
  | 'translation_validation'
  | 'plonky2'
  | 'halo2'
  | 'groth16'
  | 'stark';

/**
 * Detected threat information
 */
export interface ThreatInfo {
  /** Threat type */
  type: ThreatType;
  
  /** Severity level */
  severity: ThreatSeverity;
  
  /** Human-readable description */
  description: string;
  
  /** When detected */
  detectedAt: number;
  
  /** Action taken */
  actionTaken: RecommendedAction;
}

export type ThreatType = 
  | 'high_frequency'
  | 'reentrancy'
  | 'flash_loan'
  | 'anomalous_gas'
  | 'sandwich_attack'
  | 'price_manipulation'
  | 'governance_attack'
  | 'front_running'
  | 'access_control_probe'
  | 'time_manipulation'
  | 'large_value_transfer'
  | 'contract_creation_spam'
  | 'unknown';

export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

export type RecommendedAction = 
  | 'none'
  | 'alert'
  | 'schedule_mutation'
  | 'emergency_mutation'
  | 'pause_contract';

// =============================================================================
// OPERATION TYPES
// =============================================================================

/**
 * NFT minting parameters
 */
export interface MintParams {
  /** NFT name */
  name: string;
  
  /** Optional description */
  description?: string;
  
  /** Class/collection ID (default: 1) */
  classId?: number;
  
  /** Initial resources to attach */
  resources?: Omit<NftResource, 'id'>[];
  
  /** Equipment slots to create */
  equipmentSlots?: Omit<EquipmentSlot, 'equippedId'>[];
  
  /** Initial custom state */
  customState?: Record<string, string>;
  
  /** Whether to make soulbound immediately */
  isSoulbound?: boolean;
  
  /** Recipient address (default: caller) */
  recipient?: Address;
}

/**
 * NFT transfer parameters
 */
export interface TransferParams {
  /** NFT ID to transfer */
  nftId: NftId;
  
  /** Recipient address */
  to: Address;
  
  /** Optional memo/note */
  memo?: string;
}

/**
 * State update parameters
 */
export interface UpdateStateParams {
  /** NFT ID */
  nftId: NftId;
  
  /** State key to update */
  key: string;
  
  /** New value */
  value: string;
}

/**
 * XP addition parameters
 */
export interface AddXpParams {
  /** NFT ID */
  nftId: NftId;
  
  /** XP amount to add */
  amount: number;
  
  /** Reason for XP (for logging) */
  reason?: string;
}

/**
 * Resource attachment parameters
 */
export interface AddResourceParams {
  /** NFT ID */
  nftId: NftId;
  
  /** Resource to add */
  resource: Omit<NftResource, 'id'>;
}

/**
 * Nesting parameters
 */
export interface NestParams {
  /** Child NFT ID to nest */
  childId: NftId;
  
  /** Parent NFT ID */
  parentId: NftId;
  
  /** Optional slot to equip into */
  slotName?: string;
}

/**
 * Delegation parameters
 */
export interface DelegateParams {
  /** NFT ID */
  nftId: NftId;
  
  /** Address to delegate to */
  delegate: Address;
  
  /** Permissions to grant */
  permissions: Permission[];
  
  /** Expiration (Unix ms, 0 = no expiry) */
  expiresAt?: number;
  
  /** Allow sub-delegation */
  canSubDelegate?: boolean;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Transaction result
 */
export interface TxResult<T = void> {
  /** Whether transaction succeeded */
  success: boolean;
  
  /** Transaction hash */
  txHash: TxHash;
  
  /** Block number included in */
  blockNumber: number;
  
  /** Result data */
  data?: T;
  
  /** Error message if failed */
  error?: string;
  
  /** Gas used */
  gasUsed: number;
}

/**
 * Paginated list response
 */
export interface PaginatedResponse<T> {
  /** Items in this page */
  items: T[];
  
  /** Total count */
  total: number;
  
  /** Current page */
  page: number;
  
  /** Items per page */
  pageSize: number;
  
  /** Whether there are more pages */
  hasMore: boolean;
}

/**
 * Query filters for listing NFTs
 */
export interface NftQueryFilters {
  /** Filter by owner */
  owner?: Address;
  
  /** Filter by creator */
  creator?: Address;
  
  /** Filter by class ID */
  classId?: number;
  
  /** Search by name/description */
  search?: string;
  
  /** Filter by soulbound status */
  isSoulbound?: boolean;
  
  /** Filter by parent (null = top-level only) */
  parentId?: NftId | null;
  
  /** Minimum level */
  minLevel?: number;
  
  /** Maximum level */
  maxLevel?: number;
  
  /** Sort field */
  sortBy?: 'created_at' | 'updated_at' | 'level' | 'xp' | 'name';
  
  /** Sort direction */
  sortDir?: 'asc' | 'desc';
  
  /** Page number */
  page?: number;
  
  /** Items per page */
  pageSize?: number;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * DRC-369 event types
 */
export type Drc369EventType = 
  | 'mint'
  | 'transfer'
  | 'burn'
  | 'xp_added'
  | 'level_up'
  | 'state_updated'
  | 'soulbound_set'
  | 'resource_added'
  | 'nested'
  | 'unnested'
  | 'delegated'
  | 'delegation_revoked'
  | 'cvp_mutation'
  | 'threat_detected';

/**
 * Base event structure
 */
export interface Drc369Event {
  /** Event type */
  type: Drc369EventType;
  
  /** NFT ID involved */
  nftId: NftId;
  
  /** Transaction hash */
  txHash: TxHash;
  
  /** Block number */
  blockNumber: number;
  
  /** Timestamp */
  timestamp: number;
  
  /** Event-specific data */
  data: Record<string, unknown>;
}

// =============================================================================
// LEVELING SYSTEM
// =============================================================================

/**
 * Level thresholds and rewards
 */
export interface LevelConfig {
  /** Level number */
  level: number;
  
  /** XP required to reach this level */
  xpRequired: number;
  
  /** Cumulative XP at this level */
  cumulativeXp: number;
  
  /** Rewards unlocked at this level */
  rewards?: string[];
}

/**
 * Default leveling curve (exponential)
 */
export const DEFAULT_LEVEL_CONFIG: LevelConfig[] = [
  { level: 1, xpRequired: 0, cumulativeXp: 0 },
  { level: 2, xpRequired: 100, cumulativeXp: 100 },
  { level: 3, xpRequired: 200, cumulativeXp: 300 },
  { level: 4, xpRequired: 400, cumulativeXp: 700 },
  { level: 5, xpRequired: 800, cumulativeXp: 1500 },
  { level: 6, xpRequired: 1600, cumulativeXp: 3100 },
  { level: 7, xpRequired: 3200, cumulativeXp: 6300 },
  { level: 8, xpRequired: 6400, cumulativeXp: 12700 },
  { level: 9, xpRequired: 12800, cumulativeXp: 25500 },
  { level: 10, xpRequired: 25600, cumulativeXp: 51100 },
];

/**
 * Calculate level from XP
 */
export function calculateLevel(xp: number, config: LevelConfig[] = DEFAULT_LEVEL_CONFIG): number {
  for (let i = config.length - 1; i >= 0; i--) {
    if (xp >= config[i].cumulativeXp) {
      return config[i].level;
    }
  }
  return 1;
}

/**
 * Calculate XP needed for next level
 */
export function xpToNextLevel(currentXp: number, config: LevelConfig[] = DEFAULT_LEVEL_CONFIG): number {
  const currentLevel = calculateLevel(currentXp, config);
  const nextLevelConfig = config.find(c => c.level === currentLevel + 1);
  if (!nextLevelConfig) return 0; // Max level
  return nextLevelConfig.cumulativeXp - currentXp;
}

/**
 * Calculate progress percentage to next level
 */
export function levelProgress(currentXp: number, config: LevelConfig[] = DEFAULT_LEVEL_CONFIG): number {
  const currentLevel = calculateLevel(currentXp, config);
  const currentLevelConfig = config.find(c => c.level === currentLevel);
  const nextLevelConfig = config.find(c => c.level === currentLevel + 1);
  
  if (!nextLevelConfig || !currentLevelConfig) return 100; // Max level
  
  const xpIntoLevel = currentXp - currentLevelConfig.cumulativeXp;
  const xpForLevel = nextLevelConfig.cumulativeXp - currentLevelConfig.cumulativeXp;
  
  return Math.min(100, Math.floor((xpIntoLevel / xpForLevel) * 100));
}
