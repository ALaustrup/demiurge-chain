/**
 * OpenAI LLM Provider
 * 
 * Supports GPT-4, GPT-4 Turbo, GPT-3.5, and compatible APIs.
 */

import OpenAI from 'openai';
import { LLMProvider, registerProvider } from './base';
import type {
  InferenceRequest,
  InferenceResult,
  LLMProviderConfig,
  ToolDefinition,
  ToolCall,
} from '../types';

export class OpenAIProvider extends LLMProvider {
  private client: OpenAI;

  constructor(config: LLMProviderConfig) {
    super(config);

    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      baseURL: config.baseUrl,
      defaultHeaders: config.headers,
    });
  }

  async inference(request: InferenceRequest): Promise<InferenceResult> {
    const startTime = Date.now();

    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    // System prompt
    const system = this.buildSystemPrompt(request);
    if (system) {
      messages.push({ role: 'system', content: system });
    }

    // User prompt
    messages.push({ role: 'user', content: request.prompt });

    // Build request
    const completionRequest: OpenAI.ChatCompletionCreateParams = {
      model: this.config.model,
      messages,
      max_tokens: request.maxTokens || this.config.maxTokens || 2048,
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      stop: request.stopSequences,
    };

    // Add tools if provided
    if (request.tools && request.tools.length > 0) {
      completionRequest.tools = this.formatTools(request.tools) as OpenAI.ChatCompletionTool[];
      completionRequest.tool_choice = 'auto';
    }

    try {
      const response = await this.client.chat.completions.create(completionRequest);
      const choice = response.choices[0];
      const message = choice.message;

      // Parse tool calls
      const toolCalls = this.parseToolCalls(message);

      // Determine finish reason
      let finishReason: InferenceResult['finishReason'] = 'stop';
      if (choice.finish_reason === 'length') finishReason = 'length';
      else if (choice.finish_reason === 'tool_calls') finishReason = 'tool_call';
      else if (choice.finish_reason === 'content_filter') finishReason = 'content_filter';

      return {
        output: message.content || '',
        toolCalls,
        finishReason,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        output: '',
        toolCalls: [],
        finishReason: 'error',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }

  supportsTools(): boolean {
    // GPT-4 and GPT-3.5-turbo support function calling
    return this.config.model.includes('gpt-4') || this.config.model.includes('gpt-3.5-turbo');
  }

  protected formatTools(tools: ToolDefinition[]): OpenAI.ChatCompletionTool[] {
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters,
          required: tool.required || [],
        },
      },
    }));
  }

  protected parseToolCalls(response: unknown): ToolCall[] {
    const message = response as OpenAI.ChatCompletionMessage;
    if (!message.tool_calls) return [];

    return message.tool_calls.map(tc => ({
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    }));
  }
}

// Register provider
registerProvider('openai', (config) => new OpenAIProvider(config));

export default OpenAIProvider;
