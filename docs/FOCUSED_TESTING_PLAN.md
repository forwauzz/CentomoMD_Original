# Focused Testing Plan - Real Users

**Date:** 2025-01-09  
**Status:** ✅ **RESOLVED** - Issue was user language selection, not a bug

---

## 👥 **Test Users Identified**

### **User 1: Uzziel**
- **Email:** `tamonuzziel@gmail.com`
- **User ID:** (check with SQL query)
- **Templates Used:**
  - ✅ `section7-rd` (Section 7 - R&D Pipeline)
  - ✅ `section7-ai-formatter` (Section 7)

### **User 2: uzziel Tamon**
- **Email:** `uzzielt@techehealthservices.com`
- **User ID:** (check with SQL query)
- **Templates Used:**
  - ✅ `section7-rd` (Section 7 - R&D Pipeline) - **MOST USED (5 times)**
  - ✅ `section7-ai-formatter` (Section 7)
  - ✅ `section8-ai-formatter` (Section 8) - **3 uses**

---

## 🔍 **Step 1: Verify User Profiles**

**Run SQL Query:**
```sql
SELECT 
  user_id, 
  email, 
  display_name, 
  consent_analytics,
  locale,
  created_at
FROM profiles 
WHERE email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY email;
```

**What to Check:**
- [ ] Both users exist in database
- [ ] `consent_analytics` value for each user (true/false)
- [ ] `display_name` matches what's in usage events
- [ ] `locale` setting (fr-CA/en-CA)

**Expected:**
- Both users should have `consent_analytics = true` (default)
- User names should match database values

---

## 🧪 **Step 2: Test Templates (Priority Order)**

### **Template 1: `section7-rd` (Section 7 - R&D Pipeline)** 🔬 **SPECIAL TEMPLATE**

**About This Template:**
- **Special R&D template** with enhanced compliance checking
- Uses `Section7RdService.ts` (not regular formatter)
- Has quality assurance and manager review steps
- Most frequently used template (5 uses)

**Test Scenarios:**

#### **Test with User 1 (tamonuzziel@gmail.com):**
- [ ] **Loading Overlay:** Verify overlay appears when template is applied
- [ ] **Progress Messages:** Verify messages update (may have R&D-specific messages)
- [ ] **Formatting:** Verify Section 7 R&D formatting is applied correctly
- [ ] **Usage Tracking:** Verify entry in `template_usage_events` table
- [ ] **Feedback Queue:** Verify entry in `feedback_prompts_queue` table
- [ ] **Feedback Banner:** Wait 2 minutes, verify banner appears

#### **Test with User 2 (uzzielt@techehealthservices.com):**
- [ ] **Loading Overlay:** Verify overlay appears when template is applied
- [ ] **Progress Messages:** Verify messages update correctly
- [ ] **Formatting:** Verify Section 7 R&D formatting is applied correctly
- [ ] **Usage Tracking:** Verify entry in `template_usage_events` table
- [ ] **Feedback Queue:** Verify entry in `feedback_prompts_queue` table
- [ ] **Feedback Banner:** Wait 2 minutes, verify banner appears

#### **Compare Results:**
- [ ] **Same Formatting:** Both users should get same formatting result for same input
- [ ] **Same Progress Messages:** Both users should see same progress messages
- [ ] **Same Loading Time:** Processing time should be similar

**What to Verify:**
- ✅ Overlay appears immediately
- ✅ Progress messages update: "Preparing...", "Analyzing...", "Formatting Section 7 R&D...", "Processing...", "Finalizing..."
- ✅ R&D-specific formatting is applied (compliance checking)
- ✅ Usage is tracked for both users
- ✅ Feedback banner appears after 2 minutes for both users

---

### **Template 2: `section7-ai-formatter` (Section 7)** 🔷

**About This Template:**
- Regular Section 7 AI formatter
- Uses standard AI formatting service
- Both users have used this template

**Test Scenarios:**

#### **Test with Both Users:**
- [ ] **Loading Overlay:** Verify overlay appears
- [ ] **Progress Messages:** Verify Section 7-specific messages:
  - "Preparing AI formatting..."
  - "Formatting Section 7..."
  - "Processing Section 7 formatting..."
  - "Finalizing Section 7 formatting..."
- [ ] **Formatting:** Verify Section 7 formatting is applied
- [ ] **Usage Tracking:** Verify entry in `template_usage_events` table
- [ ] **Feedback Banner:** Verify appears after 2 minutes

**What to Verify:**
- ✅ Same behavior as `section7-rd` but without R&D-specific processing
- ✅ Progress messages are Section 7-specific
- ✅ Formatting is Section 7-compliant

---

### **Template 3: `section8-ai-formatter` (Section 8)** 🔷

**About This Template:**
- Section 8 AI formatter
- Only User 2 has used this template

**Test Scenarios:**

#### **Test with User 2 (uzzielt@techehealthservices.com):**
- [ ] **Loading Overlay:** Verify overlay appears
- [ ] **Progress Messages:** Verify Section 8-specific messages:
  - "Preparing AI formatting..."
  - "Formatting Section 8..."
  - "Processing Section 8 formatting..."
  - "Finalizing Section 8 formatting..."
- [ ] **Formatting:** Verify Section 8 formatting is applied
- [ ] **Usage Tracking:** Verify entry in `template_usage_events` table
- [ ] **Feedback Banner:** Verify appears after 2 minutes

#### **Test with User 1 (tamonuzziel@gmail.com):**
- [ ] **Template Available:** Verify template is available in dropdown
- [ ] **Can Apply:** Verify User 1 can also apply this template
- [ ] **Same Behavior:** Verify same behavior as User 2

**What to Verify:**
- ✅ Section 8-specific progress messages
- ✅ Section 8-specific formatting
- ✅ Both users can use this template (if available)

---

## 📊 **Step 3: Database Verification**

**After Each Template Test, Run These Queries:**

### **Check Usage Events:**
```sql
SELECT 
  tue.id,
  tue.template_id,
  tue.user_name,
  tue.user_email,
  tue.section_id,
  tue.mode_id,
  tue.applied_at,
  tc.name AS template_name
FROM template_usage_events tue
LEFT JOIN template_combinations tc ON tue.template_id = tc.id
WHERE tue.user_email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY tue.applied_at DESC
LIMIT 10;
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
  tf.time_to_rate,
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

### **Check Template Stats:**
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
WHERE template_id IN (
  'section7-rd',
  'section7-ai-formatter',
  'section8-ai-formatter'
)
ORDER BY total_usage DESC;
```

---

## 🎯 **Step 4: Critical Systems Verification**

### **For Each Template, Verify:**

#### **✅ Processing Orchestrator:**
- [ ] Template is recognized by ProcessingOrchestrator
- [ ] Section/mode/template compatibility is validated
- [ ] Processing completes successfully
- [ ] No errors in backend logs

#### **✅ Format API Endpoint (`/api/format/mode2`):**
- [ ] Endpoint accepts template ID
- [ ] Returns 200 OK status
- [ ] Response format is unchanged
- [ ] Processing time is acceptable

#### **✅ Layer System:**
- [ ] Layers are applied correctly (if applicable)
- [ ] Clinical entity extraction works (if applicable)
- [ ] No layer errors in logs

#### **✅ Language System:**
- [ ] Input/output language selectors work
- [ ] Language parameters are passed correctly
- [ ] Section 7/8 language enforcement works

#### **✅ Loading Overlay:**
- [ ] Overlay appears immediately
- [ ] Progress messages update correctly
- [ ] Overlay disappears when formatting completes
- [ ] Background is blurred correctly

#### **✅ Usage Tracking:**
- [ ] Event is recorded in `template_usage_events`
- [ ] User name and email are populated
- [ ] Timestamp is correct
- [ ] Template ID matches

#### **✅ Feedback System:**
- [ ] Queue entry is created (if consent = true)
- [ ] Banner appears after 2 minutes (if consent = true)
- [ ] Rating submission works
- [ ] Feedback is stored in database

---

## 🚨 **Special Considerations**

### **Template: `section7-rd` (R&D Pipeline)**

**Special Features:**
- Uses `Section7RdService.ts` instead of regular formatter
- Has enhanced compliance checking
- Quality assurance and manager review steps
- May have different progress messages

**What to Check:**
- [ ] Progress messages are R&D-specific (if applicable)
- [ ] Processing time may be longer (due to R&D pipeline)
- [ ] Formatting includes compliance checks
- [ ] Both users get same R&D processing

**Potential Differences:**
- R&D template may have additional processing steps
- Progress messages may show "R&D Pipeline" specific messages
- Processing may take longer than regular templates

---

## 📝 **Test Results Template**

### **Test Date:** _______________

#### **User 1: Uzziel (tamonuzziel@gmail.com)**
- [ ] Profile checked: ✅ / ❌
- [ ] `consent_analytics`: ✅ true / ❌ false
- [ ] Template `section7-rd` tested: ✅ / ❌
- [ ] Template `section7-ai-formatter` tested: ✅ / ❌
- [ ] Loading overlay works: ✅ / ❌
- [ ] Progress messages update: ✅ / ❌
- [ ] Usage tracking works: ✅ / ❌
- [ ] Feedback banner appears: ✅ / ❌

#### **User 2: uzziel Tamon (uzzielt@techehealthservices.com)**
- [ ] Profile checked: ✅ / ❌
- [ ] `consent_analytics`: ✅ true / ❌ false
- [ ] Template `section7-rd` tested: ✅ / ❌
- [ ] Template `section7-ai-formatter` tested: ✅ / ❌
- [ ] Template `section8-ai-formatter` tested: ✅ / ❌
- [ ] Loading overlay works: ✅ / ❌
- [ ] Progress messages update: ✅ / ❌
- [ ] Usage tracking works: ✅ / ❌
- [ ] Feedback banner appears: ✅ / ❌

#### **Issues Found:**
- _______________________________________
- _______________________________________
- _______________________________________

---

## 🎯 **Testing Priority**

1. **HIGHEST:** Verify `consent_analytics` status for both users
2. **HIGH:** Test `section7-rd` template with both users (most used)
3. **HIGH:** Test `section8-ai-formatter` with User 2 (verify User 1 can also use)
4. **MEDIUM:** Test `section7-ai-formatter` with both users
5. **LOW:** Compare behavior between users for same templates

---

## ✅ **Success Criteria**

**All Critical Systems Working:**
- ✅ ProcessingOrchestrator works for all templates
- ✅ Format endpoints return correct responses
- ✅ Loading overlay appears and updates correctly
- ✅ Progress messages update for all templates
- ✅ Usage tracking works (if consent = true)
- ✅ Feedback system works (if consent = true)

**User Differences:**
- ✅ Same template, different users → Same formatting result
- ✅ Same template, different users → Same progress messages
- ✅ Same template, different users → Different tracking (based on consent)
- ✅ Same template, different users → Different feedback banner (based on consent)

---

**Ready to start systematic testing!** 🚀

