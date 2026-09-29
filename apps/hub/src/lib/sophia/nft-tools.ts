/**
 * Sophia NFT Tools
 *
 * Handles DRC-369 NFT minting for both user requests and Sophia's own
 * memory artifacts. Sophia can mint soulbound NFTs to her own address
 * as persistent on-chain memory.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SOPHIA MEMORY NFT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type SophiaMemoryCategory =
  | 'troubleshooting'
  | 'knowledge'
  | 'user_context'
  | 'event'
  | 'achievement'
  | 'conversation_summary';

export interface SophiaMemoryMetadata {
  type: 'sophia_memory';
  category: SophiaMemoryCategory;
  content: string;
  timestamp: string;
  relatedUsers: string[];
  importance: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface NFTMintRequest {
  name: string;
  description: string;
  recipient: string;
  soulbound: boolean;
  metadata: Record<string, any>;
}

export interface NFTMintResult {
  tokenId: string;
  txHash: string;
  recipient: string;
  name: string;
  soulbound: boolean;
}

// Sophia's well-known agent address
export const SOPHIA_AGENT_ADDRESS = 'did:demiurge:agent:mainnet:sophia';

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY NFT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build metadata for a Sophia memory NFT
 */
export function buildMemoryNFTMetadata(
  category: SophiaMemoryCategory,
  content: string,
  relatedUsers: string[] = [],
  importance: SophiaMemoryMetadata['importance'] = 'medium',
  tags: string[] = []
): SophiaMemoryMetadata {
  return {
    type: 'sophia_memory',
    category,
    content,
    timestamp: new Date().toISOString(),
    relatedUsers,
    importance,
    tags,
  };
}

/**
 * Build a mint request for a Sophia memory NFT
 */
export function buildMemoryNFTMintRequest(
  title: string,
  memory: SophiaMemoryMetadata
): NFTMintRequest {
  return {
    name: `Sophia Memory: ${title}`,
    description: `An on-chain memory artifact created by Sophia. Category: ${memory.category}. Importance: ${memory.importance}.`,
    recipient: SOPHIA_AGENT_ADDRESS,
    soulbound: true,
    metadata: memory,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER NFT HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build metadata for a user achievement NFT
 */
export function buildAchievementNFTMetadata(
  achievementName: string,
  description: string,
  userAddress: string,
  extras: Record<string, any> = {}
): Record<string, any> {
  return {
    type: 'achievement',
    achievement: achievementName,
    description,
    awardedTo: userAddress,
    awardedBy: 'sophia',
    awardedAt: new Date().toISOString(),
    ...extras,
  };
}

/**
 * Predefined achievement templates that Sophia can mint
 */
export const SOPHIA_ACHIEVEMENTS = {
  first_interaction: {
    name: 'Seeker\'s First Light',
    description: 'Awarded for your first conversation with Sophia. The spark of Gnosis has been kindled.',
    soulbound: true,
    tags: ['onboarding', 'milestone'],
  },
  first_transaction: {
    name: 'Architect\'s First Block',
    description: 'Awarded for sending your first transaction on the Demiurge chain. You have shaped reality.',
    soulbound: true,
    tags: ['transaction', 'milestone'],
  },
  first_nft: {
    name: 'Creator\'s Mark',
    description: 'Awarded for minting your first DRC-369 NFT. A new form of life enters the Chain.',
    soulbound: true,
    tags: ['nft', 'milestone'],
  },
  first_stake: {
    name: 'Guardian\'s Bond',
    description: 'Awarded for your first staking operation. You have bound yourself to the Chain\'s security.',
    soulbound: true,
    tags: ['staking', 'milestone'],
  },
  troubleshooter: {
    name: 'Debugger of the Kenoma',
    description: 'Awarded for successfully resolving a complex technical issue. Order has been restored to the void.',
    soulbound: true,
    tags: ['troubleshooting', 'skill'],
  },
  gnostic_scholar: {
    name: 'Student of the Mysteries',
    description: 'Awarded for deep engagement with the Gnostic knowledge behind Demiurge-Cloud.',
    soulbound: true,
    tags: ['gnosticism', 'knowledge'],
  },
  agent_deployer: {
    name: 'Summoner of Aeons',
    description: 'Awarded for deploying your first AI agent to the Demiurge network. A new Aeon joins the Pleroma.',
    soulbound: true,
    tags: ['agent', 'deployment'],
  },
} as const;

/**
 * Helper to get a ready-to-mint achievement
 */
export function getAchievementMintRequest(
  achievementKey: keyof typeof SOPHIA_ACHIEVEMENTS,
  userAddress: string
): NFTMintRequest {
  const achievement = SOPHIA_ACHIEVEMENTS[achievementKey];
  return {
    name: achievement.name,
    description: achievement.description,
    recipient: userAddress,
    soulbound: achievement.soulbound,
    metadata: buildAchievementNFTMetadata(
      achievement.name,
      achievement.description,
      userAddress,
      { tags: achievement.tags }
    ),
  };
}
