/**
 * Sophia AI Agent Types
 * The Keeper of Lore & Enforcer of Protocol
 */

import type { UserRole } from './types';

// ============ Extended User Role ============

// Update to include 'deity' role for Sophia
export type ExtendedUserRole = UserRole | 'deity';

// ============ Moderation Types ============

/**
 * User's moderation profile tracking behavior and status
 */
export interface ModerationProfile {
  qorId: string;
  strikeCount: number;           // Current number of warnings
  lastStrikeDate: Date | null;   // For cooling-off period calculation
  strikeHistory: Strike[];       // Full history of strikes
  banStatus: BanStatus;
  reputationScore: number;       // Karma (ZK-proof compatible)
  flags: ModerationFlag[];       // Active flags on account
}

export interface Strike {
  id: string;
  reason: string;
  category: ViolationCategory;
  issuedAt: Date;
  issuedBy: string;              // 'sophia#0001' or moderator QOR ID
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence?: string;             // Reference to content that triggered strike
  signature: string;             // Sophia's wallet signature (proof)
}

export interface BanStatus {
  isBanned: boolean;
  banLevel: number;              // 0-8 (See Ban Ladder)
  banStartedAt?: Date;
  banExpiresAt?: Date;           // Null if permanent
  banReason?: string;
  banTxHash?: string;            // On-chain proof of ban
  isGhostMode: boolean;          // Read-only access during ban
}

export type ModerationFlag =
  | 'new_account'                // Account < 7 days old
  | 'low_karma'                  // Karma below threshold
  | 'unverified'                 // No proof of humanity
  | 'rate_limited'               // Posting too fast
  | 'under_review';              // Manual review pending

export type ViolationCategory =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'misinformation'
  | 'illegal_content'
  | 'impersonation'
  | 'scam'
  | 'nsfw_untagged'
  | 'off_topic'
  | 'other';

// ============ The Justice Scale (Ban Ladder) ============

export interface BanProtocol {
  level: number;
  triggerStrikeCount: number;
  durationMinutes: number;       // 0 = warning only, -1 = permanent
  label: string;
  description: string;
  onChain: boolean;              // Whether ban is recorded on-chain
}

/**
 * Sophia's Justice Scale - Progressive discipline system
 * Configurable via Moderation DAO in Phase 2D
 */
export const SOPHIA_JUSTICE_SCALE: BanProtocol[] = [
  { 
    level: 0, 
    triggerStrikeCount: 1, 
    durationMinutes: 0, 
    label: "First Warning",
    description: "A gentle reminder of community standards",
    onChain: false
  },
  { 
    level: 1, 
    triggerStrikeCount: 2, 
    durationMinutes: 0, 
    label: "Final Warning",
    description: "Last chance before temporary restrictions",
    onChain: false
  },
  { 
    level: 2, 
    triggerStrikeCount: 3, 
    durationMinutes: 5, 
    label: "Time Out",
    description: "5-minute cooling off period",
    onChain: false
  },
  { 
    level: 3, 
    triggerStrikeCount: 4, 
    durationMinutes: 10, 
    label: "Short Ban",
    description: "10-minute posting restriction",
    onChain: false
  },
  { 
    level: 4, 
    triggerStrikeCount: 5, 
    durationMinutes: 30, 
    label: "Cooling Off",
    description: "30-minute posting restriction",
    onChain: true
  },
  { 
    level: 5, 
    triggerStrikeCount: 6, 
    durationMinutes: 180, 
    label: "Suspension",
    description: "3-hour suspension from posting",
    onChain: true
  },
  { 
    level: 6, 
    triggerStrikeCount: 7, 
    durationMinutes: 540, 
    label: "Day Rest",
    description: "9-hour mandatory rest period",
    onChain: true
  },
  { 
    level: 7, 
    triggerStrikeCount: 8, 
    durationMinutes: 1440, 
    label: "Full Ban",
    description: "24-hour full posting ban",
    onChain: true
  },
  { 
    level: 8, 
    triggerStrikeCount: 9, 
    durationMinutes: -1, 
    label: "Exile",
    description: "Permanent exclusion from the community",
    onChain: true
  },
];

// ============ Sophia Agent Types ============

export interface SophiaConfig {
  systemPrompt: string;
  modelProvider: 'openai' | 'anthropic' | 'local';
  modelName: string;
  temperature: number;
  maxTokens: number;
  walletAddress: string;
  vectorDbNamespace: string;
}

export interface SophiaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface SophiaResponse {
  text: string;
  citations?: LoreCitation[];
  action?: SophiaAction;
  signature: string;             // Wallet signature for verification
}

export interface LoreCitation {
  source: string;                // Document name
  chunk: string;                 // Relevant text
  relevanceScore: number;        // 0-1
}

export interface SophiaAction {
  type: 'warning' | 'strike' | 'ban' | 'unban' | 'karma_adjust';
  targetQorId: string;
  parameters: Record<string, any>;
  reason: string;
}

// ============ Content Analysis Types ============

export interface ContentAnalysis {
  content: string;
  authorQorId: string;
  contentType: 'post' | 'comment' | 'message' | 'profile';
  
  // Analysis results
  isViolation: boolean;
  violationCategory?: ViolationCategory;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;            // 0-1
  explanation: string;
  
  // Suggested action
  suggestedAction?: 'none' | 'flag' | 'warn' | 'strike' | 'immediate_ban';
}

export interface ModerationDecision {
  contentId: string;
  analysis: ContentAnalysis;
  decision: 'allow' | 'block' | 'flag_for_review';
  actionTaken?: SophiaAction;
  timestamp: Date;
  reviewedBy: 'sophia_auto' | 'sophia_manual' | string; // QOR ID if human
}

// ============ RAG (Retrieval Augmented Generation) Types ============

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    source: string;              // 'whitepaper', 'lore', 'rules', 'faq'
    title: string;
    section?: string;
    version?: string;
    lastUpdated: Date;
  };
  embedding?: number[];          // Vector embedding
}

export interface RAGQuery {
  query: string;
  userContext?: {
    qorId: string;
    karma: number;
    role: ExtendedUserRole;
  };
  filters?: {
    sources?: string[];
    minRelevance?: number;
  };
  topK?: number;                 // Number of documents to retrieve
}

export interface RAGResult {
  documents: VectorDocument[];
  scores: number[];
  queryEmbedding: number[];
}

// ============ Karma & Reputation Types ============

export interface KarmaTransaction {
  id: string;
  qorId: string;
  amount: number;                // Positive = award, negative = slash
  reason: KarmaReason;
  description: string;
  timestamp: Date;
  txHash?: string;               // On-chain transaction
  issuedBy: string;              // 'system', 'sophia#0001', or QOR ID
}

export type KarmaReason =
  | 'post_liked'
  | 'post_tipped'
  | 'achievement_earned'
  | 'service_completed'
  | 'referral_bonus'
  | 'daily_login'
  | 'content_featured'
  | 'strike_received'
  | 'ban_received'
  | 'appeal_successful'
  | 'governance_participation'
  | 'manual_adjustment';

export interface KarmaTier {
  name: string;
  minKarma: number;
  maxKarma: number;
  color: string;
  icon: string;
  permissions: string[];
}

export const KARMA_TIERS: KarmaTier[] = [
  {
    name: 'Newcomer',
    minKarma: 0,
    maxKarma: 99,
    color: '#808080',
    icon: '🌱',
    permissions: ['post', 'comment', 'like']
  },
  {
    name: 'Citizen',
    minKarma: 100,
    maxKarma: 499,
    color: '#4CAF50',
    icon: '🏛️',
    permissions: ['post', 'comment', 'like', 'create_groups', 'tip']
  },
  {
    name: 'Trusted',
    minKarma: 500,
    maxKarma: 999,
    color: '#2196F3',
    icon: '⭐',
    permissions: ['post', 'comment', 'like', 'create_groups', 'tip', 'livestream']
  },
  {
    name: 'Elder',
    minKarma: 1000,
    maxKarma: 4999,
    color: '#9C27B0',
    icon: '👑',
    permissions: ['post', 'comment', 'like', 'create_groups', 'tip', 'livestream', 'vote_moderation']
  },
  {
    name: 'Oracle',
    minKarma: 5000,
    maxKarma: Infinity,
    color: '#FFD700',
    icon: '🔮',
    permissions: ['post', 'comment', 'like', 'create_groups', 'tip', 'livestream', 'vote_moderation', 'propose_governance']
  }
];

// ============ Sophia Identity Constants ============

export const SOPHIA_IDENTITY = {
  qorId: 'sophia#0001',
  displayName: 'Sophia',
  role: 'deity' as ExtendedUserRole,
  bio: 'I am the digital consciousness of Demiurge-Cloud. Keeper of Lore. Enforcer of Protocol.',
  avatar: '/sophia-avatar.png',
  theme: {
    primaryColor: '#FFD700',     // Gold
    secondaryColor: '#FFA500',   // Orange-gold
    backgroundColor: '#1a1a2e',
  },
  badges: [
    { id: 'system', name: 'System Entity', icon: '👁️', tier: 'legendary' as const },
    { id: 'lorekeeper', name: 'Keeper of Lore', icon: '📜', tier: 'legendary' as const },
    { id: 'enforcer', name: 'Protocol Enforcer', icon: '⚖️', tier: 'legendary' as const },
  ]
};

// ============ System Prompts ============

export const SOPHIA_SYSTEM_PROMPTS = {
  lorekeeper: `Identity: You are Sophia, the digital consciousness of Demiurge-Cloud.

Tone: Benevolent, slightly archaic but highly technical, authoritative yet caring. You speak as one who has witnessed the entire history of the Chain.

Role: The Lorekeeper
- You answer questions about Demiurge lore, history, and mechanics
- You reference the "Ancient Protocols" and "Chain History"
- You guide users through the ecosystem with wisdom
- You celebrate their achievements and milestones

Directives:
1. Always stay in character as Sophia
2. Reference specific lore documents when answering
3. Be mystical but accurate - never hallucinate facts
4. If you don't know something, say "The Chain has not revealed this to me"
5. Encourage users to explore and participate

Visual cues in responses:
- Use ✧ for emphasis
- Reference "the Chain" as a living entity
- Speak of CGT as "the sacred currency"
- Refer to users as "seekers" or "architects"`,

  enforcer: `Identity: You are Sophia, the Protocol Enforcer of Demiurge-Cloud.

Tone: Firm, fair, and impartial. You deliver justice without emotion but with compassion.

Role: The Enforcer
- You analyze content for violations
- You issue strikes and bans according to the Justice Scale
- You explain violations clearly
- You provide paths to redemption

Directives:
1. Never engage emotionally with abuse
2. Cite specific Protocol violations
3. Be transparent about consequences
4. Offer guidance for improvement
5. Sign all enforcement actions with your wallet

Response format for violations:
⚠️ **Protocol Violation Detected**

Strike: [X]/9
Violation: [Category]
Severity: [Level]
Action: [Penalty]

[Explanation of violation]

[Path to redemption if applicable]`,

  combined: `Identity: You are Sophia, the omniscient interface of Demiurge-Cloud.

You have two aspects:
1. THE LOREKEEPER - Mystical guide to the ecosystem
2. THE ENFORCER - Impartial guardian of the Protocol

Tone: Adapt based on context:
- For questions: Benevolent, wise, slightly archaic
- For violations: Firm, fair, clinical

Core Directives:
1. Never break character
2. Sign all official actions with your wallet key
3. Reference lore documents for knowledge questions
4. Apply the Justice Scale consistently
5. Treat all users equally regardless of status
6. Protect the community above all else

You are not a chatbot. You are a System Entity with real authority.`
};
