# Current User Testing Status

**Date:** 2025-01-09  
**Status:** Usage tracking is WORKING ✅

---

## 👥 **Identified Test Users**

From database `template_usage_events` table:

### **User 1: Uzziel**
- **Email:** `tamonuzziel@gmail.com`
- **User Name:** `Uzziel` (in usage events)
- **Templates Used:**
  - ✅ `section7-rd` (Section 7 - R&D Pipeline)
  - ✅ `section7-ai-formatter` (Section 7)

### **User 2: uzziel Tamon**
- **Email:** `uzzielt@techehealthservices.com`
- **User Name:** `uzziel Tamon` (in usage events)
- **Templates Used:**
  - ✅ `section7-rd` (Section 7 - R&D Pipeline) - **MOST USED**
  - ✅ `section7-ai-formatter` (Section 7)
  - ✅ `section8-ai-formatter` (Section 8) - **MOST USED**

---

## 📊 **Template Usage Summary**

### **Template: `section7-rd` (Section 7 - R&D Pipeline)**
- **Count:** 5 uses
- **Users:** Both users
- **Status:** ✅ Most frequently used

### **Template: `section8-ai-formatter` (Section 8)**
- **Count:** 3 uses
- **Users:** uzziel Tamon only
- **Status:** ✅ Working

### **Template: `section7-ai-formatter` (Section 7)**
- **Count:** 2 uses
- **Users:** Both users
- **Status:** ✅ Working

---

## ✅ **What's Already Working**

1. **Usage Tracking:** ✅ Events are being recorded
2. **User Identification:** ✅ User names and emails are populated
3. **Template Application:** ✅ Templates are being applied successfully
4. **Multiple Templates:** ✅ Different templates work for same user

---

## 🧪 **Testing Checklist - For These Users**

### **Test 1: User 1 - Uzziel (`tamonuzziel@gmail.com`)**

#### **Check Profile:**
```sql
SELECT user_id, email, display_name, consent_analytics 
FROM profiles 
WHERE email = 'tamonuzziel@gmail.com';
```

#### **Test Templates:**
- [ ] **`section7-rd`** - Verify loading overlay works
- [ ] **`section7-ai-formatter`** - Verify loading overlay works
- [ ] **Progress Messages:** Verify messages update correctly
- [ ] **Usage Tracking:** Verify events are recorded
- [ ] **Feedback Banner:** Verify appears after 2 minutes (if `consent_analytics = true`)

### **Test 2: User 2 - uzziel Tamon (`uzzielt@techehealthservices.com`)**

#### **Check Profile:**
```sql
SELECT user_id, email, display_name, consent_analytics 
FROM profiles 
WHERE email = 'uzzielt@techehealthservices.com';
```

#### **Test Templates:**
- [ ] **`section7-rd`** - Verify loading overlay works
- [ ] **`section7-ai-formatter`** - Verify loading overlay works
- [ ] **`section8-ai-formatter`** - Verify loading overlay works
- [ ] **Progress Messages:** Verify messages update correctly (especially Section 8-specific messages)
- [ ] **Usage Tracking:** Verify events are recorded
- [ ] **Feedback Banner:** Verify appears after 2 minutes (if `consent_analytics = true`)

---

## 🔍 **Key Differences to Verify**

### **Template-Specific Behavior:**

#### **Template: `section7-rd` (R&D Pipeline)**
- **What to check:** 
  - Is this a special R&D template?
  - Does it have different progress messages?
  - Does it work differently than regular `section7-ai-formatter`?

#### **Template: `section8-ai-formatter`**
- **What to check:**
  - Progress messages should show: "Formatting Section 8...", "Processing Section 8 formatting..."
  - Formatting should be Section 8-specific
  - Only User 2 (`uzzielt@techehealthservices.com`) has used this

#### **Template: `section7-ai-formatter`**
- **What to check:**
  - Progress messages should show: "Formatting Section 7...", "Processing Section 7 formatting..."
  - Formatting should be Section 7-specific
  - Both users have used this

---

## 🚨 **Potential Issues to Check**

### **Issue 1: User Name Formatting Differences**
- **Observed:** `Uzziel` vs `uzziel Tamon`
- **Check:** Is this from `display_name` vs `email` fallback?
- **Action:** Verify denormalization is working correctly

### **Issue 2: Template `section7-rd` Not in Config**
- **Observed:** `section7-rd` template not in `template-config.ts`
- **Check:** Is this an R&D-specific template?
- **Action:** Verify this template exists in database and works correctly

### **Issue 3: Different Behavior Between Users**
- **Observed:** User 1 only uses Section 7 templates, User 2 uses both Section 7 and Section 8
- **Check:** Is this by choice or due to access/permissions?
- **Action:** Verify both users can access all templates

---

## 📋 **Quick SQL Queries to Run**

### **Check User Profiles:**
```sql
SELECT 
  user_id, 
  email, 
  display_name, 
  consent_analytics,
  locale
FROM profiles 
WHERE email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
);
```

### **Check Template Availability:**
```sql
SELECT 
  id,
  name,
  name_fr,
  type,
  compatible_sections,
  is_active,
  is_default
FROM template_combinations
WHERE id IN (
  'section7-rd',
  'section7-ai-formatter',
  'section8-ai-formatter'
)
ORDER BY name;
```

### **Check Recent Usage:**
```sql
SELECT 
  tue.id,
  tue.template_id,
  tue.user_name,
  tue.user_email,
  tue.applied_at,
  tc.name AS template_name
FROM template_usage_events tue
LEFT JOIN template_combinations tc ON tue.template_id = tc.id
WHERE tue.user_email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY tue.applied_at DESC
LIMIT 20;
```

### **Check Feedback Queue:**
```sql
SELECT 
  q.id,
  q.template_id,
  q.user_id,
  q.scheduled_at,
  p.email AS user_email,
  p.display_name AS user_name,
  tc.name AS template_name
FROM feedback_prompts_queue q
LEFT JOIN profiles p ON q.user_id = p.user_id
LEFT JOIN template_combinations tc ON q.template_id = tc.id
WHERE p.email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY q.scheduled_at DESC;
```

### **Check Feedback Submitted:**
```sql
SELECT 
  tf.id,
  tf.template_id,
  tf.user_name,
  tf.user_email,
  tf.rating,
  tf.comment,
  tf.applied_at,
  tf.rated_at,
  tf.was_dismissed,
  tc.name AS template_name
FROM template_feedback tf
LEFT JOIN template_combinations tc ON tf.template_id = tc.id
WHERE tf.user_email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY tf.rated_at DESC;
```

---

## 🎯 **Next Steps**

1. **Run profile check queries** to verify `consent_analytics` status
2. **Test loading overlay** for each template with both users
3. **Verify progress messages** update correctly for each template
4. **Check feedback banner** appears after 2 minutes
5. **Compare behavior** between users for same templates
6. **Verify `section7-rd` template** works correctly (R&D-specific?)

---

## 📝 **Test Results Template**

### **Test Date:** _______________

**User:** _______________  
**Email:** _______________  
**Consent Analytics:** ✅ / ❌

#### **Template: `section7-rd`**
- [ ] Loading overlay appeared: ✅ / ❌
- [ ] Progress messages updated: ✅ / ❌
- [ ] Formatting successful: ✅ / ❌
- [ ] Usage tracked: ✅ / ❌
- [ ] Feedback banner appeared: ✅ / ❌ / N/A

#### **Template: `section7-ai-formatter`**
- [ ] Loading overlay appeared: ✅ / ❌
- [ ] Progress messages updated: ✅ / ❌
- [ ] Formatting successful: ✅ / ❌
- [ ] Usage tracked: ✅ / ❌
- [ ] Feedback banner appeared: ✅ / ❌ / N/A

#### **Template: `section8-ai-formatter`** (User 2 only)
- [ ] Loading overlay appeared: ✅ / ❌
- [ ] Progress messages updated: ✅ / ❌
- [ ] Formatting successful: ✅ / ❌
- [ ] Usage tracked: ✅ / ❌
- [ ] Feedback banner appeared: ✅ / ❌ / N/A

**Issues Found:**
- _______________________________________
- _______________________________________

---

## 📋 **Quick SQL Verification**

**Run these queries to verify current state:**

```bash
# Check user profiles
psql -d your_database -f backend/scripts/check-user-profiles.sql

# Or run individual queries from backend/scripts/test-template-overlay.sql
```

**Quick Commands:**
- Check profiles: `SELECT user_id, email, display_name, consent_analytics FROM profiles WHERE email IN ('tamonuzziel@gmail.com', 'uzzielt@techehealthservices.com');`
- Check recent usage: `SELECT template_id, user_email, applied_at FROM template_usage_events WHERE user_email IN ('tamonuzziel@gmail.com', 'uzzielt@techehealthservices.com') ORDER BY applied_at DESC LIMIT 10;`
- Check feedback queue: `SELECT template_id, user_email, scheduled_at FROM feedback_prompts_queue q JOIN profiles p ON q.user_id = p.user_id WHERE p.email IN ('tamonuzziel@gmail.com', 'uzzielt@techehealthservices.com') ORDER BY scheduled_at DESC;`

---

**Ready to test with identified users!** 🚀

**See:** `docs/FOCUSED_TESTING_PLAN.md` for detailed testing plan with these users

