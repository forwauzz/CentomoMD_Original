# Transcript Analysis Enhancement & Model Selection Implementation Plan

**Date:** 2024-12-27  
**Branch:** `feat/transcript-analysis-section7-improv`  
**Status:** 📋 Planning Phase

---

## Executive Summary

This plan implements the consultant's recommendations for enhancing the Transcript Analysis page while adding **multi-model support** (GPT-5, Gemini, Claude, etc.) through a **feature-flagged**, **surgical implementation** that ensures zero user impact.

**Key Principles:**
1. ✅ **Feature Flags First** - All new functionality gated by feature flags (default OFF)
2. ✅ **Surgical Implementation** - Minimal diffs (~3-30 lines per change)
3. ✅ **Backward Compatibility** - All existing flows continue working
4. ✅ **Experimental Mode** - Model selection available in Transcript Analysis first
5. ✅ **Gradual Rollout** - Can enable for template combinations/dictation after validation

---

## Acceptance Criteria

### Core Requirements

- [ ] Feature flag system for new enhancements (default OFF)
- [ ] Model abstraction layer supporting OpenAI, Anthropic (Claude), Google (Gemini)
- [ ] Model selection UI in Transcript Analysis page (feature-flagged)
- [ ] Per-template model configuration (optional override)
- [ ] Run controls (seed, temperature, model, prompt_hash) for reproducibility
- [ ] Template combinations support in Transcript Analysis page
- [ ] Layer integration into ProcessingOrchestrator (additive, backward compatible)
- [ ] Zero breaking changes to existing Dictation page, Word-for-Word templates, Universal Cleanup

### Model Selection Requirements

- [ ] Support multiple AI providers (OpenAI, Anthropic, Google)
- [ ] Model selection dropdown in Transcript Analysis page (feature-flagged)
- [ ] Per-template model override capability
- [ ] Default model fallback to current behavior (`gpt-4o-mini`)
- [ ] Model-specific configuration (API keys, endpoints)
- [ ] Cost tracking per model/provider

### Experimental Requirements

- [ ] Model selection available ONLY in Transcript Analysis page initially
- [ ] Can compare outputs from different models side-by-side
- [ ] Can A/B test templates with different models
- [ ] After validation, can enable model selection for template combinations/dictation via feature flag

---

## Critical Gaps & Production Safety (Consultant Feedback)

**Status:** 🔴 **BLOCKER** - Must be addressed before production deployment

Based on consultant audit, the following critical gaps have been identified. These **MUST** be implemented to ensure production safety, compliance (HIPAA, PIPEDA, Law 25), and operational reliability.

### 1. Database Schema for Eval/Benchmark Persistence (BLOCKER)

**Issue:** No persistence for evals/benchmarks = cannot compare models/templates over time or debug regressions.

**Solution:** Create minimal database tables now (not deferred):

```typescript
// backend/src/database/schema.ts - ADD

// Eval runs table - tracks each model/template execution
export const eval_runs = pgTable('eval_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  template_ref: varchar('template_ref', { length: 255 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  seed: integer('seed'),
  temperature: decimal('temperature', { precision: 3, scale: 2 }),
  prompt_hash: varchar('prompt_hash', { length: 64 }), // SHA-256 hash
  section: text('section', { enum: ['section_7', 'section_8', 'section_11'] }).notNull(),
  lang: varchar('lang', { length: 10 }).notNull(), // 'fr' | 'en'
  layer_stack: jsonb('layer_stack').$type<string[]>().default([]),
  stack_fingerprint: varchar('stack_fingerprint', { length: 64 }),
  template_base: varchar('template_base', { length: 255 }),
  template_version: varchar('template_version', { length: 50 }),
  latency_ms: integer('latency_ms'),
  tokens_in: integer('tokens_in'),
  tokens_out: integer('tokens_out'),
  cost_usd: decimal('cost_usd', { precision: 10, scale: 6 }),
  success: boolean('success').notNull().default(true),
  error: text('error'),
  deterministic: boolean('deterministic').notNull().default(false), // False if seed ignored
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Eval results table - stores metrics, diffs, compliance checks
export const eval_results = pgTable('eval_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  run_id: uuid('run_id').notNull().references(() => eval_runs.id, { onDelete: 'cascade' }),
  metrics_json: jsonb('metrics_json').$type<Record<string, number>>(),
  diffs_json: jsonb('diffs_json').$type<Record<string, any>>(), // Diff comparison results
  compliance_json: jsonb('compliance_json').$type<Record<string, boolean>>(), // Law 25, HIPAA checks
  overall_score: decimal('overall_score', { precision: 5, scale: 2 }), // 0-100 score
  layer_metrics: jsonb('layer_metrics').$type<Record<string, any>>(), // Per-layer performance
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**Migration:** Create Drizzle migration for these tables (Phase 1).

---

### 2. Enhanced AI Provider Interface (BLOCKER)

**Issue:** Current interface lacks capabilities, retry logic, cost estimation, and determinism notes.

**Solution:** Enhanced interface with production requirements:

```typescript
// backend/src/lib/aiProvider.ts - ENHANCED

export interface ModelCapabilities {
  json: boolean;           // Supports JSON response format
  seed: boolean;           // Supports seed parameter for determinism
  maxInput: number;        // Maximum input tokens
  defaultTempScale: number; // Default temperature scale (0-2 for OpenAI, 0-1 for some)
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

// Retry configuration
export interface RetryConfig {
  maxRetries?: number;      // Default: 3
  backoffMs?: number;       // Default: 250ms → 2s exponential
  jitter?: boolean;          // Default: true
  retryableErrors?: string[]; // Which errors to retry
}

// Circuit breaker per provider
export interface CircuitBreaker {
  isOpen(provider: string): boolean;
  recordSuccess(provider: string): void;
  recordFailure(provider: string): void;
  reset(provider: string): void;
}
```

---

### 3. Retry, Circuit Breaker & Fallback Strategy (BLOCKER)

**Issue:** No plan for 429/5xx handling, vendor outages, or rate limits.

**Solution:** Implement provider-specific retry/circuit breaker:

```typescript
// backend/src/lib/retry.ts (NEW)

export class RetryHandler {
  static async withRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> {
    const maxRetries = config.maxRetries ?? 3;
    const backoffMs = config.backoffMs ?? 250;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        // Classify error: 4xx (don't retry) vs 5xx (retry)
        if (this.isRetryableError(error)) {
          const delay = backoffMs * Math.pow(2, attempt);
          const jitter = config.jitter ? Math.random() * 0.1 * delay : 0;
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
        } else {
          throw error; // Don't retry non-retryable errors
        }
      }
    }
  }
  
  private static isRetryableError(error: any): boolean {
    // Retry on: 429 (rate limit), 500, 502, 503, 504
    // Don't retry on: 400, 401, 403, 404
    const status = error?.status || error?.response?.status;
    return status >= 500 || status === 429;
  }
}

// backend/src/lib/circuitBreaker.ts (NEW)

export class CircuitBreaker {
  private failures: Map<string, number> = new Map();
  private lastFailure: Map<string, number> = new Map();
  private readonly threshold = 5; // Open after 5 failures
  private readonly timeout = 30000; // 30 seconds
  
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
  
  recordSuccess(provider: string): void {
    this.failures.delete(provider);
    this.lastFailure.delete(provider);
  }
  
  recordFailure(provider: string): void {
    const current = this.failures.get(provider) ?? 0;
    this.failures.set(provider, current + 1);
    this.lastFailure.set(provider, Date.now());
  }
  
  reset(provider: string): void {
    this.failures.delete(provider);
    this.lastFailure.delete(provider);
  }
}

// Fallback order configuration
export const FALLBACK_MODELS = [
  'gpt-4o-mini',      // Primary
  'gpt-4o',           // Fallback 1
  'gpt-4-turbo',      // Fallback 2
] as const;
```

---

### 4. Server-Side Flag Enforcement (BLOCKER)

**Issue:** Client flags alone are unsafe - savvy users could bypass them.

**Solution:** Backend must enforce flags:

```typescript
// backend/src/routes/format.ts - ADD

router.post('/mode2', async (req, res) => {
  // ... existing code ...
  
  // SERVER-SIDE ENFORCEMENT
  const modelRequested = req.body.model;
  if (modelRequested && !FLAGS.FEATURE_MODEL_SELECTION) {
    // Ignore model param, use default
    req.body.model = undefined;
    console.warn(`[SECURITY] Model selection requested but flag disabled, using default`);
  }
  
  if (modelRequested && !FLAGS.FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS) {
    // Reject if not from transcript analysis (can check via user agent or route context)
    if (isTranscriptAnalysisRequest(req)) {
      req.body.model = undefined;
      console.warn(`[SECURITY] Model selection for transcript analysis disabled`);
    }
  }
  
  // ... rest of route ...
});
```

---

### 5. Compliance Controls (PHI/PII Safety) (BLOCKER)

**Issue:** No PHI scrubbing, audit logging, or data control flags.

**Solution:** Add compliance layer:

```typescript
// backend/src/lib/compliance.ts (NEW)

export class ComplianceLayer {
  // Scrub PHI/PII from logs
  static scrubForLogging(content: string): string {
    // Remove: names, dates, addresses, phone numbers, emails, SSNs
    // Replace with [REDACTED] or hash
    return content; // Implementation details
  }
  
  // Hash content for audit logs (don't store raw PHI)
  static hashContent(content: string): string {
    // SHA-256 hash
    return createHash('sha256').update(content).digest('hex');
  }
  
  // Audit log (hashed, no raw PHI)
  static async logRequest(
    userId: string,
    templateRef: string,
    model: string,
    contentHash: string,
    metadata: Record<string, any>
  ): Promise<void> {
    // Insert into audit_logs with hashed content
    // Never log raw transcript content in production
  }
  
  // Enforce data control flags per provider
  static enforceDataControls(provider: string): Record<string, any> {
    // Add X-no-log flags for Anthropic, data residency for others
    const controls: Record<string, any> = {};
    
    if (provider === 'anthropic') {
      controls['anthropic-beta'] = 'no-logging'; // Anthropic no-logging flag
    }
    
    if (provider === 'openai') {
      // OpenAI: configure data residency if available
      controls['organization'] = process.env['OPENAI_ORG_ID']; // Use org with data controls
    }
    
    return controls;
  }
}
```

---

### 6. Cost Tracking with Price Tables (BLOCKER)

**Issue:** Different vendors expose usage differently, no cost estimation.

**Solution:** Model price table + cost calculation:

```typescript
// backend/src/config/modelPrices.ts (NEW)

export const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  // OpenAI pricing (per 1M tokens)
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-5': { input: 0.00, output: 0.00 }, // TBD when available
  
  // Anthropic pricing
  'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku': { input: 0.80, output: 4.00 },
  'claude-3-opus': { input: 15.00, output: 75.00 },
  
  // Google pricing
  'gemini-pro': { input: 0.50, output: 1.50 },
  'gemini-ultra': { input: 1.25, output: 5.00 },
};

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

// Per-run cost cap
export const MAX_COST_PER_RUN = parseFloat(process.env['MAX_COST_PER_RUN'] ?? '0.50'); // $0.50 max
```

---

### 7. Error Taxonomy & UX (BLOCKER)

**Issue:** Provider errors are vendor-specific, need standardization.

**Solution:** Standardize errors:

```typescript
// backend/src/lib/aiErrors.ts (NEW)

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
  }
  
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
    
    return new AIError(AIErrorType.Unknown, message, provider, error);
  }
  
  // User-friendly message
  getUserMessage(): string {
    switch (this.type) {
      case AIErrorType.RateLimited:
        return 'Model is currently busy. Please try again in a few moments.';
      case AIErrorType.Auth:
        return 'Authentication error. Please check your API key configuration.';
      case AIErrorType.Unavailable:
        return 'Model is temporarily unavailable. Please try a different model or try again later.';
      default:
        return 'An error occurred while processing. Please try again.';
    }
  }
}
```

---

### 8. Statistical Rigor for A/B Testing (BLOCKER)

**Issue:** No paired tests or CI for A/B testing over sets.

**Solution:** Add statistical analysis:

```typescript
// backend/src/routes/benchmark.ts (NEW)

router.post('/benchmark', async (req, res) => {
  // ... run benchmarks on N items ...
  
  // Statistical analysis
  const results = await runBenchmark(req.body.items, req.body.config);
  
  // Wilcoxon signed-rank test + bootstrap CI
  const stats = statisticalAnalysis(results);
  
  res.json({
    results,
    statistics: {
      p_value: stats.pValue,        // Wilcoxon p-value
      ci_low: stats.ciLow,          // 95% CI lower bound
      ci_high: stats.ciHigh,        // 95% CI upper bound
      effect_size: stats.effectSize,
      significant: stats.pValue < 0.05,
    },
  });
});
```

---

### 9. Idempotency & Duplicate Prevention (BLOCKER)

**Issue:** Same input+params might be processed multiple times.

**Solution:** Idempotency key support:

```typescript
// backend/src/routes/format.ts - ADD

router.post('/mode2', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  
  if (idempotencyKey) {
    // Check cache for this key (within 24h window)
    const cached = await idempotencyCache.get(idempotencyKey);
    if (cached) {
      return res.json(cached);
    }
  }
  
  // ... process request ...
  
  if (idempotencyKey) {
    // Cache result for 24h
    await idempotencyCache.set(idempotencyKey, result, 86400);
  }
  
  res.json(result);
});
```

---

### 10. Telemetry & Observability (BLOCKER)

**Issue:** No metrics for latency, failures, costs, or trace correlation.

**Solution:** Add Prometheus metrics:

```typescript
// backend/src/lib/metrics.ts (NEW)

import { Counter, Histogram, Gauge } from 'prom-client';

export const metrics = {
  evalLatency: new Histogram({
    name: 'eval_latency_ms',
    help: 'Evaluation latency in milliseconds',
    labelNames: ['provider', 'model', 'template'],
  }),
  
  evalFailures: new Counter({
    name: 'eval_fail_total',
    help: 'Total evaluation failures',
    labelNames: ['provider', 'model', 'error_type'],
  }),
  
  tokensProcessed: new Counter({
    name: 'tokens_total',
    help: 'Total tokens processed',
    labelNames: ['provider', 'model', 'type'], // 'input' or 'output'
  }),
  
  costTotal: new Counter({
    name: 'cost_usd_total',
    help: 'Total cost in USD',
    labelNames: ['provider', 'model'],
  }),
};

// Add trace ID correlation
export function addTraceId(req: any, res: any): void {
  const traceId = req.headers['x-trace-id'] || generateTraceId();
  res.setHeader('x-trace-id', traceId);
  req.traceId = traceId;
}
```

---

### 11. User Allowlist (BLOCKER)

**Issue:** Even with flags OFF, need additional safety for experiments.

**Solution:** User allowlist configuration:

```typescript
// backend/src/config/flags.ts - ADD

export const EXPERIMENT_ALLOWLIST = (process.env['EXPERIMENT_ALLOWLIST'] ?? '')
  .split(',')
  .map(email => email.trim())
  .filter(Boolean);

export function isAllowedForExperiment(userEmail?: string): boolean {
  if (!FLAGS.FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS) {
    return false;
  }
  
  // If allowlist empty, allow all (when flag enabled)
  if (EXPERIMENT_ALLOWLIST.length === 0) {
    return true;
  }
  
  return userEmail ? EXPERIMENT_ALLOWLIST.includes(userEmail) : false;
}
```

---

### 12. Template Identity Resolver (BLOCKER)

**Issue:** Two sources of truth (templateId/templateCombo) will cause drift.

**Solution:** Single resolver with deprecation warnings:

```typescript
// backend/src/services/layers/LayerManager.ts - ADD

export function resolveTemplateIdentity(
  templateRef?: string,
  templateId?: string,
  templateCombo?: string
): { 
  templateRef: string;
  deprecated: boolean;
  warning?: string;
} {
  // NEW: Prefer templateRef
  if (templateRef) {
    return { templateRef, deprecated: false };
  }
  
  // DEPRECATED: Map old fields to templateRef
  const mapped = templateId || templateCombo;
  if (mapped) {
    return {
      templateRef: mapped,
      deprecated: true,
      warning: 'templateId/templateCombo are deprecated, use templateRef',
    };
  }
  
  // Fallback: section-based default
  throw new Error('No template identifier provided');
}
```

---

### Updated Phase Plan with Critical Gaps

**Phase 1 (UPDATED):** Feature Flags + Model Abstraction + **Database Schema + Compliance**
- Create `eval_runs` and `eval_results` tables
- Add compliance layer (PHI scrubbing, audit logging)
- Enhanced AI provider interface with capabilities

**Phase 2 (UPDATED):** Backend Parameters + **Retry/Circuit Breaker + Server-Side Flags**
- Add retry/circuit breaker logic
- Server-side flag enforcement
- Cost tracking with price tables

**Phase 3 (UPDATED):** Layer Integration + **Error Taxonomy + Idempotency**
- Standardize errors
- Add idempotency support
- Telemetry/metrics

**Phase 4 (UPDATED):** Transcript Analysis UI + **Statistical Analysis + User Allowlist**
- A/B testing with statistical rigor
- User allowlist enforcement
- Template identity resolver

**Phases 5-6:** Integration & rollout (unchanged)

---

## Impacted Files & Justification

### Backend Files

1. **`backend/src/lib/aiProvider.ts`** (NEW)
   - **Why:** Model abstraction layer for multi-provider support with enhanced capabilities
   - **Impact:** ~200-250 LOC, pure abstraction, no breaking changes

2. **`backend/src/lib/retry.ts`** (NEW)
   - **Why:** Retry logic with exponential backoff and jitter
   - **Impact:** ~50-80 LOC

3. **`backend/src/lib/circuitBreaker.ts`** (NEW)
   - **Why:** Circuit breaker per provider for fault tolerance
   - **Impact:** ~60-100 LOC

4. **`backend/src/lib/compliance.ts`** (NEW)
   - **Why:** PHI/PII scrubbing, audit logging, data controls
   - **Impact:** ~100-150 LOC

5. **`backend/src/lib/aiErrors.ts`** (NEW)
   - **Why:** Standardized error taxonomy and user-friendly messages
   - **Impact:** ~80-120 LOC

6. **`backend/src/lib/metrics.ts`** (NEW)
   - **Why:** Prometheus metrics for observability
   - **Impact:** ~60-100 LOC

7. **`backend/src/config/modelPrices.ts`** (NEW)
   - **Why:** Model price table and cost estimation
   - **Impact:** ~80-120 LOC

8. **`backend/src/routes/benchmark.ts`** (NEW)
   - **Why:** Statistical analysis endpoint for A/B testing
   - **Impact:** ~150-200 LOC

9. **`backend/src/config/flags.ts`**
   - **Why:** Add feature flags and user allowlist configuration
   - **Impact:** ~20-30 lines added

10. **`backend/src/database/schema.ts`**
    - **Why:** Add `eval_runs` and `eval_results` tables for persistence
    - **Impact:** ~50-80 lines added

11. **`backend/src/routes/format.ts`**
    - **Why:** Add `templateRef`, `model`, `seed`, `temperature`, server-side flag enforcement, idempotency
    - **Impact:** ~60-80 lines added, preserves existing logic

12. **`backend/src/services/processing/ProcessingOrchestrator.ts`**
    - **Why:** Add layer processing support, retry/circuit breaker integration (additive)
    - **Impact:** ~80-120 lines added, existing routing preserved

13. **`backend/src/services/layers/LayerManager.ts`**
    - **Why:** Add `resolveTemplateRef()` and `resolveTemplateIdentity()` methods (additive)
    - **Impact:** ~50-70 lines added

6. **`backend/src/services/layers/UniversalCleanupLayer.ts`**
   - **Why:** Support model selection through abstraction layer
   - **Impact:** ~10-15 lines changed (use abstraction instead of direct OpenAI)

7. **`backend/src/services/formatter/section7AI.ts`**, **`section8AI.ts`**, **`shared.ts`**
   - **Why:** Support model selection through abstraction layer
   - **Impact:** ~5-10 lines per file (use abstraction)

### Frontend Files

8. **`frontend/src/lib/featureFlags.ts`**
   - **Why:** Add feature flags for model selection and enhancements
   - **Impact:** ~10-15 lines added

9. **`frontend/src/pages/TranscriptAnalysisPage.tsx`**
   - **Why:** Add model selection UI, template combinations support, run controls
   - **Impact:** ~100-150 lines added, isolated to this page

10. **`frontend/src/components/ui/ModelSelector.tsx`** (NEW)
    - **Why:** Reusable model selection component
    - **Impact:** ~50-80 LOC, isolated component

### Config Files

11. **`env.example`**
    - **Why:** Document new environment variables for AI providers
    - **Impact:** ~15-20 lines added

12. **`.env.example`** (frontend)
    - **Why:** Document frontend feature flag variables
    - **Impact:** ~5-10 lines added

---

## Implementation Plan (6 Phases)

### Phase 1: Feature Flags & Model Abstraction Layer + Database Schema + Compliance (Week 1)

**Goal:** Create model abstraction layer, feature flag infrastructure, database schema, and compliance controls.

**Tasks:**

1. **Add Feature Flags** (~15 min)
   - Add `FEATURE_MODEL_SELECTION` flag to `backend/src/config/flags.ts` (default: `false`)
   - Add `modelSelection` flag to `frontend/src/lib/featureFlags.ts` (default: `false`)
   - Add `FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS` flag (default: `false`)
   - Add `EXPERIMENT_ALLOWLIST` configuration

2. **Create Database Schema** (~1 hour)
   - Add `eval_runs` table to `backend/src/database/schema.ts`
   - Add `eval_results` table to `backend/src/database/schema.ts`
   - Create Drizzle migration for new tables
   - Run migration

3. **Create Model Abstraction Layer** (~3-4 hours)
   - Create `backend/src/lib/aiProvider.ts` with:
     - Enhanced `AIProvider` interface (capabilities, retry, cost estimation, determinism)
     - `ModelCapabilities` interface
     - `OpenAIProvider` implementation with full capabilities
     - `AnthropicProvider` implementation (stub initially)
     - `GoogleProvider` implementation (stub initially)
     - `getAIProvider(model: string)` factory function
   - Default to OpenAI for backward compatibility

4. **Create Compliance Layer** (~2-3 hours)
   - Create `backend/src/lib/compliance.ts`
   - Implement PHI/PII scrubbing for logs
   - Implement content hashing for audit logs
   - Implement data control flags per provider
   - Audit logging (hashed, no raw PHI)

5. **Update Environment Variables** (~15 min)
   - Add `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` to `env.example`
   - Add `EXPERIMENT_ALLOWLIST` to `env.example`
   - Add `MAX_COST_PER_RUN` to `env.example`
   - Document model selection flags

**Backward Compatibility:**
- ✅ Default model remains `gpt-4o-mini` (OpenAI)
- ✅ Existing code continues to work unchanged
- ✅ Feature flags default to OFF (no user impact)

**Test Plan:**
- [ ] Unit tests for `AIProvider` interface
- [ ] Integration test: default behavior unchanged when flags OFF
- [ ] Integration test: OpenAI provider works with existing code

---

### Phase 2: Backend Parameter Enhancement + Retry/Circuit Breaker + Server-Side Flags (Week 1-2)

**Goal:** Add `templateRef`, model selection, run controls, retry/circuit breaker, server-side flag enforcement, and cost tracking.

**Tasks:**

1. **Create Retry & Circuit Breaker** (~2-3 hours)
   - Create `backend/src/lib/retry.ts` with exponential backoff + jitter
   - Create `backend/src/lib/circuitBreaker.ts` with per-provider circuit breaker
   - Configure fallback model order
   - Integrate with AI provider interface

2. **Create Cost Tracking** (~1-2 hours)
   - Create `backend/src/config/modelPrices.ts` with price table
   - Implement `estimateCost()` function
   - Add cost cap per run (`MAX_COST_PER_RUN`)
   - Integrate cost tracking into `AIProvider`

3. **Enhance `/api/format/mode2` Route** (~2-3 hours)
   - Add `templateRef` parameter (supports `templateId`/`templateCombo` for backward compat)
   - Add `model` parameter (optional, defaults to `gpt-4o-mini`)
   - Add `seed`, `temperature`, `prompt_hash` parameters (optional, for reproducibility)
   - **Server-side flag enforcement** (ignore model param if flag OFF)
   - **Idempotency key support** (check cache, store result)
   - Preserve existing parameter handling

4. **Add Layer Resolution** (~1-2 hours)
   - Add `LayerManager.resolveTemplateRef()` method
   - Add `LayerManager.resolveTemplateIdentity()` with deprecation warnings
   - Returns `{ baseTemplateId, layerStack, stack_fingerprint }`
   - Support both template combinations and base templates

5. **Integrate Model Selection** (~1 hour)
   - Pass `model` parameter to `ProcessingOrchestrator`
   - Use `AIProvider` abstraction instead of direct OpenAI calls
   - Apply retry/circuit breaker logic
   - Track costs per run

**Backward Compatibility:**
- ✅ All existing API calls continue to work
- ✅ Missing parameters default to current behavior
- ✅ `templateId`/`templateCombo` still supported (mapped to `templateRef` internally)

**Test Plan:**
- [ ] Integration test: existing API calls unchanged
- [ ] Integration test: `templateRef` resolves correctly
- [ ] Integration test: model selection works (when flag enabled)

---

### Phase 3: ProcessingOrchestrator Layer Integration + Error Taxonomy + Idempotency + Telemetry (Week 2)

**Goal:** Add layer processing support, standardized errors, idempotency, and telemetry to ProcessingOrchestrator.

**Tasks:**

1. **Create Error Taxonomy** (~1-2 hours)
   - Create `backend/src/lib/aiErrors.ts`
   - Define `AIErrorType` enum (Timeout, RateLimited, BadRequest, Auth, Unavailable, Unknown)
   - Implement `AIError` class with `fromProviderError()` method
   - Implement `getUserMessage()` for user-friendly error messages

2. **Create Telemetry/Metrics** (~2-3 hours)
   - Create `backend/src/lib/metrics.ts` with Prometheus metrics
   - Add metrics: `eval_latency_ms`, `eval_fail_total`, `tokens_total`, `cost_usd_total`
   - Add trace ID correlation (`x-trace-id` header)
   - Integrate metrics into routes and orchestrator

3. **Enhance ProcessingOrchestrator** (~2-3 hours)
   - Add optional `layerStack` parameter to `ProcessingRequest`
   - Add `applyPreLayers()` method (processes layers before template)
   - Add `applyPostLayers()` method (processes layers after template)
   - Integrate retry/circuit breaker logic
   - Integrate error taxonomy
   - Preserve existing template routing logic

4. **Integrate LayerManager** (~1 hour)
   - Use `LayerManager` for layer processing
   - Support pre/post layer execution order
   - Track layer metrics in `eval_results.layer_metrics`

**Backward Compatibility:**
- ✅ If `layerStack` not provided, behavior unchanged
- ✅ Existing template handlers unchanged
- ✅ Layer processing only when explicitly requested

**Test Plan:**
- [ ] Integration test: existing templates work unchanged
- [ ] Integration test: layer processing works with template combinations
- [ ] Integration test: pre/post layer order correct

---

### Phase 4: Transcript Analysis Page Enhancement + Statistical Analysis + User Allowlist (Week 2-3)

**Goal:** Add model selection UI, template combinations, run controls, statistical analysis, and user allowlist to Transcript Analysis page (feature-flagged).

**Tasks:**

1. **Create Model Selector Component** (~1-2 hours)
   - Create `frontend/src/components/ui/ModelSelector.tsx`
   - Dropdown with available models (OpenAI, Anthropic, Google)
   - Feature-flagged: only visible when `modelSelection` flag enabled
   - User allowlist enforcement (check backend flag)

2. **Create Benchmark/Statistical Analysis Endpoint** (~3-4 hours)
   - Create `backend/src/routes/benchmark.ts`
   - Implement `/api/benchmark` endpoint
   - Add Wilcoxon signed-rank test
   - Add bootstrap confidence intervals
   - Store statistics in `eval_runs` (p_value, ci_low, ci_high)
   - Require ≥N items for statistical rigor

3. **Enhance Transcript Analysis Page** (~3-4 hours)
   - Add template combinations dropdown (loads from `template-combinations.json`)
   - Add model selector (feature-flagged + user allowlist check)
   - Add run controls UI (seed, temperature, prompt_hash)
   - Update API calls to include `templateRef`, `model`, run controls
   - Support A/B testing with different models
   - **Add statistical analysis UI** (p-value, CI, significance indicator)
   - **Add user allowlist UI feedback** (show error if not allowed)

4. **Update Backend API Response** (~1 hour)
   - Add `layerStack`, `stack_fingerprint`, `template_base`, `operational` fields to response
   - Add `deterministic` field (false if seed ignored)
   - Add `statistics` field for A/B testing results (p_value, ci_low, ci_high)
   - All fields optional for backward compatibility

5. **User Allowlist Enforcement** (~30 min)
   - Check user email against allowlist in backend
   - Return 403 if user not allowed (when flag enabled)
   - Frontend shows appropriate error message

**Backward Compatibility:**
- ✅ Only affects Transcript Analysis page (isolated)
- ✅ Feature flags default to OFF (no user impact)
- ✅ Dictation page unchanged

**Test Plan:**
- [ ] E2E test: Transcript Analysis page unchanged when flags OFF
- [ ] E2E test: Model selection works when flag enabled
- [ ] E2E test: Template combinations work
- [ ] E2E test: A/B testing with different models works

---

### Phase 5: Model Abstraction Integration (Week 3)

**Goal:** Integrate model abstraction layer into existing AI formatters (surgical changes).

**Tasks:**

1. **Update UniversalCleanupLayer** (~30 min)
   - Replace direct OpenAI calls with `AIProvider` abstraction
   - Support model selection parameter

2. **Update Section7AIFormatter** (~30 min)
   - Replace direct OpenAI calls with `AIProvider` abstraction
   - Support model selection parameter

3. **Update Section8AIFormatter** (~30 min)
   - Replace direct OpenAI calls with `AIProvider` abstraction
   - Support model selection parameter

4. **Update Other AI Formatters** (~1 hour)
   - `shared.ts`, `Extractor.ts`, `TemplatePipeline.ts`
   - Surgical changes: replace direct OpenAI with abstraction

**Backward Compatibility:**
- ✅ Default model remains `gpt-4o-mini` (OpenAI)
- ✅ If model not specified, uses default
- ✅ Existing behavior unchanged

**Test Plan:**
- [ ] Integration test: existing formatters work unchanged
- [ ] Integration test: model selection works when specified
- [ ] Integration test: OpenAI provider matches current behavior

---

### Phase 6: Template Combinations & Gradual Rollout (Week 3)

**Goal:** Enable template combinations support and prepare for gradual rollout to dictation/template combinations pages.

**Tasks:**

1. **Template Combinations Support** (~1 hour)
   - Ensure `templateRef` resolves template combinations correctly
   - Layer processing works with combinations
   - Test with all existing combinations

2. **Documentation & Configuration** (~1 hour)
   - Document model selection feature
   - Document how to enable for template combinations/dictation
   - Create migration guide for gradual rollout

3. **Feature Flag Configuration** (~30 min)
   - Document how to enable `FEATURE_MODEL_SELECTION` for template combinations
   - Document how to enable for dictation page
   - Create rollback plan

**Backward Compatibility:**
- ✅ All existing functionality preserved
- ✅ Feature flags remain OFF by default
- ✅ Can enable gradually per user/page/template

**Test Plan:**
- [ ] Integration test: template combinations work
- [ ] Integration test: all existing combinations unchanged
- [ ] E2E test: gradual rollout configuration correct

---

## Model Provider Implementation Details

### AI Provider Interface (ENHANCED)

**Note:** This interface has been enhanced based on consultant feedback to include capabilities, retry logic, cost estimation, and determinism support.

See **Section 2: Enhanced AI Provider Interface** in the "Critical Gaps & Production Safety" section above for the complete enhanced interface definition.

**Key Enhancements:**
- ✅ Model capabilities (`supportsJson`, `supportsSeed`, `maxInput`, `defaultTempScale`)
- ✅ Retry configuration with exponential backoff
- ✅ Circuit breaker support
- ✅ Cost estimation per provider
- ✅ Determinism normalization (seed/temperature)
- ✅ Timeout and abort signal support

### Provider Implementations

**OpenAI Provider** (Priority 1 - Existing):
- Models: `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`, `gpt-5` (when available)
- Uses existing OpenAI client
- Cost tracking via usage tokens

**Anthropic Provider** (Priority 2 - Stub first):
- Models: `claude-3-5-sonnet`, `claude-3-5-haiku`, `claude-3-opus`
- Requires `ANTHROPIC_API_KEY` environment variable
- Can implement later, interface ready

**Google Provider** (Priority 3 - Stub first):
- Models: `gemini-pro`, `gemini-ultra`
- Requires `GOOGLE_API_KEY` environment variable
- Can implement later, interface ready

---

## Feature Flag Strategy

### Backend Feature Flags

**`backend/src/config/flags.ts`:**

```typescript
export const FLAGS = {
  // ... existing flags ...
  
  // Model selection feature flags
  FEATURE_MODEL_SELECTION: (process.env['FEATURE_MODEL_SELECTION'] ?? 'false') === 'true',
  FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS: (process.env['FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS'] ?? 'false') === 'true',
  FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS: (process.env['FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS'] ?? 'false') === 'true',
  FEATURE_MODEL_SELECTION_DICTATION: (process.env['FEATURE_MODEL_SELECTION_DICTATION'] ?? 'false') === 'true',
  
  // Enhanced transcript analysis features
  FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS: (process.env['FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS'] ?? 'false') === 'true',
  FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS: (process.env['FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS'] ?? 'false') === 'true',
  
  // Layer integration
  FEATURE_LAYER_PROCESSING: (process.env['FEATURE_LAYER_PROCESSING'] ?? 'false') === 'true',
} as const;
```

### Frontend Feature Flags

**`frontend/src/lib/featureFlags.ts`:**

```typescript
export interface FeatureFlags {
  // ... existing flags ...
  modelSelection: boolean;
  modelSelectionTranscriptAnalysis: boolean;
  modelSelectionTemplateCombinations: boolean;
  modelSelectionDictation: boolean;
  enhancedTranscriptAnalysis: boolean;
  templateCombinationsInAnalysis: boolean;
}
```

### Feature Flag Rollout Strategy

**Phase 1: Experimental (Transcript Analysis only)**
- `FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true` → Enable model selection in Transcript Analysis page
- All other flags OFF → No impact on dictation/template combinations

**Phase 2: Template Combinations (after validation)**
- `FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS=true` → Enable model selection for template combinations
- Requires validation from Phase 1

**Phase 3: Dictation Page (after validation)**
- `FEATURE_MODEL_SELECTION_DICTATION=true` → Enable model selection for dictation page
- Requires validation from Phase 2

---

## Backward Compatibility Guarantees

### API Compatibility

**Existing API calls continue to work:**

```typescript
// BEFORE (existing code)
POST /api/format/mode2
{
  transcript: "...",
  section: "7",
  templateId: "section7-ai-formatter"
}

// AFTER (backward compatible)
POST /api/format/mode2
{
  transcript: "...",
  section: "7",
  templateId: "section7-ai-formatter"  // Still works!
  // OR
  templateRef: "section7-ai-formatter"  // New unified field
  // OR
  templateCombo: "template-verbatim"    // Still works!
}
```

### Default Behavior

- **Model:** Defaults to `gpt-4o-mini` (OpenAI) if not specified
- **Template:** Defaults to section-based template if not specified
- **Layers:** No layer processing if `layerStack` not provided
- **Feature Flags:** All default to `false` (OFF)

### Existing Flows Preserved

1. ✅ **Dictation Page:** Uses `templateCombo` parameter, continues working
2. ✅ **Word-for-Word Templates:** Frontend preprocessing preserved
3. ✅ **Universal Cleanup:** `useUniversal` flag continues to work
4. ✅ **Section-Based Mapping:** Fallback to `section7-ai-formatter` preserved
5. ✅ **ProcessingOrchestrator:** Existing template routing unchanged

---

## Testing Strategy

### Unit Tests

- [ ] `AIProvider` interface implementations
- [ ] `LayerManager.resolveTemplateRef()` method
- [ ] `ProcessingOrchestrator` layer processing
- [ ] Model selection parameter handling

### Integration Tests

- [ ] Existing API calls unchanged (backward compatibility)
- [ ] Model selection works with OpenAI
- [ ] Template combinations resolve correctly
- [ ] Layer processing works with template combinations
- [ ] Universal Cleanup with model selection

### E2E Tests

- [ ] Transcript Analysis page unchanged when flags OFF
- [ ] Model selection UI appears when flag enabled
- [ ] Template combinations work in Transcript Analysis
- [ ] A/B testing with different models works
- [ ] Dictation page unchanged

---

## Rollback Plan

### Feature Flag Rollback

**If issues detected:**
1. Set `FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=false`
2. Set `FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=false`
3. All functionality reverts to previous behavior
4. No code changes required (feature flags)

### Code Rollback

**If code issues detected:**
1. Revert branch to previous commit
2. Feature flags already OFF by default
3. No database migrations required
4. No breaking changes (all additive)

---

## Database Schema (Future)

**Note:** Database schema for benchmarking is **deferred** per consultant recommendations. Can be added later after validating model selection works.

**Future Schema (not in this plan):**
- `benchmark_runs` table
- `benchmark_results` table
- Statistical analysis tables

---

## Environment Variables

### Backend (`env.example`)

```bash
# AI Provider API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here  # Optional
GOOGLE_API_KEY=your_google_api_key_here  # Optional

# Model Selection Feature Flags
FEATURE_MODEL_SELECTION=false
FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=false
FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS=false
FEATURE_MODEL_SELECTION_DICTATION=false

# Enhanced Transcript Analysis
FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=false
FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS=false

# Layer Processing
FEATURE_LAYER_PROCESSING=false

# Default Model (if not specified)
DEFAULT_AI_MODEL=gpt-4o-mini
DEFAULT_AI_PROVIDER=openai
```

### Frontend (`frontend/env.template`)

```bash
# Model Selection Feature Flags
VITE_FEATURE_MODEL_SELECTION=false
VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=false
VITE_FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS=false
VITE_FEATURE_MODEL_SELECTION_DICTATION=false

# Enhanced Transcript Analysis
VITE_FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=false
VITE_FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS=false
```

---

## Success Metrics

### Phase 1-3: Infrastructure
- ✅ Feature flags work correctly
- ✅ Model abstraction layer supports OpenAI
- ✅ Backend parameters backward compatible
- ✅ Layer processing works additively

### Phase 4: Transcript Analysis Enhancement
- ✅ Model selection UI appears when flag enabled
- ✅ Template combinations work in Transcript Analysis
- ✅ A/B testing with different models works
- ✅ No impact on Dictation page

### Phase 5-6: Integration & Rollout
- ✅ All formatters use model abstraction
- ✅ Template combinations work end-to-end
- ✅ Can enable model selection for template combinations/dictation
- ✅ Zero breaking changes

---

## Timeline Estimate (UPDATED)

**Total:** 4 weeks (20 working days) - **Increased due to critical gaps**

- **Week 1:** Phase 1 (Feature flags, model abstraction, database schema, compliance)
- **Week 1-2:** Phase 2 (Backend parameters, retry/circuit breaker, server-side flags, cost tracking)
- **Week 2:** Phase 3 (Layer integration, error taxonomy, idempotency, telemetry)
- **Week 2-3:** Phase 4 (Transcript Analysis UI, statistical analysis, user allowlist)
- **Week 3:** Phase 5 (Model integration into existing formatters)
- **Week 4:** Phase 6 (Template combinations, gradual rollout, testing)

**Buffer:** +5 days for testing, bug fixes, and production readiness

**Note:** Timeline increased due to critical production safety requirements identified by consultant audit.

---

## Risks & Mitigations

### Risk 1: Breaking Existing Functionality

**Mitigation:**
- All changes additive (no removals)
- Feature flags default to OFF
- Backward compatibility shims for all parameters
- Comprehensive testing of existing flows

### Risk 2: Model Provider Integration Complexity

**Mitigation:**
- Start with OpenAI (already working)
- Stub Anthropic/Google providers initially
- Can add later without breaking changes
- Interface abstraction allows easy extension

### Risk 3: Performance Impact

**Mitigation:**
- Model abstraction layer is lightweight
- No additional API calls when flags OFF
- Layer processing only when explicitly requested
- Monitor performance metrics

### Risk 4: User Confusion with Model Selection

**Mitigation:**
- Feature-flagged: hidden by default
- Only available in Transcript Analysis initially
- Clear UI labels and tooltips
- Default model selection (no user action required)

---

## Next Steps

1. **Review & Approval:** Review this plan with team
2. **Create TODO List:** Break down into specific tasks
3. **Start Phase 1:** Create feature flags and model abstraction layer
4. **Incremental Development:** Follow phased approach
5. **Testing:** Comprehensive testing at each phase
6. **Documentation:** Update documentation as we go

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-27  
**Author:** Implementation Plan  
**Status:** 📋 Ready for Review
