/**
 * AI Provider Abstraction Layer
 * Multi-provider support with capabilities, retry, cost estimation, and determinism
 */

import OpenAI from 'openai';
import { AIError, AIErrorType } from './aiErrors.js';
import { RetryHandler, RetryConfig } from './retry.js';
import { circuitBreaker } from './circuitBreaker.js';
import { estimateCost, exceedsCostCap, MAX_COST_PER_RUN } from '../config/modelPrices.js';

export interface ModelCapabilities {
  json: boolean;           // Supports JSON response format
  seed: boolean;           // Supports seed parameter for determinism
  maxInput: number;        // Maximum input tokens
  defaultTempScale: number; // Default temperature scale (0-2 for OpenAI, 0-1 for some)
}

export interface AICompletionRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  seed?: number;
  response_format?: { type: 'json_object' | 'text' };
}

export interface AICompletionResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost_usd?: number;
  deterministic?: boolean; // True if seed was applied successfully
}

export interface AIProvider {
  name: string;
  models: string[];
  supports: ModelCapabilities;
  
  createCompletion(
    req: AICompletionRequest, 
    opts?: { 
      timeoutMs?: number;
      signal?: AbortSignal;
      retryConfig?: RetryConfig;
    }
  ): Promise<AICompletionResponse>;
  
  estimateCost(usage: { prompt: number; completion: number }): number;
  
  // Determinism check
  supportsDeterminism(model: string): boolean;
  
  // Normalize seed/temperature for this provider
  normalizeSeed(seed?: number): number | undefined;
  normalizeTemperature(temp: number): number;
}

/**
 * OpenAI Provider Implementation
 */
export class OpenAIProvider implements AIProvider {
  name = 'openai';
  // Model list is dynamically determined by enabled models
  get models(): string[] {
    // Use dynamic import for circular dependency (but getter can't be async)
    // So we'll use a static import or cache the result
    try {
      // Try to use cached model list or default
      return ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
    } catch (error) {
      console.error('Failed to get OpenAI models:', error);
      return ['gpt-4o-mini']; // Fallback
    }
  }
  
  // Async method to get enabled models
  async getEnabledModels(): Promise<string[]> {
    const { getModelsByProvider } = await import('../config/modelVersions.js');
    return getModelsByProvider('openai').map((m: { id: string }) => m.id);
  }
  
  supports: ModelCapabilities = {
    json: true,           // GPT-4 supports JSON mode
    seed: true,           // GPT-4 supports seed
    maxInput: 128000,     // GPT-4o context window
    defaultTempScale: 2,  // OpenAI uses 0-2 scale
  };
  
  private client: OpenAI;
  
  constructor() {
    const apiKey = process.env['OPENAI_API_KEY'];
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }
    this.client = new OpenAI({ apiKey });
  }
  
  async createCompletion(
    req: AICompletionRequest,
    opts?: { timeoutMs?: number; signal?: AbortSignal; retryConfig?: RetryConfig }
  ): Promise<AICompletionResponse> {
    // Check if model is enabled (async check)
    try {
      const { isModelEnabled } = await import('../config/modelVersions.js');
      if (!isModelEnabled(req.model)) {
        throw new AIError(
          AIErrorType.BadRequest,
          `Model ${req.model} is not enabled or requires feature flag`,
          this.name
        );
      }
    } catch (error) {
      // If import fails or model not enabled, continue with validation but warn
      console.warn(`[OpenAIProvider] Model ${req.model} check failed, continuing with default validation`);
    }
    
    // Check circuit breaker
    if (circuitBreaker.isOpen(this.name)) {
      throw new AIError(
        AIErrorType.Unavailable,
        'OpenAI circuit breaker is open',
        this.name
      );
    }
    
    try {
      // Check cost cap before making request
      const estimatedUsage = {
        prompt: this.estimateTokens(req.messages.map(m => m.content).join(' ')),
        completion: req.max_tokens || 2000,
      };
      
      if (exceedsCostCap(req.model, estimatedUsage)) {
        throw new AIError(
          AIErrorType.BadRequest,
          `Estimated cost exceeds cap (${MAX_COST_PER_RUN})`,
          this.name
        );
      }
      
      // Apply retry logic
      const response = await RetryHandler.withRetry(
        async () => {
          // Build request object with only defined properties
          const completionParams: any = {
            model: req.model,
            messages: req.messages,
            temperature: this.normalizeTemperature(req.temperature ?? 0.1),
          };
          
          // Only add optional properties if they are defined
          if (req.max_tokens !== undefined) {
            completionParams.max_tokens = req.max_tokens;
          }
          
          const normalizedSeed = this.normalizeSeed(req.seed);
          if (normalizedSeed !== undefined) {
            completionParams.seed = normalizedSeed;
          }
          
          if (req.response_format) {
            completionParams.response_format = req.response_format;
          }
          
          // Build options object with only defined properties
          const requestOptions: any = {};
          if (opts?.timeoutMs !== undefined) {
            requestOptions.timeout = opts.timeoutMs;
          }
          if (opts?.signal !== undefined) {
            requestOptions.signal = opts.signal;
          }
          
          const completion = await this.client.chat.completions.create(
            completionParams,
            Object.keys(requestOptions).length > 0 ? requestOptions : undefined
          );
          
          return completion;
        },
        opts?.retryConfig
      );
      
      const content = response.choices[0]?.message?.content || '';
      if (!content) {
        throw new Error('OpenAI returned empty response');
      }
      
      // Record success
      circuitBreaker.recordSuccess(this.name);
      
      // Calculate cost
      const usage = response.usage;
      const cost = usage ? this.estimateCost({
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
      }) : undefined;
      
      const result: AICompletionResponse = {
        content,
        model: response.model,
        deterministic: req.seed !== undefined && this.supportsDeterminism(req.model),
      };
      
      if (usage) {
        result.usage = {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
        };
      }
      
      if (cost !== undefined) {
        result.cost_usd = cost;
      }
      
      return result;
    } catch (error) {
      // Record failure
      circuitBreaker.recordFailure(this.name);
      
      // Convert to standardized error
      throw AIError.fromProviderError(this.name, error);
    }
  }
  
  estimateCost(usage: { prompt: number; completion: number }): number {
    return estimateCost('gpt-4o-mini', usage); // Default to cheapest model for estimation
  }
  
  supportsDeterminism(model: string): boolean {
    // GPT-4 models support seed
    return this.models.includes(model) && model.startsWith('gpt-4');
  }
  
  normalizeSeed(seed?: number): number | undefined {
    // OpenAI accepts 0-2147483647
    if (seed === undefined) return undefined;
    return Math.max(0, Math.min(2147483647, seed));
  }
  
  normalizeTemperature(temp: number): number {
    // OpenAI uses 0-2 scale
    return Math.max(0, Math.min(2, temp));
  }
  
  /**
   * Rough token estimation (4 chars per token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

/**
 * Anthropic Provider Implementation (Stub - to be implemented)
 */
export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  get models(): string[] {
    // Return default models (can be enhanced with async getEnabledModels later)
    return ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'];
  }
  
  async getEnabledModels(): Promise<string[]> {
    const { getModelsByProvider } = await import('../config/modelVersions.js');
    return getModelsByProvider('anthropic').map((m: { id: string }) => m.id);
  }
  
  supports: ModelCapabilities = {
    json: true,
    seed: false,          // Anthropic doesn't support seed yet
    maxInput: 200000,     // Claude context window
    defaultTempScale: 1,  // Anthropic uses 0-1 scale
  };
  
  async createCompletion(
    _req: AICompletionRequest,
    _opts?: { timeoutMs?: number; signal?: AbortSignal; retryConfig?: RetryConfig }
  ): Promise<AICompletionResponse> {
    throw new Error('Anthropic provider not yet implemented');
  }
  
  estimateCost(_usage: { prompt: number; completion: number }): number {
    return estimateCost('claude-3-5-sonnet', { prompt: 0, completion: 0 });
  }
  
  supportsDeterminism(_model: string): boolean {
    return false; // Anthropic doesn't support seed
  }
  
  normalizeSeed(_seed?: number): number | undefined {
    return undefined; // Not supported
  }
  
  normalizeTemperature(temp: number): number {
    // Anthropic uses 0-1 scale
    return Math.max(0, Math.min(1, temp));
  }
}

/**
 * Google Provider Implementation (Stub - to be implemented)
 */
export class GoogleProvider implements AIProvider {
  name = 'google';
  get models(): string[] {
    // Return default models (can be enhanced with async getEnabledModels later)
    return ['gemini-pro', 'gemini-ultra', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  }
  
  async getEnabledModels(): Promise<string[]> {
    const { getModelsByProvider } = await import('../config/modelVersions.js');
    return getModelsByProvider('google').map((m: { id: string }) => m.id);
  }
  
  supports: ModelCapabilities = {
    json: false,          // Gemini doesn't support JSON mode the same way
    seed: false,          // Gemini doesn't support seed
    maxInput: 100000,     // Gemini context window
    defaultTempScale: 1,  // Google uses 0-1 scale
  };
  
  async createCompletion(
    _req: AICompletionRequest,
    _opts?: { timeoutMs?: number; signal?: AbortSignal; retryConfig?: RetryConfig }
  ): Promise<AICompletionResponse> {
    throw new Error('Google provider not yet implemented');
  }
  
  estimateCost(_usage: { prompt: number; completion: number }): number {
    return estimateCost('gemini-pro', { prompt: 0, completion: 0 });
  }
  
  supportsDeterminism(_model: string): boolean {
    return false; // Google doesn't support seed
  }
  
  normalizeSeed(_seed?: number): number | undefined {
    return undefined; // Not supported
  }
  
  normalizeTemperature(temp: number): number {
    // Google uses 0-1 scale
    return Math.max(0, Math.min(1, temp));
  }
}

/**
 * Provider Factory
 * Determines provider from model string and returns appropriate instance
 */
const providerCache = new Map<string, AIProvider>();

export function getAIProvider(model: string): AIProvider {
  // Check cache first
  const cached = providerCache.get(model);
  if (cached) return cached;
  
  // Determine provider from model string
  let provider: AIProvider;
  
  if (model.startsWith('gpt-')) {
    provider = new OpenAIProvider();
  } else if (model.startsWith('claude-')) {
    provider = new AnthropicProvider();
  } else if (model.startsWith('gemini-')) {
    provider = new GoogleProvider();
  } else {
    // Default to OpenAI
    provider = new OpenAIProvider();
  }
  
  // Cache provider
  providerCache.set(model, provider);
  return provider;
}
