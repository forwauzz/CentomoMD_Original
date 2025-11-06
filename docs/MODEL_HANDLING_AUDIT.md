# Model Handling Code Audit - Production Claude Issue

**Date:** 2025-01-27  
**Issue:** Production app not picking up Claude as default model  
**Status:** 🔴 Critical Issues Found

---

## Executive Summary

The flag logic for `USE_CLAUDE_SONNET_4_AS_DEFAULT` is correctly implemented, **BUT** there are multiple code paths that bypass this flag and use hardcoded GPT models. Additionally, there are potential failures if `ANTHROPIC_API_KEY` is missing.

---

## 🔴 Critical Issues Found

### 1. **Hardcoded Models Bypassing Flag** (5 files)

#### Issue 1.1: `section8AI.ts` - Line 412
**Location:** `backend/src/services/formatter/section8AI.ts:412`
**Problem:** Fallback code uses `process.env['OPENAI_MODEL'] || 'gpt-4o-mini'` without checking flag
```typescript
const model = process.env['OPENAI_MODEL'] || 'gpt-4o-mini';
```
**Impact:** High - Used in error fallback path

#### Issue 1.2: `ProcessingOrchestrator.ts` - Lines 563, 570
**Location:** `backend/src/services/processing/ProcessingOrchestrator.ts:563,570`
**Problem:** Hardcoded `'gpt-4o-mini'` instead of using flag
```typescript
console.info(`[${correlationId}] Calling OpenAI API`, {
  model: 'gpt-4o-mini',  // ❌ HARDCODED
  ...
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',  // ❌ HARDCODED
  ...
});
```
**Impact:** High - Core processing orchestrator

#### Issue 1.3: `ClinicalExtractionLayer.ts` - Line 193
**Location:** `backend/src/services/layers/ClinicalExtractionLayer.ts:193`
**Problem:** Hardcoded `"gpt-4o-mini"` and uses OpenAI directly instead of AIProvider abstraction
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",  // ❌ HARDCODED, bypasses AIProvider
  ...
});
```
**Impact:** High - Clinical extraction layer

#### Issue 1.4: `section7AI-hardened.ts` - Lines 541, 551, 691
**Location:** `backend/src/services/formatter/section7AI-hardened.ts`
**Problem:** Hardcoded `'gpt-4o-mini'` in multiple places, uses OpenAI directly
```typescript
console.log(`[${correlationId}] Calling OpenAI API with JSON contract`, {
  model: 'gpt-4o-mini',  // ❌ HARDCODED
  ...
});

const response = await getOpenAI().chat.completions.create({
  model: 'gpt-4o-mini',  // ❌ HARDCODED
  ...
});
```
**Impact:** Medium - Hardened formatter (may not be primary path)

---

### 2. **Missing API Key Handling** (Potential Failure Point)

#### Issue 2.1: `aiProvider.ts` - Lines 776-782
**Location:** `backend/src/lib/aiProvider.ts:776-782`
**Problem:** Throws error if `ANTHROPIC_API_KEY` is missing, but no graceful fallback
```typescript
if (!process.env['ANTHROPIC_API_KEY']) {
  throw new AIError(
    AIErrorType.ConfigurationError,
    'ANTHROPIC_API_KEY environment variable is required for Claude models',
    'anthropic'
  );
}
```
**Impact:** Critical - App will crash/fail if Claude is selected but API key missing

#### Issue 2.2: `AnthropicProvider` constructor - Lines 311-313
**Location:** `backend/src/lib/aiProvider.ts:311-313`
**Problem:** Constructor throws error if API key missing
```typescript
constructor() {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  ...
}
```
**Impact:** Critical - Provider can't be created without key

---

### 3. **Environment Variable Issues** (Potential Configuration Problem)

#### Issue 3.1: `NODE_ENV` Not Set in Production
**Location:** `backend/src/config/flags.ts:59`
**Problem:** Flag logic depends on `NODE_ENV === 'production'`, but might not be set
```typescript
const isProduction = (process.env['NODE_ENV'] ?? 'development') === 'production';
```
**Impact:** Critical - If `NODE_ENV` not set to 'production', flag defaults to false (GPT)

**Check in Production:**
```bash
echo $NODE_ENV  # Should be 'production'
```

---

## ✅ Correctly Implemented Files

These files properly use the flag:

1. ✅ `backend/src/services/formatter/Extractor.ts` - Lines 67-69
2. ✅ `backend/src/services/formatter/shared.ts` - Lines 182-184
3. ✅ `backend/src/services/formatter/TemplatePipeline.ts` - Lines 143-145
4. ✅ `backend/src/services/formatter/section7AI.ts` - Lines 320-322
5. ✅ `backend/src/services/formatter/section8AI.ts` - Lines 267-269 (primary path)
6. ✅ `backend/src/services/section7RdService.ts` - Lines 373-375, 447-449
7. ✅ `backend/src/services/layers/UniversalCleanupLayer.ts` - Lines 106-108
8. ✅ `backend/src/routes/format.ts` - Line 254

---

## 🔍 Root Cause Analysis

### Why Production Isn't Using Claude

1. **Primary Issue:** Multiple code paths bypass the flag entirely
   - `ProcessingOrchestrator` uses hardcoded GPT
   - `ClinicalExtractionLayer` uses hardcoded GPT
   - `section7AI-hardened` uses hardcoded GPT
   - `section8AI` fallback uses hardcoded GPT

2. **Secondary Issue:** If `NODE_ENV !== 'production'`, flag defaults to false
   - Check: `process.env.NODE_ENV` in production environment

3. **Tertiary Issue:** If `ANTHROPIC_API_KEY` is missing, app will fail
   - Need to verify key is set in production

---

## 🛠️ Required Fixes

### Fix Priority 1: Critical (Blocks Production)

1. **Fix `ProcessingOrchestrator.ts`** - Use flag for default model
2. **Fix `ClinicalExtractionLayer.ts`** - Use AIProvider abstraction with flag
3. **Fix `section8AI.ts` fallback** - Use flag for fallback model
4. **Verify `NODE_ENV=production`** in production environment
5. **Verify `ANTHROPIC_API_KEY`** is set in production environment

### Fix Priority 2: High (Affects Some Paths)

6. **Fix `section7AI-hardened.ts`** - Use AIProvider abstraction with flag

### Fix Priority 3: Medium (Nice to Have)

7. **Add graceful fallback** - If Claude fails due to missing API key, fall back to GPT instead of crashing

---

## 📋 Verification Steps

### Step 1: Check Environment Variables in Production

```bash
# SSH into production
ssh production-server

# Check NODE_ENV
echo $NODE_ENV  # Should output: production

# Check ANTHROPIC_API_KEY
echo $ANTHROPIC_API_KEY  # Should output: sk-ant-...

# Check USE_CLAUDE_SONNET_4_AS_DEFAULT (if explicitly set)
echo $USE_CLAUDE_SONNET_4_AS_DEFAULT  # Should be 'true' or unset (will default to true in production)
```

### Step 2: Check Flag Value at Runtime

Add temporary logging to `backend/src/config/flags.ts`:
```typescript
USE_CLAUDE_SONNET_4_AS_DEFAULT: (() => {
  const isProduction = (process.env['NODE_ENV'] ?? 'development') === 'production';
  const explicitValue = process.env['USE_CLAUDE_SONNET_4_AS_DEFAULT'];
  
  const result = explicitValue !== undefined 
    ? explicitValue === 'true'
    : isProduction;
  
  console.log('[FLAGS] USE_CLAUDE_SONNET_4_AS_DEFAULT:', {
    NODE_ENV: process.env['NODE_ENV'],
    isProduction,
    explicitValue,
    result
  });
  
  return result;
})(),
```

### Step 3: Check Which Code Paths Are Being Used

Add logging to see which formatters are being called:
```typescript
// In routes/format.ts or wherever model selection happens
console.log('[MODEL_AUDIT] Model selection:', {
  flagValue: FLAGS.USE_CLAUDE_SONNET_4_AS_DEFAULT,
  selectedModel: actualModelUsed,
  codePath: 'routes/format.ts'
});
```

---

## 🎯 Recommended Action Plan

1. **Immediate:** Fix all hardcoded models (Priority 1 fixes)
2. **Immediate:** Verify production environment variables
3. **Short-term:** Add graceful fallback for missing API key
4. **Long-term:** Centralize model selection logic to avoid future bypasses

---

## 📊 Code Coverage Summary

| File | Status | Uses Flag | Hardcoded GPT | Notes |
|------|--------|-----------|---------------|-------|
| `Extractor.ts` | ✅ | Yes | No | Correct |
| `shared.ts` | ✅ | Yes | No | Correct |
| `TemplatePipeline.ts` | ✅ | Yes | No | Correct |
| `section7AI.ts` | ✅ | Yes | No | Correct |
| `section8AI.ts` | ⚠️ | Partial | Yes (fallback) | Primary path OK, fallback broken |
| `section7RdService.ts` | ✅ | Yes | No | Correct |
| `UniversalCleanupLayer.ts` | ✅ | Yes | No | Correct |
| `ClinicalExtractionLayer.ts` | ❌ | No | Yes | **NEEDS FIX** |
| `ProcessingOrchestrator.ts` | ❌ | No | Yes | **NEEDS FIX** |
| `section7AI-hardened.ts` | ❌ | No | Yes | **NEEDS FIX** |
| `routes/format.ts` | ✅ | Yes | No | Correct |

---

## 🔗 Related Files

- `backend/src/config/flags.ts` - Flag definition ✅
- `backend/src/lib/aiProvider.ts` - Provider abstraction ⚠️ (needs graceful fallback)
- `env.example` - Documentation ✅

---

**Next Steps:** Fix all Priority 1 issues and verify production environment configuration.

