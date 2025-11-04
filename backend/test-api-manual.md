# Manual API Testing Guide

**Endpoint:** `POST /api/format/mode2`  
**Base URL:** `http://localhost:3000` (or your backend URL)

---

## 🧪 Test Scenarios

### Test 1: Backward Compatibility ✅

**Purpose:** Verify existing code still works

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

---

### Test 2: New templateRef Parameter ✅

**Purpose:** Test unified template identifier

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

**Expected:** ✅ 200 OK, same formatted output as Test 1

---

### Test 3: Model Selection (Flag OFF) ⚠️

**Purpose:** Verify model selection is ignored when flag is OFF

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
- OR ❌ 400/403 (if strict validation - also acceptable)

---

### Test 4: Seed and Temperature ✅

**Purpose:** Test reproducibility controls

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

**Expected:** ✅ 200 OK, response includes `deterministic: true` if seed supported

---

### Test 5: Idempotency Key 🔑

**Purpose:** Test idempotency caching

**Step 1 - First Request:**
```bash
curl -X POST http://localhost:3000/api/format/mode2 \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-12345" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }'
```

**Step 2 - Second Request (same key):**
```bash
curl -X POST http://localhost:3000/api/format/mode2 \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-12345" \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }'
```

**Expected:** 
- ✅ Step 1: 200 OK, normal latency
- ✅ Step 2: 200 OK, much faster (cached response)

---

### Test 6: Trace ID 🔍

**Purpose:** Verify trace ID generation

**Request:**
```bash
curl -X POST http://localhost:3000/api/format/mode2 \
  -H "Content-Type: application/json" \
  -v \
  -d '{
    "transcript": "Le travailleur consulte le médecin",
    "section": "7",
    "templateId": "section7-ai-formatter",
    "language": "fr"
  }'
```

**Expected:** ✅ Response header includes `X-Trace-Id: trace-...`

---

### Test 7: Enhanced Response Fields 📊

**Purpose:** Check if enhanced fields are returned (when flag enabled)

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

**Expected:** ✅ Response includes (if flag enabled):
- `template_base`
- `layerStack`
- `stack_fingerprint`
- `prompt_hash`
- `operational`
- `deterministic`

---

### Test 8: Error Handling - Invalid Section ❌

**Purpose:** Verify proper error handling

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

**Expected:** ❌ 400 Bad Request, error message

---

### Test 9: Error Handling - Missing Transcript ❌

**Purpose:** Verify validation

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

**Expected:** ❌ 400 Bad Request, "Transcript is required"

---

## 📋 Using Postman

1. **Create New Request**
   - Method: `POST`
   - URL: `http://localhost:3000/api/format/mode2`

2. **Headers:**
   - `Content-Type: application/json`
   - (Optional) `Idempotency-Key: test-12345`
   - (Optional) `X-User-Email: test@example.com`

3. **Body (raw JSON):**
   ```json
   {
     "transcript": "Le travailleur consulte le médecin",
     "section": "7",
     "templateId": "section7-ai-formatter",
     "language": "fr"
   }
   ```

---

## 🎯 Success Criteria

All tests should:
- ✅ Return appropriate status codes
- ✅ Include proper error messages when failing
- ✅ Include trace IDs in responses
- ✅ Maintain backward compatibility
- ✅ Accept new parameters without breaking

---

## 📝 Notes

- Make sure backend is running (`npm run dev`)
- Check backend logs for detailed information
- Feature flags must be set in `.env` for some features
- Model selection requires `FEATURE_MODEL_SELECTION=true`
