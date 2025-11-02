# Next Test Steps

**Status:** Continue testing after fixing SQL UUID error

---

## ✅ What We've Done So Far

1. ✅ Got token from browser console
2. ✅ Fixed SQL UUID error (need to use actual user_id)
3. ✅ Created helper SQL scripts

---

## 📋 Next Steps - Complete Testing

### **Step 1: Create Test Queue Entry (SQL)**

**Run this SQL query** (replace with your actual `user_id`):

```sql
-- First, get your user_id:
SELECT user_id, email FROM profiles WHERE email = 'your-email@example.com';

-- Then create test queue entry (replace YOUR_USER_ID_HERE):
INSERT INTO feedback_prompts_queue (
  template_id,
  user_id,
  session_id,
  scheduled_at,
  created_at
) VALUES (
  'section7-ai-formatter',
  'YOUR_USER_ID_HERE'::uuid,  -- ⚠️ Replace with your actual user_id
  NULL,
  NOW() - INTERVAL '1 minute',
  NOW()
) RETURNING *;
```

**Expected:** Returns the inserted row with `scheduled_at <= NOW()` (already due)

---

### **Step 2: Test Backend Endpoint**

**Option A: Using PowerShell script**
```powershell
cd backend
.\scripts\test-feedback-endpoint.ps1 "YOUR_TOKEN_HERE"
```

**Option B: Manual curl (if you have curl)**
```bash
curl -X GET "http://localhost:3000/api/templates/prompts/due" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "templateId": "section7-ai-formatter",
      "sessionId": null,
      "scheduledAt": "2025-01-09T..."
    }
  ],
  "count": 1
}
```

✅ **If successful:** Endpoint works correctly!

---

### **Step 3: Test Frontend Polling**

1. **Open browser** → Go to Dictation page (`/dictation`)
2. **Open DevTools** (F12) → **Network tab**
3. **Filter:** `prompts/due`
4. **Watch for:**
   - ✅ Polling request appears immediately (or within 30 seconds)
   - ✅ Request URL: `/api/templates/prompts/due`
   - ✅ Status: `200 OK`
   - ✅ Response contains your queue entry

5. **Check Console tab** for:
   - ✅ `✅ Due feedback prompt found: section7-ai-formatter`
   - ✅ Feedback banner appears on screen

6. **Verify banner:**
   - ✅ Shows template name
   - ✅ 5-star rating works
   - ✅ Dismiss button works

✅ **If successful:** Frontend polling works!

---

### **Step 4: Test Stats Display**

1. **Navigate to Settings page** (`/settings`)
2. **Scroll down** to "Template Usage Statistics" section
3. **Verify:**
   - ✅ Card loads
   - ✅ Shows templates with stats (if any exist)
   - ✅ Displays: Total Uses, Users, Ratings, Success Rate
   - ✅ Shows star ratings if available
   - ✅ No console errors

✅ **If successful:** Stats display works!

---

### **Step 5: Test Navigation Survival**

1. **Apply a template** (or create another queue entry as above)
2. **Navigate away** (go to Dashboard, Settings, etc.)
3. **Wait 30 seconds** (or refresh page)
4. **Return to Dictation page**
5. **Verify:**
   - ✅ Banner appears (polling picks it up)
   - ✅ Banner works correctly

✅ **If successful:** Navigation survival works!

---

## 🎯 Test Checklist

- [ ] SQL: Created test queue entry
- [ ] Backend: Endpoint returns due prompts
- [ ] Frontend: Polling works (requests every 30 seconds)
- [ ] Frontend: Banner appears when prompt is due
- [ ] Frontend: Banner rating works
- [ ] Frontend: Banner dismiss works
- [ ] Stats: Display shows in Settings page
- [ ] Navigation: Banner survives navigation

---

## 🐛 If Something Fails

### **Banner doesn't appear:**
- Check Console: `✅ Due feedback prompt found: <templateId>`
- Check Network: `/api/templates/prompts/due` returns data
- Check Database: Queue entry exists and `scheduled_at <= NOW()`

### **Endpoint returns empty:**
- Check Database: Queue entry exists
- Check User: Same `user_id` in queue entry and your session
- Check Consent: `consent_analytics = true` in profiles table

### **Stats don't load:**
- Check Console: Any errors?
- Check Network: `/api/templates/:id/summary` requests
- Check Templates: Active templates exist

---

## ✅ Once All Tests Pass

**Ready to commit!** 🚀

1. All tests pass ✅
2. No console errors ✅
3. No backend errors ✅
4. Ready to commit changes ✅

---

**Let me know which step you're on or if you need help!** 🚀

