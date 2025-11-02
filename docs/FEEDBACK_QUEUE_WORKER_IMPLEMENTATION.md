# Feedback Queue Worker - Surgical Implementation Plan

**Date:** 2025-01-09  
**Branch:** `cases/templates-enhanced`  
**Approach:** Surgical implementation following @Project.mdc rules

---

## 🟡 Before Coding - Project Rules Compliance

### 1. Acceptance Criteria

✅ **Core Requirements:**
- Server-side worker processes `feedback_prompts_queue`
- Poll queue for `scheduled_at <= now()`
- Frontend can check for due prompts
- Feedback banner appears when prompt is due
- Remove processed prompts from queue

✅ **Success Criteria:**
- Worker processes queue correctly
- Frontend can poll for due prompts
- Feedback banner appears reliably
- No prompts lost on navigation
- All existing functionality works

---

### 2. Impacted Files + Justification

#### **Files to Create/Modify:**

1. **`backend/src/routes/template-usage-feedback.ts`** (MODIFY)
   - **Why:** Add endpoint to check for due feedback prompts
   - **Impact:** Add one endpoint only (no changes to existing endpoints)

2. **`frontend/src/hooks/useTemplateTracking.ts`** (MODIFY)
   - **Why:** Add polling for due feedback prompts
   - **Impact:** Add polling logic only (no changes to existing tracking)

**Files NOT to Touch:**
- ❌ `backend/src/services/FeedbackQueueService.ts` - NO CHANGES (service exists)
- ❌ `frontend/src/components/feedback/TemplateFeedbackBanner.tsx` - NO CHANGES
- ❌ All other components - NO CHANGES

---

### 3. Implementation Plan (4 Steps)

#### **Step 1: Add Endpoint to Check Due Prompts**
- Add `GET /api/templates/prompts/due` endpoint
- Return prompts where `scheduled_at <= now()`
- Filter by current user

#### **Step 2: Add Polling to Frontend Hook**
- Add polling to `useTemplateTracking` hook
- Poll every 10-30 seconds for due prompts
- Set `showFeedbackBanner` when prompt is due

#### **Step 3: Clean Up Processed Prompts**
- Remove prompt from queue when banner is shown
- Or mark as processed (keep for analytics)

#### **Step 4: Test & Verify**
- Test prompts appear after 2 minutes
- Test prompts work even after navigation
- Verify no console errors

---

### 4. Test Plan

#### **Happy Path Tests:**
1. ✅ Template applied → prompt enqueued
2. ✅ After 2 minutes → frontend polls for due prompt
3. ✅ Due prompt found → banner appears
4. ✅ Banner shown → prompt removed from queue
5. ✅ Navigation → prompt still works (from queue)

#### **Unhappy Path Tests:**
1. ✅ API failure → graceful handling
2. ✅ No due prompts → no error
3. ✅ Multiple prompts → handles correctly
4. ✅ Navigation during wait → prompt still appears

---

### 5. Authentication Requirement

**Status:** ✅ **Authentication Required** (already handled)

**Justification:**
- Endpoint `/api/templates/prompts/due` requires authentication
- User can only see their own prompts
- No additional auth needed

---

## 🛠️ Implementation Steps

### Step 1: Add Endpoint to Check Due Prompts

**File:** `backend/src/routes/template-usage-feedback.ts`

**Add endpoint:**
```typescript
/**
 * GET /api/templates/prompts/due
 * Get due feedback prompts for current user
 */
router.get('/prompts/due', async (req, res) => {
  // Get user from auth
  // Get due prompts from queue
  // Return prompts ready to be shown
});
```

---

### Step 2: Add Polling to Frontend Hook

**File:** `frontend/src/hooks/useTemplateTracking.ts`

**Add polling:**
```typescript
// Poll every 30 seconds for due prompts
useEffect(() => {
  const pollForDuePrompts = async () => {
    // Check for due prompts
    // If found, show banner
  };
  
  const interval = setInterval(pollForDuePrompts, 30000);
  return () => clearInterval(interval);
}, [currentSessionId]);
```

---

### Step 3: Clean Up Processed Prompts

**File:** `frontend/src/hooks/useTemplateTracking.ts`

**Remove prompt when banner is shown:**
```typescript
// When banner is shown, delete prompt from queue
await FeedbackQueueService.deleteFeedbackPrompt(...);
```

---

## ✅ After Coding - Verification Checklist

- [ ] All TypeScript errors resolved (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] Endpoint returns due prompts correctly
- [ ] Frontend polls correctly
- [ ] Feedback banner appears after 2 minutes
- [ ] Navigation doesn't break prompts
- [ ] No console errors

---

## 🚨 Rollback Plan

If any step fails:
1. **Frontend:** Revert polling changes
2. **Backend:** Remove endpoint
3. **Code:** Revert commits if necessary: `git revert <commit>`

---

## 📋 Next Steps

1. **Start with Step 1** (Add Endpoint)
2. **Test endpoint** before proceeding
3. **Add polling** to frontend
4. **Test end-to-end** functionality

---

**Ready to start surgical implementation!** 🚀

