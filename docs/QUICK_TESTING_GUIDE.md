# Quick Testing Guide

**Date:** 2025-01-09  
**Purpose:** Quick start guide for testing template functionality across different users

---

## 🚀 **Quick Start Testing**

### **Step 1: Identify Test Users**

Test with at least 2 users:
1. **User WITH Consent** (`consent_analytics = true`)
2. **User WITHOUT Consent** (`consent_analytics = false`)

**Check user consent:**
```sql
SELECT user_id, email, display_name, consent_analytics 
FROM profiles 
WHERE email IN ('user1@example.com', 'user2@example.com');
```

---

### **Step 2: Test Templates (Priority Order)**

#### **Template 1: Universal Cleanup** 🔄
- **Template ID:** `universal-cleanup` or `word-for-word-with-ai`
- **What it does:** Cleans transcript + extracts clinical entities
- **Progress messages:** "Preparing...", "Analyzing...", "Extracting clinical entities...", "Applying formatting..."
- **Test:** Apply to any section (7, 8, 11)

#### **Template 2: Section 7 AI Formatter** 🔷
- **Template ID:** `section7-ai-formatter`
- **What it does:** AI-based formatting for Section 7
- **Progress messages:** "Preparing AI formatting...", "Formatting Section 7...", "Processing Section 7 formatting...", "Finalizing Section 7 formatting..."
- **Test:** Apply to Section 7 transcript

#### **Template 3: Section 8 AI Formatter** 🔷
- **Template ID:** `section8-ai-formatter`
- **What it does:** AI-based formatting for Section 8
- **Progress messages:** "Preparing AI formatting...", "Formatting Section 8...", "Processing Section 8 formatting...", "Finalizing Section 8 formatting..."
- **Test:** Apply to Section 8 transcript

---

### **Step 3: Test Checklist (Per User)**

For each user, test each template:

#### **✅ Loading Overlay Test**
- [ ] Overlay appears immediately when template is applied
- [ ] "CentomoMD" text is visible
- [ ] Spinner is animating
- [ ] Background content is blurred
- [ ] Progress messages update (watch for message changes)

#### **✅ Progress Messages Test**
- [ ] Message 1 appears (e.g., "Preparing transcript...")
- [ ] Message 2 appears (e.g., "Analyzing transcript...")
- [ ] Message 3 appears (e.g., "Extracting clinical entities...")
- [ ] Message 4 appears (e.g., "Applying formatting...")
- [ ] Messages don't get stuck on one message
- [ ] Overlay disappears when formatting completes

#### **✅ Formatting Result Test**
- [ ] Transcript is formatted correctly
- [ ] Section-specific formatting is applied (if Section 7/8)
- [ ] Clinical entities extracted (if applicable)
- [ ] No errors in browser console
- [ ] No errors in backend logs

#### **✅ Usage Tracking Test** (Only if `consent_analytics = true`)
- [ ] Entry created in `template_usage_events` table
- [ ] `user_name` and `user_email` are populated
- [ ] Entry in `feedback_prompts_queue` table (scheduled for 2 minutes)

#### **✅ Feedback Banner Test** (Only if `consent_analytics = true`)
- [ ] Banner appears ~2 minutes after template application
- [ ] Banner is centered on screen
- [ ] Star rating works (1-5 stars)
- [ ] Dismiss button works
- [ ] Feedback stored in `template_feedback` table after submission
- [ ] Entry removed from `feedback_prompts_queue` after submission/dismissal

#### **✅ No Tracking Test** (Only if `consent_analytics = false`)
- [ ] Template formatting still works
- [ ] NO entry in `template_usage_events` table
- [ ] NO entry in `feedback_prompts_queue` table
- [ ] NO feedback banner appears
- [ ] Backend logs show: "User opted out of analytics"

---

### **Step 4: Compare Results Between Users**

#### **Same Template, Different Users:**
- [ ] **Formatting:** Should be IDENTICAL (same output)
- [ ] **Loading Overlay:** Should be IDENTICAL (same progress messages)
- [ ] **Usage Tracking:** Different (one tracked, one not)
- [ ] **Feedback Banner:** Different (one shows, one doesn't)

#### **Same User, Different Templates:**
- [ ] **Progress Messages:** Should be DIFFERENT (template-specific)
- [ ] **Formatting Result:** Should be DIFFERENT (template-specific)
- [ ] **Loading Time:** May be different (some templates faster)

---

### **Step 5: Database Verification**

#### **After Each Test, Run These Queries:**

**Check Usage Events:**
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
WHERE tue.user_id = '<USER_ID>'
ORDER BY tue.applied_at DESC
LIMIT 5;
```

**Check Feedback Queue:**
```sql
SELECT 
  q.id,
  q.template_id,
  q.user_id,
  q.scheduled_at,
  tc.name AS template_name
FROM feedback_prompts_queue q
LEFT JOIN template_combinations tc ON q.template_id = tc.id
WHERE q.user_id = '<USER_ID>'
ORDER BY q.scheduled_at DESC;
```

**Check Feedback:**
```sql
SELECT 
  tf.id,
  tf.template_id,
  tf.user_name,
  tf.user_email,
  tf.rating,
  tf.applied_at,
  tf.rated_at,
  tf.was_dismissed,
  tc.name AS template_name
FROM template_feedback tf
LEFT JOIN template_combinations tc ON tf.template_id = tc.id
WHERE tf.user_id = '<USER_ID>'
ORDER BY tf.rated_at DESC;
```

---

### **Step 6: Common Issues to Watch For**

#### **Issue 1: Messages Stuck on "Extracting clinical entities..."**
**Fix Applied:** Added delays between progress updates
**Verify:** Messages should change: "Preparing..." → "Analyzing..." → "Extracting..." → "Applying..."

#### **Issue 2: Overlay Not Appearing**
**Check:**
- Browser console for errors
- React DevTools: `isFormatting` state
- Verify `TemplateFormattingLoader` component renders

#### **Issue 3: Usage Not Tracked (But Should Be)**
**Check:**
- `consent_analytics = true` in profile
- Backend logs show: "Template usage tracked"
- Database has entry in `template_usage_events`

#### **Issue 4: Feedback Banner Not Appearing**
**Check:**
- `consent_analytics = true` in profile
- Wait full 2 minutes
- Check `feedback_prompts_queue` table has entry
- Browser console: `showFeedbackBanner` state

#### **Issue 5: Different Behavior for Different Users**
**Check:**
- Compare `consent_analytics` values
- Compare template IDs used
- Compare section/mode combinations
- Check backend logs for both users

---

## 📝 **Quick Test Results Template**

### **Test Date:** _______________

**User:** _______________  
**Email:** _______________  
**Consent Analytics:** ✅ / ❌

**Template Tested:** _______________  
**Template ID:** _______________

**Results:**
- [ ] Loading overlay appeared: ✅ / ❌
- [ ] Progress messages updated: ✅ / ❌
- [ ] Formatting successful: ✅ / ❌
- [ ] Usage tracked: ✅ / ❌ / N/A
- [ ] Feedback banner appeared: ✅ / ❌ / N/A

**Issues Found:**
- _______________________________________
- _______________________________________

---

## 🎯 **Testing Order**

1. **Start with User WITH consent** (`consent_analytics = true`)
   - Test Universal Cleanup template
   - Test Section 7 AI template
   - Test Section 8 AI template

2. **Then test User WITHOUT consent** (`consent_analytics = false`)
   - Verify formatting still works
   - Verify no tracking occurs
   - Verify no feedback banner

3. **Compare results**
   - Same template, different users
   - Same user, different templates

---

## 🚨 **Red Flags - Stop Testing If:**

- ❌ Format endpoint `/api/format/mode2` returns errors
- ❌ Template application fails completely
- ❌ Loading overlay never appears
- ❌ Progress messages never update
- ❌ Formatting produces wrong output

**If any red flag appears:**
1. Stop testing
2. Check backend logs
3. Check browser console
4. Verify user profile
5. Report issue immediately

---

**Ready to start testing!** 🚀

