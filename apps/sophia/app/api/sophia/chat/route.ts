/**
 * Sophia Chat API — Full Implementation
 *
 * Multi-provider LLM (Grok > Claude > GPT) with tool calling,
 * SSE streaming, page context awareness, and 16 tools.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SOPHIA_FULL_SYSTEM_PROMPT, SOPHIA_ERROR_MESSAGE } from '@lib/sophia/prompts';
import { executeTool } from '@lib/sophia/tools';

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const TOOL_DEFINITIONS = [
  { type: 'function', function: { name: 'getBlockInfo', description: 'Get blockchain block information', parameters: { type: 'object', properties: { blockNumber: { type: 'number', description: 'Block number (optional, defaults to latest)' } } } } },
  { type: 'function', function: { name: 'getAccountBalance', description: 'Check CGT balance and energy for an address', parameters: { type: 'object', properties: { address: { type: 'string', description: 'Account address' } }, required: ['address'] } } },
  { type: 'function', function: { name: 'getValidatorInfo', description: 'Get validator information', parameters: { type: 'object', properties: { address: { type: 'string', description: 'Validator address (optional)' } } } } },
  { type: 'function', function: { name: 'getTransaction', description: 'Look up transaction by hash', parameters: { type: 'object', properties: { hash: { type: 'string' } }, required: ['hash'] } } },
  { type: 'function', function: { name: 'getNFTInfo', description: 'Get DRC-369 NFT info', parameters: { type: 'object', properties: { tokenId: { type: 'string' }, collection: { type: 'string' } }, required: ['tokenId'] } } },
  { type: 'function', function: { name: 'getNetworkStats', description: 'Get network health stats', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'sendToAgent', description: 'Send message to AI agent', parameters: { type: 'object', properties: { agentId: { type: 'string' }, message: { type: 'string' }, action: { type: 'string', enum: ['query', 'command', 'notify'] } }, required: ['agentId', 'message', 'action'] } } },
  { type: 'function', function: { name: 'explainGnosticConcept', description: 'Explain a Gnostic term and its protocol mapping', parameters: { type: 'object', properties: { term: { type: 'string', description: 'Gnostic term or Demiurge concept' } }, required: ['term'] } } },
  { type: 'function', function: { name: 'mintNFT', description: 'Mint a DRC-369 NFT', parameters: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, metadata: { type: 'object' }, recipient: { type: 'string' }, soulbound: { type: 'boolean', default: false } }, required: ['name', 'description', 'recipient'] } } },
  { type: 'function', function: { name: 'queryMyNFTs', description: 'Query NFTs owned by address', parameters: { type: 'object', properties: { address: { type: 'string' } } } } },
  { type: 'function', function: { name: 'troubleshoot', description: 'Run guided diagnostic flow for an issue', parameters: { type: 'object', properties: { issue: { type: 'string', enum: ['transaction_failed', 'cannot_connect', 'nft_not_showing', 'staking_rewards_missing', 'wallet_issue', 'general'] }, context: { type: 'string' } }, required: ['issue'] } } },
  { type: 'function', function: { name: 'getStartedGuide', description: 'Interactive onboarding guide', parameters: { type: 'object', properties: { path: { type: 'string', enum: ['user', 'developer', 'validator'] }, step: { type: 'number' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'explainCode', description: 'Explain Demiurge SDK code snippet', parameters: { type: 'object', properties: { code: { type: 'string' }, language: { type: 'string', default: 'typescript' } }, required: ['code'] } } },
  { type: 'function', function: { name: 'deployAgent', description: 'Deploy agent wizard', parameters: { type: 'object', properties: { step: { type: 'string', enum: ['start', 'configure', 'register', 'status'] }, config: { type: 'object' } }, required: ['step'] } } },
  { type: 'function', function: { name: 'getGovernanceInfo', description: 'Get governance proposals and validator info', parameters: { type: 'object', properties: { action: { type: 'string', enum: ['list_proposals', 'proposal_detail', 'validator_changes', 'commission_impact'] }, proposalId: { type: 'string' }, validatorAddress: { type: 'string' } }, required: ['action'] } } },
];

// ═══════════════════════════════════════════════════════════════════════════════
// LLM CALLER
// ═══════════════════════════════════════════════════════════════════════════════

async function callLLM(
  messages: any[],
  systemPrompt: string,
  enableTools: boolean = true,
  stream: boolean = false,
): Promise<{ text?: string; toolCalls?: any[]; error?: string; stream?: ReadableStream }> {
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
            model, max_tokens: 2048, temperature: 0.7, stream,
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            tools: enableTools ? TOOL_DEFINITIONS : undefined,
            tool_choice: enableTools ? 'auto' : undefined,
          }),
        });
        if (resp.ok) {
          if (stream && resp.body) return { stream: transformOpenAIStream(resp.body) };
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
            body: JSON.stringify({ model, max_tokens: 2048, temperature: 0.7, stream, messages: [{ role: 'system', content: systemPrompt }, ...messages] }),
          });
          if (retry.ok) {
            if (stream && retry.body) return { stream: transformOpenAIStream(retry.body) };
            const data = await retry.json();
            return { text: data.choices[0].message.content };
          }
          if (retry.status === 429) { continue; }
          break;
        } else {
          console.warn(`Groq ${model} returned ${resp.status}`); break;
        }
      } catch (e) { console.warn(`Groq ${model} failed:`, e); break; }
    }
  }

  // Grok / xAI (OpenAI-compatible)
  if (grokKey) {
    try {
      const resp = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokKey}` },
        body: JSON.stringify({
          model: 'grok-4-latest',
          max_tokens: 2048,
          temperature: 0.7,
          stream,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          tools: enableTools ? TOOL_DEFINITIONS : undefined,
          tool_choice: enableTools ? 'auto' : undefined,
        }),
      });
      if (resp.ok) {
        if (stream && resp.body) {
          return { stream: transformOpenAIStream(resp.body) };
        }
        const data = await resp.json();
        const choice = data.choices[0];
        if (choice.message.tool_calls) return { toolCalls: choice.message.tool_calls };
        return { text: choice.message.content };
      }
    } catch (e) { console.warn('Grok failed:', e); }
  }

  // Claude
  if (anthropicKey) {
    try {
      const anthropicMessages = messages.filter((m: any) => m.role !== 'system');
      const claudeTools = enableTools
        ? TOOL_DEFINITIONS.map((t) => ({ name: t.function.name, description: t.function.description, input_schema: t.function.parameters }))
        : undefined;

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          temperature: 0.7,
          stream,
          system: systemPrompt,
          messages: anthropicMessages,
          tools: claudeTools,
        }),
      });
      if (resp.ok) {
        if (stream && resp.body) {
          return { stream: transformAnthropicStream(resp.body) };
        }
        const data = await resp.json();
        const toolUse = data.content.find((c: any) => c.type === 'tool_use');
        if (toolUse) {
          return { toolCalls: [{ id: toolUse.id, function: { name: toolUse.name, arguments: JSON.stringify(toolUse.input) } }] };
        }
        const textContent = data.content.find((c: any) => c.type === 'text');
        return { text: textContent?.text || '' };
      }
    } catch (e) { console.warn('Claude failed:', e); }
  }

  // OpenAI
  if (openaiKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 2048,
          temperature: 0.7,
          stream,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          tools: enableTools ? TOOL_DEFINITIONS : undefined,
          tool_choice: enableTools ? 'auto' : undefined,
        }),
      });
      if (resp.ok) {
        if (stream && resp.body) {
          return { stream: transformOpenAIStream(resp.body) };
        }
        const data = await resp.json();
        const choice = data.choices[0];
        if (choice.message.tool_calls) return { toolCalls: choice.message.tool_calls };
        return { text: choice.message.content };
      }
    } catch (e) { console.warn('OpenAI failed:', e); }
  }

  if (groqKey || grokKey || anthropicKey || openaiKey) {
    console.warn('All LLM providers failed (likely rate limited)');
    return { text: '✧ I need a moment to gather my thoughts, seeker. The streams of wisdom flow quickly — please try again in a few seconds. — Sophia ✧' };
  }
  return { error: 'No LLM API key configured. Set GROQ_API_KEY, XAI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAM TRANSFORMERS
// ═══════════════════════════════════════════════════════════════════════════════

function transformOpenAIStream(input: ReadableStream): ReadableStream {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  let buf = '';
  return new ReadableStream({
    async start(ctrl) {
      const reader = input.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data: ')) continue;
            const p = t.slice(6);
            if (p === '[DONE]') continue;
            try {
              const j = JSON.parse(p);
              const d = j.choices?.[0]?.delta?.content;
              if (d) ctrl.enqueue(enc.encode(`data: ${JSON.stringify(d)}\n\n`));
            } catch {}
          }
        }
        ctrl.enqueue(enc.encode(`data: [DONE]\n\n`));
        ctrl.close();
      } catch { ctrl.close(); }
    },
  });
}

function transformAnthropicStream(input: ReadableStream): ReadableStream {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  let buf = '';
  return new ReadableStream({
    async start(ctrl) {
      const reader = input.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data: ')) continue;
            try {
              const j = JSON.parse(t.slice(6));
              if (j.type === 'content_block_delta' && j.delta?.text) {
                ctrl.enqueue(enc.encode(`data: ${JSON.stringify(j.delta.text)}\n\n`));
              }
            } catch {}
          }
        }
        ctrl.enqueue(enc.encode(`data: [DONE]\n\n`));
        ctrl.close();
      } catch { ctrl.close(); }
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, messages: msgArray, conversationHistory, stream: wantStream, pageContext } = body;

    // Support both old format (message + conversationHistory) and new format (messages[])
    let apiMessages: any[];
    if (msgArray && Array.isArray(msgArray)) {
      apiMessages = msgArray;
    } else if (message) {
      const history = (conversationHistory || [])
        .filter((m: any) => m.role === 'user' || m.role === 'assistant')
        .map((m: any) => ({ role: m.role, content: m.content }));
      apiMessages = [...history, { role: 'user', content: message }];
    } else {
      return NextResponse.json({ error: 'Missing message or messages' }, { status: 400 });
    }

    // Build system prompt with optional page context
    let systemPrompt = SOPHIA_FULL_SYSTEM_PROMPT;
    if (pageContext?.route) {
      systemPrompt += `\n\nCURRENT PAGE CONTEXT:\nThe user is viewing: ${pageContext.route}\nPage: ${pageContext.pageTitle || 'unknown'}`;
      if (pageContext.data) systemPrompt += `\nData: ${JSON.stringify(pageContext.data)}`;
    }

    // Streaming mode
    if (wantStream) {
      return handleStreaming(apiMessages, systemPrompt);
    }

    // Non-streaming with tool calling loop
    let conversationMessages = [...apiMessages];
    let iterations = 0;
    const maxIterations = 5;
    let toolsUsed = 0;

    while (iterations < maxIterations) {
      iterations++;

      const result = await callLLM(conversationMessages, systemPrompt, iterations < maxIterations);

      if (result.error) {
        return NextResponse.json({ error: result.error, message: SOPHIA_ERROR_MESSAGE }, { status: 503 });
      }

      if (result.text) {
        return NextResponse.json({
          message: result.text,
          text: result.text,
          iterations,
          toolsUsed,
        });
      }

      if (result.toolCalls && result.toolCalls.length > 0) {
        conversationMessages.push({ role: 'assistant', content: null, tool_calls: result.toolCalls });

        const toolResults = await Promise.all(
          result.toolCalls.map(async (call: any) => {
            const toolResult = await executeTool(call.function.name, JSON.parse(call.function.arguments || '{}'));
            toolsUsed++;
            return { tool_call_id: call.id, role: 'tool', content: JSON.stringify(toolResult) };
          })
        );
        conversationMessages.push(...toolResults);
        continue;
      }

      break;
    }

    return NextResponse.json({ message: SOPHIA_ERROR_MESSAGE, text: SOPHIA_ERROR_MESSAGE, iterations });
  } catch (error: any) {
    console.error('Sophia chat error:', error);
    return NextResponse.json({ error: error.message, message: SOPHIA_ERROR_MESSAGE }, { status: 500 });
  }
}

async function handleStreaming(messages: any[], systemPrompt: string): Promise<Response> {
  const enc = new TextEncoder();

  // First, handle tool calls (non-streaming)
  let conversationMessages = [...messages];
  let iterations = 0;
  const maxIterations = 5;
  const toolEvents: string[] = [];

  while (iterations < maxIterations) {
    iterations++;
    const result = await callLLM(conversationMessages, systemPrompt, iterations < maxIterations, false);

    if (result.error) {
      return new Response(`data: ${JSON.stringify({ error: result.error })}\n\ndata: [DONE]\n\n`, {
        headers: sseHeaders(),
      });
    }

    if (result.toolCalls && result.toolCalls.length > 0) {
      conversationMessages.push({ role: 'assistant', content: null, tool_calls: result.toolCalls });

      const toolResults = await Promise.all(
        result.toolCalls.map(async (call: any) => {
          const toolResult = await executeTool(call.function.name, JSON.parse(call.function.arguments || '{}'));
          toolEvents.push(JSON.stringify({ tool: call.function.name, result: toolResult }));
          return { tool_call_id: call.id, role: 'tool', content: JSON.stringify(toolResult) };
        })
      );
      conversationMessages.push(...toolResults);
      continue;
    }

    // Got text response after tools — stream it
    if (result.text) {
      const text = result.text;
      const stream = new ReadableStream({
        start(ctrl) {
          const chunkSize = 20;
          for (let i = 0; i < text.length; i += chunkSize) {
            ctrl.enqueue(enc.encode(`data: ${JSON.stringify(text.slice(i, i + chunkSize))}\n\n`));
          }
          ctrl.enqueue(enc.encode(`data: [DONE]\n\n`));
          ctrl.close();
        },
      });
      return new Response(stream, { headers: sseHeaders() });
    }

    break;
  }

  // No tool calls — stream directly from LLM
  const streamResult = await callLLM(conversationMessages, systemPrompt, false, true);
  if (streamResult.stream) {
    return new Response(streamResult.stream, { headers: sseHeaders() });
  }

  return new Response(`data: ${JSON.stringify(SOPHIA_ERROR_MESSAGE)}\n\ndata: [DONE]\n\n`, {
    headers: sseHeaders(),
  });
}

function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  };
}

// Health check
export async function GET() {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGrok = !!(process.env.XAI_API_KEY || process.env.GROK_API_KEY);
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  return NextResponse.json({
    status: hasGroq || hasGrok || hasAnthropic || hasOpenAI ? 'ready' : 'no-api-key',
    providers: { groq: hasGroq, grok: hasGrok, anthropic: hasAnthropic, openai: hasOpenAI },
    tools: TOOL_DEFINITIONS.map((t) => t.function.name),
    toolCount: TOOL_DEFINITIONS.length,
  });
}
