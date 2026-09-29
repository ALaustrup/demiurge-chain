/**
 * Built-in Tools for Demiurge Agents
 * 
 * Pre-defined tools for common blockchain operations.
 */

import type { ToolDefinition } from '../types';

/**
 * Create a tool for reading DRC-369 assets
 */
export function createReadAssetsTool(
  getAssets: (owner: string) => Promise<unknown[]>
): ToolDefinition {
  return {
    name: 'get_assets',
    description: 'Get all DRC-369 assets owned by an address. Returns array of asset objects with name, level, xp, rarity, physics properties, etc.',
    parameters: {
      owner: {
        type: 'string',
        description: 'Owner address (hex) or QOR ID handle',
      },
    },
    required: ['owner'],
    execute: async (params) => {
      const owner = params.owner as string;
      return await getAssets(owner);
    },
  };
}

/**
 * Create a tool for transferring CGT tokens
 */
export function createTransferCgtTool(
  transfer: (to: string, amount: string) => Promise<{ txHash: string }>
): ToolDefinition {
  return {
    name: 'transfer_cgt',
    description: 'Transfer CGT tokens to another address. Subject to spending limits.',
    parameters: {
      to: {
        type: 'string',
        description: 'Recipient address or QOR ID handle',
      },
      amount: {
        type: 'string',
        description: 'Amount to transfer (e.g., "100 CGT")',
      },
    },
    required: ['to', 'amount'],
    execute: async (params) => {
      const to = params.to as string;
      const amount = params.amount as string;
      return await transfer(to, amount);
    },
  };
}

/**
 * Create a tool for modifying asset XP
 */
export function createAddXpTool(
  addXp: (tokenId: string, amount: number) => Promise<{ txHash: string; newXp: number; newLevel: number }>
): ToolDefinition {
  return {
    name: 'add_asset_xp',
    description: 'Add XP to a DRC-369 asset. May trigger level up.',
    parameters: {
      tokenId: {
        type: 'string',
        description: 'Asset token ID (32 bytes hex)',
      },
      amount: {
        type: 'number',
        description: 'XP amount to add',
      },
    },
    required: ['tokenId', 'amount'],
    execute: async (params) => {
      const tokenId = params.tokenId as string;
      const amount = params.amount as number;
      return await addXp(tokenId, amount);
    },
  };
}

/**
 * Create a tool for storing memories
 */
export function createRememberTool(
  store: (content: string, type: string, importance: number, tags: string[]) => Promise<{ memoryId: string }>
): ToolDefinition {
  return {
    name: 'remember',
    description: 'Store information in long-term memory. Use for important facts, experiences, or learned patterns.',
    parameters: {
      content: {
        type: 'string',
        description: 'Content to remember',
      },
      type: {
        type: 'string',
        description: 'Memory type: episodic (events), semantic (facts), procedural (skills)',
        enum: ['episodic', 'semantic', 'procedural'],
      },
      importance: {
        type: 'number',
        description: 'Importance score (0-100)',
      },
      tags: {
        type: 'array',
        description: 'Tags for categorization',
        items: { type: 'string' },
      },
    },
    required: ['content', 'type'],
    execute: async (params) => {
      const content = params.content as string;
      const type = params.type as string;
      const importance = (params.importance as number) || 50;
      const tags = (params.tags as string[]) || [];
      return await store(content, type, importance, tags);
    },
  };
}

/**
 * Create a tool for recalling memories
 */
export function createRecallTool(
  search: (query: string, type?: string, limit?: number) => Promise<unknown[]>
): ToolDefinition {
  return {
    name: 'recall',
    description: 'Search your memory for relevant information. Uses semantic similarity.',
    parameters: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      type: {
        type: 'string',
        description: 'Filter by memory type',
        enum: ['episodic', 'semantic', 'procedural'],
      },
      limit: {
        type: 'number',
        description: 'Max results (default: 5)',
      },
    },
    required: ['query'],
    execute: async (params) => {
      const query = params.query as string;
      const type = params.type as string | undefined;
      const limit = params.limit as number | undefined;
      return await search(query, type, limit);
    },
  };
}

/**
 * Create a tool for getting chain status
 */
export function createChainStatusTool(
  getStatus: () => Promise<{ blockNumber: number; tps: number; epoch: number }>
): ToolDefinition {
  return {
    name: 'get_chain_status',
    description: 'Get current Demiurge chain status including block number and TPS.',
    parameters: {},
    execute: async () => {
      return await getStatus();
    },
  };
}

/**
 * Create a tool for resolving QOR IDs
 */
export function createResolveIdentityTool(
  resolve: (handle: string) => Promise<{ did: string; address: string; displayName: string }>
): ToolDefinition {
  return {
    name: 'resolve_identity',
    description: 'Resolve a QOR ID handle to DID and address.',
    parameters: {
      handle: {
        type: 'string',
        description: 'QOR ID handle (e.g., "alice" or "@alice.demiurge")',
      },
    },
    required: ['handle'],
    execute: async (params) => {
      const handle = params.handle as string;
      return await resolve(handle);
    },
  };
}

/**
 * Create a tool for external API calls (bounded agents)
 */
export function createHttpTool(
  allowedDomains: string[]
): ToolDefinition {
  return {
    name: 'http_request',
    description: `Make HTTP requests to allowed domains: ${allowedDomains.join(', ')}`,
    parameters: {
      url: {
        type: 'string',
        description: 'URL to request',
      },
      method: {
        type: 'string',
        description: 'HTTP method',
        enum: ['GET', 'POST'],
      },
      body: {
        type: 'string',
        description: 'Request body (for POST)',
      },
    },
    required: ['url', 'method'],
    execute: async (params) => {
      const url = params.url as string;
      const method = params.method as string;
      const body = params.body as string | undefined;

      // Validate domain
      const urlObj = new URL(url);
      if (!allowedDomains.some(d => urlObj.hostname.endsWith(d))) {
        throw new Error(`Domain not allowed: ${urlObj.hostname}`);
      }

      const response = await fetch(url, {
        method,
        body: method === 'POST' ? body : undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return {
        status: response.status,
        data: await response.text(),
      };
    },
  };
}

/**
 * Create the standard tool set
 */
export interface StandardToolsConfig {
  getAssets: (owner: string) => Promise<unknown[]>;
  transferCgt: (to: string, amount: string) => Promise<{ txHash: string }>;
  addXp: (tokenId: string, amount: number) => Promise<{ txHash: string; newXp: number; newLevel: number }>;
  storeMemory: (content: string, type: string, importance: number, tags: string[]) => Promise<{ memoryId: string }>;
  searchMemory: (query: string, type?: string, limit?: number) => Promise<unknown[]>;
  getChainStatus: () => Promise<{ blockNumber: number; tps: number; epoch: number }>;
  resolveIdentity: (handle: string) => Promise<{ did: string; address: string; displayName: string }>;
  allowedHttpDomains?: string[];
}

export function createStandardTools(config: StandardToolsConfig): ToolDefinition[] {
  const tools: ToolDefinition[] = [
    createReadAssetsTool(config.getAssets),
    createTransferCgtTool(config.transferCgt),
    createAddXpTool(config.addXp),
    createRememberTool(config.storeMemory),
    createRecallTool(config.searchMemory),
    createChainStatusTool(config.getChainStatus),
    createResolveIdentityTool(config.resolveIdentity),
  ];

  if (config.allowedHttpDomains && config.allowedHttpDomains.length > 0) {
    tools.push(createHttpTool(config.allowedHttpDomains));
  }

  return tools;
}
