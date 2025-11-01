# Critical Systems Testing Checklist

**Purpose:** Test all systems that were promised to remain unaffected during template loading overlay implementation  
**Date:** 2025-01-09  
**Context:** Template usage tracking, feedback system, and loading overlay changes

---

## 🚨 **CRITICAL SYSTEMS - MUST TEST ALL USERS**

### **1. Processing Orchestrator System** 🔴 **CRITICAL**

**Files Protected:**
- `backend/src/services/processing/ProcessingOrchestrator.ts`
- `backend/src/config/sections.ts`
- `backend/src/config/modes.ts`
- `backend/src/config/templates.ts`

**Test Scenarios:**
- [ ] **Section 7 template application** - Verify Universal Cleanup works
- [ ] **Section 8 template application** - Verify AI formatting works
- [ ] **Section 11 template application** - Verify formatting works
- [ ] **Mode 2 (Smart Dictation)** - Verify all template combinations work
- [ ] **Template validation** - Verify section/mode/template compatibility checks
- [ ] **Error handling** - Verify invalid template combinations are rejected

**What to Verify:**
- ✅ Template application succeeds
- ✅ Clinical entity extraction works
- ✅ Section-specific formatting is applied
- ✅ No errors in backend logs
- ✅ Processing time is within normal range

---

### **2. Format API Endpoints** 🔴 **CRITICAL**

**Protected Endpoints:**
- `POST /api/format/mode2` - Smart Dictation (Main endpoint)
- `POST /api/format/mode1` - Word-for-Word
- `POST /api/format/word-for-word-ai` - Word-for-Word with AI
- `POST /api/format-history-evolution` - History of Evolution

**Test Scenarios:**

#### **Mode 2 (Smart Dictation) - Primary Endpoint**
- [ ] **Universal Cleanup template** - Verify `/api/format/mode2` with `templateId`
- [ ] **Section 7 AI template** - Verify Section 7 formatting
- [ ] **Section 8 AI template** - Verify Section 8 formatting
- [ ] **Clinical Extraction template** - Verify extraction works
- [ ] **Word-for-Word template** - Verify word-for-word formatting
- [ ] **Language switching** - Verify `inputLanguage`/`outputLanguage` work
- [ ] **Error handling** - Verify invalid requests return proper errors

#### **Mode 1 (Word-for-Word)**
- [ ] **Basic formatting** - Verify word-for-word transcription
- [ ] **Language support** - Verify FR/EN input/output

#### **Word-for-Word with AI**
- [ ] **AI cleanup** - Verify GPT-based cleanup works
- [ ] **Language support** - Verify FR/EN support

#### **History of Evolution**
- [ ] **Special formatting** - Verify history formatting works
- [ ] **Worker-first rules** - Verify chronological ordering

**What to Verify:**
- ✅ All endpoints return 200 OK
- ✅ Response format unchanged
- ✅ No breaking changes to request/response schema
- ✅ Response time within normal range
- ✅ Error messages are clear and helpful

---

### **3. Layer System** 🔴 **CRITICAL**

**Files Protected:**
- `backend/src/services/layers/LayerManager.ts`
- `backend/src/services/layers/UniversalCleanupLayer.ts`
- `backend/src/services/layers/ClinicalExtractionLayer.ts`
- `backend/config/layers/*.json`

**Test Scenarios:**
- [ ] **Universal Cleanup Layer** - Verify transcript cleanup works
- [ ] **Clinical Extraction Layer** - Verify entity extraction works
- [ ] **Verbatim Layer** - Verify verbatim formatting works
- [ ] **Voice Commands Layer** - Verify voice command processing works
- [ ] **Layer combinations** - Verify multiple layers work together
- [ ] **Layer fallbacks** - Verify fallback behavior works

**What to Verify:**
- ✅ Layers process transcripts correctly
- ✅ Clinical entities are extracted properly
- ✅ Layer caching works
- ✅ Layer dependencies are handled
- ✅ No errors in layer processing

---

### **4. Language Input/Output System** 🔴 **CRITICAL**

**Files Protected:**
- `frontend/src/stores/uiStore.ts`
- `frontend/src/components/transcription/TranscriptionInterface.tsx`
- `backend/src/config/flags.ts`
- `backend/src/routes/format.ts`

**Test Scenarios:**
- [ ] **Input language selector** - Verify FR/EN selection works
- [ ] **Output language selector** - Verify FR/EN selection works
- [ ] **CNESST policy enforcement** - Verify Section 7/8 default to FR output
- [ ] **Language flags** - Verify `ENABLE_OUTPUT_LANGUAGE_SELECTION` works
- [ ] **Language parameter passing** - Verify `inputLanguage`/`outputLanguage` are passed correctly
- [ ] **Language persistence** - Verify language preferences are saved

**What to Verify:**
- ✅ Language selectors update state correctly
- ✅ Language changes trigger re-renders
- ✅ CNESST sections enforce FR output (if policy enabled)
- ✅ Language parameters are sent to backend correctly
- ✅ Backend respects language parameters

---

### **5. Backend Template Manager** 🔴 **CRITICAL**

**Files Protected:**
- `backend/src/config/templates.ts` - Backend template registry (655 lines)

**Test Scenarios:**
- [ ] **Template retrieval** - Verify `templateManager.getTemplate()` works
- [ ] **Template listing** - Verify `templateManager.getAllTemplates()` works
- [ ] **Section filtering** - Verify `templateManager.getTemplatesBySection()` works
- [ ] **Mode filtering** - Verify `templateManager.getTemplatesByMode()` works
- [ ] **Template validation** - Verify template ID validation works

**What to Verify:**
- ✅ Backend template registry is unchanged
- ✅ Template IDs match expected values
- ✅ Template metadata is correct
- ✅ No breaking changes to template structure

---

### **6. Formatter Services** 🔴 **CRITICAL**

**Files Protected:**
- `backend/src/services/formatter/mode2.ts`
- `backend/src/services/formatter/historyEvolution.ts`
- `backend/src/utils/wordForWordFormatter.ts`
- `backend/src/services/aiFormattingService.ts`

**Test Scenarios:**
- [ ] **Mode2Formatter** - Verify Section 7/8 formatting works
- [ ] **HistoryEvolutionFormatter** - Verify history formatting works
- [ ] **WordForWordFormatter** - Verify word-for-word formatting works
- [ ] **AIFormattingService** - Verify GPT formatting works
- [ ] **Formatter caching** - Verify response caching works
- [ ] **Error handling** - Verify formatter errors are handled gracefully

**What to Verify:**
- ✅ Formatters produce correct output
- ✅ Response time is acceptable
- ✅ Caching reduces redundant API calls
- ✅ Errors are logged and handled properly

---

### **7. Section and Mode Managers** 🔴 **CRITICAL**

**Files Protected:**
- `backend/src/config/sections.ts`
- `backend/src/config/modes.ts`

**Test Scenarios:**
- [ ] **Section definitions** - Verify Section 7/8/11 definitions are correct
- [ ] **Mode definitions** - Verify Mode 1/2/3 definitions are correct
- [ ] **Compatibility checks** - Verify section/mode compatibility validation
- [ ] **Language support** - Verify language support per section/mode
- [ ] **Feature flags** - Verify feature flags per section/mode

**What to Verify:**
- ✅ Section definitions match CNESST requirements
- ✅ Mode definitions are accurate
- ✅ Compatibility validation works
- ✅ No breaking changes to section/mode structure

---

### **8. WebSocket System** 🔴 **CRITICAL**

**Files Protected:**
- `backend/src/index.ts` - WebSocket server setup
- `backend/src/services/transcriptionService.ts` - AWS Transcribe integration
- `frontend/src/hooks/useTranscription.ts` - WebSocket client

**Test Scenarios:**
- [ ] **Audio capture** - Verify microphone capture works
- [ ] **WebSocket connection** - Verify connection to `ws://localhost:3001/ws/transcription`
- [ ] **Real-time transcription** - Verify live transcription appears in UI
- [ ] **Partial results** - Verify partial transcription results stream correctly
- [ ] **Connection handling** - Verify reconnection works on disconnect
- [ ] **Error handling** - Verify WebSocket errors are handled gracefully
- [ ] **AWS Transcribe integration** - Verify AWS Transcribe streaming works

**What to Verify:**
- ✅ Audio is captured from microphone
- ✅ WebSocket connects successfully
- ✅ Transcription appears in real-time
- ✅ Partial results update continuously
- ✅ Reconnection works automatically
- ✅ No WebSocket errors in console

---

### **9. Frontend Transcription Interface** 🔴 **CRITICAL**

**Files Protected (Except Loading Overlay):**
- `frontend/src/components/transcription/TranscriptionInterface.tsx` - Main UI
- `frontend/src/components/transcription/TemplateSelector.tsx` - Template selection
- `frontend/src/components/transcription/TemplateDropdown.tsx` - Template dropdown
- `frontend/src/hooks/useTranscription.ts` - Audio capture & WebSocket

**Test Scenarios:**
- [ ] **Template selection** - Verify template dropdown works
- [ ] **Template application** - Verify templates can be applied to transcripts
- [ ] **Transcript editing** - Verify transcript editing works
- [ ] **Save to section** - Verify "Save to Section" functionality works
- [ ] **Language switching** - Verify language selectors work
- [ ] **Audio controls** - Verify start/stop/pause dictation works
- [ ] **Loading overlay** - ✅ **NEW** Verify loading overlay shows during formatting
- [ ] **Progress messages** - ✅ **NEW** Verify progress messages update correctly

**What to Verify:**
- ✅ Template selection UI works
- ✅ Template application works end-to-end
- ✅ Transcript editing is functional
- ✅ Save to section works
- ✅ Language switching works
- ✅ Audio controls work
- ✅ **NEW** Loading overlay appears and disappears correctly
- ✅ **NEW** Progress messages update as formatting progresses

---

### **10. Database Schema (Existing Tables)** 🔴 **CRITICAL**

**Tables Protected:**
- `users` - User accounts
- `profiles` - User profiles (✅ **NEW** `consent_analytics` column added)
- `sessions` - Transcription sessions
- `transcripts` - Transcript content
- `cases` - Medical cases
- `templates` - Legacy template table (can remain empty)
- `clinics` - Clinic information
- `audit_logs` - Audit trail
- `voice_command_mappings` - Voice command mappings

**Test Scenarios:**
- [ ] **User creation** - Verify user registration works
- [ ] **Profile updates** - Verify profile updates work
- [ ] **Session creation** - Verify sessions are created correctly
- [ ] **Transcript storage** - Verify transcripts are saved correctly
- [ ] **Case management** - Verify case CRUD operations work
- [ ] **Audit logging** - Verify audit logs are created
- [ ] **Consent analytics** - ✅ **NEW** Verify `consent_analytics` flag works

**What to Verify:**
- ✅ All existing tables work as expected
- ✅ Schema changes don't break existing queries
- ✅ ✅ **NEW** `consent_analytics` defaults to `true` for existing users
- ✅ ✅ **NEW** `consent_analytics` works for template usage tracking

---

### **11. API Endpoints (Existing)** 🔴 **CRITICAL**

**Protected Endpoints:**
- `POST /api/format/mode1`
- `POST /api/format/mode2`
- `POST /api/format/word-for-word-ai`
- `POST /api/format-history-evolution`
- `GET /api/cases` - Cases API
- `GET /api/sessions` - Sessions API
- `GET /api/transcripts` - Transcripts API
- `GET /api/clinics` - Clinics API
- `GET /api/profile` - Profile API

**Test Scenarios:**
- [ ] **All format endpoints** - Verify all format endpoints work
- [ ] **Cases API** - Verify case retrieval/create/update works
- [ ] **Sessions API** - Verify session management works
- [ ] **Transcripts API** - Verify transcript retrieval works
- [ ] **Clinics API** - Verify clinic management works
- [ ] **Profile API** - Verify profile management works
- [ ] **Authentication** - Verify JWT authentication works

**What to Verify:**
- ✅ All existing endpoints return correct responses
- ✅ Request/response schemas unchanged
- ✅ Error handling works correctly
- ✅ Authentication is enforced where needed

---

### **12. Configuration and Flags** 🔴 **CRITICAL**

**Files Protected:**
- `backend/src/config/flags.ts`
- `backend/.env.example`
- `backend/src/config/env.ts`

**Test Scenarios:**
- [ ] **Language flags** - Verify `ENABLE_OUTPUT_LANGUAGE_SELECTION` works
- [ ] **Universal cleanup flags** - Verify `UNIVERSAL_CLEANUP_ENABLED` works
- [ ] **Processing flags** - Verify SLO flags work
- [ ] **Cache flags** - Verify cache TTL settings work

**What to Verify:**
- ✅ All feature flags work as expected
- ✅ Environment variables are loaded correctly
- ✅ No breaking changes to flag structure

---

## ✅ **NEW FEATURES TO TEST** (Added, Not Protected)

### **Template Usage Tracking**
- [ ] **Usage events** - Verify template applications are tracked
- [ ] **Usage stats** - Verify usage statistics are stored
- [ ] **Consent checks** - Verify users with `consent_analytics = false` are not tracked

### **Template Feedback System**
- [ ] **Feedback submission** - Verify users can submit feedback
- [ ] **Feedback banner** - Verify feedback banner appears 2 minutes after template application
- [ ] **Rating system** - Verify 1-5 star rating works
- [ ] **Feedback dismissal** - Verify users can dismiss feedback
- [ ] **Consent checks** - Verify users with `consent_analytics = false` cannot submit feedback

### **Loading Overlay**
- [ ] **Overlay display** - Verify overlay appears when template is applied
- [ ] **Progress messages** - Verify messages update: "Preparing...", "Analyzing...", "Extracting...", etc.
- [ ] **Overlay dismissal** - Verify overlay disappears when formatting completes
- [ ] **Blur effect** - Verify background is blurred during overlay
- [ ] **CentomoMD branding** - Verify "CentomoMD" text is displayed

---

## 📋 **Testing Checklist Summary**

**Before Testing:**
- [ ] All critical systems identified
- [ ] Test users created (with different consent settings)
- [ ] Test cases prepared
- [ ] Test data loaded

**During Testing:**
- [ ] Test each critical system individually
- [ ] Test end-to-end workflows
- [ ] Test error scenarios
- [ ] Test with different user roles
- [ ] Test with different consent settings

**After Testing:**
- [ ] Document any issues found
- [ ] Verify all tests pass
- [ ] Get user confirmation
- [ ] Deploy if all tests pass

---

## 🚨 **Emergency Rollback Triggers**

**Rollback immediately if:**
- ❌ Any format endpoint returns errors
- ❌ ProcessingOrchestrator fails
- ❌ WebSocket connection breaks
- ❌ Template application fails for existing templates
- ❌ Language system breaks
- ❌ Database queries fail

**Rollback Steps:**
1. Revert frontend changes (disable API fetching)
2. Revert backend changes (remove new routes)
3. Rollback database migrations if needed
4. Restore from backup if database corruption occurred

---

---

## 👥 **Real User Testing Status**

**Date:** 2025-01-09  
**Users Identified from Database:**

### **User 1: Uzziel**
- **Email:** `tamonuzziel@gmail.com`
- **Templates Used:** `section7-rd`, `section7-ai-formatter`
- **Status:** ✅ Usage tracking confirmed working

### **User 2: uzziel Tamon**
- **Email:** `uzzielt@techehealthservices.com`
- **Templates Used:** `section7-rd`, `section7-ai-formatter`, `section8-ai-formatter`
- **Status:** ✅ Usage tracking confirmed working

### **Templates in Use:**
1. **`section7-rd`** (Section 7 - R&D Pipeline) - 5 uses
2. **`section8-ai-formatter`** (Section 8) - 3 uses
3. **`section7-ai-formatter`** (Section 7) - 2 uses

### **Next Steps:**
- [ ] Verify `consent_analytics` status for both users
- [ ] Test loading overlay with both users
- [ ] Verify progress messages update correctly
- [ ] Check feedback banner appears after 2 minutes
- [ ] Compare behavior between users for same templates

**See:** `docs/CURRENT_USER_TESTING_STATUS.md` for detailed testing plan

---

**End of Critical Systems Testing Checklist**

