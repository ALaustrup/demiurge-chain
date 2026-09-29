/**
 * Demiurge Agent Foundry SDK
 * 
 * Create autonomous AI agents as First-Class Citizens on Demiurge-Cloud.
 * 
 * @example
 * ```typescript
 * import { createAgent, AgentConfig } from '@demiurge/agent-foundry';
 * 
 * const agent = await createAgent({
 *   name: 'TradingOracle',
 *   llm: {
 *     provider: 'gemini',
 *     model: 'gemini-1.5-pro',
 *   },
 *   autonomy: 'bounded',
 *   capabilities: ['read', 'analyze', 'trade'],
 *   mission: 'Analyze market conditions and optimize portfolio.',
 *   spendingLimit: '1000 CGT',
 *   controller: 'alice.demiurge',
 * });
 * 
 * // Run single inference
 * const result = await agent.think('What assets should I acquire?');
 * 
 * // Or run autonomously
 * await agent.run();
 * ```
 * 
 * @packageDocumentation
 */

// Main exports
import { 
  EtherealAgent, 
  createAgent,
  createAgentWithInstantKeys,
  registerAgent,
  AgentFactory,
} from './agent';
export { 
  EtherealAgent, 
  createAgent,
  createAgentWithInstantKeys,
  registerAgent,
  AgentFactory,
};
export type { 
  InstantKeysAgent, 
  RegisteredAgent, 
  AgentRegistrationOptions,
} from './agent';

// Provider exports
import { 
  LLMProvider, 
  createProvider, 
  registerProvider,
  OpenAIProvider,
  GeminiProvider,
} from './providers';
export { 
  LLMProvider, 
  createProvider, 
  registerProvider,
  OpenAIProvider,
  GeminiProvider,
};

// Memory exports
export { MemoryClient } from './memory';

// Tool exports
import {
  createReadAssetsTool,
  createTransferCgtTool,
  createAddXpTool,
  createRememberTool,
  createRecallTool,
  createChainStatusTool,
  createResolveIdentityTool,
  createHttpTool,
  createStandardTools,
} from './tools';

export {
  createReadAssetsTool,
  createTransferCgtTool,
  createAddXpTool,
  createRememberTool,
  createRecallTool,
  createChainStatusTool,
  createResolveIdentityTool,
  createHttpTool,
  createStandardTools,
};

// Type exports
export type {
  // Agent types
  AgentConfig,
  AgentState,
  AgentEvents,
  AgentDid,
  AgentMetadata,
  AutonomyLevel,
  AgentCapability,
  
  // LLM types
  LLMProviderType,
  LLMProviderConfig,
  ModelCapability,
  InferenceRequest,
  InferenceResult,
  
  // Tool types
  ToolDefinition,
  ToolParameterSchema,
  ToolCall,
  
  // Memory types
  MemoryEntry,
  MemoryType,
  MemorySearchOptions,
  
  // Context types
  AgentContext,
  AssetContext,
  
  // Transaction types
  ActionType,
  AgentTransaction,
  SpendingLimit,
} from './types';

// Re-export validation schema
export { AgentConfigSchema } from './types';

// Version
export const VERSION = '0.1.0';

/**
 * Quick start helper
 */
export const AgentFoundry = {
  createAgent,
  createProvider,
  registerProvider,
  
  /** Dual creation patterns */
  instant: createAgentWithInstantKeys,
  register: registerAgent,
  factory: AgentFactory,
  
  /** Built-in tools */
  tools: {
    createReadAssetsTool,
    createTransferCgtTool,
    createAddXpTool,
    createRememberTool,
    createRecallTool,
    createChainStatusTool,
    createResolveIdentityTool,
    createHttpTool,
    createStandardTools,
  },
  
  /** Pre-configured providers */
  providers: {
    openai: (apiKey: string, model = 'gpt-4-turbo') => ({
      provider: 'openai' as const,
      apiKey,
      model,
    }),
    gemini: (apiKey: string, model = 'gemini-1.5-pro') => ({
      provider: 'gemini' as const,
      apiKey,
      model,
    }),
    cursor: (apiKey: string) => ({
      provider: 'cursor' as const,
      apiKey,
      model: 'cursor-1.0',
    }),
    ollama: (model: string, baseUrl = 'http://localhost:11434') => ({
      provider: 'ollama' as const,
      model,
      baseUrl,
    }),
  },
};

export default AgentFoundry;
