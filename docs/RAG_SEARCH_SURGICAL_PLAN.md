# RAG Search - Surgical Implementation Plan

**Date:** 2025-01-XX  
**Approach:** Surgical - Minimal changes, isolated components, feature-flagged  
**Location:** Dictation page (within existing RagChat component)

---

## 🎯 **SURGICAL APPROACH PRINCIPLES**

1. **Minimal Changes:** Only touch files that need changes
2. **Isolated Components:** New search component is separate, doesn't affect existing code
3. **Feature-Flagged:** Uses existing `VITE_FEATURE_RAG_CHAT` flag (no new flag needed)
4. **No Breaking Changes:** Existing Ask functionality remains unchanged
5. **Incremental:** Add tabs to RagChat, keep all existing functionality

---

## 📋 **IMPLEMENTATION PLAN**

### Step 1: Add Search Types (Surgical)
**File:** `frontend/src/types/rag.ts`  
**Change:** Add 2 new types (no changes to existing types)

```typescript
// Existing types (DO NOT MODIFY)
export type RagSource = { page: number; snippet: string };
export type AskResponse = { answer: string; sources: RagSource[]; used_pages: number[]; footer: string };

// NEW: Add these types
export type SearchHit = { page: number; snippet: string; score: number };
export type SearchResponse = { query: string; results: SearchHit[] };
```

**Impact:** +6 lines, no breaking changes

---

### Step 2: Add Search Service Function (Surgical)
**File:** `frontend/src/services/ragClient.ts`  
**Change:** Add 1 new function (no changes to existing `askDoc`)

```typescript
// Existing askDoc function (DO NOT MODIFY)
export async function askDoc(question: string): Promise<AskResponse> {
  // ... existing code ...
}

// NEW: Add this function
export async function searchDoc(q: string, topN = 10): Promise<SearchResponse> {
  // ... new code ...
}
```

**Impact:** +20 lines, no breaking changes

---

### Step 3: Create Search Component (New File - Isolated)
**File:** `frontend/src/components/transcription/RagSearch.tsx` (NEW)  
**Change:** New file, completely isolated

- Search input field
- Results list with page numbers, snippets, scores
- Loading and error states
- Empty state
- Matches RagChat styling

**Impact:** New file (~150 lines), zero impact on existing code

---

### Step 4: Add Tabs to RagChat (Surgical)
**File:** `frontend/src/components/transcription/RagChat.tsx`  
**Change:** Wrap existing content in tabs, add search tab

**Before:**
```tsx
export const RagChat: React.FC = () => {
  // ... existing state and logic ...
  return (
    <Card>
      {/* Existing Ask UI */}
    </Card>
  );
};
```

**After:**
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RagSearch } from './RagSearch';

export const RagChat: React.FC = () => {
  // ... existing state and logic (NO CHANGES) ...
  return (
    <Card>
      <Tabs defaultValue="ask">
        <TabsList>
          <TabsTrigger value="ask">Q&A</TabsTrigger>
          <TabsTrigger value="search">Recherche</TabsTrigger>
        </TabsList>
        <TabsContent value="ask">
          {/* Existing Ask UI - NO CHANGES */}
        </TabsContent>
        <TabsContent value="search">
          <RagSearch />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
```

**Impact:** 
- +3 imports
- +10 lines (tabs wrapper)
- Existing Ask functionality: **ZERO CHANGES**
- All existing state/logic: **UNTOUCHED**

---

## 🔒 **SAFETY GUARANTEES**

### ✅ No Breaking Changes
- Existing `askDoc()` function: **UNTOUCHED**
- Existing `RagSource` and `AskResponse` types: **UNTOUCHED**
- Existing Ask UI logic: **UNTOUCHED**
- Existing state management: **UNTOUCHED**

### ✅ Isolated Components
- `RagSearch.tsx`: New file, zero dependencies on existing code
- Search types: New types, don't affect existing types
- Search service: New function, doesn't affect existing function

### ✅ Feature-Flagged
- Uses existing `VITE_FEATURE_RAG_CHAT` flag
- When flag is OFF: Nothing changes (search doesn't appear)
- When flag is ON: Both Ask and Search are available

### ✅ Minimal File Changes
- `rag.ts`: +6 lines (new types only)
- `ragClient.ts`: +20 lines (new function only)
- `RagChat.tsx`: +13 lines (tabs wrapper only)
- `RagSearch.tsx`: New file (~150 lines)

---

## 📊 **IMPACT ANALYSIS**

### Files Modified
1. `frontend/src/types/rag.ts` - **+6 lines** (new types)
2. `frontend/src/services/ragClient.ts` - **+20 lines** (new function)
3. `frontend/src/components/transcription/RagChat.tsx` - **+13 lines** (tabs wrapper)

### Files Created
1. `frontend/src/components/transcription/RagSearch.tsx` - **~150 lines** (new component)

### Files NOT Touched
- ❌ `TranscriptionInterface.tsx` - **NO CHANGES**
- ❌ `DictationPage.tsx` - **NO CHANGES**
- ❌ `featureFlags.ts` - **NO CHANGES**
- ❌ `rag.ts` (config) - **NO CHANGES**
- ❌ Any other files - **NO CHANGES**

---

## 🧪 **TESTING STRATEGY**

### Regression Testing
1. ✅ Verify existing Ask functionality still works
2. ✅ Verify existing Ask UI unchanged
3. ✅ Verify existing state management unchanged
4. ✅ Verify feature flag still works

### New Functionality Testing
1. ✅ Test search functionality
2. ✅ Test search error handling
3. ✅ Test tab switching
4. ✅ Test search with various queries

---

## ✅ **ACCEPTANCE CRITERIA**

- ✅ Existing Ask functionality works exactly as before
- ✅ Search functionality works independently
- ✅ Tabs allow switching between Ask and Search
- ✅ No breaking changes to existing code
- ✅ Feature flag controls both Ask and Search
- ✅ All tests pass
- ✅ No console errors

---

## 🎯 **SURGICAL CHECKLIST**

- [ ] Add `SearchHit` and `SearchResponse` types to `rag.ts` (no changes to existing types)
- [ ] Add `searchDoc()` function to `ragClient.ts` (no changes to existing function)
- [ ] Create `RagSearch.tsx` component (new file, isolated)
- [ ] Add tabs to `RagChat.tsx` (wrap existing content, no logic changes)
- [ ] Test existing Ask functionality (should work exactly as before)
- [ ] Test new Search functionality
- [ ] Verify feature flag still works
- [ ] Run typecheck and lint (should pass)

---

## 📝 **IMPLEMENTATION NOTES**

### Why Tabs Instead of Separate Route?
- ✅ Keeps everything in one place (dictation page)
- ✅ No routing changes needed
- ✅ Better UX for dictation workflow
- ✅ Minimal changes to existing code

### Why Same Feature Flag?
- ✅ Search is part of RAG feature
- ✅ No need for separate flag
- ✅ Simpler configuration
- ✅ When RAG is enabled, both Ask and Search are available

### Why Isolated Components?
- ✅ `RagSearch` is completely separate from `RagChat` logic
- ✅ Can be tested independently
- ✅ Can be removed easily if needed
- ✅ No coupling between Ask and Search

---

**End of Surgical Plan**

