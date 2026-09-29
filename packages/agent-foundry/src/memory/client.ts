/**
 * Memory Client
 * 
 * Client for the Vector-State Kernel - persistent on-chain agent memory.
 */

import axios from 'axios';
import type { MemoryEntry, MemorySearchOptions, MemoryType } from '../types';
import { LLMProvider } from '../providers/base';

/**
 * Memory client configuration
 */
export interface MemoryClientConfig {
  /** RPC endpoint */
  rpcEndpoint: string;
  /** Agent DID */
  agentDid: string;
  /** LLM provider for embeddings */
  llmProvider?: LLMProvider;
  /** Session token for authentication */
  sessionToken?: string;
}

/**
 * Memory Client for Vector-State Kernel
 */
export class MemoryClient {
  private config: MemoryClientConfig;
  private localCache: Map<string, MemoryEntry> = new Map();

  constructor(config: MemoryClientConfig) {
    this.config = config;
  }

  /**
   * Store a memory
   */
  async store(
    content: string,
    type: MemoryType,
    options?: {
      importance?: number;
      tags?: string[];
      assetContext?: string[];
    }
  ): Promise<MemoryEntry> {
    // Generate embedding if provider available
    let embedding: number[] | undefined;
    if (this.config.llmProvider) {
      try {
        embedding = await this.config.llmProvider.embed(content);
      } catch (e) {
        console.warn('Failed to generate embedding:', e);
      }
    }

    // Generate summary (first 100 chars or LLM-generated)
    const summary = content.length <= 100 ? content : content.slice(0, 97) + '...';

    const memory: Omit<MemoryEntry, 'id' | 'createdAt' | 'accessCount'> = {
      type,
      content,
      summary,
      embedding,
      assetContext: options?.assetContext,
      tags: options?.tags || [],
      importance: options?.importance ?? 50,
    };

    try {
      const response = await this.rpc('agent_storeMemory', {
        agentDid: this.config.agentDid,
        memory,
      });

      const stored: MemoryEntry = {
        id: response.memoryId,
        ...memory,
        createdAt: Date.now(),
        accessCount: 0,
      };

      // Cache locally
      this.localCache.set(stored.id, stored);

      return stored;
    } catch (error) {
      // Fallback to local-only storage
      const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const stored: MemoryEntry = {
        id: localId,
        ...memory,
        createdAt: Date.now(),
        accessCount: 0,
      };
      this.localCache.set(stored.id, stored);
      return stored;
    }
  }

  /**
   * Search memories by similarity
   */
  async search(options: MemorySearchOptions): Promise<MemoryEntry[]> {
    // Generate query embedding
    let queryEmbedding = options.embedding;
    if (!queryEmbedding && this.config.llmProvider) {
      try {
        queryEmbedding = await this.config.llmProvider.embed(options.query);
      } catch (e) {
        console.warn('Failed to generate query embedding:', e);
      }
    }

    try {
      const response = await this.rpc('agent_searchMemory', {
        agentDid: this.config.agentDid,
        query: options.query,
        embedding: queryEmbedding,
        type: options.type,
        tags: options.tags,
        limit: options.limit || 5,
        minSimilarity: options.minSimilarity,
      });

      const memories = response.memories as MemoryEntry[];

      // Update local cache
      for (const mem of memories) {
        this.localCache.set(mem.id, mem);
      }

      return memories;
    } catch (error) {
      // Fallback to local search
      return this.localSearch(options, queryEmbedding);
    }
  }

  /**
   * Get memory by ID
   */
  async get(memoryId: string): Promise<MemoryEntry | null> {
    // Check cache first
    if (this.localCache.has(memoryId)) {
      return this.localCache.get(memoryId)!;
    }

    try {
      const response = await this.rpc('agent_getMemory', {
        agentDid: this.config.agentDid,
        memoryId,
      });

      if (response.memory) {
        this.localCache.set(memoryId, response.memory);
        return response.memory;
      }
    } catch (error) {
      console.warn('Failed to fetch memory:', error);
    }

    return null;
  }

  /**
   * Get memories by type
   */
  async getByType(type: MemoryType, limit = 10): Promise<MemoryEntry[]> {
    try {
      const response = await this.rpc('agent_getMemoriesByType', {
        agentDid: this.config.agentDid,
        type,
        limit,
      });

      return response.memories as MemoryEntry[];
    } catch (error) {
      // Fallback to local
      return Array.from(this.localCache.values())
        .filter(m => m.type === type)
        .slice(0, limit);
    }
  }

  /**
   * Get working memory (short-term context)
   */
  async getWorkingMemory(): Promise<MemoryEntry[]> {
    return this.getByType('working', 20);
  }

  /**
   * Clear working memory
   */
  async clearWorkingMemory(): Promise<void> {
    try {
      await this.rpc('agent_clearWorkingMemory', {
        agentDid: this.config.agentDid,
      });
    } catch (error) {
      // Clear local working memory
      for (const [id, mem] of this.localCache) {
        if (mem.type === 'working') {
          this.localCache.delete(id);
        }
      }
    }
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<{
    total: number;
    episodic: number;
    semantic: number;
    procedural: number;
    working: number;
  }> {
    try {
      const response = await this.rpc('agent_getMemoryStats', {
        agentDid: this.config.agentDid,
      });
      return response;
    } catch (error) {
      // Calculate from local cache
      const stats = { total: 0, episodic: 0, semantic: 0, procedural: 0, working: 0 };
      for (const mem of this.localCache.values()) {
        stats.total++;
        stats[mem.type]++;
      }
      return stats;
    }
  }

  /**
   * Local similarity search (fallback)
   */
  private localSearch(options: MemorySearchOptions, queryEmbedding?: number[]): MemoryEntry[] {
    let memories = Array.from(this.localCache.values());

    // Filter by type
    if (options.type) {
      memories = memories.filter(m => m.type === options.type);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      memories = memories.filter(m => 
        options.tags!.some(tag => m.tags.includes(tag))
      );
    }

    // Sort by similarity if embeddings available
    if (queryEmbedding) {
      memories = memories
        .map(m => ({
          memory: m,
          similarity: m.embedding 
            ? this.cosineSimilarity(queryEmbedding, m.embedding)
            : 0,
        }))
        .filter(({ similarity }) => similarity >= (options.minSimilarity || 0))
        .sort((a, b) => b.similarity - a.similarity)
        .map(({ memory }) => memory);
    } else {
      // Fallback to text matching
      const queryLower = options.query.toLowerCase();
      memories = memories
        .filter(m => 
          m.content.toLowerCase().includes(queryLower) ||
          m.summary.toLowerCase().includes(queryLower)
        )
        .sort((a, b) => b.importance - a.importance);
    }

    return memories.slice(0, options.limit || 5);
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Make RPC call
   */
  private async rpc(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await axios.post(
      this.config.rpcEndpoint,
      {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.sessionToken && {
            Authorization: `Bearer ${this.config.sessionToken}`,
          }),
        },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    return response.data.result;
  }
}
