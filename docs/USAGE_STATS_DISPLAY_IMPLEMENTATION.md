# Usage Statistics Display - Surgical Implementation Plan

**Date:** 2025-01-09  
**Branch:** `cases/templates-enhanced`  
**Approach:** Surgical implementation following @Project.mdc rules

---

## 🟡 Before Coding - Project Rules Compliance

### 1. Acceptance Criteria

✅ **Core Requirements:**
- Display template usage statistics to users
- Show: total usage, average rating, success rate
- Display stats for all templates or per-template
- Use existing `/api/templates/:id/summary` endpoint
- All existing functionality remains intact (no breaking changes)

✅ **Success Criteria:**
- Stats component displays correctly
- Stats load from API
- Stats update when data changes
- No errors in console
- All existing features work

---

### 2. Impacted Files + Justification

#### **Files to Create/Modify:**

1. **`frontend/src/components/stats/TemplateUsageStats.tsx`** (NEW)
   - **Why:** New component to display template usage stats
   - **Impact:** New component only (no changes to existing files)

2. **`frontend/src/pages/SettingsPage.tsx`** (MODIFY)
   - **Why:** Add stats section to Settings page
   - **Impact:** Add stats card only (no changes to existing settings)

**Files NOT to Touch:**
- ❌ `backend/src/routes/template-usage-feedback.ts` - NO CHANGES (endpoint exists)
- ❌ `backend/src/services/TemplateUsageService.ts` - NO CHANGES
- ❌ `backend/src/services/TemplateFeedbackService.ts` - NO CHANGES
- ❌ All other components - NO CHANGES

---

### 3. Implementation Plan (4 Steps)

#### **Step 1: Create Stats Component**
- Create `frontend/src/components/stats/TemplateUsageStats.tsx`
- Fetch stats from `/api/templates/:id/summary` for selected template
- Display: total usage, avg rating, success rate
- Handle loading and error states

#### **Step 2: Create Stats Hook (Optional)**
- Create `frontend/src/hooks/useTemplateStats.ts` (if needed)
- Reusable hook for fetching template stats
- Can skip if simple enough to include in component

#### **Step 3: Integrate into Settings Page**
- Add stats card to Settings page
- Show stats for user's most used templates (or all templates)
- Keep it simple and scoped

#### **Step 4: Test & Verify**
- Test stats load correctly
- Test with different templates
- Verify no console errors
- Ensure existing settings still work

---

### 4. Test Plan

#### **Happy Path Tests:**
1. ✅ Stats component loads
2. ✅ Stats fetch from API successfully
3. ✅ Stats display correctly (total usage, avg rating)
4. ✅ Settings page still works
5. ✅ No console errors

#### **Unhappy Path Tests:**
1. ✅ API failure - shows error message gracefully
2. ✅ No stats available - shows empty state
3. ✅ Network error - handles gracefully
4. ✅ Invalid template ID - handles gracefully

---

### 5. Authentication Requirement

**Status:** ✅ **Authentication Required** (already handled)

**Justification:**
- Endpoint `/api/templates/:id/summary` already requires authentication
- User must be authenticated to see stats
- No additional auth needed

---

## 🛠️ Implementation Steps

### Step 1: Create TemplateUsageStats Component

**File:** `frontend/src/components/stats/TemplateUsageStats.tsx`

**Key Features:**
- Fetch stats from API
- Display in clean card format
- Handle loading/error states
- Show per-template or aggregate stats

**Keep it simple:**
- Max 200 LOC per file rule
- Single responsibility: display stats
- No complex logic

---

### Step 2: Integrate into Settings Page

**File:** `frontend/src/pages/SettingsPage.tsx`

**Changes:**
- Add stats card section
- Show stats for most used templates
- Keep existing settings intact

---

## ✅ After Coding - Verification Checklist

- [ ] All TypeScript errors resolved (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] Stats component displays correctly
- [ ] Stats load from API
- [ ] Settings page still works
- [ ] No console errors
- [ ] Handles errors gracefully

---

## 🚨 Rollback Plan

If any step fails:
1. **Frontend:** Remove stats component
2. **Settings:** Revert Settings page changes
3. **Code:** Revert commits if necessary: `git revert <commit>`

---

## 📋 Next Steps

1. **Start with Step 1** (Create Stats Component)
2. **Test each step** before proceeding to next
3. **Verify Settings page** after integration
4. **Commit incrementally** after each successful step

---

**Ready to start surgical implementation!** 🚀

