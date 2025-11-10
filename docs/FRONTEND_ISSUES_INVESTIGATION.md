# Frontend Issues Investigation

**Date:** 2024-12-27  
**Branch:** Transcript analysis & section 7 improv  
**Comparison:** azure-production vs current dev branch

---

## ✅ FOUND: Issues Identified

### 1. **Navy Blue Sidebar Theme Missing** ❌

**Issue:** Sidebar is white instead of navy blue  
**Location:** `frontend/src/components/layout/PrimarySidebar.tsx:438`

**Current Code:**
```typescript
<div
  className={cn(
    'flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
    sidebarCollapsed ? 'w-20' : 'w-70'
  )}
```

**Expected:** Navy blue background (`bg-[#0b2a4f]` or `bg-primary` based on CSS vars)

**Fix Needed:**
- Change `bg-white` to `bg-[#0b2a4f]` or use `bg-primary` class
- Update text colors to white/light colors for contrast

---

### 2. **Loading Overlay Component Missing** ❌

**Issue:** "Extracting clinical entities..." loading overlay with "CentomoMD" title and spinner is missing  
**Expected Location:** Should be a global loading overlay component

**Current State:**
- Loading states exist in `TranscriptionInterface.tsx` but inline (`setFormattingProgress('Extracting clinical entities...')`)
- No dedicated loading overlay component found

**Fix Needed:**
- Create `LoadingOverlay.tsx` component with:
  - Semi-transparent gray backdrop
  - White card with "CentomoMD" title
  - Circular spinner animation
  - Dynamic message prop ("Extracting clinical entities...", etc.)
- Integrate into `TranscriptionInterface.tsx` when `formattingProgress` is set

---

### 3. **Template Rating Component Missing** ❌

**Issue:** "How was this template?" modal with star rating is missing  
**Expected:** Modal dialog with:
- Title: "How was this template?"
- Template name: "Section 7 - Pipeline R&D"
- 5-star rating system
- "Click a star to rate this template" instruction
- Close button (X)

**Current State:**
- No `TemplateRating.tsx` component found
- No rating functionality in codebase

**Fix Needed:**
- Create `TemplateRating.tsx` component:
  ```tsx
  interface TemplateRatingProps {
    isOpen: boolean;
    onClose: () => void;
    templateId: string;
    templateName: string;
    onRate: (rating: number) => void;
  }
  ```
- Integrate into template selection flow
- Add API endpoint for saving ratings
- Store ratings in database (new `template_ratings` table)

---

### 4. **Template Usage Statistics Missing from Settings** ❌

**Issue:** Template usage statistics not shown in Settings page  
**Expected:** Statistics showing:
- Total Uses
- Users count
- Ratings count
- Average Rating
- Success Rate

**Current State:**
- `SettingsPage.tsx` only has: General, Compliance, Dictation Defaults, Export Defaults, Data
- No template statistics section

**Fix Needed:**
- Add new card to `SettingsPage.tsx`:
  ```tsx
  <Card>
    <CardHeader>
      <CardTitle>Template Usage Statistics</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Template stats table */}
    </CardContent>
  </Card>
  ```
- Fetch statistics from API endpoint `/api/templates/stats`
- Display in table format matching production screenshot

---

### 5. **Dashboard Layout Different** ⚠️

**Issue:** Dashboard looks different from production  
**Current State:**
- Dashboard has navy blue banner (`bg-[#0b2a4f]`) ✅
- But cards/widgets might be different

**Fix Needed:**
- Compare `DashboardPage.tsx` and `DashboardCards.tsx` with production
- Verify card layouts, spacing, and styling match

---

### 6. **Settings/Profile at Bottom Left** ✅

**Status:** This is CORRECT - Settings and Profile are at bottom left of sidebar  
**Location:** `PrimarySidebar.tsx:478-483`

```typescript
{/* Bottom items */}
<div className="mt-auto space-y-1">
  {sidebarItems
    .filter((item) => item.isBottom)
    .map(renderSidebarItem)}
</div>
```

**No fix needed** - this matches production behavior.

---

## 📋 Implementation Plan

### Priority 1: Critical UI Issues
1. **Fix Navy Blue Sidebar** (15 min)
   - Change `bg-white` to `bg-[#0b2a4f]`
   - Update text colors for contrast

2. **Create Loading Overlay Component** (30 min)
   - Create `LoadingOverlay.tsx`
   - Integrate into `TranscriptionInterface.tsx`

### Priority 2: Missing Features
3. **Create Template Rating Component** (45 min)
   - Create `TemplateRating.tsx`
   - Add API endpoint for ratings
   - Integrate into template flow

4. **Add Template Usage Stats to Settings** (30 min)
   - Create API endpoint `/api/templates/stats`
   - Add stats card to Settings page

### Priority 3: Verification
5. **Compare Dashboard with Production** (15 min)
   - Review and adjust if needed

---

## 🔍 Root Cause Analysis

**Why did these break?**

These issues are **NOT related to our backend changes**. Our backend work:
- ✅ Only modified backend files
- ✅ All feature-flagged (OFF by default)
- ✅ Backward compatible

**Actual Root Cause:**
These features likely:
1. **Never existed in this branch** - Different branch than production
2. **Were reverted** - Previous commit removed them
3. **Need to be implemented** - Were planned but not completed

**Next Steps:**
1. Check if these exist in `azure-production` branch
2. If they exist, merge/copy from production
3. If they don't exist, implement them (as outlined above)

---

## 📝 Files to Check/Modify

### Files to Modify:
- `frontend/src/components/layout/PrimarySidebar.tsx` - Fix navy blue theme
- `frontend/src/components/transcription/TranscriptionInterface.tsx` - Add loading overlay
- `frontend/src/pages/SettingsPage.tsx` - Add template stats

### Files to Create:
- `frontend/src/components/ui/LoadingOverlay.tsx` - Loading overlay component
- `frontend/src/components/templates/TemplateRating.tsx` - Rating modal component
- `backend/src/routes/templates.ts` (or similar) - Template stats API endpoint

### Files to Verify:
- `frontend/src/pages/DashboardPage.tsx` - Compare with production
- `frontend/src/components/dashboard/DashboardCards.tsx` - Compare with production

---

**Status:** Ready for implementation  
**Estimated Time:** 2-3 hours for all fixes
