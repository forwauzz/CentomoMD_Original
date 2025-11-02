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
    const message = error?.message || 'Unknown error';
    
    if (status === 429) {
      return new AIError(AIErrorType.RateLimited, 'Rate limit exceeded', provider, error);
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
        return 'Model is currently busy. Please try again in a few moments.';
      case AIErrorType.Auth:
        return 'Authentication error. Please check your API key configuration.';
      case AIErrorType.Unavailable:
        return 'Model is temporarily unavailable. Please try a different model or try again later.';
      case AIErrorType.Timeout:
        return 'Request timed out. Please try again.';
      case AIErrorType.BadRequest:
        return 'Invalid request. Please check your input and try again.';
      default:
        return 'An error occurred while processing. Please try again.';
    }
  }
}
