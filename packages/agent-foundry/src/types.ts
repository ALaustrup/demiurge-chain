/**
 * Agent Foundry Type Definitions
 * 
 * Types for creating autonomous AI agents as First-Class Citizens on Demiurge.
 */

import { z } from 'zod';

// ============================================================================
// AGENT IDENTITY
// ============================================================================

/**
 * Agent autonomy levels
 */
export type AutonomyLevel = 'supervised' | 'bounded' | 'autonomous' | 'sovereign';

/**
 * Agent capabilities
 */
export type AgentCapability =
  | 'read'
  | 'analyze'
  | 'trade'
  | 'transfer'
  | 'create'
  | 'modify_assets'
  | 'governance'
  | 'spawn_agents'
  | 'external_api';

/**
 * Agent DID structure
 */
export interface AgentDid {
  /** Full DID string (did:demiurge:agent:mainnet:0x...) */
  did: string;
  /** Network (mainnet, testnet) */
  network: string;
  /** Unique 32-byte ID as hex */
  uniqueId: string;
}

/**
 * Agent metadata
 */
export interface AgentMetadata {
  /** Human-readable name */
  name: string;
  /** Agent type */
  type: 'EtherealAgent' | 'SentinelAgent' | 'OracleAgent' | 'CustomAgent';
  /** Model identifier */
  modelId: string;
  /** Model name */
  modelName: string;
  /** Capabilities */
  capabilities: AgentCapability[];
  /** Autonomy level */
  autonomy: AutonomyLevel;
  /** Mission description */
  mission: string;
  /** Spending limit per epoch (in CGT smallest units) */
  spendingLimit: bigint;
  /** Creation timestamp */
  createdAt: number;
  /** Reputation score (0-1000) */
  reputation: number;
}

// ============================================================================
// LLM PROVIDERS
// ============================================================================

/**
 * Supported LLM providers
 */
export type LLMProviderType =
  | 'openai'
  | 'gemini'
  | 'anthropic'
  | 'cursor'
  | 'grok'
  | 'ollama'
  | 'archon';

/**
 * Model capability categories
 */
export type ModelCapability =
  | 'text_generation'
  | 'code_generation'
  | 'image_understanding'
  | 'reasoning'
  | 'tool_use'
  | 'embeddings';

/**
 * LLM provider configuration
 */
export interface LLMProviderConfig {
  /** Provider type */
  provider: LLMProviderType;
  /** API key (or env var name) */
  apiKey?: string;
  /** Base URL (for self-hosted) */
  baseUrl?: string;
  /** Model ID */
  model: string;
  /** Max tokens */
  maxTokens?: number;
  /** Temperature (0-1) */
  temperature?: number;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Inference request
 */
export interface InferenceRequest {
  /** Prompt/input */
  prompt: string;
  /** System prompt */
  systemPrompt?: string;
  /** Context (injected from DRC-369 assets, memory, etc.) */
  context?: AgentContext;
  /** Available tools */
  tools?: ToolDefinition[];
  /** Max tokens */
  maxTokens?: number;
  /** Temperature */
  temperature?: number;
  /** Stop sequences */
  stopSequences?: string[];
}

/**
 * Inference result
 */
export interface InferenceResult {
  /** Output text */
  output: string;
  /** Tool calls made */
  toolCalls: ToolCall[];
  /** Finish reason */
  finishReason: 'stop' | 'length' | 'tool_call' | 'content_filter' | 'error';
  /** Usage stats */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Latency in ms */
  latencyMs: number;
  /** VCP proof ID (if verified) */
  proofId?: string;
}

// ============================================================================
// TOOLS
// ============================================================================

/**
 * Tool parameter schema (JSON Schema subset)
 */
export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  enum?: string[];
  items?: ToolParameterSchema;
  properties?: Record<string, ToolParameterSchema>;
  required?: string[];
}

/**
 * Tool definition
 */
export interface ToolDefinition {
  /** Tool name (snake_case) */
  name: string;
  /** Description for the LLM */
  description: string;
  /** Parameter schema */
  parameters: Record<string, ToolParameterSchema>;
  /** Required parameters */
  required?: string[];
  /** Execute function */
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Tool call from LLM
 */
export interface ToolCall {
  /** Tool name */
  name: string;
  /** Arguments */
  arguments: Record<string, unknown>;
  /** Result (after execution) */
  result?: unknown;
  /** Error (if failed) */
  error?: string;
}

// ============================================================================
// MEMORY
// ============================================================================

/**
 * Memory types
 */
export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'working';

/**
 * Memory entry
 */
export interface MemoryEntry {
  /** Memory ID */
  id: string;
  /** Memory type */
  type: MemoryType;
  /** Content */
  content: string;
  /** Summary (for quick retrieval) */
  summary: string;
  /** Embedding vector */
  embedding?: number[];
  /** Associated asset IDs */
  assetContext?: string[];
  /** Tags */
  tags: string[];
  /** Importance (0-100) */
  importance: number;
  /** Creation timestamp */
  createdAt: number;
  /** Access count */
  accessCount: number;
}

/**
 * Memory search options
 */
export interface MemorySearchOptions {
  /** Query text */
  query: string;
  /** Query embedding (if pre-computed) */
  embedding?: number[];
  /** Filter by type */
  type?: MemoryType;
  /** Filter by tags */
  tags?: string[];
  /** Max results */
  limit?: number;
  /** Min similarity threshold (0-1) */
  minSimilarity?: number;
}

// ============================================================================
// CONTEXT
// ============================================================================

/**
 * Asset context (injected from DRC-369)
 */
export interface AssetContext {
  /** Token ID */
  tokenId: string;
  /** Asset name */
  name: string;
  /** Physics properties */
  physics: {
    massKg: number;
    friction: number;
    restitution: number;
    destructible: boolean;
    durability: number;
  };
  /** State */
  state: {
    xp: number;
    level: number;
    rarity: string;
  };
  /** Custom attributes */
  attributes: Record<string, string | number | boolean>;
}

/**
 * Full agent context
 */
export interface AgentContext {
  /** Agent DID */
  agentDid: string;
  /** Mission */
  mission: string;
  /** Retrieved memories */
  memories: MemoryEntry[];
  /** Asset context */
  assets: AssetContext[];
  /** Current timestamp */
  timestamp: number;
  /** Available tools */
  availableTools: string[];
  /** Custom context */
  custom?: Record<string, unknown>;
}

// ============================================================================
// WALLET & TRANSACTIONS
// ============================================================================

/**
 * Action types
 */
export type ActionType =
  | 'transfer_cgt'
  | 'transfer_asset'
  | 'modify_asset'
  | 'store_memory'
  | 'query'
  | 'request_inference'
  | 'vote'
  | 'spawn_agent'
  | 'external_call';

/**
 * Spending limit config
 */
export interface SpendingLimit {
  /** Per-transaction limit (CGT smallest units) */
  perTransaction: bigint;
  /** Per-epoch limit */
  perEpoch: bigint;
  /** Max transactions per epoch */
  maxTransactionsPerEpoch: number;
}

/**
 * Agent transaction
 */
export interface AgentTransaction {
  /** Agent DID */
  agentDid: string;
  /** Action type */
  actionType: ActionType;
  /** Transaction data */
  data: unknown;
  /** Nonce */
  nonce: number;
  /** Timestamp */
  timestamp: number;
  /** Signature */
  signature: string;
  /** Controller approval (if required) */
  controllerApproval?: string;
  /** Transaction hash (after submission) */
  txHash?: string;
}

// ============================================================================
// AGENT CONFIG
// ============================================================================

/**
 * Agent creation config
 */
export interface AgentConfig {
  /** Agent name */
  name: string;
  /** LLM provider config */
  llm: LLMProviderConfig;
  /** Autonomy level */
  autonomy: AutonomyLevel;
  /** Capabilities */
  capabilities: AgentCapability[];
  /** Mission description */
  mission: string;
  /** Spending limit per epoch (CGT string like "1000 CGT") */
  spendingLimit: string;
  /** Controller QOR ID */
  controller: string;
  /** Custom tools */
  tools?: ToolDefinition[];
  /** Initial memory */
  initialMemory?: Omit<MemoryEntry, 'id' | 'createdAt' | 'accessCount'>[];
  /** RPC endpoint */
  rpcEndpoint?: string;
}

/**
 * Agent state
 */
export type AgentState = 'idle' | 'thinking' | 'executing' | 'waiting_approval' | 'error' | 'stopped';

/**
 * Agent events
 */
export interface AgentEvents {
  /** Agent started */
  started: { agentDid: string };
  /** Agent stopped */
  stopped: { agentDid: string; reason: string };
  /** Inference started */
  inferenceStart: { requestId: string; prompt: string };
  /** Inference complete */
  inferenceComplete: { requestId: string; result: InferenceResult };
  /** Tool called */
  toolCall: { name: string; arguments: Record<string, unknown> };
  /** Tool result */
  toolResult: { name: string; result: unknown };
  /** Memory stored */
  memoryStored: { memoryId: string; type: MemoryType };
  /** Transaction submitted */
  transactionSubmitted: { txHash: string; actionType: ActionType };
  /** Approval required */
  approvalRequired: { actionId: string; actionType: ActionType; data: unknown };
  /** Error */
  error: { code: string; message: string; details?: unknown };
  /** State changed */
  stateChanged: { from: AgentState; to: AgentState };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const AgentConfigSchema = z.object({
  name: z.string().min(1).max(64),
  llm: z.object({
    provider: z.enum(['openai', 'gemini', 'anthropic', 'cursor', 'grok', 'ollama', 'archon']),
    apiKey: z.string().optional(),
    baseUrl: z.string().url().optional(),
    model: z.string(),
    maxTokens: z.number().int().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
  }),
  autonomy: z.enum(['supervised', 'bounded', 'autonomous', 'sovereign']),
  capabilities: z.array(z.enum([
    'read', 'analyze', 'trade', 'transfer', 'create',
    'modify_assets', 'governance', 'spawn_agents', 'external_api'
  ])),
  mission: z.string().min(1).max(2048),
  spendingLimit: z.string().regex(/^\d+(\.\d+)?\s*CGT$/i),
  controller: z.string().min(1),
  tools: z.array(z.any()).optional(),
  initialMemory: z.array(z.any()).optional(),
  rpcEndpoint: z.string().url().optional(),
});
