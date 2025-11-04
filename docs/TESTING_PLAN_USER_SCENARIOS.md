# Testing Plan - User Scenarios

**Date:** 2025-01-09  
**Purpose:** Systematic testing of template functionality across different user scenarios

---

## 👥 **User Scenarios to Test**

### **Scenario 1: User WITH Consent Analytics** ✅
- **Profile:** `consent_analytics = true`
- **Expected Behavior:**
  - ✅ Template usage is tracked
  - ✅ Feedback can be submitted
  - ✅ Feedback banner appears after 2 minutes
  - ✅ Loading overlay works with progress messages

### **Scenario 2: User WITHOUT Consent Analytics** ❌
- **Profile:** `consent_analytics = false`
- **Expected Behavior:**
  - ✅ Template still works (formatting applies)
  - ❌ Template usage is NOT tracked (silent failure)
  - ❌ Feedback is NOT stored (silent failure)
  - ✅ Feedback banner does NOT appear (no queue entry)
  - ✅ Loading overlay works (independent of tracking)

### **Scenario 3: New User (Default Consent)** ✅
- **Profile:** New user, `consent_analytics = true` (default)
- **Expected Behavior:**
  - ✅ Same as Scenario 1

### **Scenario 4: Existing User (Migration)** ✅
- **Profile:** Existing user, `consent_analytics = true` (set by migration)
- **Expected Behavior:**
  - ✅ Same as Scenario 1

---

## 🧪 **Test Templates (Different Behaviors)**

### **Template 1: Universal Cleanup** 🔄
- **ID:** `universal-cleanup` or `word-for-word-with-ai`
- **Behavior:**
  - Uses `UniversalCleanupLayer`
  - Progress: "Preparing...", "Analyzing...", "Extracting clinical entities...", "Applying formatting..."
  - Works for all sections (7, 8, 11)

### **Template 2: Section 7 AI Formatter** 🔷
- **ID:** `section7-ai-formatter`
- **Behavior:**
  - Uses AI formatting service
  - Progress: "Preparing AI formatting...", "Formatting Section 7...", "Processing Section 7 formatting...", "Finalizing Section 7 formatting..."
  - Section-specific formatting

### **Template 3: Section 8 AI Formatter** 🔷
- **ID:** `section8-ai-formatter`
- **Behavior:**
  - Uses AI formatting service
  - Progress: "Preparing AI formatting...", "Formatting Section 8...", "Processing Section 8 formatting...", "Finalizing Section 8 formatting..."
  - Section-specific formatting

### **Template 4: Clinical Extraction** 🔬
- **ID:** `section7-clinical-extraction`
- **Behavior:**
  - Uses `ClinicalExtractionLayer`
  - Progress: "Extracting clinical context...", "Processing clinical extraction..."
  - Section 7 specific

### **Template 5: Word-for-Word** 📝
- **ID:** `word-for-word-formatter`
- **Behavior:**
  - Basic word-for-word formatting
  - No AI processing
  - Faster progress messages

---

## 📋 **Testing Checklist - Per User Scenario**

### **For Each User Scenario (1-4):**

#### **Step 1: Verify User Profile**
- [ ] Check `consent_analytics` value in profile
- [ ] Verify user has valid session
- [ ] Verify user has clinic membership (if required)

#### **Step 2: Test Each Template (1-5)**

**For Template 1 (Universal Cleanup):**
- [ ] Select template from dropdown
- [ ] **Loading Overlay:** Verify overlay appears immediately
- [ ] **Progress Messages:** Verify messages update:
  - "Preparing transcript..."
  - "Analyzing transcript..."
  - "Extracting clinical entities..."
  - "Applying formatting..."
- [ ] **Formatting:** Verify transcript is formatted correctly
- [ ] **Usage Tracking:** Check database `template_usage_events` table (if consent_analytics = true)
- [ ] **Feedback Queue:** Check `feedback_prompts_queue` table (if consent_analytics = true)
- [ ] **Feedback Banner:** Wait 2 minutes, verify banner appears (if consent_analytics = true)

**For Template 2 (Section 7 AI):**
- [ ] Select template from dropdown
- [ ] **Loading Overlay:** Verify overlay appears
- [ ] **Progress Messages:** Verify Section 7-specific messages:
  - "Preparing AI formatting..."
  - "Formatting Section 7..."
  - "Processing Section 7 formatting..."
  - "Finalizing Section 7 formatting..."
- [ ] **Formatting:** Verify Section 7-specific formatting applied
- [ ] **Usage Tracking:** Check database (if consent_analytics = true)
- [ ] **Feedback Banner:** Verify appears after 2 minutes (if consent_analytics = true)

**For Template 3 (Section 8 AI):**
- [ ] Select template from dropdown
- [ ] **Loading Overlay:** Verify overlay appears
- [ ] **Progress Messages:** Verify Section 8-specific messages:
  - "Preparing AI formatting..."
  - "Formatting Section 8..."
  - "Processing Section 8 formatting..."
  - "Finalizing Section 8 formatting..."
- [ ] **Formatting:** Verify Section 8-specific formatting applied
- [ ] **Usage Tracking:** Check database (if consent_analytics = true)
- [ ] **Feedback Banner:** Verify appears after 2 minutes (if consent_analytics = true)

**For Template 4 (Clinical Extraction):**
- [ ] Select template from dropdown
- [ ] **Loading Overlay:** Verify overlay appears
- [ ] **Progress Messages:** Verify clinical extraction messages:
  - "Extracting clinical context..."
  - "Processing clinical extraction..."
- [ ] **Formatting:** Verify clinical entities extracted
- [ ] **Usage Tracking:** Check database (if consent_analytics = true)
- [ ] **Feedback Banner:** Verify appears after 2 minutes (if consent_analytics = true)

**For Template 5 (Word-for-Word):**
- [ ] Select template from dropdown
- [ ] **Loading Overlay:** Verify overlay appears (if applicable)
- [ ] **Progress Messages:** Verify word-for-word messages
- [ ] **Formatting:** Verify word-for-word formatting applied
- [ ] **Usage Tracking:** Check database (if consent_analytics = true)
- [ ] **Feedback Banner:** Verify appears after 2 minutes (if consent_analytics = true)

#### **Step 3: Test Feedback System (if consent_analytics = true)**
- [ ] **Feedback Banner:** Wait for banner to appear (2 minutes after template application)
- [ ] **Rating:** Submit 1-5 star rating
- [ ] **Database:** Verify feedback stored in `template_feedback` table
- [ ] **Queue Cleanup:** Verify entry removed from `feedback_prompts_queue` table
- [ ] **Dismissal:** Test dismissing feedback banner
- [ ] **Database:** Verify `was_dismissed = true` in `template_feedback` table

#### **Step 4: Test Feedback System (if consent_analytics = false)**
- [ ] **No Tracking:** Verify no entry in `template_usage_events` table
- [ ] **No Queue:** Verify no entry in `feedback_prompts_queue` table
- [ ] **No Banner:** Verify feedback banner does NOT appear
- [ ] **Formatting Still Works:** Verify template formatting still works correctly

---

## 🔍 **Database Verification Queries**

### **Check User Consent Status**
```sql
SELECT user_id, email, display_name, consent_analytics 
FROM profiles 
WHERE user_id = '<USER_ID>';
```

### **Check Template Usage Events**
```sql
SELECT 
  tue.id,
  tue.template_id,
  tue.user_id,
  tue.user_name,
  tue.user_email,
  tue.applied_at,
  tc.name AS template_name
FROM template_usage_events tue
LEFT JOIN template_combinations tc ON tue.template_id = tc.id
WHERE tue.user_id = '<USER_ID>'
ORDER BY tue.applied_at DESC;
```

### **Check Feedback Queue**
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

### **Check Template Feedback**
```sql
SELECT 
  tf.id,
  tf.template_id,
  tf.user_id,
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
WHERE tf.user_id = '<USER_ID>'
ORDER BY tf.rated_at DESC;
```

### **Check Materialized View Stats**
```sql
SELECT 
  template_id,
  total_usage,
  unique_users,
  last_used_at,
  avg_rating,
  rating_count,
  success_count,
  dismissal_count
FROM mv_template_stats
ORDER BY total_usage DESC;
```

---

## 🚨 **Common Issues to Watch For**

### **Issue 1: Loading Overlay Not Appearing**
**Symptoms:**
- Template applies but no overlay shown
- Progress messages not visible

**Checks:**
- [ ] Check `isFormatting` state is set to `true`
- [ ] Check `TemplateFormattingLoader` component is rendered
- [ ] Check browser console for errors
- [ ] Verify `setFormattingProgress` is called

### **Issue 2: Progress Messages Not Updating**
**Symptoms:**
- Overlay appears but message stays stuck (e.g., "Extracting clinical entities...")

**Checks:**
- [ ] Verify `setFormattingProgress` calls are awaited
- [ ] Verify delays between progress updates (`await new Promise(...)`)
- [ ] Check React DevTools for state updates
- [ ] Verify `key` prop on `TemplateFormattingLoader` is working

### **Issue 3: Usage Tracking Not Working**
**Symptoms:**
- No entries in `template_usage_events` table
- No feedback queue entries

**Checks:**
- [ ] Verify `consent_analytics = true` in profile
- [ ] Check backend logs for consent checks
- [ ] Verify `trackTemplateApplication` is called
- [ ] Check API endpoint `/api/templates/:id/apply` returns success

### **Issue 4: Feedback Banner Not Appearing**
**Symptoms:**
- Template applied but no feedback banner after 2 minutes

**Checks:**
- [ ] Verify `consent_analytics = true` in profile
- [ ] Check `feedback_prompts_queue` table for entry
- [ ] Verify client-side timer is set (2 minutes)
- [ ] Check `showFeedbackBanner` state is updated
- [ ] Verify `pendingFeedback` state is set

### **Issue 5: Format Endpoint Errors**
**Symptoms:**
- Template application fails
- 500 errors from `/api/format/mode2`

**Checks:**
- [ ] Verify ProcessingOrchestrator is working
- [ ] Check backend logs for errors
- [ ] Verify template ID is valid
- [ ] Check section/mode/template compatibility

### **Issue 6: Different Behavior for Different Users**
**Symptoms:**
- Template works for User A but not User B
- Different progress messages for same template

**Checks:**
- [ ] Verify both users have same `consent_analytics` value
- [ ] Check if users have different roles/permissions
- [ ] Verify both users are using same template ID
- [ ] Check clinic membership differences
- [ ] Compare backend logs for both users

---

## 📊 **Testing Results Template**

### **Test Run Date:** _______________

**User Scenario:** _______________  
**User ID:** _______________  
**Consent Analytics:** _______________

#### **Template 1: Universal Cleanup**
- [ ] Loading overlay appeared: ✅ / ❌
- [ ] Progress messages updated: ✅ / ❌
- [ ] Formatting successful: ✅ / ❌
- [ ] Usage tracked: ✅ / ❌ / N/A (no consent)
- [ ] Feedback banner appeared: ✅ / ❌ / N/A (no consent)

#### **Template 2: Section 7 AI**
- [ ] Loading overlay appeared: ✅ / ❌
- [ ] Progress messages updated: ✅ / ❌
- [ ] Formatting successful: ✅ / ❌
- [ ] Usage tracked: ✅ / ❌ / N/A (no consent)
- [ ] Feedback banner appeared: ✅ / ❌ / N/A (no consent)

#### **Template 3: Section 8 AI**
- [ ] Loading overlay appeared: ✅ / ❌
- [ ] Progress messages updated: ✅ / ❌
- [ ] Formatting successful: ✅ / ❌
- [ ] Usage tracked: ✅ / ❌ / N/A (no consent)
- [ ] Feedback banner appeared: ✅ / ❌ / N/A (no consent)

#### **Template 4: Clinical Extraction**
- [ ] Loading overlay appeared: ✅ / ❌
- [ ] Progress messages updated: ✅ / ❌
- [ ] Formatting successful: ✅ / ❌
- [ ] Usage tracked: ✅ / ❌ / N/A (no consent)
- [ ] Feedback banner appeared: ✅ / ❌ / N/A (no consent)

#### **Template 5: Word-for-Word**
- [ ] Loading overlay appeared: ✅ / ❌
- [ ] Progress messages updated: ✅ / ❌
- [ ] Formatting successful: ✅ / ❌
- [ ] Usage tracked: ✅ / ❌ / N/A (no consent)
- [ ] Feedback banner appeared: ✅ / ❌ / N/A (no consent)

#### **Issues Found:**
- _______________________________________
- _______________________________________
- _______________________________________

---

## 🎯 **Priority Testing Order**

1. **HIGHEST PRIORITY:** User WITH consent (`consent_analytics = true`)
   - Section 7 AI Formatter
   - Section 8 AI Formatter
   - Universal Cleanup

2. **HIGH PRIORITY:** User WITHOUT consent (`consent_analytics = false`)
   - Verify formatting still works
   - Verify no tracking occurs
   - Verify no feedback banner

3. **MEDIUM PRIORITY:** Different template types
   - Clinical Extraction
   - Word-for-Word

4. **LOW PRIORITY:** Edge cases
   - Multiple rapid template applications
   - Network failures during formatting
   - Browser refresh during formatting

---

**End of Testing Plan**

