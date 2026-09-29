/**
 * Google Gemini LLM Provider
 * 
 * Supports Gemini Pro, Gemini Pro Vision, and Gemini Ultra.
 */

import { GoogleGenerativeAI, GenerativeModel, Part, FunctionDeclaration } from '@google/generative-ai';
import { LLMProvider, registerProvider } from './base';
import type {
  InferenceRequest,
  InferenceResult,
  LLMProviderConfig,
  ToolDefinition,
  ToolCall,
} from '../types';

export class GeminiProvider extends LLMProvider {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(config: LLMProviderConfig) {
    super(config);

    const apiKey = config.apiKey || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key required (GOOGLE_AI_API_KEY or GEMINI_API_KEY)');
    }

    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: config.model });
  }

  async inference(request: InferenceRequest): Promise<InferenceResult> {
    const startTime = Date.now();

    try {
      // Build system instruction
      const systemInstruction = this.buildSystemPrompt(request);

      // Create model with tools if provided
      let model = this.model;
      if (request.tools && request.tools.length > 0) {
        model = this.client.getGenerativeModel({
          model: this.config.model,
          systemInstruction,
          tools: [{ functionDeclarations: this.formatTools(request.tools) as FunctionDeclaration[] }],
        });
      } else if (systemInstruction) {
        model = this.client.getGenerativeModel({
          model: this.config.model,
          systemInstruction,
        });
      }

      // Generate content
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        generationConfig: {
          maxOutputTokens: request.maxTokens || this.config.maxTokens || 2048,
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          stopSequences: request.stopSequences,
        },
      });

      const response = result.response;
      const candidate = response.candidates?.[0];

      if (!candidate) {
        return {
          output: '',
          toolCalls: [],
          finishReason: 'error',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          latencyMs: Date.now() - startTime,
        };
      }

      // Extract text and tool calls
      let output = '';
      const toolCalls: ToolCall[] = [];

      for (const part of candidate.content.parts) {
        if ('text' in part) {
          output += part.text;
        } else if ('functionCall' in part) {
          toolCalls.push({
            name: part.functionCall.name,
            arguments: part.functionCall.args as Record<string, unknown>,
          });
        }
      }

      // Determine finish reason
      let finishReason: InferenceResult['finishReason'] = 'stop';
      if (candidate.finishReason === 'MAX_TOKENS') finishReason = 'length';
      else if (candidate.finishReason === 'SAFETY') finishReason = 'content_filter';
      else if (toolCalls.length > 0) finishReason = 'tool_call';

      // Get usage metadata
      const usageMetadata = response.usageMetadata;

      return {
        output,
        toolCalls,
        finishReason,
        usage: {
          promptTokens: usageMetadata?.promptTokenCount || 0,
          completionTokens: usageMetadata?.candidatesTokenCount || 0,
          totalTokens: usageMetadata?.totalTokenCount || 0,
        },
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Gemini inference error:', error);
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
    const embeddingModel = this.client.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  }

  supportsTools(): boolean {
    // Gemini Pro and Ultra support function calling
    return this.config.model.includes('gemini-pro') || this.config.model.includes('gemini-1.5');
  }

  protected formatTools(tools: ToolDefinition[]): FunctionDeclaration[] {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object' as const,
        properties: tool.parameters,
        required: tool.required || [],
      },
    }));
  }

  protected parseToolCalls(response: unknown): ToolCall[] {
    // Tool calls are parsed directly in inference()
    return [];
  }
}

// Register provider
registerProvider('gemini', (config) => new GeminiProvider(config));

export default GeminiProvider;
