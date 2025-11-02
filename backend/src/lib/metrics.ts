/**
 * Telemetry & Metrics
 * Prometheus metrics for observability
 */

// Note: Using console-based metrics for now
// In production, integrate with prom-client when available

export interface MetricLabels {
  provider?: string;
  model?: string;
  template?: string;
  error_type?: string;
  type?: 'input' | 'output';
}

export const metrics = {
  /**
   * Record evaluation latency
   */
  recordLatency(ms: number, labels: MetricLabels = {}): void {
    const { provider, model, template } = labels;
    console.log(`[METRIC] eval_latency_ms ${ms}ms`, { provider, model, template });
    // TODO: Integrate with Prometheus when available
    // metrics.evalLatency.observe(labels, ms);
  },

  /**
   * Record evaluation failure
   */
  recordFailure(labels: MetricLabels = {}): void {
    const { provider, model, error_type } = labels;
    console.log(`[METRIC] eval_fail_total`, { provider, model, error_type });
    // TODO: Integrate with Prometheus when available
    // metrics.evalFailures.inc(labels);
  },

  /**
   * Record tokens processed
   */
  recordTokens(count: number, labels: MetricLabels = {}): void {
    const { provider, model, type } = labels;
    console.log(`[METRIC] tokens_total ${count}`, { provider, model, type });
    // TODO: Integrate with Prometheus when available
    // metrics.tokensProcessed.inc(labels, count);
  },

  /**
   * Record cost
   */
  recordCost(usd: number, labels: MetricLabels = {}): void {
    const { provider, model } = labels;
    console.log(`[METRIC] cost_usd_total $${usd}`, { provider, model });
    // TODO: Integrate with Prometheus when available
    // metrics.costTotal.inc(labels, usd);
  },
};

/**
 * Generate trace ID for request correlation
 */
export function generateTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add trace ID to request/response
 */
export function addTraceId(req: any, res: any): void {
  const traceId = req.headers['x-trace-id'] || generateTraceId();
  res.setHeader('x-trace-id', traceId);
  req.traceId = traceId;
}
