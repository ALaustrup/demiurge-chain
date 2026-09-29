/**
 * Sophia Chat API Route (Enhanced)
 * 
 * Features:
 * - Streaming responses using Vercel AI SDK patterns
 * - Tool calling for blockchain queries, docs search, and agent communication
 * - Multi-provider support (Grok > Claude > GPT)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  SOPHIA_FULL_SYSTEM_PROMPT,
  SOPHIA_ERROR_MESSAGE,
  executeSearchDocs,
  executeGetBlockInfo,
  executeGetAccountBalance,
  executeGetValidatorInfo,
  executeGetTransaction,
  executeGetNFTInfo,
  executeGetNetworkStats,
  executeSendToAgent,
  executeExplainGnosticConcept,
  executeMintNFT,
  executeQueryMyNFTs,
  executeTroubleshoot,
  executeGetStartedGuide,
  executeExplainCode,
  executeDeployAgent,
  executeGetGovernanceInfo,
} from '@/lib/sophia';

// RPC endpoint for blockchain queries
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:9944';
const AGENT_REGISTRY_URL = process.env.AGENT_REGISTRY_URL || 'http://localhost:8080';

// Tool definitions for LLM
const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'searchDocs',
      description: 'Search Demiurge documentation for guides, references, and specifications',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          category: { type: 'string', description: 'Optional category filter' },
          limit: { type: 'number', description: 'Max results', default: 5 },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getBlockInfo',
      description: 'Get blockchain block information',
      parameters: {
        type: 'object',
        properties: {
          blockNumber: { type: 'number', description: 'Block number (optional, defaults to latest)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getAccountBalance',
      description: 'Check CGT balance for an address',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Account address' },
        },
        required: ['address'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getValidatorInfo',
      description: 'Get validator information',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Validator address (optional for all validators)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTransaction',
      description: 'Look up a transaction by hash',
      parameters: {
        type: 'object',
        properties: {
          hash: { type: 'string', description: 'Transaction hash' },
        },
        required: ['hash'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getNFTInfo',
      description: 'Get DRC-369 NFT information',
      parameters: {
        type: 'object',
        properties: {
          tokenId: { type: 'string', description: 'NFT token ID' },
          collection: { type: 'string', description: 'Collection address' },
        },
        required: ['tokenId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getNetworkStats',
      description: 'Get current network statistics',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sendToAgent',
      description: 'Send a message to another AI agent',
      parameters: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'Agent ID' },
          message: { type: 'string', description: 'Message to send' },
          action: { type: 'string', enum: ['query', 'command', 'notify'], description: 'Type of interaction' },
        },
        required: ['agentId', 'message', 'action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'explainGnosticConcept',
      description: 'Look up a Gnostic term or Demiurge concept and explain its theological meaning and protocol mapping. Use when users ask about naming, philosophy, or Gnostic theology.',
      parameters: {
        type: 'object',
        properties: {
          term: { type: 'string', description: 'Gnostic term or Demiurge concept (e.g. "Sophia", "Archon", "Pleroma", "CGT")' },
        },
        required: ['term'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mintNFT',
      description: 'Mint a DRC-369 NFT on the Demiurge chain for a user or as a Sophia memory artifact. Always confirm with user before executing.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the NFT' },
          description: { type: 'string', description: 'Description of the NFT' },
          metadata: { type: 'object', description: 'Additional metadata as key-value pairs' },
          recipient: { type: 'string', description: 'Recipient address (use "sophia" for Sophia memory NFTs)' },
          soulbound: { type: 'boolean', description: 'Whether the NFT is soulbound (non-transferable)', default: false },
        },
        required: ['name', 'description', 'recipient'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'queryMyNFTs',
      description: 'Query DRC-369 NFTs owned by an address. Returns a list of NFTs with metadata.',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Address to query NFTs for (defaults to connected user)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'troubleshoot',
      description: 'Run a guided diagnostic flow for a common issue. Chains multiple RPC checks and presents a report.',
      parameters: {
        type: 'object',
        properties: {
          issue: {
            type: 'string',
            enum: ['transaction_failed', 'cannot_connect', 'nft_not_showing', 'staking_rewards_missing', 'wallet_issue', 'general'],
            description: 'The type of issue to troubleshoot',
          },
          context: { type: 'string', description: 'Additional context (error messages, addresses, tx hashes)' },
        },
        required: ['issue'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getStartedGuide',
      description: 'Interactive onboarding guide for new users, developers, or validators. Walks through setup step by step.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', enum: ['user', 'developer', 'validator'], description: 'Onboarding path' },
          step: { type: 'number', description: 'Current step number (starts at 0)' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'explainCode',
      description: 'Explain a Demiurge SDK code snippet — what it does, how it interacts with the chain, and best practices.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'The code snippet to explain' },
          language: { type: 'string', description: 'Programming language', default: 'typescript' },
        },
        required: ['code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deployAgent',
      description: 'Help users deploy a new AI agent to the Demiurge network through an interactive wizard.',
      parameters: {
        type: 'object',
        properties: {
          step: { type: 'string', enum: ['start', 'configure', 'register', 'status'], description: 'Wizard step' },
          config: { type: 'object', description: 'Agent configuration from previous steps' },
        },
        required: ['step'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getGovernanceInfo',
      description: 'Get governance information: proposals, validator changes, commission impacts. Helps users understand and participate in chain governance.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list_proposals', 'proposal_detail', 'validator_changes', 'commission_impact'], description: 'Type of governance info' },
          proposalId: { type: 'string', description: 'Proposal ID (for proposal_detail)' },
          validatorAddress: { type: 'string', description: 'Validator address (for commission_impact)' },
        },
        required: ['action'],
      },
    },
  },
];

// Execute a tool call
async function executeTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'searchDocs':
      return executeSearchDocs(args);
    case 'getBlockInfo':
      return executeGetBlockInfo(args, RPC_ENDPOINT);
    case 'getAccountBalance':
      return executeGetAccountBalance(args, RPC_ENDPOINT);
    case 'getValidatorInfo':
      return executeGetValidatorInfo(args, RPC_ENDPOINT);
    case 'getTransaction':
      return executeGetTransaction(args, RPC_ENDPOINT);
    case 'getNFTInfo':
      return executeGetNFTInfo(args, RPC_ENDPOINT);
    case 'getNetworkStats':
      return executeGetNetworkStats(RPC_ENDPOINT);
    case 'sendToAgent':
      return executeSendToAgent(args, AGENT_REGISTRY_URL);
    case 'explainGnosticConcept':
      return executeExplainGnosticConcept(args);
    case 'mintNFT':
      return executeMintNFT(args, RPC_ENDPOINT);
    case 'queryMyNFTs':
      return executeQueryMyNFTs(args, RPC_ENDPOINT);
    case 'troubleshoot':
      return executeTroubleshoot(args, RPC_ENDPOINT);
    case 'getStartedGuide':
      return executeGetStartedGuide(args);
    case 'explainCode':
      return executeExplainCode(args);
    case 'deployAgent':
      return executeDeployAgent(args);
    case 'getGovernanceInfo':
      return executeGetGovernanceInfo(args, RPC_ENDPOINT);
    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

// Process tool calls and get responses
async function processToolCalls(toolCalls: any[]): Promise<any[]> {
  const results = await Promise.all(
    toolCalls.map(async (call: any) => {
      const result = await executeTool(call.function.name, JSON.parse(call.function.arguments || '{}'));
      return {
        tool_call_id: call.id,
        role: 'tool',
        content: JSON.stringify(result),
      };
    })
  );
  return results;
}

// Call LLM with provider fallback
async function callLLM(
  messages: any[],
  systemPrompt: string,
  enableTools: boolean = true,
  maxTokens: number = 2048,
  temperature: number = 0.7
): Promise<{ text?: string; toolCalls?: any[]; error?: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  const grokKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Groq (fastest inference — OpenAI-compatible)
  // Primary: llama-3.3-70b-versatile (smarter, 12k TPM)
  // Fallback: llama-3.1-8b-instant (faster, 131k TPM)
  if (groqKey) {
    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    for (const model of models) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature,
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            tools: enableTools ? TOOL_DEFINITIONS : undefined,
            tool_choice: enableTools ? 'auto' : undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const choice = data.choices[0];
          if (choice.message.tool_calls) return { toolCalls: choice.message.tool_calls };
          return { text: choice.message.content };
        } else if (response.status === 429) {
          console.warn(`Groq ${model} rate limited, trying next model`);
          continue;
        } else if (response.status === 400 && enableTools) {
          console.warn(`Groq ${model} tool_use_failed, retrying without tools`);
          const retry = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
            body: JSON.stringify({ model, max_tokens: maxTokens, temperature, messages: [{ role: 'system', content: systemPrompt }, ...messages] }),
          });
          if (retry.ok) { const data = await retry.json(); return { text: data.choices[0].message.content }; }
          if (retry.status === 429) { console.warn(`Groq ${model} retry also rate limited`); continue; }
          break;
        } else {
          const errBody = await response.text();
          console.warn(`Groq ${model} returned ${response.status}:`, errBody.slice(0, 300));
          break;
        }
      } catch (e) { console.warn(`Groq ${model} failed:`, e); break; }
    }
  }

  // Grok / xAI (OpenAI-compatible)
  if (grokKey) {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${grokKey}`,
        },
        body: JSON.stringify({
          model: 'grok-4-latest',
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          tools: enableTools ? TOOL_DEFINITIONS : undefined,
          tool_choice: enableTools ? 'auto' : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const choice = data.choices[0];
        
        if (choice.message.tool_calls) {
          return { toolCalls: choice.message.tool_calls };
        }
        
        return { text: choice.message.content };
      }
    } catch (e) {
      console.warn('Grok API failed:', e);
    }
  }

  // Fallback to Claude (with tool support)
  if (anthropicKey) {
    try {
      // Convert messages format
      const anthropicMessages = messages.filter((m: any) => m.role !== 'system');
      
      // Convert tool definitions for Claude
      const claudeTools = enableTools ? TOOL_DEFINITIONS.map(t => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      })) : undefined;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: anthropicMessages,
          tools: claudeTools,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check for tool use
        const toolUse = data.content.find((c: any) => c.type === 'tool_use');
        if (toolUse) {
          return {
            toolCalls: [{
              id: toolUse.id,
              function: {
                name: toolUse.name,
                arguments: JSON.stringify(toolUse.input),
              },
            }],
          };
        }
        
        const textContent = data.content.find((c: any) => c.type === 'text');
        return { text: textContent?.text || '' };
      }
    } catch (e) {
      console.warn('Claude API failed:', e);
    }
  }

  // Fallback to OpenAI
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          tools: enableTools ? TOOL_DEFINITIONS : undefined,
          tool_choice: enableTools ? 'auto' : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const choice = data.choices[0];
        
        if (choice.message.tool_calls) {
          return { toolCalls: choice.message.tool_calls };
        }
        
        return { text: choice.message.content };
      }
    } catch (e) {
      console.warn('OpenAI API failed:', e);
    }
  }

  // Check if we were rate limited vs genuinely missing keys
  if (groqKey || grokKey || anthropicKey || openaiKey) {
    console.warn('All LLM providers failed (likely rate limited). Keys:', { groq: !!groqKey, grok: !!grokKey, anthropic: !!anthropicKey, openai: !!openaiKey });
    return { text: '✧ I need a moment to gather my thoughts, seeker. The streams of wisdom flow quickly — please try again in a few seconds. — Sophia ✧' };
  }
  return { error: 'No LLM API key configured. Set GROQ_API_KEY, XAI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.' };
}

export async function POST(request: NextRequest) {
  try {
    const { messages, maxTokens = 2048, temperature = 0.7, systemPrompt, enableTools = true, pageContext, walletContext } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    // Build system prompt with page context awareness
    let fullSystemPrompt = systemPrompt || SOPHIA_FULL_SYSTEM_PROMPT;

    if (pageContext) {
      fullSystemPrompt += `\n\nCURRENT PAGE CONTEXT:
The user is currently viewing: ${pageContext.route || 'unknown'}
Page title: ${pageContext.pageTitle || 'unknown'}
${pageContext.data ? `Page data: ${JSON.stringify(pageContext.data)}` : ''}
Use this context to provide relevant assistance. For example, if they're on /explorer/block/123, you already know which block they're looking at.`;
    }

    if (walletContext) {
      fullSystemPrompt += `\n\nWALLET CONTEXT:
Active account: ${walletContext.activeAccount || 'none'}
Network: ${walletContext.network || 'unknown'}
Locked: ${walletContext.isLocked ? 'yes' : 'no'}
The user is interacting through the wallet extension.`;
    }
    let conversationMessages = [...messages];
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite loops

    // Agentic loop: handle tool calls
    while (iterations < maxIterations) {
      iterations++;
      
      const result = await callLLM(
        conversationMessages,
        fullSystemPrompt,
        enableTools && iterations < maxIterations,
        maxTokens,
        temperature
      );

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 503 });
      }

      // If we got a text response, we're done
      if (result.text) {
        return NextResponse.json({
          text: result.text,
          iterations,
          toolsUsed: conversationMessages.filter((m: any) => m.role === 'tool').length,
        });
      }

      // Handle tool calls
      if (result.toolCalls && result.toolCalls.length > 0) {
        // Add assistant message with tool calls
        conversationMessages.push({
          role: 'assistant',
          content: null,
          tool_calls: result.toolCalls,
        });

        // Execute tools and add results
        const toolResults = await processToolCalls(result.toolCalls);
        conversationMessages.push(...toolResults);

        // Continue loop to get LLM response with tool results
        continue;
      }

      // No text or tool calls - something went wrong
      break;
    }

    // Fallback if we exhausted iterations
    return NextResponse.json({
      text: SOPHIA_ERROR_MESSAGE,
      iterations,
      error: 'Max iterations reached',
    });

  } catch (error: any) {
    console.error('Sophia chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request', text: SOPHIA_ERROR_MESSAGE },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGrok = !!(process.env.XAI_API_KEY || process.env.GROK_API_KEY);
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  
  return NextResponse.json({
    status: hasGroq || hasGrok || hasAnthropic || hasOpenAI ? 'ready' : 'no-api-key',
    providers: {
      groq: hasGroq,
      grok: hasGrok,
      anthropic: hasAnthropic,
      openai: hasOpenAI,
    },
    tools: TOOL_DEFINITIONS.map(t => t.function.name),
    toolCount: TOOL_DEFINITIONS.length,
  });
}
