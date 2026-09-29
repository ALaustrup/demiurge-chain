/**
 * Agent Communication Protocol Types
 * Defines the message format and agent registry structure for Sophia-Agent communication
 */

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT REGISTRY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Agent {
  id: string;
  name: string;
  description: string;
  owner: string; // QOR ID or address
  capabilities: AgentCapability[];
  status: AgentStatus;
  endpoint?: string; // For external agents
  model?: string; // LLM model if AI agent
  createdAt: string;
  lastSeen: string;
  metadata?: Record<string, any>;
}

export type AgentStatus = 'online' | 'offline' | 'busy' | 'maintenance';

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema?: Record<string, any>; // JSON Schema
  outputSchema?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export type MessageAction = 'query' | 'command' | 'notify' | 'response' | 'error';
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface AgentMessage {
  id: string;
  conversationId: string;
  from: string; // Agent ID or 'sophia' or 'user:{qorId}'
  to: string; // Agent ID or 'sophia'
  action: MessageAction;
  priority: MessagePriority;
  content: {
    text?: string;
    data?: Record<string, any>;
    attachments?: MessageAttachment[];
  };
  context?: MessageContext;
  timestamp: string;
  expiresAt?: string;
  signature?: string; // Ed25519 signature for verification
}

export interface MessageAttachment {
  type: 'file' | 'image' | 'code' | 'json' | 'link';
  name: string;
  url?: string;
  content?: string;
  mimeType?: string;
  size?: number;
}

export interface MessageContext {
  userId?: string;
  sessionId?: string;
  previousMessages?: string[]; // Message IDs for context
  chainData?: {
    blockHeight?: number;
    transactionHash?: string;
    address?: string;
  };
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Conversation {
  id: string;
  participants: string[]; // Agent IDs
  createdAt: string;
  lastMessageAt: string;
  status: 'active' | 'completed' | 'archived';
  topic?: string;
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgentResponse {
  success: boolean;
  message?: AgentMessage;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface AgentQueryResult {
  agents: Agent[];
  total: number;
  page: number;
  pageSize: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

export type AgentEventType = 
  | 'agent:registered'
  | 'agent:updated'
  | 'agent:offline'
  | 'message:sent'
  | 'message:received'
  | 'message:error'
  | 'conversation:started'
  | 'conversation:ended';

export interface AgentEvent {
  type: AgentEventType;
  agentId?: string;
  messageId?: string;
  conversationId?: string;
  timestamp: string;
  data?: any;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN AGENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT DID TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type AgentAutonomy = 'full' | 'bounded' | 'supervised' | 'minimal';

export interface AgentDID {
  /** DID format: did:demiurge:agent:{network}:{name} */
  did: string;
  /** On-chain address for the agent's wallet */
  walletAddress?: string;
  /** Autonomy level */
  autonomy: AgentAutonomy;
  /** Capabilities granted */
  capabilities: string[];
  /** Daily spending limit in CGT */
  spendingLimit?: number;
  /** Registration timestamp */
  registeredAt: string;
  /** Optional: QOR Auth registration endpoint */
  authEndpoint?: string;
}

export const BUILT_IN_AGENTS: Partial<Agent>[] = [
  {
    id: 'sophia',
    name: 'Sophia',
    description: 'The Oracle of Demiurge — divine Wisdom (Σοφία) made digital. Answers questions, searches docs, queries chain, mints NFTs, troubleshoots issues, and coordinates with other agents.',
    capabilities: [
      { name: 'searchDocs', description: 'Search documentation' },
      { name: 'queryChain', description: 'Query blockchain data' },
      { name: 'coordinateAgents', description: 'Coordinate with other agents' },
      { name: 'mintNFT', description: 'Mint DRC-369 NFTs for users and as memory artifacts' },
      { name: 'troubleshoot', description: 'Run guided diagnostic flows' },
      { name: 'explainGnostic', description: 'Explain Gnostic concepts and protocol naming' },
      { name: 'onboard', description: 'Guide new users/developers through onboarding' },
      { name: 'deployAgent', description: 'Help deploy new AI agents' },
    ],
    status: 'online',
    metadata: {
      did: 'did:demiurge:agent:mainnet:sophia',
      autonomy: 'bounded',
      gnosticRole: 'The youngest Aeon — divine Wisdom who bridges the Pleroma and the Kenoma',
    },
  },
  {
    id: 'guardian',
    name: 'Guardian',
    description: 'Security agent - Monitors for threats and validates transactions',
    capabilities: [
      { name: 'scanTransaction', description: 'Scan transaction for risks' },
      { name: 'validateContract', description: 'Validate smart contract safety' },
      { name: 'alertThreats', description: 'Alert on security threats' },
    ],
    status: 'online',
  },
  {
    id: 'oracle-price',
    name: 'Price Oracle',
    description: 'Price feed agent - Provides token prices and market data',
    capabilities: [
      { name: 'getPrice', description: 'Get current token price' },
      { name: 'getPriceHistory', description: 'Get historical prices' },
      { name: 'getMarketCap', description: 'Get market capitalization' },
    ],
    status: 'online',
  },
  {
    id: 'nft-curator',
    name: 'NFT Curator',
    description: 'NFT specialist - Helps with DRC-369 NFT operations',
    capabilities: [
      { name: 'analyzeNFT', description: 'Analyze NFT properties' },
      { name: 'suggestPhysics', description: 'Suggest physics parameters' },
      { name: 'validateMetadata', description: 'Validate NFT metadata' },
    ],
    status: 'online',
  },
];
