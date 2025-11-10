# RAG Chat Feature Implementation Plan

**Date:** 2025-01-XX  
**Feature:** RAG Chat Integration in Dictation Page  
**Status:** Planning

---

## 📋 Overview

Add a feature-flagged RAG chat component to the dictation page, positioned directly below the "Final Transcript" box. The feature will be modular and designed to support future template-triggered automation.

---

## 🎯 Goals

1. **Feature-Flagged**: RAG chat is gated behind `VITE_FEATURE_RAG_CHAT` (default: OFF)
2. **Modular Architecture**: Service layer, types, and UI are separated for future template integration
3. **Minimal Impact**: No changes to existing dictation functionality when flag is OFF
4. **Future-Ready**: Service layer can be called programmatically by template automation

---

## 📁 Files to Create/Modify

### New Files
1. `frontend/src/types/rag.ts` - RAG type definitions
2. `frontend/src/config/rag.ts` - RAG API configuration (env var handling)
3. `frontend/src/services/ragClient.ts` - RAG API client service
4. `frontend/src/components/transcription/RagChat.tsx` - RAG chat UI component
5. `frontend/src/hooks/useRagChat.ts` - RAG chat state management hook (optional, for future template integration)

### Modified Files
1. `frontend/src/lib/featureFlags.ts` - Add `ragChat` flag
2. `frontend/src/components/transcription/TranscriptionInterface.tsx` - Inject RAG chat component (feature-flagged)
3. `.env.example` (or create if missing) - Document `VITE_RAG_API` and `VITE_FEATURE_RAG_CHAT`

---

## 🔧 Implementation Steps

### Step 1: Add Feature Flag
**File:** `frontend/src/lib/featureFlags.ts`

- Add `ragChat: boolean` to `FeatureFlags` interface
- Add `ragChat: false` to `DEFAULT_FEATURE_FLAGS`
- Add `ragChat: import.meta.env.VITE_FEATURE_RAG_CHAT === 'true'` to `envFlags`
- Add `ragChat: false` to `devFlags` (keep OFF by default)
- Add `ragChat: envFlags.ragChat || devFlags.ragChat` to return object

**Impact:** ~5 lines added, no breaking changes

---

### Step 2: Create RAG Types
**File:** `frontend/src/types/rag.ts` (NEW)

```typescript
export type RagSource = { 
  page: number; 
  snippet: string 
};

export type AskResponse = { 
  answer: string; 
  sources: RagSource[]; 
  used_pages: number[]; 
  footer: string 
};
```

**Impact:** New file, ~15 lines

---

### Step 3: Create RAG Configuration
**File:** `frontend/src/config/rag.ts` (NEW)

- Export `RAG_API_BASE` from `import.meta.env.VITE_RAG_API`
- Throw clear error if env var is missing when feature is enabled
- Follow pattern from `frontend/src/lib/api.ts` (BASE URL handling)

**Impact:** New file, ~20 lines

---

### Step 4: Create RAG API Client Service
**File:** `frontend/src/services/ragClient.ts` (NEW)

- Export `askDoc(question: string): Promise<AskResponse>`
- Use `fetch` with POST to `${RAG_API_BASE}/ask`
- Set `Content-Type: application/json`
- Handle HTTP errors (non-2xx) with readable error messages
- Follow pattern from `frontend/src/services/formattingService.ts`

**Impact:** New file, ~50 lines

---

### Step 5: Create RAG Chat Component
**File:** `frontend/src/components/transcription/RagChat.tsx` (NEW)

**Component Structure:**
- Local state: `question`, `loading`, `error`, `data?: AskResponse`
- Text input with placeholder: "Posez une question sur le document…"
- Submit button (disabled while loading)
- Keyboard submit on Enter
- Render answer (preserve line breaks, bordered box)
- Render sources list ("Page X — snippet…")
- Render footer (small, muted text)
- Copy-to-clipboard button for answer (optional)
- Truncate snippets >240 chars with tooltip
- Empty state message
- Accessible labels

**Styling:**
- Use Tailwind CSS (match existing component styles)
- Compact chat box design
- Scrollable answer area
- Match `TranscriptionInterface` card styling

**Impact:** New file, ~200 lines

---

### Step 6: Inject RAG Chat into TranscriptionInterface
**File:** `frontend/src/components/transcription/TranscriptionInterface.tsx`

**Location:** After Final Transcript Card (after line 1417)

**Changes:**
1. Import `useFeatureFlags` (already imported)
2. Import `RagChat` component
3. Get `ragChat` flag from `featureFlags`
4. Conditionally render `<RagChat />` only when `ragChat === true`
5. Wrap in appropriate spacing/styling to match layout

**Code Pattern:**
```typescript
{featureFlags.ragChat && (
  <div className="mt-4">
    <RagChat />
  </div>
)}
```

**Impact:** ~5 lines added, no changes to existing logic

---

### Step 7: Environment Configuration
**File:** `.env.example` (create if missing, or update existing)

Add:
```bash
# RAG Chat Feature
VITE_FEATURE_RAG_CHAT=false
VITE_RAG_API=http://127.0.0.1:8000
```

**Impact:** ~2 lines added

---

## 🧪 Testing Plan

### Unit Tests
- [ ] `ragClient.ts`: Test successful API call, error handling, missing env var
- [ ] `RagChat.tsx`: Test form submission, loading states, error display, empty validation

### Integration Tests
- [ ] Feature flag OFF: Verify RAG chat does not render
- [ ] Feature flag ON: Verify RAG chat renders and functions correctly
- [ ] Verify existing dictation functionality unchanged when flag is OFF
- [ ] Verify existing dictation functionality unchanged when flag is ON

### Manual Testing
- [ ] Enable feature flag, verify chat appears below Final Transcript
- [ ] Submit question, verify answer/sources/footer render correctly
- [ ] Test error handling (invalid API URL, network error)
- [ ] Test loading states (button disabled, loading indicator)
- [ ] Test keyboard submit (Enter key)
- [ ] Test copy-to-clipboard functionality
- [ ] Test snippet truncation and tooltip
- [ ] Disable feature flag, verify chat disappears
- [ ] Verify no console errors when flag is OFF

---

## 🔒 Safety & Compliance

### Feature Flag Default
- **Default:** `VITE_FEATURE_RAG_CHAT=false` (OFF by default)
- **Rationale:** Follows project convention (all features OFF by default)

### No Breaking Changes
- When flag is OFF: Zero impact on existing functionality
- When flag is ON: Only adds new UI component, no changes to dictation logic

### Compliance
- No PHI/PII logging in RAG client
- API calls are stateless (no data retention)
- Follow existing service patterns for error handling

---

## 🚀 Future Template Integration Path

### Phase 1 (Current): Manual Chat
- User types question → `askDoc(question)` → Display answer

### Phase 2 (Future): Template-Triggered Automation
- Template generates summary → Agent reads summary → Agent calls `askDoc(question)` programmatically
- Same service layer (`ragClient.ts`) can be imported and used
- RAG chat component can accept `initialQuestion` prop for auto-submission
- State management hook (`useRagChat.ts`) can be shared between manual and automated flows

### Architecture Benefits
- **Service Layer Isolation**: `ragClient.ts` is pure function, no UI dependencies
- **Component Reusability**: `RagChat` can accept props for different contexts
- **State Management**: Hook pattern allows shared state between manual/automated flows

---

## 📝 Acceptance Criteria

✅ Feature flag `VITE_FEATURE_RAG_CHAT` controls RAG chat visibility  
✅ When flag is OFF, RAG chat does not render (zero impact)  
✅ When flag is ON, RAG chat appears below Final Transcript box  
✅ User can type question and submit (Enter or button)  
✅ Answer, sources, and footer render correctly  
✅ Loading and error states handled gracefully  
✅ API base URL configurable via `VITE_RAG_API` env var  
✅ Clear error if `VITE_RAG_API` is missing when feature is enabled  
✅ Existing dictation functionality unchanged  
✅ All lint, typecheck, and tests pass  

---

## 🔄 Rollback Plan

If issues arise:
1. Set `VITE_FEATURE_RAG_CHAT=false` in `.env` → Feature disappears immediately
2. No code changes needed for rollback (feature-flagged)
3. If service layer has issues, can disable flag without affecting dictation

---

## 📊 Estimated Impact

- **New Files:** 5 files (~300 LOC total)
- **Modified Files:** 2 files (~10 lines added)
- **Breaking Changes:** None
- **Dependencies:** None (uses existing fetch API)
- **Performance:** Minimal (only loads when flag is ON)

---

## ✅ Next Steps

1. Review and approve this plan
2. Implement Step 1 (Feature Flag)
3. Implement Steps 2-4 (Types, Config, Service)
4. Implement Step 5 (UI Component)
5. Implement Step 6 (Integration)
6. Implement Step 7 (Environment Config)
7. Run tests and verify acceptance criteria
8. Update SHIPLOG after PR merge

---

**End of Implementation Plan**

