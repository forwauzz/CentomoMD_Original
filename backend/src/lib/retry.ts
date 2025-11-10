/**
 * Retry Handler
 * Implements exponential backoff with jitter for resilient API calls
 */

export interface RetryConfig {
  maxRetries?: number;      // Default: 3
  backoffMs?: number;       // Default: 250ms → 2s exponential
  jitter?: boolean;          // Default: true
  retryableErrors?: string[]; // Which errors to retry
}

const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'retryableErrors'>> = {
  maxRetries: 3,
  backoffMs: 250,
  jitter: true,
};

export class RetryHandler {
  /**
   * Execute function with retry logic
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> {
    const maxRetries = config.maxRetries ?? DEFAULT_CONFIG.maxRetries;
    const backoffMs = config.backoffMs ?? DEFAULT_CONFIG.backoffMs;
    const jitter = config.jitter ?? DEFAULT_CONFIG.jitter;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error; // Final attempt failed
        }
        
        // Classify error: 4xx (don't retry) vs 5xx (retry)
        if (this.isRetryableError(error)) {
          const delay = backoffMs * Math.pow(2, attempt);
          const jitterMs = jitter ? Math.random() * 0.1 * delay : 0;
          await new Promise(resolve => setTimeout(resolve, delay + jitterMs));
        } else {
          throw error; // Don't retry non-retryable errors
        }
      }
    }
    
    // TypeScript requires this, though it's unreachable
    throw new Error('Retry logic failed unexpectedly');
  }
  
  /**
   * Determine if error is retryable
   * Retry on: 429 (rate limit), 500, 502, 503, 504
   * Don't retry on: 400, 401, 403, 404
   */
  private static isRetryableError(error: any): boolean {
    const status = error?.status || error?.response?.status;
    
    // Retry on server errors and rate limits
    if (status >= 500) return true;
    if (status === 429) return true; // Rate limited
    
    // Don't retry on client errors
    if (status >= 400 && status < 500) return false;
    
    // Network errors are retryable
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') return true;
    
    return false;
  }
}
