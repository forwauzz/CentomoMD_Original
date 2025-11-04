/**
 * AI Provider Abstraction Layer
 * Multi-provider support with capabilities, retry, cost estimation, and determinism
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
          // PROOF: Log exact model being sent to API
          console.log(`[PROOF] OpenAI API Call - Model: ${req.model}, Provider: ${this.name}`);
          console.log(`[PROOF] OpenAI Request Details:`, {
            model: req.model,
            messagesCount: req.messages.length,
            maxTokens: req.max_tokens,
            temperature: req.temperature,
            seed: req.seed
          });
          
          // Build request object with only defined properties
          // Check if model has special parameter requirements
          const isNewerModel = req.model === 'gpt-5' || req.model === 'gpt-5-mini' || req.model === 'gpt-5-turbo' || req.model.includes('o3');
          
          const completionParams: any = {
            model: req.model,
            messages: req.messages,
          };
          
          // For newer models (like gpt-5), only default temperature (1) is supported
          if (isNewerModel) {
            // Don't set temperature - let it use default (1)
            console.log(`[PROOF] Using default temperature (1) for newer model: ${req.model} (temperature=${req.temperature} was requested but not supported)`);
          } else {
            completionParams.temperature = this.normalizeTemperature(req.temperature ?? 0.1);
          }
          
          // Only add optional properties if they are defined
          // For newer models (like gpt-5), use max_completion_tokens instead of max_tokens
          if (req.max_tokens !== undefined) {
            if (isNewerModel) {
              completionParams.max_completion_tokens = req.max_tokens;
              console.log(`[PROOF] Using max_completion_tokens for newer model: ${req.model}`);
            } else {
              completionParams.max_tokens = req.max_tokens;
            }
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
          
          // PROOF: Log API response with actual model used
          console.log(`[PROOF] OpenAI API Response:`, {
            model: completion.model, // This is the ACTUAL model used by API
            requestedModel: req.model,
            responseId: completion.id,
            usage: completion.usage,
            modelMatches: completion.model === req.model
          });
          
          if (completion.model !== req.model) {
            console.warn(`[PROOF] ⚠️ MODEL MISMATCH: Requested ${req.model}, but API used ${completion.model}`);
          }
          
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
 * Anthropic Provider Implementation
 */
export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private client: Anthropic;
  
  constructor() {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.client = new Anthropic({ apiKey });
  }
  
  get models(): string[] {
    // Return default models (can be enhanced with async getEnabledModels later)
    return ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-4-sonnet', 'claude-4-haiku', 'claude-4-opus'];
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
    req: AICompletionRequest,
    opts?: { timeoutMs?: number; signal?: AbortSignal; retryConfig?: RetryConfig }
  ): Promise<AICompletionResponse> {
    // Check circuit breaker
    if (circuitBreaker.isOpen(this.name)) {
      throw new AIError(
        AIErrorType.ServiceUnavailable,
        'Anthropic circuit breaker is open',
        this.name
      );
    }
    
    try {
      // Map model name to Anthropic format (claude-3-5-sonnet -> claude-3-5-sonnet-20241022)
      const modelId = req.model.startsWith('claude-') ? req.model : `claude-${req.model}`;
      
      // Extract system and user messages
      const systemMessage = req.messages.find(m => m.role === 'system')?.content || '';
      const userMessages = req.messages.filter(m => m.role === 'user').map(m => m.content);
      const userMessage = userMessages.join('\n\n');
      
      // Check cost cap
      const estimatedUsage = {
        prompt: this.estimateTokens(systemMessage + userMessage),
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
          // Build params without stream to get Message type response
          const params: Omit<Anthropic.Messages.MessageCreateParams, 'stream'> & { stream?: false } = {
            model: modelId as any,
            max_tokens: req.max_tokens || 4096,
            temperature: this.normalizeTemperature(req.temperature ?? 0.1),
            messages: [{ role: 'user', content: userMessage }],
            stream: false, // Explicitly disable streaming
          };
          
          // Add system message if provided
          if (systemMessage) {
            params.system = systemMessage;
          }
          
          if (req.response_format?.type === 'json_object') {
            // Anthropic doesn't have json_object mode, but we can request it in the prompt
            params.system = `${params.system || ''}\n\nIMPORTANT: Respond with valid JSON only, no markdown formatting.`.trim();
          }
          
          return await this.client.messages.create(params);
        },
        opts?.retryConfig
      );
      
      // Type guard: ensure we have a Message response (not a stream)
      // Anthropic SDK returns Message when stream: false, Stream when stream: true
      // Since we set stream: false, we should get Message
      if ('type' in response && response.type !== 'message') {
        throw new Error('Unexpected stream response from Anthropic');
      }
      
      // Handle Message response
      const messageResponse = response as Anthropic.Messages.Message;
      const content = messageResponse.content[0]?.type === 'text' ? messageResponse.content[0].text : '';
      if (!content) {
        throw new Error('Anthropic returned empty response');
      }
      
      // Record success
      circuitBreaker.recordSuccess(this.name);
      
      // Calculate cost
      const usage = messageResponse.usage;
      const cost = usage ? this.estimateCost({
        prompt: usage.input_tokens,
        completion: usage.output_tokens,
      }) : undefined;
      
      const result: AICompletionResponse = {
        content,
        model: messageResponse.model,
        deterministic: false, // Anthropic doesn't support seed
      };
      
      if (usage) {
        result.usage = {
          prompt_tokens: usage.input_tokens,
          completion_tokens: usage.output_tokens,
          total_tokens: usage.input_tokens + usage.output_tokens,
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
    return estimateCost('claude-3-5-sonnet', usage);
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
  
  /**
   * Rough token estimation (4 chars per token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

/**
 * Google Provider Implementation
 */
export class GoogleProvider implements AIProvider {
  name = 'google';
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env['GOOGLE_API_KEY'];
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  
  get models(): string[] {
    // Return default models (can be enhanced with async getEnabledModels later)
    return ['gemini-pro', 'gemini-ultra', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-2.5-flash', 'gemini-2-pro', 'gemini-2-ultra'];
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
    req: AICompletionRequest,
    opts?: { timeoutMs?: number; signal?: AbortSignal; retryConfig?: RetryConfig }
  ): Promise<AICompletionResponse> {
    // Check circuit breaker
    if (circuitBreaker.isOpen(this.name)) {
      throw new AIError(
        AIErrorType.ServiceUnavailable,
        'Google circuit breaker is open',
        this.name
      );
    }
    
    try {
      // Map model name to Google format
      // Google uses specific model names: gemini-pro, gemini-1.5-pro, etc.
      // Note: Some model names might need adjustment based on API version
      let modelId = req.model;
      if (!modelId.startsWith('gemini-')) {
        modelId = `gemini-${modelId}`;
      }
      
      // Google model name mapping
      // The SDK expects exact model names like 'gemini-pro' or 'gemini-1.5-pro'
      // Some variations might not be available
      const modelNameMap: Record<string, string> = {
        'gemini-pro': 'gemini-pro',
        'gemini-1.5-pro': 'gemini-1.5-pro',
        'gemini-1.5-flash': 'gemini-1.5-flash', // May not be available in all regions
        'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp', // Experimental Gemini 2.0 Flash
        'gemini-2.5-flash': 'gemini-2.5-flash', // Latest Gemini 2.5 Flash
        'gemini-ultra': 'gemini-pro', // Fallback to pro if ultra not available
        'gemini-2-pro': 'gemini-1.5-pro', // Fallback if gemini-2 not available
        'gemini-2-ultra': 'gemini-1.5-pro', // Fallback
      };
      
      // Use mapped name if available, otherwise use original
      const mappedModelId = modelNameMap[modelId] || modelId;
      
      // PROOF: Log model mapping
      console.log(`[PROOF] Google Model Mapping:`, {
        requestedModel: req.model,
        originalModelId: modelId,
        mappedModelId: mappedModelId,
        mappingUsed: modelNameMap[modelId] ? 'fallback mapping' : 'direct',
        modelsMatch: mappedModelId === modelId
      });
      
      if (mappedModelId !== modelId) {
        console.warn(`[PROOF] ⚠️ MODEL FALLBACK: Requested ${req.model} (${modelId}), but using ${mappedModelId} instead`);
      }
      
      // Get the model
      const model = this.genAI.getGenerativeModel({ model: mappedModelId });
      
      // PROOF: Log exact API call
      console.log(`[PROOF] Google API Call - Model: ${mappedModelId}, Provider: ${this.name}`);
      
      // Extract system and user messages
      const systemMessage = req.messages.find(m => m.role === 'system')?.content || '';
      const userMessages = req.messages.filter(m => m.role === 'user').map(m => m.content);
      const userMessage = userMessages.join('\n\n');
      
      // Combine system and user for Gemini (system instruction)
      const fullPrompt = systemMessage ? `${systemMessage}\n\n${userMessage}` : userMessage;
      
      // Check cost cap
      const estimatedUsage = {
        prompt: this.estimateTokens(fullPrompt),
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
          const generationConfig: any = {
            temperature: this.normalizeTemperature(req.temperature ?? 0.1),
          };
          
          if (req.max_tokens !== undefined) {
            generationConfig.maxOutputTokens = req.max_tokens;
          }
          
          if (req.response_format?.type === 'json_object') {
            generationConfig.responseMimeType = 'application/json';
          }
          
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            generationConfig,
          });
          
          // PROOF: Log API response (Gemini API doesn't return model in response)
          console.log(`[PROOF] Google API Response:`, {
            modelUsed: mappedModelId, // This is what we actually called
            requestedModel: req.model,
            originalModelId: modelId,
            mappedModelId: mappedModelId,
            modelMatches: mappedModelId === modelId,
            promptTokens: result.response.usageMetadata?.promptTokenCount,
            completionTokens: result.response.usageMetadata?.candidatesTokenCount
          });
          
          if (mappedModelId !== modelId) {
            console.warn(`[PROOF] ⚠️ MODEL FALLBACK: Requested ${req.model}, but using ${mappedModelId} instead`);
          }
          
          return result.response;
        },
        opts?.retryConfig
      );
      
      const text = response.text();
      
      // PROOF: Log response status
      console.log(`[PROOF] Google API Response Text Check:`, {
        requestedModel: req.model,
        mappedModelId: mappedModelId,
        hasText: !!text,
        textLength: text?.length || 0,
        hasCandidates: !!response.candidates,
        candidatesCount: response.candidates?.length || 0,
        firstCandidateFinishReason: response.candidates?.[0]?.finishReason || 'unknown',
        usageMetadata: response.usageMetadata
      });
      
      if (!text || !text.trim()) {
        // PROOF: Log empty response issue
        console.error(`[PROOF] ⚠️ Google API returned empty response for model: ${mappedModelId}`, {
          requestedModel: req.model,
          mappedModelId: mappedModelId,
          hasCandidates: !!response.candidates,
          candidatesCount: response.candidates?.length || 0,
          firstCandidateFinishReason: response.candidates?.[0]?.finishReason || 'unknown',
          usageMetadata: response.usageMetadata
        });
        
        // Check if model exists - try to get error details
        if (response.candidates && response.candidates.length > 0 && response.candidates[0]) {
          const finishReason = response.candidates[0].finishReason;
          console.warn(`[PROOF] ⚠️ Google API - First candidate finish reason: ${finishReason}`);
          
          if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
            throw new AIError(
              AIErrorType.BadRequest,
              `Google model ${mappedModelId} blocked content: ${finishReason}`,
              this.name
            );
          }
        }
        
        throw new AIError(
          AIErrorType.BadRequest,
          `Google model ${mappedModelId} returned empty response. Model may not exist or be available. Check if model name is correct.`,
          this.name
        );
      }
      
      // Record success
      circuitBreaker.recordSuccess(this.name);
      
      // Calculate cost (estimate from usage metadata)
      const usageMetadata = response.usageMetadata;
      const usage = usageMetadata ? {
        prompt: usageMetadata.promptTokenCount || this.estimateTokens(fullPrompt),
        completion: usageMetadata.candidatesTokenCount || this.estimateTokens(text),
      } : {
        prompt: this.estimateTokens(fullPrompt),
        completion: this.estimateTokens(text),
      };
      
      const cost = this.estimateCost(usage);
      
      const result: AICompletionResponse = {
        content: text,
        model: modelId,
        deterministic: false, // Google doesn't support seed
        usage: {
          prompt_tokens: usage.prompt,
          completion_tokens: usage.completion,
          total_tokens: usage.prompt + usage.completion,
        },
        cost_usd: cost,
      };
      
      return result;
    } catch (error) {
      // Record failure
      circuitBreaker.recordFailure(this.name);
      
      // Convert to standardized error
      throw AIError.fromProviderError(this.name, error);
    }
  }
  
  estimateCost(usage: { prompt: number; completion: number }): number {
    return estimateCost('gemini-pro', usage);
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
  
  /**
   * Rough token estimation (4 chars per token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
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
  
  try {
    if (model.startsWith('gpt-')) {
      provider = new OpenAIProvider();
    } else if (model.startsWith('claude-')) {
      // Check if API key exists before creating provider
      if (!process.env['ANTHROPIC_API_KEY']) {
        throw new AIError(
          AIErrorType.ConfigurationError,
          'ANTHROPIC_API_KEY environment variable is required for Claude models',
          'anthropic'
        );
      }
      provider = new AnthropicProvider();
    } else if (model.startsWith('gemini-')) {
      // Check if API key exists before creating provider
      if (!process.env['GOOGLE_API_KEY']) {
        throw new AIError(
          AIErrorType.ConfigurationError,
          'GOOGLE_API_KEY environment variable is required for Gemini models',
          'google'
        );
      }
      provider = new GoogleProvider();
    } else {
      // Default to OpenAI
      provider = new OpenAIProvider();
    }
    
    // Cache provider
    providerCache.set(model, provider);
    return provider;
  } catch (error) {
    // If provider creation fails, throw a clear error
    if (error instanceof AIError) {
      throw error;
    }
    throw new AIError(
      AIErrorType.ConfigurationError,
      `Failed to initialize provider for model ${model}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'unknown'
    );
  }
}
