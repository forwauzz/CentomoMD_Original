/**
 * Model Price Configuration
 * Pricing per 1M tokens (input/output)
 * Updated regularly from provider documentation
 */

export const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  // OpenAI pricing (per 1M tokens)
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-4': { input: 30.00, output: 60.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  // Future models (TBD when available)
  'gpt-5': { input: 0.00, output: 0.00 }, // TBD
  'gpt-5-mini': { input: 0.00, output: 0.00 }, // TBD
  'gpt-5-turbo': { input: 0.00, output: 0.00 }, // TBD
  
  // Anthropic pricing (per 1M tokens)
  'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku': { input: 0.80, output: 4.00 },
  'claude-3-opus': { input: 15.00, output: 75.00 },
  'claude-3-sonnet': { input: 3.00, output: 15.00 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  // Future models (TBD)
  'claude-4-sonnet': { input: 0.00, output: 0.00 }, // TBD
  'claude-4-haiku': { input: 0.00, output: 0.00 }, // TBD
  'claude-4-opus': { input: 0.00, output: 0.00 }, // TBD
  
  // Google pricing (per 1M tokens)
  'gemini-pro': { input: 0.50, output: 1.50 },
  'gemini-ultra': { input: 1.25, output: 5.00 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  // Future models (TBD)
  'gemini-2-pro': { input: 0.00, output: 0.00 }, // TBD
  'gemini-2-ultra': { input: 0.00, output: 0.00 }, // TBD
  
  // Meta Llama (TBD - pricing varies by deployment)
  'llama-3.1-70b': { input: 0.00, output: 0.00 }, // TBD
  'llama-3.1-8b': { input: 0.00, output: 0.00 }, // TBD
  
  // Mistral (TBD)
  'mistral-large': { input: 0.00, output: 0.00 }, // TBD
  'mistral-medium': { input: 0.00, output: 0.00 }, // TBD
};

/**
 * Estimate cost for a model call
 * @param model Model identifier
 * @param usage Token usage (prompt and completion)
 * @returns Estimated cost in USD
 */
export function estimateCost(
  model: string,
  usage: { prompt: number; completion: number }
): number {
  const prices = MODEL_PRICES[model];
  if (!prices) {
    console.warn(`No price data for model: ${model}, defaulting to $0.00`);
    return 0.00;
  }
  
  const inputCost = (usage.prompt / 1_000_000) * prices.input;
  const outputCost = (usage.completion / 1_000_000) * prices.output;
  
  return inputCost + outputCost;
}

/**
 * Per-run cost cap (from environment or default)
 */
export const MAX_COST_PER_RUN = parseFloat(process.env['MAX_COST_PER_RUN'] ?? '0.50'); // $0.50 max

/**
 * Check if estimated cost exceeds cap
 */
export function exceedsCostCap(model: string, estimatedUsage: { prompt: number; completion: number }): boolean {
  const cost = estimateCost(model, estimatedUsage);
  return cost > MAX_COST_PER_RUN;
}
