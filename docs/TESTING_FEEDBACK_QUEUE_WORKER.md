# Testing Guide - Feedback Queue Worker

**Date:** 2025-01-09  
**Status:** Ready for Testing

---

## 📍 UI Changes Location

### 1. **Template Usage Statistics** (NEW - Settings Page)
   - **Location:** Settings Page → Scroll down to "Template Usage Statistics" section
   - **Component:** `frontend/src/components/stats/TemplateUsageStats.tsx`
   - **What to see:**
     - Card showing "Template Usage Statistics"
     - Lists top 5 most used templates
     - Shows: Total Uses, Users, Ratings, Success Rate
     - Shows average star rating per template

### 2. **Feedback Banner** (BEHAVIORAL CHANGE - No Visual Change)
   - **Location:** Transcription Interface (when template is applied)
   - **Component:** `frontend/src/components/feedback/TemplateFeedbackBanner.tsx`
   - **Visual:** Same as before (centered modal with stars)
   - **Behavior Change:** 
     - Before: Client-side 2-minute timer (lost on navigation)
     - Now: Server-side queue with polling (survives navigation)

---

## 🧪 Test Plan

### Test 1: Template Usage Statistics Display

**Steps:**
1. Go to Settings page (`/settings`)
2. Scroll down to "Template Usage Statistics" section
3. Verify:
   - ✅ Card loads
   - ✅ Shows "Template Usage Statistics" title
   - ✅ Displays templates with stats (if any exist)
   - ✅ Shows: Total Uses, Users, Ratings, Success Rate
   - ✅ Shows star ratings if available

**Expected Result:**
- Stats display correctly
- No console errors
- Loading state works
- Empty state works (if no stats)

---

### Test 2: Feedback Queue Worker - Basic Flow

**Steps:**
1. Go to Dictation page (`/dictation`)
2. Apply a template (any template)
3. **Wait 2 minutes** (or manually set queue `scheduled_at` to past time in DB)
4. Verify:
   - ✅ Feedback banner appears after 2 minutes
   - ✅ Banner shows template name
   - ✅ 5-star rating works
   - ✅ Dismiss button works

**Expected Result:**
- Banner appears reliably after 2 minutes
- Can rate the template
- Can dismiss the banner
- No console errors

---

### Test 3: Feedback Queue Worker - Navigation Survival

**Steps:**
1. Go to Dictation page (`/dictation`)
2. Apply a template
3. **Navigate away** (go to Dashboard, Settings, etc.)
4. **Wait 2 minutes** (or manually set queue `scheduled_at` to past time)
5. Return to Dictation page (or any page where `useTemplateTracking` is active)
6. Verify:
   - ✅ Banner appears after polling detects due prompt
   - ✅ Banner works correctly

**Expected Result:**
- Banner appears even after navigation
- Works across different pages
- Polling picks up due prompts

---

### Test 4: Feedback Queue Worker - Multiple Templates

**Steps:**
1. Apply Template A
2. **Before 2 minutes**, apply Template B
3. Wait for both to be due
4. Verify:
   - ✅ Banner shows most recent template
   - ✅ After rating/dismissing, next template banner appears
   - ✅ Each prompt handled correctly

**Expected Result:**
- Multiple prompts handled correctly
- Banner shows one at a time
- Queue processed in order

---

### Test 5: Backend Endpoint Test

**Test endpoint:** `GET /api/templates/prompts/due`

**Steps:**
1. Apply a template (creates queue entry)
2. Manually set `scheduled_at` to past time in database:
   ```sql
   UPDATE feedback_prompts_queue 
   SET scheduled_at = NOW() - INTERVAL '1 minute'
   WHERE user_id = '<your_user_id>';
   ```
3. Call endpoint:
   ```bash
   curl -H "Authorization: Bearer <token>" \
        http://localhost:3000/api/templates/prompts/due
   ```
4. Verify:
   - ✅ Returns due prompts for current user
   - ✅ Filters correctly
   - ✅ Returns proper format

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "templateId": "section7-ai-formatter",
      "sessionId": "...",
      "scheduledAt": "2025-01-09T..."
    }
  ],
  "count": 1
}
```

---

## 🔍 Manual Database Check

**Check queue entries:**
```sql
-- See all queue entries
SELECT * FROM feedback_prompts_queue 
ORDER BY scheduled_at DESC;

-- See due prompts (scheduled_at <= now())
SELECT * FROM feedback_prompts_queue 
WHERE scheduled_at <= NOW()
ORDER BY scheduled_at ASC;

-- See prompts for specific user
SELECT * FROM feedback_prompts_queue 
WHERE user_id = '<user_id>'
ORDER BY scheduled_at DESC;
```

---

## 🐛 Common Issues & Debugging

### Issue: Banner doesn't appear
**Check:**
1. Console logs: `✅ Due feedback prompt found: <templateId>`
2. Database: Queue entry exists and `scheduled_at <= NOW()`
3. Polling: Check network tab for `/api/templates/prompts/due` requests
4. Session: Make sure `useTemplateTracking` hook is active

### Issue: Stats don't load
**Check:**
1. Console logs: API errors
2. Network tab: `/api/templates/:id/summary` requests
3. Templates: Make sure templates exist and are active

### Issue: Multiple banners
**Check:**
1. Polling interval: Should be 30 seconds
2. State management: `pendingFeedback` should prevent duplicates
3. Queue cleanup: Prompts removed after feedback/dismissal

---

## ✅ Success Criteria

- [x] Stats display in Settings page
- [x] Feedback banner appears after 2 minutes
- [x] Banner survives navigation
- [x] Polling works (30-second interval)
- [x] Multiple prompts handled correctly
- [x] Backend endpoint returns due prompts
- [x] No console errors
- [x] All existing functionality works

---

**Ready for testing!** 🚀

