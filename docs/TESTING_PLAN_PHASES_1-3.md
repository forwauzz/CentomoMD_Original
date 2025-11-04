# Testing Plan: Phases 1-3

**Date:** 2024-12-27  
**Branch:** `feat/transcript-analysis-section7-improv`  
**Status:** 🧪 Testing Phase

---

## Test Checklist

### Phase 1: Infrastructure Tests

#### ✅ 1.1 Feature Flags
- [ ] Backend flags load correctly (default OFF)
- [ ] Frontend flags load correctly (default OFF)
- [ ] Experiment allowlist works
- [ ] Model version flags work

#### ✅ 1.2 Database Schema
- [ ] Database schema compiles (TypeScript)
- [ ] Migration can be generated
- [ ] Tables can be created

#### ✅ 1.3 Model Abstraction Layer
- [ ] AIProvider interface compiles
- [ ] OpenAIProvider instantiates correctly
- [ ] Model version configuration loads
- [ ] Feature-flagged models are disabled by default

#### ✅ 1.4 Compliance Layer
- [ ] PHI scrubbing works
- [ ] Content hashing works (SHA-256)
- [ ] Audit logging doesn't log raw PHI

---

### Phase 2: Resilience & Safety Tests

#### ✅ 2.1 Retry Handler
- [ ] Retry logic works (exponential backoff)
- [ ] Jitter applied correctly
- [ ] Error classification works (4xx vs 5xx)

#### ✅ 2.2 Circuit Breaker
- [ ] Circuit opens after 5 failures
- [ ] Circuit resets after timeout
- [ ] Success records reset failures

#### ✅ 2.3 API Enhancement
- [ ] `/api/format/mode2` accepts new parameters (templateRef, model, seed, temperature)
- [ ] Server-side flag enforcement works (ignores model if flag OFF)
- [ ] User allowlist enforcement works (returns 403 if not allowed)
- [ ] Idempotency key works (returns cached result)
- [ ] Template resolution works (templateRef → baseTemplateId + layerStack)
- [ ] Backward compatibility works (templateId/templateCombo still work)

#### ✅ 2.4 Layer Resolution
- [ ] `resolveTemplateRef()` works for combinations
- [ ] `resolveTemplateRef()` works for base templates
- [ ] `resolveTemplateIdentity()` returns deprecation warnings

---

### Phase 3: Error Handling & Observability Tests

#### ✅ 3.1 Error Taxonomy
- [ ] AIError converts provider errors correctly
- [ ] User-friendly messages work
- [ ] Error types are correct (RateLimited, Auth, etc.)

#### ✅ 3.2 Telemetry
- [ ] Metrics record correctly (latency, tokens, cost, failures)
- [ ] Trace ID generation works
- [ ] Trace ID correlation works (request ↔ response)

#### ✅ 3.3 ProcessingOrchestrator
- [ ] Layer processing works (pre/post layers)
- [ ] Operational metadata collected
- [ ] Feature flag gating works (layers only when flag ON)

---

## Quick Test Commands

```bash
# 1. TypeScript compilation
cd backend
npm run build

# 2. Linting
npm run lint

# 3. Database migration generation
npm run db:generate

# 4. Test imports (quick smoke test)
node -e "require('./dist/src/config/flags.js')"
node -e "require('./dist/src/lib/aiProvider.js')"
node -e "require('./dist/src/lib/retry.js')"
node -e "require('./dist/src/lib/circuitBreaker.js')"
```

---

## Integration Tests (Manual)

### Test 1: Backward Compatibility
**Endpoint:** `POST /api/format/mode2`
**Request:**
```json
{
  "transcript": "Le travailleur consulte le docteur",
  "section": "7",
  "templateId": "section7-ai-formatter",
  "language": "fr"
}
```
**Expected:** Works unchanged (backward compatible)

### Test 2: Template Ref (New)
**Endpoint:** `POST /api/format/mode2`
**Request:**
```json
{
  "transcript": "Le travailleur consulte le docteur",
  "section": "7",
  "templateRef": "template-verbatim",
  "language": "fr"
}
```
**Expected:** Resolves to base template + layer stack

### Test 3: Model Selection (Feature Flagged)
**Endpoint:** `POST /api/format/mode2`
**Request:**
```json
{
  "transcript": "Le travailleur consulte le docteur",
  "section": "7",
  "templateId": "section7-ai-formatter",
  "model": "gpt-5",
  "language": "fr"
}
```
**Expected:** 
- If `FEATURE_MODEL_SELECTION=false`: Model param ignored, uses default
- If `FEATURE_MODEL_SELECTION=true` AND `FEATURE_GPT5=true`: Uses gpt-5
- If `FEATURE_MODEL_SELECTION=true` AND `FEATURE_GPT5=false`: Error (model not enabled)

### Test 4: Idempotency
**Endpoint:** `POST /api/format/mode2`
**Headers:** `Idempotency-Key: test-key-123`
**Request:** (same request twice)
**Expected:** Second request returns cached result from first

### Test 5: User Allowlist
**Endpoint:** `POST /api/format/mode2`
**Headers:** `X-User-Email: test@example.com`
**Request:**
```json
{
  "transcript": "Le travailleur consulte le docteur",
  "section": "7",
  "model": "gpt-4o",
  "language": "fr"
}
```
**Expected:**
- If email in allowlist: Works
- If email not in allowlist: Returns 403
- If allowlist empty AND flag ON: Works (allows all)

---

## Type Safety Tests

All new interfaces should be type-safe:
- [ ] `ProcessingRequest` accepts new fields (layerStack, model, seed, temperature)
- [ ] `ProcessingResult` includes operational metadata
- [ ] `AIProvider` interface is complete
- [ ] `ModelVersion` interface is complete

---

## Next Steps After Testing

1. Run database migration
2. Test API endpoints manually
3. Verify feature flags work
4. Proceed to Phase 4 (UI enhancements)
