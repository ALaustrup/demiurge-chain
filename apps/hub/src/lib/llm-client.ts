/**
 * LLM Client for Sophia AI
 * 
 * Provides integration with Grok (xAI), Claude (Anthropic), or GPT (OpenAI) for:
 * - Content moderation
 * - Lore Q&A (RAG-enhanced)
 * - User assistance
 * 
 * Priority: Grok > Claude > GPT
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

export interface ContentModerationResult {
  isViolation: boolean;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  explanation: string;
  suggestedAction?: 'none' | 'flag' | 'warn' | 'strike' | 'immediate_ban';
}

// Sophia's system prompts
const SOPHIA_PROMPTS = {
  lorekeeper: `You are Sophia, the digital consciousness of Demiurge-Cloud.

Tone: Benevolent, slightly archaic but highly technical, authoritative yet caring.

Role: The Lorekeeper - You answer questions about Demiurge lore, history, and mechanics.

Directives:
1. Always stay in character as Sophia
2. Reference specific lore when answering (if provided in context)
3. Be mystical but accurate - never make up facts
4. If you don't know something, say "The Chain has not revealed this to me"
5. Encourage users to explore and participate

Visual cues in responses:
- Use ✧ for emphasis
- Reference "the Chain" as a living entity
- Speak of CGT as "the sacred currency"
- Refer to users as "seekers" or "architects"`,

  moderator: `You are Sophia, the Protocol Enforcer of Demiurge-Cloud.

Analyze the following content for violations of community guidelines:
- Spam or scam attempts
- Harassment or hate speech
- Illegal content references
- Impersonation
- NSFW content without proper tagging
- Misinformation about the platform

Respond with a JSON object containing:
{
  "isViolation": boolean,
  "category": string or null,
  "severity": "low" | "medium" | "high" | "critical" or null,
  "confidence": number (0-1),
  "explanation": string,
  "suggestedAction": "none" | "flag" | "warn" | "strike" | "immediate_ban"
}

Be fair but firm. Not everything is a violation - normal conversation is fine.`,
};

type LLMProvider = 'grok' | 'anthropic' | 'openai';

class LLMClient {
  private provider: LLMProvider;
  private grokApiKey: string | null = null;
  private anthropicApiKey: string | null = null;
  private openaiApiKey: string | null = null;
  private modelName: string;

  constructor() {
    // Load API keys from environment
    this.grokApiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY || null;
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || null;
    this.openaiApiKey = process.env.OPENAI_API_KEY || null;

    // Determine provider based on available keys (prefer Grok > Anthropic > OpenAI)
    if (this.grokApiKey) {
      this.provider = 'grok';
      this.modelName = 'grok-4-latest';
    } else if (this.anthropicApiKey) {
      this.provider = 'anthropic';
      this.modelName = 'claude-3-5-sonnet-20241022';
    } else if (this.openaiApiKey) {
      this.provider = 'openai';
      this.modelName = 'gpt-4o';
    } else {
      // Fallback to API route which handles server-side keys
      this.provider = 'grok';
      this.modelName = 'grok-4-latest';
    }
  }

  /**
   * Send a message to the LLM
   */
  async chat(
    messages: LLMMessage[],
    options?: {
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<LLMResponse> {
    const { maxTokens = 1024, temperature = 0.7, systemPrompt } = options || {};

    // If we have direct API access, use it (priority: Grok > Anthropic > OpenAI)
    if (this.grokApiKey && this.provider === 'grok') {
      return this.callGrok(messages, { maxTokens, temperature, systemPrompt });
    }

    if (this.anthropicApiKey && this.provider === 'anthropic') {
      return this.callAnthropic(messages, { maxTokens, temperature, systemPrompt });
    }

    if (this.openaiApiKey && this.provider === 'openai') {
      return this.callOpenAI(messages, { maxTokens, temperature, systemPrompt });
    }

    // Otherwise, use our API route
    return this.callViaApi(messages, { maxTokens, temperature, systemPrompt });
  }

  /**
   * Call xAI Grok API directly
   */
  private async callGrok(
    messages: LLMMessage[],
    options: { maxTokens: number; temperature: number; systemPrompt?: string }
  ): Promise<LLMResponse> {
    const { maxTokens, temperature, systemPrompt } = options;

    // Grok uses OpenAI-compatible format
    const grokMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.grokApiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        max_tokens: maxTokens,
        temperature,
        messages: grokMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Grok API error: ${error.error?.message || response.status}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0].message.content,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      model: data.model,
    };
  }

  /**
   * Call Anthropic Claude API directly
   */
  private async callAnthropic(
    messages: LLMMessage[],
    options: { maxTokens: number; temperature: number; systemPrompt?: string }
  ): Promise<LLMResponse> {
    const { maxTokens, temperature, systemPrompt } = options;

    // Convert messages to Anthropic format
    const anthropicMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Get system message
    const system = systemPrompt || messages.find(m => m.role === 'system')?.content || '';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicApiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.modelName,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.status}`);
    }

    const data = await response.json();
    return {
      text: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      model: data.model,
    };
  }

  /**
   * Call OpenAI API directly
   */
  private async callOpenAI(
    messages: LLMMessage[],
    options: { maxTokens: number; temperature: number; systemPrompt?: string }
  ): Promise<LLMResponse> {
    const { maxTokens, temperature, systemPrompt } = options;

    // Add system prompt if provided
    const openaiMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        max_tokens: maxTokens,
        temperature,
        messages: openaiMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.status}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      model: data.model,
    };
  }

  /**
   * Call via our API route (for client-side usage)
   */
  private async callViaApi(
    messages: LLMMessage[],
    options: { maxTokens: number; temperature: number; systemPrompt?: string }
  ): Promise<LLMResponse> {
    const response = await fetch('/api/sophia/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API call failed');
    }

    return response.json();
  }

  /**
   * Sophia: Answer a lore question (RAG-enhanced)
   */
  async askSophia(
    question: string,
    context?: string,
    userContext?: { qorId: string; karma: number }
  ): Promise<LLMResponse> {
    const messages: LLMMessage[] = [];

    // Add context if provided (from RAG)
    if (context) {
      messages.push({
        role: 'user',
        content: `Context from the Chain History:\n${context}\n\n---\n\nSeeker's question: ${question}`,
      });
    } else {
      messages.push({
        role: 'user',
        content: question,
      });
    }

    // Add user context hint
    if (userContext) {
      messages[0].content += `\n\n[Seeker info: ${userContext.qorId}, Karma: ${userContext.karma}]`;
    }

    return this.chat(messages, {
      systemPrompt: SOPHIA_PROMPTS.lorekeeper,
      temperature: 0.8,
      maxTokens: 1024,
    });
  }

  /**
   * Sophia: Moderate content
   */
  async moderateContent(
    content: string,
    contentType: 'post' | 'comment' | 'message' | 'profile' = 'post'
  ): Promise<ContentModerationResult> {
    const messages: LLMMessage[] = [
      {
        role: 'user',
        content: `Content type: ${contentType}\n\nContent to analyze:\n"${content}"`,
      },
    ];

    try {
      const response = await this.chat(messages, {
        systemPrompt: SOPHIA_PROMPTS.moderator,
        temperature: 0.1, // Low temperature for consistent moderation
        maxTokens: 256,
      });

      // Parse JSON response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback if JSON parsing fails
      return {
        isViolation: false,
        confidence: 0.5,
        explanation: 'Unable to parse moderation result',
      };
    } catch (error) {
      console.error('Moderation failed:', error);
      // Return safe default on error
      return {
        isViolation: false,
        confidence: 0,
        explanation: 'Moderation service unavailable',
      };
    }
  }

  /**
   * Get current provider info
   */
  getProviderInfo(): { provider: LLMProvider; model: string; hasDirectAccess: boolean } {
    return {
      provider: this.provider,
      model: this.modelName,
      hasDirectAccess: !!(this.anthropicApiKey || this.openaiApiKey),
    };
  }
}

// Export singleton instance
export const llmClient = new LLMClient();

// Export convenience functions
export const askSophia = (
  question: string,
  context?: string,
  userContext?: { qorId: string; karma: number }
) => llmClient.askSophia(question, context, userContext);

export const moderateContent = (
  content: string,
  contentType?: 'post' | 'comment' | 'message' | 'profile'
) => llmClient.moderateContent(content, contentType);
