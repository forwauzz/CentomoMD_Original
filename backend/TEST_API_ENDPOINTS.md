# API Endpoint Testing Guide

**Date:** 2024-12-27  
**Endpoint:** `POST /api/format/mode2`  
**Base URL:** `http://localhost:3000`

---

## 🚀 Quick Start

### Option 1: Automated Test Script (Recommended)

**Requirements:** Node.js 18+ (has built-in fetch)

```bash
# Make sure backend is running first
npm run dev

# In another terminal, run:
node test-api-endpoints.js
```

### Option 2: Manual Testing with curl

See `test-api-manual.md` for detailed curl commands.

---

## 🧪 Test Scenarios

### ✅ Test 1: Backward Compatibility

Verify existing code still works unchanged.

**Request:**
```bash
curl -X POST http://localhost:3000/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }'
```

**Expected:** ✅ 200 OK, formatted output

**Check:**
- Status code: 200
- Response has `formatted` field
- Response has `success: true`

---

### ✅ Test 2: New templateRef Parameter

Test unified template identifier.

**Request:**
```bash
curl -X POST http://localhost:3000/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateRef": "section7-ai-formatter",
    "language": "fr"
  }'
```

**Expected:** ✅ 200 OK, same result as Test 1

---

### ⚠️ Test 3: Model Selection (Flag OFF)

Verify model selection is ignored when `FEATURE_MODEL_SELECTION=false`.

**Request:**
```bash
curl -X POST http://localhost:3000/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateId": "section7-ai-formatter",
    "model": "gpt-5",
    "language": "fr"
  }'
```

**Expected:** 
- ✅ 200 OK (model ignored, uses default)
- OR ❌ 403/400 (if strict validation - also acceptable)

**Note:** Check backend logs for: `[SECURITY] Model selection requested but FEATURE_MODEL_SELECTION disabled`

---

### ✅ Test 4: Seed and Temperature

Test reproducibility controls.

**Request:**
```bash
curl -X POST http://localhost:3000/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateId": "section7-ai-formatter",
    "seed": 42,
    "temperature": 0.2,
    "language": "fr"
  }'
```

**Expected:** ✅ 200 OK, response includes `deterministic: true` (if enhanced flag enabled)

---

### 🔑 Test 5: Idempotency Key

Test idempotency caching (24h TTL).

**Step 1 - First Request:**
```bash
curl -X POST http://localhost:3000/api/format/mode2 \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-idempotency-123" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }' -w "\nTime: %{time_total}s\n"
```

**Step 2 - Second Request (same key):**
```bash
curl -X POST http://localhost:3000/api/format/mode2 \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-idempotency-123" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }' -w "\nTime: %{time_total}s\n"
```

**Expected:** 
- ✅ Step 1: ~2-5 seconds (actual processing)
- ✅ Step 2: <0.1 seconds (cached response)
- Check backend logs for: `[API] Returning cached result for idempotency key`

---

### 🔍 Test 6: Trace ID

Verify trace ID generation for correlation.

**Request:**
```bash
curl -X POST http://localhost:3000/api/format/mode2 \
  -H "Content-Type: application/json" \
  -i \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }'
```

**Expected:** ✅ Response header includes `X-Trace-Id: trace-...`

---

### 📊 Test 7: Enhanced Response Fields

Check if enhanced fields are returned (when `FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true`).

**Request:**
```bash
curl -X POST http://localhost:3000/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }' | jq '.'
```

**Expected (if flag enabled):**
```json
{
  "formatted": "...",
  "success": true,
  "template_base": "section7-ai-formatter",
  "layerStack": [],
  "stack_fingerprint": "...",
  "prompt_hash": "...",
  "operational": {
    "latencyMs": 1234,
    "deterministic": false
  }
}
```

---

### ❌ Test 8: Error Handling - Invalid Section

**Request:**
```bash
curl -X POST http://localhost:3000/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "99",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }'
```

**Expected:** ❌ 400 Bad Request, error: "Section must be \"7\", \"8\", or \"11\""

---

### ❌ Test 9: Error Handling - Missing Transcript

**Request:**
```bash
curl -X POST http://localhost:3000/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{
    "section": "7",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }'
```

**Expected:** ❌ 400 Bad Request, error: "Transcript is required and must be a string"

---

## 📋 Success Criteria

All tests should:
- ✅ Return appropriate HTTP status codes
- ✅ Include proper error messages when failing
- ✅ Include trace IDs in responses
- ✅ Maintain backward compatibility (Test 1)
- ✅ Accept new parameters without breaking
- ✅ Handle errors gracefully (Tests 8-9)
- ✅ Cache idempotent requests (Test 5)

---

## 🔍 Debugging

### Check Backend Logs

When running `npm run dev`, watch for:
- `[API] Mode2 request body:` - Request details
- `[SECURITY] Model selection requested but FEATURE_MODEL_SELECTION disabled` - Flag enforcement
- `[DEPRECATION] templateId/templateCombo are deprecated` - Backward compatibility warnings
- `[API] Returning cached result for idempotency key` - Idempotency caching
- `[METRIC]` - Metrics logging

### Common Issues

1. **Port not available**
   - Check if another process is using port 3000
   - Change port in backend config

2. **CORS errors** (if testing from browser)
   - Check CORS configuration in backend

3. **Missing environment variables**
   - Verify `.env` file exists
   - Check required variables are set

---

## 📝 Notes

- Make sure backend is running before testing
- Feature flags must be set in `.env` for full functionality
- Some features require flags: `FEATURE_MODEL_SELECTION`, `FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS`
- Idempotency cache is in-memory (cleared on server restart)

---

## 🎯 Next Steps

After testing:
1. ✅ Verify all tests pass
2. ✅ Check backend logs for warnings
3. ✅ Test edge cases
4. ✅ Proceed to Phase 4 (UI enhancements)
