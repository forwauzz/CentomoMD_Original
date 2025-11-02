# Quick Test Script - Feedback Queue Worker & Stats

**Date:** 2025-01-09  
**Status:** Ready to Test

---

## 🧪 Test Script

### **Step 1: Check Current Queue Status**

**SQL Query:**
```sql
-- Check all queue entries
SELECT 
  id,
  template_id,
  user_id,
  session_id,
  scheduled_at,
  created_at,
  NOW() as current_time,
  scheduled_at <= NOW() as is_due
FROM feedback_prompts_queue
ORDER BY scheduled_at DESC;
```

---

### **Step 2: Create Test Queue Entry (Manually Trigger Prompt)**

**SQL Query:**
```sql
-- Get your user_id first
SELECT user_id, email, display_name FROM profiles;

-- Then create a test queue entry (due NOW - shows immediately)
INSERT INTO feedback_prompts_queue (
  template_id,
  user_id,
  session_id,
  scheduled_at,
  created_at
) VALUES (
  'section7-ai-formatter',  -- Replace with any template_id
  'YOUR_USER_ID_HERE',      -- Replace with your user_id
  NULL,                      -- Or a session_id if you have one
  NOW() - INTERVAL '1 minute',  -- Already due (in the past)
  NOW()
) RETURNING *;
```

---

### **Step 3: Test Backend Endpoint**

**Using curl (replace YOUR_TOKEN):**
```bash
curl -X GET "http://localhost:3000/api/templates/prompts/due" \
  -H "Authorization: Bearer YOUR_TOKEN" \
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

---

### **Step 4: Test Frontend Polling**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter: `prompts/due`
4. Navigate to Dictation page (`/dictation`)
5. Watch for polling requests every 30 seconds
6. Check Console tab for: `✅ Due feedback prompt found: <templateId>`

---

### **Step 5: Test Stats Display**

1. Navigate to Settings page (`/settings`)
2. Scroll down to "Template Usage Statistics" section
3. Verify:
   - ✅ Card loads
   - ✅ Shows templates with stats
   - ✅ Displays: Total Uses, Users, Ratings, Success Rate
   - ✅ No console errors

---

### **Step 6: Test Feedback Banner**

1. After Step 2 (queue entry created), go to Dictation page
2. Wait for polling (or refresh page)
3. Verify:
   - ✅ Banner appears
   - ✅ Shows template name
   - ✅ 5-star rating works
   - ✅ Dismiss button works

---

### **Step 7: Cleanup Test Data**

**SQL Query:**
```sql
-- Delete test queue entry
DELETE FROM feedback_prompts_queue
WHERE template_id = 'section7-ai-formatter'
  AND user_id = 'YOUR_USER_ID_HERE'
  AND scheduled_at <= NOW();
```

---

## 🔍 Debugging Queries

**Check if user has consent:**
```sql
SELECT user_id, email, consent_analytics
FROM profiles
WHERE user_id = 'YOUR_USER_ID_HERE';
```

**Check queue entries for user:**
```sql
SELECT *
FROM feedback_prompts_queue
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY scheduled_at DESC;
```

**Check feedback records:**
```sql
SELECT *
FROM template_feedback
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY rated_at DESC;
```

---

**Ready to test!** 🚀

