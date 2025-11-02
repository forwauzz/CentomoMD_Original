# Quick Fix: SQL UUID Error

**Error:** `invalid input syntax for type uuid: "YOUR_USER_ID_HERE"`

**Problem:** You need to replace `YOUR_USER_ID_HERE` with your actual user_id (UUID format)

---

## ✅ Solution: Follow These Steps

### **Step 1: Get Your User ID**

Run this SQL query first (replace with your email):

```sql
SELECT 
  user_id,
  email,
  display_name
FROM profiles
WHERE email = 'your-email@example.com';  -- ⚠️ Replace with your email
```

**Or see all users:**
```sql
SELECT 
  user_id,
  email,
  display_name
FROM profiles
ORDER BY created_at DESC;
```

**Copy the `user_id` value** (it should look like: `9dc87840-75b8-4bd0-8ec1-85d2a2c2e804`)

---

### **Step 2: Create Test Queue Entry**

Now use your actual `user_id` in the INSERT statement:

```sql
-- Replace 'PASTE_YOUR_USER_ID_HERE' with the user_id from Step 1
INSERT INTO feedback_prompts_queue (
  template_id,
  user_id,
  session_id,
  scheduled_at,
  created_at
) VALUES (
  'section7-ai-formatter',
  'PASTE_YOUR_USER_ID_HERE'::uuid,  -- ⚠️ Paste your user_id here (must be UUID format)
  NULL,
  NOW() - INTERVAL '1 minute',
  NOW()
) RETURNING *;
```

---

## 🔍 Example

**If your user_id is:** `9dc87840-75b8-4bd0-8ec1-85d2a2c2e804`

**Then your INSERT should be:**
```sql
INSERT INTO feedback_prompts_queue (
  template_id,
  user_id,
  session_id,
  scheduled_at,
  created_at
) VALUES (
  'section7-ai-formatter',
  '9dc87840-75b8-4bd0-8ec1-85d2a2c2e804'::uuid,  -- ✅ Your actual user_id
  NULL,
  NOW() - INTERVAL '1 minute',
  NOW()
) RETURNING *;
```

---

## 🚨 Common Mistakes

❌ **Wrong:**
```sql
user_id = 'YOUR_USER_ID_HERE'  -- String literal, not UUID
```

✅ **Correct:**
```sql
user_id = '9dc87840-75b8-4bd0-8ec1-85d2a2c2e804'::uuid  -- Actual UUID with ::uuid cast
```

---

## 📝 Quick Script

Use the complete script: `backend/scripts/test-feedback-queue-complete.sql`

It walks you through all steps including getting your user_id first.

---

**Ready to test!** 🚀

