/**
 * Sophia Chat Streaming API Route
 *
 * Server-Sent Events (SSE) streaming for real-time token output.
 * Uses the same tool infrastructure as the non-streaming route but
 * delivers the final LLM response as a stream of text chunks.
 *
 * Protocol:
 *   event: token     - A text chunk (data field contains the text)
 *   event: tool_call - A tool was invoked (data field is JSON with name/result)
 *   event: done      - Stream is complete (data field is JSON with metadata)
 *   event: error     - An error occurred (data field is JSON with message)
 */

import { NextRequest } from 'next/server';
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

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:9944';
const AGENT_REGISTRY_URL = process.env.AGENT_REGISTRY_URL || 'http://localhost:8080';

// Tool definitions (same as non-streaming route)
const TOOL_DEFINITIONS = [
  { type: 'function', function: { name: 'searchDocs', description: 'Search Demiurge documentation', parameters: { type: 'object', properties: { query: { type: 'string' }, category: { type: 'string' }, limit: { type: 'number', default: 5 } }, required: ['query'] } } },
  { type: 'function', function: { name: 'getBlockInfo', description: 'Get blockchain block information', parameters: { type: 'object', properties: { blockNumber: { type: 'number' } } } } },
  { type: 'function', function: { name: 'getAccountBalance', description: 'Check CGT balance', parameters: { type: 'object', properties: { address: { type: 'string' } }, required: ['address'] } } },
  { type: 'function', function: { name: 'getValidatorInfo', description: 'Get validator information', parameters: { type: 'object', properties: { address: { type: 'string' } } } } },
  { type: 'function', function: { name: 'getTransaction', description: 'Look up transaction by hash', parameters: { type: 'object', properties: { hash: { type: 'string' } }, required: ['hash'] } } },
  { type: 'function', function: { name: 'getNFTInfo', description: 'Get DRC-369 NFT info', parameters: { type: 'object', properties: { tokenId: { type: 'string' }, collection: { type: 'string' } }, required: ['tokenId'] } } },
  { type: 'function', function: { name: 'getNetworkStats', description: 'Get network stats', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'sendToAgent', description: 'Send message to AI agent', parameters: { type: 'object', properties: { agentId: { type: 'string' }, message: { type: 'string' }, action: { type: 'string', enum: ['query', 'command', 'notify'] } }, required: ['agentId', 'message', 'action'] } } },
  { type: 'function', function: { name: 'explainGnosticConcept', description: 'Explain a Gnostic term and its protocol mapping', parameters: { type: 'object', properties: { term: { type: 'string' } }, required: ['term'] } } },
  { type: 'function', function: { name: 'mintNFT', description: 'Mint a DRC-369 NFT', parameters: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, metadata: { type: 'object' }, recipient: { type: 'string' }, soulbound: { type: 'boolean', default: false } }, required: ['name', 'description', 'recipient'] } } },
  { type: 'function', function: { name: 'queryMyNFTs', description: 'Query NFTs owned by address', parameters: { type: 'object', properties: { address: { type: 'string' } } } } },
  { type: 'function', function: { name: 'troubleshoot', description: 'Run diagnostic flow', parameters: { type: 'object', properties: { issue: { type: 'string', enum: ['transaction_failed', 'cannot_connect', 'nft_not_showing', 'staking_rewards_missing', 'wallet_issue', 'general'] }, context: { type: 'string' } }, required: ['issue'] } } },
  { type: 'function', function: { name: 'getStartedGuide', description: 'Onboarding guide', parameters: { type: 'object', properties: { path: { type: 'string', enum: ['user', 'developer', 'validator'] }, step: { type: 'number' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'explainCode', description: 'Explain Demiurge SDK code', parameters: { type: 'object', properties: { code: { type: 'string' }, language: { type: 'string', default: 'typescript' } }, required: ['code'] } } },
  { type: 'function', function: { name: 'deployAgent', description: 'Deploy agent wizard', parameters: { type: 'object', properties: { step: { type: 'string', enum: ['start', 'configure', 'register', 'status'] }, config: { type: 'object' } }, required: ['step'] } } },
  { type: 'function', function: { name: 'getGovernanceInfo', description: 'Get governance proposals, validator changes, commission impacts', parameters: { type: 'object', properties: { action: { type: 'string', enum: ['list_proposals', 'proposal_detail', 'validator_changes', 'commission_impact'] }, proposalId: { type: 'string' }, validatorAddress: { type: 'string' } }, required: ['action'] } } },
];

async function executeTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'searchDocs': return executeSearchDocs(args);
    case 'getBlockInfo': return executeGetBlockInfo(args, RPC_ENDPOINT);
    case 'getAccountBalance': return executeGetAccountBalance(args, RPC_ENDPOINT);
    case 'getValidatorInfo': return executeGetValidatorInfo(args, RPC_ENDPOINT);
    case 'getTransaction': return executeGetTransaction(args, RPC_ENDPOINT);
    case 'getNFTInfo': return executeGetNFTInfo(args, RPC_ENDPOINT);
    case 'getNetworkStats': return executeGetNetworkStats(RPC_ENDPOINT);
    case 'sendToAgent': return executeSendToAgent(args, AGENT_REGISTRY_URL);
    case 'explainGnosticConcept': return executeExplainGnosticConcept(args);
    case 'mintNFT': return executeMintNFT(args, RPC_ENDPOINT);
    case 'queryMyNFTs': return executeQueryMyNFTs(args, RPC_ENDPOINT);
    case 'troubleshoot': return executeTroubleshoot(args, RPC_ENDPOINT);
    case 'getStartedGuide': return executeGetStartedGuide(args);
    case 'explainCode': return executeExplainCode(args);
    case 'deployAgent': return executeDeployAgent(args);
    case 'getGovernanceInfo': return executeGetGovernanceInfo(args, RPC_ENDPOINT);
    default: return { success: false, error: `Unknown tool: ${name}` };
  }
}

// Non-streaming LLM call (for tool-calling rounds)
async function callLLMNonStreaming(
  messages: any[],
  systemPrompt: string,
  enableTools: boolean,
): Promise<{ text?: string; toolCalls?: any[]; error?: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  const grokKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Groq — primary: 70b (smarter), fallback: 8b (higher rate limits)
  if (groqKey) {
    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    for (const model of models) {
      try {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
          body: JSON.stringify({
            model, max_tokens: 2048, temperature: 0.7,
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            tools: enableTools ? TOOL_DEFINITIONS : undefined,
            tool_choice: enableTools ? 'auto' : undefined,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const choice = data.choices[0];
          if (choice.message.tool_calls) return { toolCalls: choice.message.tool_calls };
          return { text: choice.message.content };
        } else if (resp.status === 429) {
          console.warn(`Groq ${model} rate limited, trying next`); continue;
        } else if (resp.status === 400 && enableTools) {
          console.warn(`Groq ${model} tool_use_failed, retrying without tools`);
          const retry = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
            body: JSON.stringify({ model, max_tokens: 2048, temperature: 0.7, messages: [{ role: 'system', content: systemPrompt }, ...messages] }),
          });
          if (retry.ok) { const data = await retry.json(); return { text: data.choices[0].message.content }; }
          if (retry.status === 429) { continue; }
          break;
        } else {
          console.warn(`Groq ${model} returned ${resp.status}`); break;
        }
      } catch (e) { console.warn(`Groq ${model} failed:`, e); break; }
    }
  }

  // Grok / xAI
  if (grokKey) {
    try {
      const resp = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokKey}` },
        body: JSON.stringify({
          model: 'grok-4-latest',
          max_tokens: 2048,
          temperature: 0.7,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          tools: enableTools ? TOOL_DEFINITIONS : undefined,
          tool_choice: enableTools ? 'auto' : undefined,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const choice = data.choices[0];
        if (choice.message.tool_calls) return { toolCalls: choice.message.tool_calls };
        return { text: choice.message.content };
      }
    } catch (e) { console.warn('Grok API failed:', e); }
  }

  // Fallback to OpenAI
  if (openaiKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 2048,
          temperature: 0.7,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          tools: enableTools ? TOOL_DEFINITIONS : undefined,
          tool_choice: enableTools ? 'auto' : undefined,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const choice = data.choices[0];
        if (choice.message.tool_calls) return { toolCalls: choice.message.tool_calls };
        return { text: choice.message.content };
      }
    } catch (e) { console.warn('OpenAI API failed:', e); }
  }

  // Fallback to Claude
  if (anthropicKey) {
    try {
      const anthropicMessages = messages.filter((m: any) => m.role !== 'system');
      const claudeTools = enableTools ? TOOL_DEFINITIONS.map(t => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      })) : undefined;

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          temperature: 0.7,
          system: systemPrompt,
          messages: anthropicMessages,
          tools: claudeTools,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const toolUse = data.content.find((c: any) => c.type === 'tool_use');
        if (toolUse) {
          return { toolCalls: [{ id: toolUse.id, function: { name: toolUse.name, arguments: JSON.stringify(toolUse.input) } }] };
        }
        const textContent = data.content.find((c: any) => c.type === 'text');
        return { text: textContent?.text || '' };
      }
    } catch (e) { console.warn('Claude API failed:', e); }
  }

  if (groqKey || grokKey || anthropicKey || openaiKey) {
    console.warn('All non-streaming LLM providers failed (likely rate limited)');
    return { text: '✧ I need a moment to gather my thoughts, seeker. The streams of wisdom flow quickly — please try again in a few seconds. — Sophia ✧' };
  }
  return { error: 'No LLM API available. Set GROQ_API_KEY, XAI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.' };
}

// Streaming LLM call (for final response only)
async function callLLMStreaming(
  messages: any[],
  systemPrompt: string,
): Promise<ReadableStream | { error: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  const grokKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Groq streaming — primary: 70b, fallback: 8b (higher rate limits)
  if (groqKey) {
    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    for (const model of models) {
      try {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
          body: JSON.stringify({ model, max_tokens: 2048, temperature: 0.7, stream: true, messages: [{ role: 'system', content: systemPrompt }, ...messages] }),
        });
        if (resp.ok && resp.body) return transformOpenAIStream(resp.body);
        if (resp.status === 429) { console.warn(`Groq ${model} streaming rate limited, trying next`); continue; }
        console.warn(`Groq ${model} streaming returned ${resp.status}`); break;
      } catch (e) { console.warn(`Groq ${model} streaming failed:`, e); break; }
    }
  }

  // Grok / xAI streaming (OpenAI-compatible)
  if (grokKey) {
    try {
      const resp = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokKey}` },
        body: JSON.stringify({
          model: 'grok-4-latest',
          max_tokens: 2048,
          temperature: 0.7,
          stream: true,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
        }),
      });
      if (resp.ok && resp.body) {
        return transformOpenAIStream(resp.body);
      }
    } catch (e) { console.warn('Grok streaming failed:', e); }
  }

  // Try OpenAI streaming
  if (openaiKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 2048,
          temperature: 0.7,
          stream: true,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
        }),
      });
      if (resp.ok && resp.body) {
        return transformOpenAIStream(resp.body);
      }
    } catch (e) { console.warn('OpenAI streaming failed:', e); }
  }

  // Claude streaming
  if (anthropicKey) {
    try {
      const anthropicMessages = messages.filter((m: any) => m.role !== 'system');
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          temperature: 0.7,
          stream: true,
          system: systemPrompt,
          messages: anthropicMessages,
        }),
      });
      if (resp.ok && resp.body) {
        return transformAnthropicStream(resp.body);
      }
    } catch (e) { console.warn('Claude streaming failed:', e); }
  }

  if (groqKey || grokKey || openaiKey || anthropicKey) {
    console.warn('All streaming LLM providers failed (likely rate limited)');
    // Return a fake text stream with the rate limit message
    const enc = new TextEncoder();
    const msg = '✧ I need a moment to gather my thoughts, seeker. The streams of wisdom flow quickly — please try again in a few seconds. — Sophia ✧';
    return new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(enc.encode(`event: token\ndata: ${JSON.stringify(msg)}\n\n`));
        ctrl.enqueue(enc.encode(`event: done\ndata: ${JSON.stringify({ status: 'rate_limited' })}\n\n`));
        ctrl.close();
      },
    });
  }
  return { error: 'No streaming LLM API available. Set GROQ_API_KEY, XAI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.' };
}

/**
 * Transform an OpenAI-compatible SSE stream into our SSE format.
 * Input: data: {"choices":[{"delta":{"content":"..."}}]}
 * Output: event: token\ndata: ...\n\n
 */
function transformOpenAIStream(inputStream: ReadableStream): ReadableStream {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream({
    async start(controller) {
      const reader = inputStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const payload = trimmed.slice(6);
            if (payload === '[DONE]') continue;

            try {
              const json = JSON.parse(payload);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify(delta)}\n\n`));
              }
            } catch {
              // Skip malformed lines
            }
          }
        }
        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ status: 'complete' })}\n\n`));
        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: 'Stream interrupted' })}\n\n`));
        controller.close();
      }
    },
  });
}

/**
 * Transform an Anthropic SSE stream into our SSE format.
 * Input: event: content_block_delta / data: {"delta":{"text":"..."}}
 * Output: event: token\ndata: ...\n\n
 */
function transformAnthropicStream(inputStream: ReadableStream): ReadableStream {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream({
    async start(controller) {
      const reader = inputStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const payload = trimmed.slice(6);

            try {
              const json = JSON.parse(payload);
              if (json.type === 'content_block_delta' && json.delta?.text) {
                controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify(json.delta.text)}\n\n`));
              }
            } catch {
              // Skip
            }
          }
        }
        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ status: 'complete' })}\n\n`));
        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: 'Stream interrupted' })}\n\n`));
        controller.close();
      }
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const { messages, systemPrompt, pageContext } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fullSystemPrompt = buildSystemPrompt(systemPrompt, pageContext);
    let conversationMessages = [...messages];
    let iterations = 0;
    const maxIterations = 5;
    const encoder = new TextEncoder();

    // Phase 1: Handle tool calls (non-streaming, need structured responses)
    const toolEvents: string[] = [];
    while (iterations < maxIterations) {
      iterations++;

      const result = await callLLMNonStreaming(
        conversationMessages,
        fullSystemPrompt,
        iterations < maxIterations,
      );

      if (result.error) {
        return new Response(
          `event: error\ndata: ${JSON.stringify({ message: result.error })}\n\n`,
          { status: 200, headers: sseHeaders() },
        );
      }

      // If we got tool calls, execute them and continue
      if (result.toolCalls && result.toolCalls.length > 0) {
        conversationMessages.push({
          role: 'assistant',
          content: null,
          tool_calls: result.toolCalls,
        });

        const toolResults = await Promise.all(
          result.toolCalls.map(async (call: any) => {
            const toolResult = await executeTool(
              call.function.name,
              JSON.parse(call.function.arguments || '{}'),
            );
            toolEvents.push(
              `event: tool_call\ndata: ${JSON.stringify({ name: call.function.name, result: toolResult })}\n\n`,
            );
            return {
              tool_call_id: call.id,
              role: 'tool',
              content: JSON.stringify(toolResult),
            };
          }),
        );

        conversationMessages.push(...toolResults);
        continue;
      }

      // If we got text from the non-streaming call (e.g., tools were involved),
      // we still want to stream it character by character for UX consistency
      if (result.text) {
        const text = result.text;
        const stream = new ReadableStream({
          start(controller) {
            // Emit tool events first
            for (const evt of toolEvents) {
              controller.enqueue(encoder.encode(evt));
            }
            // Emit text in chunks (~20 chars each for smooth streaming)
            const chunkSize = 20;
            for (let i = 0; i < text.length; i += chunkSize) {
              const chunk = text.slice(i, i + chunkSize);
              controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ status: 'complete', iterations, toolsUsed: toolEvents.length })}\n\n`));
            controller.close();
          },
        });

        return new Response(stream, { status: 200, headers: sseHeaders() });
      }

      break;
    }

    // Phase 2: If no tools were invoked, stream the final response directly
    if (toolEvents.length === 0) {
      const streamResult = await callLLMStreaming(conversationMessages, fullSystemPrompt);

      if ('error' in streamResult) {
        return new Response(
          `event: error\ndata: ${JSON.stringify({ message: streamResult.error })}\n\n`,
          { status: 200, headers: sseHeaders() },
        );
      }

      return new Response(streamResult, { status: 200, headers: sseHeaders() });
    }

    // Fallback
    return new Response(
      `event: token\ndata: ${JSON.stringify(SOPHIA_ERROR_MESSAGE)}\n\nevent: done\ndata: ${JSON.stringify({ status: 'fallback' })}\n\n`,
      { status: 200, headers: sseHeaders() },
    );
  } catch (error: any) {
    console.error('Sophia streaming error:', error);
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: error.message || 'Internal error' })}\n\n`,
      { status: 200, headers: sseHeaders() },
    );
  }
}

function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  };
}

function buildSystemPrompt(customPrompt?: string, pageContext?: { route?: string; pageTitle?: string; data?: any }): string {
  let prompt = customPrompt || SOPHIA_FULL_SYSTEM_PROMPT;

  if (pageContext) {
    prompt += `\n\nCURRENT PAGE CONTEXT:
The user is currently viewing: ${pageContext.route || 'unknown'}
Page title: ${pageContext.pageTitle || 'unknown'}
${pageContext.data ? `Page data: ${JSON.stringify(pageContext.data)}` : ''}
Use this context to provide relevant assistance. For example, if they're on a block page, you already know which block they're looking at.`;
  }

  return prompt;
}
