/**
 * Circuit Breaker
 * Prevents cascading failures by opening circuit after consecutive failures
 */

export class CircuitBreaker {
  private failures: Map<string, number> = new Map();
  private lastFailure: Map<string, number> = new Map();
  private readonly threshold = 5; // Open after 5 failures
  private readonly timeout = 30000; // 30 seconds

  /**
   * Check if circuit is open for provider
   */
  isOpen(provider: string): boolean {
    const failures = this.failures.get(provider) ?? 0;
    const lastFailureTime = this.lastFailure.get(provider) ?? 0;
    
    if (failures >= this.threshold) {
      // Check if timeout expired
      if (Date.now() - lastFailureTime > this.timeout) {
        this.reset(provider);
        return false;
      }
      return true; // Circuit open
    }
    return false;
  }

  /**
   * Record successful call (closes circuit)
   */
  recordSuccess(provider: string): void {
    this.failures.delete(provider);
    this.lastFailure.delete(provider);
  }

  /**
   * Record failed call (increments failure count)
   */
  recordFailure(provider: string): void {
    const current = this.failures.get(provider) ?? 0;
    this.failures.set(provider, current + 1);
    this.lastFailure.set(provider, Date.now());
  }

  /**
   * Reset circuit for provider (manual override)
   */
  reset(provider: string): void {
    this.failures.delete(provider);
    this.lastFailure.delete(provider);
  }
}

// Global circuit breaker instance
export const circuitBreaker = new CircuitBreaker();

/**
 * Fallback model order (when primary fails)
 */
export const FALLBACK_MODELS = [
  'gpt-4o-mini',      // Primary
  'gpt-4o',           // Fallback 1
  'gpt-4-turbo',      // Fallback 2
] as const;
