# Step-by-Step Test Guide

**Date:** 2025-01-09  
**Status:** Ready to Test

---

## 🎯 Quick Test Checklist

### **Test 1: Template Usage Statistics (Settings Page)**

✅ **Steps:**
1. Navigate to `/settings` in your browser
2. Scroll down past all the settings cards
3. Look for **"Template Usage Statistics"** section
4. Verify:
   - Card loads with "Template Usage Statistics" title
   - Shows list of templates (if any stats exist)
   - Displays: Total Uses, Users, Ratings, Success Rate
   - Shows star ratings if available
   - No console errors

✅ **Expected:**
- Stats display correctly OR empty state message
- No errors in browser console

---

### **Test 2: Feedback Queue Worker (Backend Endpoint)**

✅ **Steps:**

**Step 2a: Get Your Token**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run:
```javascript
const { data: { session } } = await window.supabase.auth.getSession();
console.log('Token:', session?.access_token);
```
4. Copy the token

**Step 2b: Create Test Queue Entry**
1. Connect to your database
2. Get your user_id:
```sql
SELECT user_id, email FROM profiles WHERE email = 'your-email@example.com';
```
3. Create a test queue entry:
```sql
INSERT INTO feedback_prompts_queue (
  template_id,
  user_id,
  scheduled_at,
  created_at
) VALUES (
  'section7-ai-formatter',  -- Use any template_id
  'YOUR_USER_ID_HERE',      -- Your user_id from above
  NOW() - INTERVAL '1 minute',  -- Already due
  NOW()
) RETURNING *;
```

**Step 2c: Test Endpoint**
1. Open PowerShell in project root
2. Run:
```powershell
.\backend\scripts\test-feedback-endpoint.ps1 "YOUR_TOKEN_HERE"
```

✅ **Expected:**
- Returns `{ "success": true, "data": [...], "count": 1 }`
- Shows your due prompt in the data array

---

### **Test 3: Feedback Queue Worker (Frontend Polling)**

✅ **Steps:**

**Step 3a: Prepare Test Queue Entry**
1. Use SQL from Test 2 (Step 2b) to create a due prompt

**Step 3b: Test Frontend**
1. Open browser DevTools (F12)
2. Go to **Network tab**
3. Filter: `prompts/due`
4. Navigate to **Dictation page** (`/dictation`)
5. Watch for:
   - ✅ Polling request every 30 seconds
   - ✅ Console log: `✅ Due feedback prompt found: <templateId>`
   - ✅ Feedback banner appears

**Step 3c: Test Navigation Survival**
1. Apply a template (or create queue entry as above)
2. Navigate away (go to Dashboard)
3. Wait 30 seconds (or refresh)
4. Return to Dictation page
5. Verify banner appears (polling picks it up)

✅ **Expected:**
- Polling works (requests every 30 seconds)
- Banner appears when prompt is due
- Banner works even after navigation

---

### **Test 4: Feedback Banner Interaction**

✅ **Steps:**
1. Ensure a due prompt exists (Test 2, Step 2b)
2. Go to Dictation page
3. Wait for banner to appear (or refresh page)
4. Test:
   - ✅ Click star rating (1-5 stars)
   - ✅ Verify feedback submitted
   - ✅ Banner disappears
5. Test dismiss:
   - ✅ Create another due prompt
   - ✅ Click X (dismiss button)
   - ✅ Banner disappears

✅ **Expected:**
- Rating works correctly
- Dismiss works correctly
- Queue entry removed after feedback/dismissal

---

## 🔍 Debugging

### **Issue: Banner doesn't appear**

**Check:**
1. Console logs: `✅ Due feedback prompt found: <templateId>`
2. Network tab: `/api/templates/prompts/due` returns data
3. Database: Queue entry exists and `scheduled_at <= NOW()`
4. Database: User has `consent_analytics = true`:
```sql
SELECT user_id, consent_analytics FROM profiles WHERE user_id = 'YOUR_USER_ID';
```

### **Issue: Stats don't load**

**Check:**
1. Console errors (Network tab)
2. Templates exist and are active:
```sql
SELECT id, name_en, is_active FROM template_combinations WHERE is_active = true;
```
3. Stats exist:
```sql
SELECT * FROM mv_template_stats LIMIT 5;
```

### **Issue: Polling doesn't work**

**Check:**
1. Console logs: Any errors?
2. Network tab: See `/prompts/due` requests?
3. Hook active: Is `useTemplateTracking` mounted?
4. Interval: Should poll every 30 seconds

---

## ✅ Success Criteria

- [x] Stats display in Settings page
- [x] Backend endpoint returns due prompts
- [x] Frontend polling works (every 30 seconds)
- [x] Feedback banner appears when prompt is due
- [x] Banner survives navigation
- [x] Rating works correctly
- [x] Dismiss works correctly
- [x] Queue entry removed after feedback/dismissal
- [x] No console errors

---

**Ready to test!** 🚀

