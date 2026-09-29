/**
 * Sophia AI Tool Definitions
 * Tools that Sophia can use to interact with the Demiurge ecosystem
 */

import { z } from 'zod';

// Tool result types
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL SCHEMAS - Define parameters for each tool
// ═══════════════════════════════════════════════════════════════════════════════

export const searchDocsSchema = z.object({
  query: z.string().describe('Search query for documentation'),
  category: z.string().optional().describe('Optional category filter: getting-started, developers, sdk, validators, specifications, architecture, deployment, troubleshooting'),
  limit: z.number().optional().default(5).describe('Maximum number of results'),
});

export const getBlockInfoSchema = z.object({
  blockNumber: z.number().optional().describe('Block number to fetch. If not provided, returns latest block'),
});

export const getAccountBalanceSchema = z.object({
  address: z.string().describe('Account address to check balance for'),
});

export const getValidatorInfoSchema = z.object({
  address: z.string().optional().describe('Validator address. If not provided, returns all active validators'),
});

export const getTransactionSchema = z.object({
  hash: z.string().describe('Transaction hash to look up'),
});

export const sendToAgentSchema = z.object({
  agentId: z.string().describe('The ID of the agent to communicate with'),
  message: z.string().describe('Message to send to the agent'),
  action: z.enum(['query', 'command', 'notify']).describe('Type of interaction'),
});

export const getNFTInfoSchema = z.object({
  tokenId: z.string().describe('NFT token ID'),
  collection: z.string().optional().describe('Collection address'),
});

export const getNetworkStatsSchema = z.object({});

export const explainGnosticConceptSchema = z.object({
  term: z.string().describe('The Gnostic term or Demiurge concept to explain (e.g. "Sophia", "Archon", "Pleroma", "CGT")'),
});

export const mintNFTSchema = z.object({
  name: z.string().describe('Name of the NFT'),
  description: z.string().describe('Description of the NFT'),
  metadata: z.record(z.any()).optional().describe('Additional metadata as key-value pairs'),
  recipient: z.string().describe('Recipient address (use "sophia" for Sophia memory NFTs)'),
  soulbound: z.boolean().optional().default(false).describe('Whether the NFT is soulbound (non-transferable)'),
});

export const queryMyNFTsSchema = z.object({
  address: z.string().optional().describe('Address to query NFTs for. Defaults to connected user.'),
});

export const troubleshootSchema = z.object({
  issue: z.enum([
    'transaction_failed',
    'cannot_connect',
    'nft_not_showing',
    'staking_rewards_missing',
    'wallet_issue',
    'general',
  ]).describe('The type of issue to troubleshoot'),
  context: z.string().optional().describe('Additional context about the issue (error message, address, tx hash, etc.)'),
});

export const getStartedGuideSchema = z.object({
  path: z.enum(['user', 'developer', 'validator']).describe('The onboarding path to follow'),
  step: z.number().optional().describe('Current step in the guide (starts at 0)'),
});

export const explainCodeSchema = z.object({
  code: z.string().describe('The Demiurge SDK code snippet to explain'),
  language: z.string().optional().default('typescript').describe('Programming language of the snippet'),
});

export const deployAgentSchema = z.object({
  step: z.enum(['start', 'configure', 'register', 'status']).describe('Current step in the agent deployment wizard'),
  config: z.record(z.any()).optional().describe('Agent configuration from previous steps'),
});

export const getGovernanceInfoSchema = z.object({
  action: z.enum(['list_proposals', 'proposal_detail', 'validator_changes', 'commission_impact']).describe('Type of governance information to retrieve'),
  proposalId: z.string().optional().describe('Specific proposal ID (for proposal_detail)'),
  validatorAddress: z.string().optional().describe('Validator address (for commission_impact)'),
});

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS - Describe what each tool does
// ═══════════════════════════════════════════════════════════════════════════════

export const sophiaTools = {
  searchDocs: {
    name: 'searchDocs',
    description: 'Search the Demiurge documentation for guides, references, and specifications. Use this when users ask questions about how to use Demiurge, SDK, validators, or technical details.',
    parameters: searchDocsSchema,
  },
  
  getBlockInfo: {
    name: 'getBlockInfo',
    description: 'Get information about a specific block or the latest block on the Demiurge chain. Includes block hash, transactions, validator, and timestamp.',
    parameters: getBlockInfoSchema,
  },
  
  getAccountBalance: {
    name: 'getAccountBalance',
    description: 'Check the CGT balance and energy allocation for any account address on the Demiurge chain.',
    parameters: getAccountBalanceSchema,
  },
  
  getValidatorInfo: {
    name: 'getValidatorInfo',
    description: 'Get information about validators including their stake, commission, status, and performance metrics.',
    parameters: getValidatorInfoSchema,
  },
  
  getTransaction: {
    name: 'getTransaction',
    description: 'Look up a transaction by its hash. Returns transaction details, status, and block inclusion.',
    parameters: getTransactionSchema,
  },
  
  sendToAgent: {
    name: 'sendToAgent',
    description: 'Communicate with a registered AI agent on the Demiurge network. Use this to delegate tasks or query specialized agents.',
    parameters: sendToAgentSchema,
  },
  
  getNFTInfo: {
    name: 'getNFTInfo',
    description: 'Get information about a DRC-369 NFT including metadata, physics properties, composability data, and ownership.',
    parameters: getNFTInfoSchema,
  },
  
  getNetworkStats: {
    name: 'getNetworkStats',
    description: 'Get current network statistics including TPS, active validators, total staked, and network health.',
    parameters: getNetworkStatsSchema,
  },

  explainGnosticConcept: {
    name: 'explainGnosticConcept',
    description: 'Look up a Gnostic term or Demiurge-Cloud concept and explain both its theological meaning and its mapping to the protocol. Use this when users ask about naming conventions or Gnostic philosophy.',
    parameters: explainGnosticConceptSchema,
  },

  mintNFT: {
    name: 'mintNFT',
    description: 'Mint a DRC-369 NFT on the Demiurge chain. Can mint for users or as a Sophia memory artifact. Always confirm with the user before executing.',
    parameters: mintNFTSchema,
  },

  queryMyNFTs: {
    name: 'queryMyNFTs',
    description: 'Query DRC-369 NFTs owned by an address. Returns a list of NFTs with metadata, XP, and level.',
    parameters: queryMyNFTsSchema,
  },

  troubleshoot: {
    name: 'troubleshoot',
    description: 'Run a guided diagnostic flow for a common issue. Chains multiple checks and presents a structured report with actionable fixes.',
    parameters: troubleshootSchema,
  },

  getStartedGuide: {
    name: 'getStartedGuide',
    description: 'Interactive onboarding guide for new users, developers, or validators. Walks through setup step by step.',
    parameters: getStartedGuideSchema,
  },

  explainCode: {
    name: 'explainCode',
    description: 'Explain a Demiurge SDK code snippet — what it does, how it interacts with the chain, and best practices.',
    parameters: explainCodeSchema,
  },

  deployAgent: {
    name: 'deployAgent',
    description: 'Help users deploy a new AI agent to the Demiurge network through an interactive wizard.',
    parameters: deployAgentSchema,
  },

  getGovernanceInfo: {
    name: 'getGovernanceInfo',
    description: 'Get governance information: proposals, validator changes, commission impacts. Helps users understand and participate in chain governance.',
    parameters: getGovernanceInfoSchema,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL HANDLERS - Execute the tools
// ═══════════════════════════════════════════════════════════════════════════════

import { searchDocs as searchDocsIndex, docsIndex } from '@/lib/docs';

export async function executeSearchDocs(params: z.infer<typeof searchDocsSchema>): Promise<ToolResult> {
  try {
    let results = searchDocsIndex(params.query);
    
    if (params.category) {
      results = results.filter(r => 
        r.category.toLowerCase().includes(params.category!.toLowerCase())
      );
    }
    
    results = results.slice(0, params.limit || 5);
    
    return {
      success: true,
      data: {
        count: results.length,
        results: results.map(r => ({
          title: r.title,
          description: r.description,
          category: r.category,
          url: r.href,
        })),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetBlockInfo(
  params: z.infer<typeof getBlockInfoSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const method = params.blockNumber 
      ? 'chain_getBlockByNumber' 
      : 'chain_getLatestBlock';
    
    const rpcParams = params.blockNumber ? [params.blockNumber] : [];
    
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params: rpcParams,
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    return {
      success: true,
      data: {
        blockNumber: data.result?.number,
        hash: data.result?.hash,
        timestamp: data.result?.timestamp,
        validator: data.result?.author,
        transactions: data.result?.transactions?.length || 0,
        parentHash: data.result?.parentHash,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetAccountBalance(
  params: z.infer<typeof getAccountBalanceSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'chain_getBalance',
        params: [params.address],
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    // Also get energy info
    const energyResponse = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'energy_getEnergy',
        params: [params.address],
      }),
    });
    
    const energyData = await energyResponse.json();
    
    return {
      success: true,
      data: {
        address: params.address,
        balance: {
          free: data.result?.free,
          reserved: data.result?.reserved,
          total: data.result?.total,
        },
        energy: energyData.result || null,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetValidatorInfo(
  params: z.infer<typeof getValidatorInfoSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const method = params.address 
      ? 'consensus_getValidator'
      : 'consensus_getActiveValidators';
    
    const rpcParams = params.address ? [params.address] : [];
    
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params: rpcParams,
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    return {
      success: true,
      data: data.result,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetTransaction(
  params: z.infer<typeof getTransactionSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'chain_getTransaction',
        params: [params.hash],
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    return {
      success: true,
      data: data.result,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeSendToAgent(
  params: z.infer<typeof sendToAgentSchema>,
  baseUrl: string = ''
): Promise<ToolResult> {
  try {
    // Use local agent registry
    const { getAgent, sendMessage, createConversation, simulateAgentResponse } = await import('@/lib/agents');
    
    // Look up agent
    const agent = getAgent(params.agentId);
    
    if (!agent) {
      return { success: false, error: `Agent ${params.agentId} not found` };
    }
    
    if (agent.status === 'offline') {
      return { success: false, error: `Agent ${params.agentId} is currently offline` };
    }
    
    // Create conversation and send message
    const conversation = createConversation(['sophia', params.agentId]);
    
    const result = sendMessage({
      conversationId: conversation.id,
      from: 'sophia',
      to: params.agentId,
      action: params.action,
      priority: 'normal',
      content: {
        text: params.message,
      },
    });
    
    if (!result.success || !result.message) {
      return { success: false, error: result.error?.message || 'Failed to send message' };
    }
    
    // Get simulated response from agent
    const response = await simulateAgentResponse(result.message);
    
    return {
      success: true,
      data: {
        agentId: params.agentId,
        agentName: agent.name,
        agentDescription: agent.description,
        messageSent: params.message,
        response: response?.content.text || 'Agent did not respond',
        conversationId: conversation.id,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetNFTInfo(
  params: z.infer<typeof getNFTInfoSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'drc369_getNFT',
        params: [params.tokenId, params.collection],
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    return {
      success: true,
      data: data.result,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetNetworkStats(
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'system_health',
        params: [],
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    return {
      success: true,
      data: {
        connected: data.result?.peers > 0,
        peers: data.result?.peers,
        syncing: data.result?.isSyncing,
        shouldHavePeers: data.result?.shouldHavePeers,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEW TOOL HANDLERS - Gnostic, NFT, Troubleshooting, Onboarding, Code, Agent
// ═══════════════════════════════════════════════════════════════════════════════

import {
  lookupGnosticTerm,
  searchGnosticKnowledge,
  formatGnosticEntry,
  getGnosticGlossary,
} from './gnostic-knowledge';
import {
  runTroubleshootingFlow,
  type TroubleshootingIssue,
} from './troubleshooting';
import {
  getOnboardingStep,
  type OnboardingPath,
} from './onboarding';

export async function executeExplainGnosticConcept(
  params: z.infer<typeof explainGnosticConceptSchema>
): Promise<ToolResult> {
  try {
    // Try exact match first
    const entry = lookupGnosticTerm(params.term);

    if (entry) {
      return {
        success: true,
        data: {
          found: true,
          entry: {
            term: entry.term,
            definition: entry.definition,
            gnosticOrigin: entry.gnosticOrigin,
            protocolMapping: entry.protocolMapping,
            relatedTerms: entry.relatedTerms,
            deepDive: entry.deepDive || null,
          },
          formatted: formatGnosticEntry(entry),
        },
      };
    }

    // Try fuzzy search
    const results = searchGnosticKnowledge(params.term);

    if (results.length > 0) {
      return {
        success: true,
        data: {
          found: true,
          note: `No exact match for "${params.term}", but found related concepts:`,
          entries: results.map((r) => ({
            term: r.term,
            definition: r.definition,
            protocolMapping: r.protocolMapping,
          })),
        },
      };
    }

    // Nothing found — return glossary
    return {
      success: true,
      data: {
        found: false,
        note: `"${params.term}" is not in the Gnostic knowledge base. Here are all known terms:`,
        glossary: getGnosticGlossary(),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeMintNFT(
  params: z.infer<typeof mintNFTSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const nftMetadata = {
      name: params.name,
      description: params.description,
      ...(params.metadata || {}),
      mintedBy: 'sophia',
      mintedAt: new Date().toISOString(),
      soulbound: params.soulbound || false,
    };

    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'drc369_mint',
        params: [{
          to: params.recipient,
          metadata: nftMetadata,
          soulbound: params.soulbound || false,
        }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    return {
      success: true,
      data: {
        tokenId: data.result?.tokenId || data.result?.token_id,
        recipient: params.recipient,
        name: params.name,
        soulbound: params.soulbound || false,
        metadata: nftMetadata,
        txHash: data.result?.txHash || data.result?.hash,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeQueryMyNFTs(
  params: z.infer<typeof queryMyNFTsSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const address = params.address || 'connected_user';

    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'drc369_balanceOf',
        params: [address],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    return {
      success: true,
      data: {
        address,
        count: data.result?.count || 0,
        nfts: data.result?.tokens || [],
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeTroubleshoot(
  params: z.infer<typeof troubleshootSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const report = await runTroubleshootingFlow(
      params.issue as TroubleshootingIssue,
      rpcEndpoint,
      params.context
    );

    return {
      success: true,
      data: report,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetStartedGuide(
  params: z.infer<typeof getStartedGuideSchema>
): Promise<ToolResult> {
  try {
    const stepData = getOnboardingStep(
      params.path as OnboardingPath,
      params.step || 0
    );

    return {
      success: true,
      data: stepData,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeExplainCode(
  params: z.infer<typeof explainCodeSchema>
): Promise<ToolResult> {
  try {
    // Provide structural analysis for the LLM to use as context
    const codeLines = params.code.split('\n').length;
    const hasImports = /import\s+/.test(params.code);
    const hasDemiurgeSDK = /demiurge|DemiurgeSDK|@demiurge/.test(params.code);
    const hasRPC = /rpc|jsonrpc|fetch.*method/.test(params.code);
    const hasNFT = /nft|drc.?369|mint|token/i.test(params.code);
    const hasStaking = /stake|validator|consensus/i.test(params.code);
    const hasAgent = /agent|did:demiurge/i.test(params.code);

    const detectedFeatures: string[] = [];
    if (hasDemiurgeSDK) detectedFeatures.push('Demiurge SDK usage');
    if (hasRPC) detectedFeatures.push('RPC/JSON-RPC calls');
    if (hasNFT) detectedFeatures.push('DRC-369 NFT operations');
    if (hasStaking) detectedFeatures.push('Staking/validator operations');
    if (hasAgent) detectedFeatures.push('Agent/DID operations');

    return {
      success: true,
      data: {
        language: params.language,
        lineCount: codeLines,
        detectedFeatures,
        code: params.code,
        analysisHint: 'Use this structural analysis along with your knowledge of the Demiurge SDK to provide a comprehensive explanation.',
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeDeployAgent(
  params: z.infer<typeof deployAgentSchema>
): Promise<ToolResult> {
  try {
    switch (params.step) {
      case 'start':
        return {
          success: true,
          data: {
            step: 'start',
            title: '✧ Agent Deployment Wizard',
            description: 'Let\'s deploy a new AI agent to the Demiurge network.',
            fields: [
              { name: 'name', type: 'string', description: 'Agent name (e.g., "AnalyticsBot")', required: true },
              { name: 'description', type: 'string', description: 'What the agent does', required: true },
              { name: 'model', type: 'select', options: ['grok', 'claude', 'gpt-4', 'local'], description: 'LLM model to use', required: true },
              { name: 'capabilities', type: 'multiselect', options: ['read', 'analyze', 'create', 'execute', 'external_api'], description: 'Agent capabilities', required: true },
              { name: 'autonomy', type: 'select', options: ['full', 'bounded', 'supervised', 'minimal'], description: 'Autonomy level', required: true },
            ],
            nextStep: 'configure',
          },
        };

      case 'configure':
        return {
          success: true,
          data: {
            step: 'configure',
            title: '✧ Configure Agent Resources',
            config: params.config,
            fields: [
              { name: 'spendingLimit', type: 'number', description: 'Max CGT spending per day', required: true, default: 100 },
              { name: 'energyBudget', type: 'number', description: 'Max energy per transaction', required: true, default: 500 },
              { name: 'webhookUrl', type: 'string', description: 'Webhook URL for notifications', required: false },
            ],
            nextStep: 'register',
          },
        };

      case 'register':
        return {
          success: true,
          data: {
            step: 'register',
            title: '✧ Register Agent On-Chain',
            config: params.config,
            agentDID: `did:demiurge:agent:${params.config?.name?.toLowerCase().replace(/\s+/g, '-') || 'unnamed'}`,
            registrationEndpoint: '/api/agents/register',
            note: 'This will create an Agent DID and register the agent with the QOR Auth system. A wallet will be automatically generated for the agent.',
            nextStep: 'status',
          },
        };

      case 'status':
        return {
          success: true,
          data: {
            step: 'status',
            title: '✧ Agent Deployment Status',
            config: params.config,
            status: 'pending_registration',
            note: 'Once confirmed, the agent will be registered on-chain and ready to receive messages.',
          },
        };

      default:
        return { success: false, error: 'Unknown deployment step' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetGovernanceInfo(
  params: z.infer<typeof getGovernanceInfoSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    switch (params.action) {
      case 'list_proposals': {
        const response = await fetch(rpcEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'governance_listProposals',
            params: [],
          }),
        });
        const data = await response.json();
        return {
          success: true,
          data: {
            proposals: data.result || [],
            note: 'Governance proposals allow the community to vote on protocol changes.',
          },
        };
      }

      case 'proposal_detail': {
        if (!params.proposalId) {
          return { success: false, error: 'proposalId required for proposal_detail' };
        }
        const response = await fetch(rpcEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'governance_getProposal',
            params: [params.proposalId],
          }),
        });
        const data = await response.json();
        return { success: true, data: data.result || { error: 'Proposal not found' } };
      }

      case 'validator_changes': {
        const response = await fetch(rpcEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'consensus_getActiveValidators',
            params: [],
          }),
        });
        const data = await response.json();
        const validators = data.result || [];
        return {
          success: true,
          data: {
            activeCount: validators.length,
            validators: validators.map((v: any) => ({
              address: v.account || v.address,
              active: v.active !== false,
              commission: v.commission,
            })),
            note: 'Shows the current validator set. Changes to the set happen at era boundaries.',
          },
        };
      }

      case 'commission_impact': {
        if (!params.validatorAddress) {
          return { success: false, error: 'validatorAddress required for commission_impact' };
        }
        const response = await fetch(rpcEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'consensus_getValidatorInfo',
            params: [params.validatorAddress],
          }),
        });
        const data = await response.json();
        const info = data.result || {};
        const commission = Number(info.commission || 0);
        return {
          success: true,
          data: {
            validator: params.validatorAddress,
            commission: `${commission}%`,
            impact: `For every 100 CGT in nominator rewards, the validator keeps ${commission} CGT and nominators receive ${100 - commission} CGT.`,
            totalStake: info.total_stake || info.totalStake || 0,
            nominators: info.nominator_count || info.nominators || 0,
          },
        };
      }

      default:
        return { success: false, error: `Unknown governance action: ${params.action}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
