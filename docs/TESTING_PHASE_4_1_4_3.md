# Testing Guide: Phase 4.1 & 4.3 (Model Selection & UI)

**Date:** 2024-12-27  
**Branch:** `feat/transcript-analysis-section7-improv`  
**Status:** ✅ Ready for Testing

---

## 🧪 Test Coverage

### ✅ What's Ready to Test

1. **Backend API Endpoints**
   - `/api/models/available` - Get available models
   - `/api/models/:modelId` - Get specific model info
   - `/api/format/mode2` - Enhanced with model/seed/temperature parameters

2. **Frontend Components**
   - `ModelSelector` component (feature-flagged)
   - `TranscriptAnalysisPage` with model selection UI
   - Run controls (seed, temperature inputs)

3. **Feature Flag Behavior**
   - Model selection visibility (flag ON/OFF)
   - Backend allowlist checking

---

## 🔍 Test Cases

### 1. API Endpoint Tests

#### Test 1.1: `/api/models/available` - Feature Flag OFF

**Setup:**
- Set `FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=false` in `.env`

**Test:**
```bash
curl -X GET http://localhost:3001/api/models/available
```

**Expected:**
- Status: `403 Forbidden`
- Response: `{ "success": false, "error": "Model selection is not enabled" }`

---

#### Test 1.2: `/api/models/available` - Feature Flag ON, No Allowlist

**Setup:**
- Set `FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true` in `.env`
- Set `EXPERIMENT_ALLOWLIST=` (empty) in `.env`

**Test:**
```bash
curl -X GET http://localhost:3001/api/models/available
```

**Expected:**
- Status: `200 OK`
- Response: `{ "success": true, "models": [...], "count": N }`
- Models include: `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`, etc.
- Only enabled models (based on feature flags) are returned

---

#### Test 1.3: `/api/models/available` - Feature Flag ON, With Allowlist (Allowed User)

**Setup:**
- Set `FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true` in `.env`
- Set `EXPERIMENT_ALLOWLIST=test@example.com` in `.env`

**Test:**
```bash
curl -X GET http://localhost:3001/api/models/available \
  -H "x-user-email: test@example.com"
```

**Expected:**
- Status: `200 OK`
- Response: `{ "success": true, "models": [...], "count": N }`

---

#### Test 1.4: `/api/models/available` - Feature Flag ON, With Allowlist (Not Allowed User)

**Setup:**
- Set `FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true` in `.env`
- Set `EXPERIMENT_ALLOWLIST=test@example.com` in `.env`

**Test:**
```bash
curl -X GET http://localhost:3001/api/models/available \
  -H "x-user-email: unauthorized@example.com"
```

**Expected:**
- Status: `403 Forbidden`
- Response: `{ "success": false, "error": "You are not authorized to use model selection. Contact your administrator.", "allowlist": false }`

---

#### Test 1.5: `/api/models/:modelId` - Get Specific Model

**Test:**
```bash
curl -X GET http://localhost:3001/api/models/gpt-4o-mini
```

**Expected:**
- Status: `200 OK`
- Response: `{ "success": true, "model": { "id": "gpt-4o-mini", "name": "GPT-4o Mini", "provider": "openai", "enabled": true } }`

---

#### Test 1.6: `/api/models/:modelId` - Non-existent Model

**Test:**
```bash
curl -X GET http://localhost:3001/api/models/non-existent-model
```

**Expected:**
- Status: `404 Not Found`
- Response: `{ "success": false, "error": "Model not found" }`

---

### 2. Frontend Component Tests

#### Test 2.1: ModelSelector - Feature Flag OFF

**Setup:**
- Set `VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=false` in frontend `.env`

**Steps:**
1. Navigate to `/transcript-analysis`
2. Click "Process Single Template" tab
3. Look for Model Selector component

**Expected:**
- Model Selector component is **NOT visible**
- Run controls (seed, temperature) are **NOT visible**

---

#### Test 2.2: ModelSelector - Feature Flag ON, No Allowlist Error

**Setup:**
- Set `VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true` in frontend `.env`
- Set `FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true` in backend `.env`
- Set `EXPERIMENT_ALLOWLIST=` (empty) in backend `.env`

**Steps:**
1. Navigate to `/transcript-analysis`
2. Click "Process Single Template" tab
3. Look for Model Selector component

**Expected:**
- Model Selector component is **visible**
- Run controls (seed, temperature) are **visible**
- Model dropdown shows available models
- Default model is "Default (gpt-4o-mini)"

---

#### Test 2.3: ModelSelector - Feature Flag ON, Allowlist Error (Not Allowed)

**Setup:**
- Set `VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true` in frontend `.env`
- Set `FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true` in backend `.env`
- Set `EXPERIMENT_ALLOWLIST=test@example.com` in backend `.env`
- User email is NOT in allowlist

**Steps:**
1. Navigate to `/transcript-analysis`
2. Click "Process Single Template" tab
3. Look for Model Selector component

**Expected:**
- Model Selector component shows **yellow warning banner**
- Message: "⚠️ Model Selection Restricted"
- Error: "You are not authorized to use model selection. Contact your administrator."
- Model dropdown is **disabled or hidden**

---

#### Test 2.4: ModelSelector - Loading State

**Setup:**
- Feature flags enabled
- Backend endpoint delayed or unavailable

**Steps:**
1. Navigate to `/transcript-analysis`
2. Click "Process Single Template" tab
3. Observe Model Selector during loading

**Expected:**
- Shows "Loading models..." text
- Dropdown is disabled during loading

---

#### Test 2.5: Run Controls - Seed Input

**Setup:**
- Feature flags enabled
- Model Selector visible

**Steps:**
1. Navigate to `/transcript-analysis`
2. Click "Process Single Template" tab
3. Enter seed value: `12345`
4. Enter temperature value: `0.8`
5. Select a template
6. Enter transcript text
7. Click "Process Template"

**Expected:**
- Seed input accepts numbers (0-999999)
- Temperature input accepts decimals (0.0-2.0)
- Values are sent to backend in API request
- Check browser DevTools Network tab for request body

---

### 3. API Integration Tests

#### Test 3.1: `/api/format/mode2` - With Model Selection

**Setup:**
- Feature flags enabled
- Model selected: `gpt-4o`
- Seed: `12345`
- Temperature: `0.8`

**Test:**
```bash
curl -X POST http://localhost:3001/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Test transcript content",
    "section": "7",
    "language": "fr",
    "templateRef": "section7-ai-formatter",
    "model": "gpt-4o",
    "seed": 12345,
    "temperature": 0.8
  }'
```

**Expected:**
- Status: `200 OK`
- Response includes `formatted` field
- Request is processed with selected model
- Check backend logs for model parameter

---

#### Test 3.2: `/api/format/mode2` - With templateRef (New Unified Identifier)

**Setup:**
- Feature flags enabled
- Use `templateRef` instead of `templateId` or `templateCombo`

**Test:**
```bash
curl -X POST http://localhost:3001/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Test transcript content",
    "section": "7",
    "language": "fr",
    "templateRef": "section7-ai-formatter"
  }'
```

**Expected:**
- Status: `200 OK`
- Template resolved correctly via `LayerManager.resolveTemplateRef()`
- Response includes `template_base`, `layerStack`, `stack_fingerprint` (if flag enabled)

---

#### Test 3.3: `/api/format/mode2` - Backward Compatibility (Legacy Parameters)

**Setup:**
- Feature flags enabled
- Use legacy `templateId` or `templateCombo`

**Test:**
```bash
curl -X POST http://localhost:3001/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Test transcript content",
    "section": "7",
    "language": "fr",
    "templateId": "section7-ai-formatter"
  }'
```

**Expected:**
- Status: `200 OK`
- Template resolved correctly (backward compatibility)
- Response includes formatted content

---

#### Test 3.4: `/api/format/mode2` - Server-Side Flag Enforcement

**Setup:**
- Backend flag: `FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=false`
- Frontend sends model parameter

**Test:**
```bash
curl -X POST http://localhost:3001/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Test transcript content",
    "section": "7",
    "language": "fr",
    "templateRef": "section7-ai-formatter",
    "model": "gpt-4o"
  }'
```

**Expected:**
- Status: `200 OK` (or `400 Bad Request` if flag enforcement is strict)
- Model parameter is **ignored** if flag OFF
- Request is processed with default model (`gpt-4o-mini`)

---

### 4. End-to-End Tests

#### Test 4.1: Full Workflow - Model Selection in Transcript Analysis

**Setup:**
- Feature flags enabled
- User in allowlist (or allowlist empty)

**Steps:**
1. Navigate to `/transcript-analysis`
2. Click "Process Single Template" tab
3. Verify Model Selector is visible
4. Select template: "Section 7 AI Formatter"
5. Select model: "GPT-4o" (from dropdown)
6. Enter seed: `12345`
7. Enter temperature: `0.8`
8. Paste transcript in "Original Transcript" textarea
9. Click "Process Template"
10. Observe results

**Expected:**
- Processing completes successfully
- Formatted result appears in output
- Check Network tab: Request includes `model`, `seed`, `temperature`, `templateRef`
- Response includes operational metadata (if flag enabled)

---

#### Test 4.2: Full Workflow - Default Model (No Selection)

**Setup:**
- Feature flags enabled
- Model selector visible but default selected

**Steps:**
1. Navigate to `/transcript-analysis`
2. Click "Process Single Template" tab
3. Select template: "Section 7 AI Formatter"
4. Leave model as "Default (gpt-4o-mini)"
5. Paste transcript
6. Click "Process Template"

**Expected:**
- Processing completes successfully
- Default model (`gpt-4o-mini`) is used
- Check Network tab: Request does NOT include `model` parameter (or includes `model: null`)

---

## 🐛 Debugging Tips

### Check Feature Flags

**Backend:**
```bash
# Check backend flags
curl http://localhost:3001/api/_debug/flags
# Or check .env file
cat .env | grep FEATURE_MODEL_SELECTION
```

**Frontend:**
- Open browser DevTools Console
- Type: `import.meta.env.VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS`
- Should return `"true"` or `"false"`

### Check Allowlist

**Backend:**
```bash
# Check allowlist in .env
cat .env | grep EXPERIMENT_ALLOWLIST
```

**Test allowlist:**
```bash
# User in allowlist
curl -X GET http://localhost:3001/api/models/available \
  -H "x-user-email: test@example.com"

# User not in allowlist
curl -X GET http://localhost:3001/api/models/available \
  -H "x-user-email: unauthorized@example.com"
```

### Check Backend Logs

**Model Selection:**
- Look for `[API] Mode2 request body:` in backend logs
- Should include `model`, `seed`, `temperature`, `templateRef`

**Template Resolution:**
- Look for `[API] Template resolution:` in backend logs
- Should show resolved template details

### Check Frontend Network Tab

**Request to `/api/format/mode2`:**
- Check Request Payload
- Should include: `templateRef`, `model`, `seed`, `temperature` (if provided)

**Request to `/api/models/available`:**
- Check Response
- Should include `models` array with enabled models

---

## ✅ Test Checklist

### Backend API
- [ ] `/api/models/available` returns 403 when flag OFF
- [ ] `/api/models/available` returns models when flag ON
- [ ] `/api/models/available` enforces allowlist correctly
- [ ] `/api/models/:modelId` returns model info
- [ ] `/api/format/mode2` accepts `templateRef` parameter
- [ ] `/api/format/mode2` accepts `model`, `seed`, `temperature` parameters
- [ ] `/api/format/mode2` maintains backward compatibility with `templateId`/`templateCombo`

### Frontend Components
- [ ] ModelSelector hidden when flag OFF
- [ ] ModelSelector visible when flag ON
- [ ] ModelSelector shows allowlist error when user not allowed
- [ ] ModelSelector loads models from backend
- [ ] Run controls (seed, temperature) visible when flag ON
- [ ] Run controls disabled during processing

### Integration
- [ ] Model selection passed to backend API
- [ ] Seed and temperature passed to backend API
- [ ] TemplateRef used instead of legacy templateId/templateCombo
- [ ] Default model used when no model selected
- [ ] Processing completes successfully with model selection

---

## 🚀 Quick Test Script

```bash
# Test 1: Models endpoint (flag OFF)
curl http://localhost:3001/api/models/available

# Test 2: Models endpoint (flag ON)
# First set: FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
curl http://localhost:3001/api/models/available

# Test 3: Format endpoint with model
curl -X POST http://localhost:3001/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Test content",
    "section": "7",
    "templateRef": "section7-ai-formatter",
    "model": "gpt-4o"
  }'
```

---

**Status:** ✅ Ready for Testing  
**Next Steps:** After testing, proceed with Phase 4.2 (Benchmark/Statistical Analysis endpoint)

