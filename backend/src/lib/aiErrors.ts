/**
 * AI Error Taxonomy
 * Standardized error types for multi-provider support
 */

export enum AIErrorType {
  Timeout = 'TIMEOUT',
  RateLimited = 'RATE_LIMITED',
  BadRequest = 'BAD_REQUEST',
  Auth = 'AUTH',
  Unavailable = 'UNAVAILABLE',
  ServiceUnavailable = 'SERVICE_UNAVAILABLE',
  ConfigurationError = 'CONFIGURATION_ERROR',
  Unknown = 'UNKNOWN',
}

export class AIError extends Error {
  constructor(
    public type: AIErrorType,
    message: string,
    public provider: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
  
  /**
   * Convert provider-specific error to standardized AIError
   */
  static fromProviderError(provider: string, error: any): AIError {
    const status = error?.status || error?.response?.status;
    const message = error?.message || error?.error?.message || 'Unknown error';
    
    if (status === 429) {
      // Extract detailed error information from OpenAI
      const errorDetails = error?.error || error?.response?.data?.error || {};
      const errorType = errorDetails?.type || error?.code || '';
      const errorMessage = errorDetails?.message || message;
      
      // Check if it's a quota/billing issue vs rate limit
      const isQuotaError = errorMessage.toLowerCase().includes('quota') || 
                          errorMessage.toLowerCase().includes('billing') ||
                          errorMessage.toLowerCase().includes('exceeded your current quota');
      
      // Extract retry-after header if available
      const retryAfter = error?.response?.headers?.['retry-after'] || 
                        error?.headers?.['retry-after'] ||
                        error?.response?.headers?.['x-ratelimit-reset-requests'];
      
      const detailedMessage = isQuotaError
        ? `Quota exceeded: ${errorMessage}. This may be a billing/payment issue or account limit. Check your OpenAI account settings and billing details.`
        : `Rate limit exceeded: ${errorMessage}${retryAfter ? ` (Retry after: ${retryAfter}s)` : ''}`;
      
      return new AIError(AIErrorType.RateLimited, detailedMessage, provider, error);
    }
    if (status === 401 || status === 403) {
      return new AIError(AIErrorType.Auth, 'Authentication failed', provider, error);
    }
    if (status === 400) {
      return new AIError(AIErrorType.BadRequest, 'Invalid request', provider, error);
    }
    if (status >= 500) {
      return new AIError(AIErrorType.Unavailable, 'Provider unavailable', provider, error);
    }
    if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNABORTED') {
      return new AIError(AIErrorType.Timeout, 'Request timeout', provider, error);
    }
    
    return new AIError(AIErrorType.Unknown, message, provider, error);
  }
  
  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.type) {
      case AIErrorType.RateLimited:
        // Check if it's a quota/billing issue vs rate limit
        const isQuotaError = this.message.toLowerCase().includes('quota') || 
                            this.message.toLowerCase().includes('billing');
        if (isQuotaError) {
          return 'OpenAI account quota exceeded. This may be due to billing/payment issues or account limits. Please check your OpenAI account settings, billing information, and account status at https://platform.openai.com/account/billing.';
        }
        return 'Model is currently busy. Please try again in a few moments.';
      case AIErrorType.Auth:
        return 'Authentication error. Please check your API key configuration.';
      case AIErrorType.Unavailable:
      case AIErrorType.ServiceUnavailable:
        return 'Model is temporarily unavailable. Please try a different model or try again later.';
      case AIErrorType.Timeout:
        return 'Request timed out. Please try again.';
      case AIErrorType.BadRequest:
        return 'Invalid request. Please check your input and try again.';
      case AIErrorType.ConfigurationError:
        return 'Configuration error. Please check your API keys and feature flags.';
      default:
        return 'An error occurred while processing. Please try again.';
    }
  }
}
