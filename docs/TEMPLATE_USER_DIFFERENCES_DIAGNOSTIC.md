# Template User Differences - Diagnostic Report

**Date:** 2025-01-09  
**Issue:** Section 7 templates work for `tamonuzziel@gmail.com` but NOT for `uzzielt@techehealthservices.com`

---

## 🔍 **Diagnostic Steps**

### **Step 1: Check User Profiles**

**Run this query:**
```sql
SELECT 
  user_id, 
  email, 
  display_name, 
  locale,
  consent_analytics,
  created_at
FROM profiles 
WHERE email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY email;
```

**Expected Output:**
```
user_id | email                          | display_name | locale | consent_analytics | created_at
--------|--------------------------------|--------------|--------|-------------------|------------
...     | tamonuzziel@gmail.com          | Uzziel       | ?      | true              | ...
...     | uzzielt@techehealthservices.com| uzziel Tamon | ?      | true              | ...
```

**What to Check:**
- [ ] `locale` value for User 1 (should be `fr-CA` or `en-CA`)
- [ ] `locale` value for User 2 (should be `fr-CA` or `en-CA`)
- [ ] If `locale` differs, this may be the root cause

---

### **Step 2: Check Section 7 Template Settings**

**Run this query:**
```sql
SELECT 
  id,
  name,
  name_fr,
  name_en,
  type,
  compatible_sections,
  compatible_modes,
  language,
  is_active,
  is_default,
  created_at
FROM template_combinations
WHERE id IN ('section7-rd', 'section7-ai-formatter')
ORDER BY id;
```

**Expected Output:**
```
id                    | name                    | language | is_active | compatible_sections
----------------------|-------------------------|----------|-----------|-------------------
section7-ai-formatter| Section 7               | ?        | true      | ["section_7"]
section7-rd          | Section 7 - R&D Pipeline | ?        | true      | ["section_7"]
```

**What to Check:**
- [ ] `language` value for `section7-rd` (should be `fr`, `en`, or `both`)
- [ ] `language` value for `section7-ai-formatter` (should be `fr`, `en`, or `both`)
- [ ] `is_active` is `true` for both templates
- [ ] `compatible_sections` includes `section_7` for both

---

### **Step 3: Check Language Compatibility**

**Run this query:**
```sql
SELECT 
  p.email,
  p.locale,
  tc.id AS template_id,
  tc.name AS template_name,
  tc.language AS template_language,
  tc.is_active AS template_is_active,
  CASE 
    WHEN tc.language = 'both' THEN '✅ Compatible (both)'
    WHEN tc.language = 'fr' AND p.locale = 'fr-CA' THEN '✅ Compatible (fr)'
    WHEN tc.language = 'en' AND (p.locale = 'en-CA' OR p.locale = 'en-US') THEN '✅ Compatible (en)'
    WHEN tc.language = 'both' THEN '✅ Compatible (both)'
    ELSE '❌ NOT Compatible'
  END AS compatibility_status
FROM profiles p
CROSS JOIN template_combinations tc
WHERE p.email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
AND tc.id IN ('section7-rd', 'section7-ai-formatter')
ORDER BY p.email, tc.id;
```

**Expected Output:**
```
email                          | locale | template_id          | template_language | compatibility_status
-------------------------------|--------|---------------------|-------------------|--------------------
tamonuzziel@gmail.com          | ?      | section7-ai-formatter| ?                 | ✅ / ❌
tamonuzziel@gmail.com          | ?      | section7-rd          | ?                 | ✅ / ❌
uzzielt@techehealthservices.com| ?      | section7-ai-formatter| ?                 | ✅ / ❌
uzzielt@techehealthservices.com| ?      | section7-rd          | ?                 | ✅ / ❌
```

**What to Check:**
- [ ] User 1 compatibility status (should be `✅`)
- [ ] User 2 compatibility status (should be `❌` if issue is language filtering)
- [ ] If User 2 shows `❌ NOT Compatible`, language filtering is the root cause

---

### **Step 4: Check API Response Differences**

**Test with User 1 token:**
```bash
curl -H "Authorization: Bearer <token1>" \
  https://api.alie.app/api/template-combinations?active=true | jq '.data[] | select(.id | contains("section7"))'
```

**Test with User 2 token:**
```bash
curl -H "Authorization: Bearer <token2>" \
  https://api.alie.app/api/template-combinations?active=true | jq '.data[] | select(.id | contains("section7"))'
```

**What to Check:**
- [ ] Same templates returned for both users
- [ ] `section7-rd` appears in both responses
- [ ] `section7-ai-formatter` appears in both responses
- [ ] If API returns same templates, issue is in frontend filtering

---

### **Step 5: Check Frontend Console Logs**

**For User 1:**
1. Open browser console
2. Navigate to dictation page
3. Look for:
   - `TemplateProvider: Loaded X templates from API`
   - `TemplateDropdown: Loaded X templates (modular) with language Y`
   - `TemplateDropdown: Template titles: [...]`

**For User 2:**
1. Open browser console
2. Navigate to dictation page
3. Look for:
   - `TemplateProvider: Loaded X templates from API`
   - `TemplateDropdown: Loaded X templates (modular) with language Y`
   - `TemplateDropdown: Template titles: [...]`

**What to Check:**
- [ ] Same number of templates loaded for both users
- [ ] Same language setting in logs
- [ ] Same template titles in logs
- [ ] If different, frontend filtering is the issue

---

## 🎯 **Root Cause Analysis**

### **Scenario 1: Language Filtering Issue** ⚠️ **MOST LIKELY**

**Problem:**
- User 1 has `locale = 'fr-CA'`, templates have `language = 'fr'` or `both` → ✅ Works
- User 2 has `locale = 'en-CA'`, templates have `language = 'fr'` → ❌ Filtered out

**Evidence:**
- User 2's `locale` doesn't match template `language` setting
- Frontend filtering excludes templates based on language compatibility

**Solution:**
1. Set templates to `language = 'both'` (works for all locales)
2. OR set User 2's locale to match templates
3. OR create language-specific templates

---

### **Scenario 2: API Returns Different Results** ⚠️ **LESS LIKELY**

**Problem:**
- API returns different templates for different users (unlikely without user-specific filtering)

**Evidence:**
- API responses differ between users
- Backend has user-specific filtering (not currently implemented)

**Solution:**
- Check backend API logic for user-specific filtering
- Verify template combination service returns same templates for all users

---

### **Scenario 3: Template Status Mismatch** ⚠️ **LESS LIKELY**

**Problem:**
- Templates have different `is_active` status in database vs static config

**Evidence:**
- Database has `is_active = false` for User 2's templates
- Static config has `isActive = true` for User 2's templates

**Solution:**
- Ensure database has `is_active = true` for both templates
- Verify migration populated templates correctly

---

## 🛠️ **Quick Fix Options**

### **Option 1: Set Templates to `language = 'both'`** ✅ **RECOMMENDED**

**Query:**
```sql
UPDATE template_combinations 
SET language = 'both' 
WHERE id IN ('section7-rd', 'section7-ai-formatter');
```

**Pros:**
- Works for all locales
- No user changes needed
- Simple one-line fix

**Cons:**
- May not be intended behavior (if templates should be language-specific)

**When to Use:**
- If templates should work for both French and English users
- If language filtering is too restrictive

---

### **Option 2: Set User Locale to Match Templates** ⚠️ **NOT RECOMMENDED**

**Query:**
```sql
UPDATE profiles 
SET locale = 'fr-CA' 
WHERE email = 'uzzielt@techehealthservices.com';
```

**Pros:**
- Matches template language
- User gets French interface

**Cons:**
- Changes user experience
- May not be what user wants
- Doesn't solve root cause

**When to Use:**
- If user wants French interface
- If templates should only work for French users

---

### **Option 3: Create Language-Specific Templates** 📋 **FOR FUTURE**

**Approach:**
- Create `section7-ai-formatter-en` for English users
- Create `section7-ai-formatter-fr` for French users
- Frontend selects based on user locale

**Pros:**
- Proper separation of concerns
- Language-specific optimizations
- Scalable solution

**Cons:**
- More complex
- Requires more maintenance
- Requires template duplication

**When to Use:**
- If templates need language-specific optimizations
- If there are significant differences between languages

---

## 📊 **Diagnostic Results Template**

### **Step 1: User Profiles**
```
User 1 (tamonuzziel@gmail.com):
- locale: ___________
- consent_analytics: ___________

User 2 (uzzielt@techehealthservices.com):
- locale: ___________
- consent_analytics: ___________
```

### **Step 2: Template Settings**
```
section7-rd:
- language: ___________
- is_active: ___________

section7-ai-formatter:
- language: ___________
- is_active: ___________
```

### **Step 3: Compatibility Status**
```
User 1 + section7-rd: ___________
User 1 + section7-ai-formatter: ___________
User 2 + section7-rd: ___________
User 2 + section7-ai-formatter: ___________
```

### **Step 4: API Response**
```
User 1 templates: ___________
User 2 templates: ___________
Same? Yes / No
```

### **Step 5: Frontend Logs**
```
User 1 logs: ___________
User 2 logs: ___________
Same? Yes / No
```

---

## 🎯 **Next Steps**

1. **Run diagnostic queries** (Steps 1-3)
2. **Record results** in this document
3. **Identify root cause** based on evidence
4. **Apply fix** (Option 1 recommended)
5. **Test fix** with both users
6. **Verify** templates work for both users

---

**Ready to diagnose!** 🚀

