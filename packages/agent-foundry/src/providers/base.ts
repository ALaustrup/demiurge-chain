/**
 * Base LLM Provider Interface
 * 
 * Abstract interface for all LLM providers to implement.
 */

import type {
  InferenceRequest,
  InferenceResult,
  LLMProviderConfig,
  ToolDefinition,
  ToolCall,
} from '../types';

/**
 * Abstract LLM Provider
 */
export abstract class LLMProvider {
  protected config: LLMProviderConfig;
  protected name: string;

  constructor(config: LLMProviderConfig) {
    this.config = config;
    this.name = config.provider;
  }

  /**
   * Get provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get model ID
   */
  getModel(): string {
    return this.config.model;
  }

  /**
   * Run inference
   */
  abstract inference(request: InferenceRequest): Promise<InferenceResult>;

  /**
   * Generate embeddings
   */
  abstract embed(text: string): Promise<number[]>;

  /**
   * Check if provider supports tool calling
   */
  abstract supportsTools(): boolean;

  /**
   * Convert tools to provider-specific format
   */
  protected abstract formatTools(tools: ToolDefinition[]): unknown;

  /**
   * Parse tool calls from provider response
   */
  protected abstract parseToolCalls(response: unknown): ToolCall[];

  /**
   * Build system prompt with context
   */
  protected buildSystemPrompt(request: InferenceRequest): string {
    let system = request.systemPrompt || '';

    if (request.context) {
      system += '\n\n## Context\n';
      system += `Agent DID: ${request.context.agentDid}\n`;
      system += `Mission: ${request.context.mission}\n`;
      system += `Timestamp: ${new Date(request.context.timestamp).toISOString()}\n`;

      if (request.context.memories.length > 0) {
        system += '\n### Relevant Memories\n';
        for (const mem of request.context.memories) {
          system += `- [${mem.type}] ${mem.summary}\n`;
        }
      }

      if (request.context.assets.length > 0) {
        system += '\n### Asset Context\n';
        for (const asset of request.context.assets) {
          system += `#### ${asset.name} (${asset.tokenId.slice(0, 10)}...)\n`;
          system += `- Level: ${asset.state.level}, XP: ${asset.state.xp}, Rarity: ${asset.state.rarity}\n`;
          system += `- Mass: ${asset.physics.massKg}kg, Durability: ${asset.physics.durability}%\n`;
        }
      }

      if (request.context.availableTools.length > 0) {
        system += '\n### Available Tools\n';
        for (const tool of request.context.availableTools) {
          system += `- ${tool}\n`;
        }
      }
    }

    return system;
  }
}

/**
 * Provider factory
 */
export type ProviderFactory = (config: LLMProviderConfig) => LLMProvider;

/**
 * Provider registry
 */
export const providerRegistry = new Map<string, ProviderFactory>();

/**
 * Register a provider
 */
export function registerProvider(name: string, factory: ProviderFactory): void {
  providerRegistry.set(name, factory);
}

/**
 * Create a provider instance
 */
export function createProvider(config: LLMProviderConfig): LLMProvider {
  const factory = providerRegistry.get(config.provider);
  if (!factory) {
    throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
  return factory(config);
}
