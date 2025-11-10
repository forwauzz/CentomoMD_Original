# Template User Differences Investigation

**Date:** 2025-01-09  
**Issue:** Section 7 templates work for `tamonuzziel@gmail.com` but NOT for `uzzielt@techehealthservices.com`

---

## 🔍 **Problem Statement**

### **Symptoms:**
- ✅ `tamonuzziel@gmail.com` - Section 7 templates work
- ❌ `uzzielt@techehealthservices.com` - Section 7 templates do NOT work

### **User Details:**
Both users have:
- ✅ `consent_analytics = true`
- ✅ Templates appear in usage events
- ❓ Unknown: `locale` settings (fr-CA vs en-CA)
- ❓ Unknown: Language preferences

---

## 🧪 **Diagnostic Steps**

### **Step 1: Check User Profiles**
```sql
SELECT user_id, email, display_name, locale, consent_analytics 
FROM profiles 
WHERE email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
);
```

**What to Check:**
- [ ] `locale` values for each user
- [ ] `display_name` matches usage events
- [ ] `consent_analytics` status

---

### **Step 2: Check Template Status in Database**
```sql
SELECT id, name, is_active, language, compatible_sections 
FROM template_combinations
WHERE id IN ('section7-rd', 'section7-ai-formatter');
```

**What to Check:**
- [ ] `is_active = true` for both templates
- [ ] `language` setting (fr, en, or both)
- [ ] `compatible_sections` includes `section_7`

---

### **Step 3: Check Language Compatibility**

**Frontend Filtering:**
- Templates are filtered by `currentLanguage` (fr-CA vs en-US)
- Templates with `language = 'both'` should work for both locales
- Templates with `language = 'fr'` only work for `fr-CA` locale
- Templates with `language = 'en'` only work for `en-US` locale

**Potential Issue:**
- If User 2 has `locale = 'en-CA'` but templates have `language = 'fr'`, they won't appear
- If User 2 has `locale = 'fr-CA'` but templates have `language = 'en'`, they won't appear

---

### **Step 4: Check Template Loading Path**

**Template Loading Flow:**
1. `TemplateContext.tsx` loads templates from API or static config
2. Filters by `isActive`
3. `TemplateDropdown.tsx` loads templates from context
4. Filters by `language` compatibility AND `isActive`

**Potential Issues:**
1. **API Failure:** API fails for User 2 → falls back to static config
2. **Language Filter:** Frontend filters out templates based on user locale
3. **Template Status:** Templates have different `is_active` status in database vs static config

---

### **Step 5: Check Browser Console Logs**

**What to Look For:**
- `TemplateProvider: Loaded X templates from API` vs `Using static TEMPLATE_CONFIGS as fallback`
- `TemplateDropdown: Loaded X templates (modular) with language Y`
- `TemplateDropdown: Template titles: [...]`
- Any API errors or warnings

---

## 🔍 **Potential Root Causes**

### **Cause 1: Language Filtering** ⚠️ **MOST LIKELY**
**Problem:** User 2's locale doesn't match template language settings

**Solution:**
- Check user `locale` values
- Check template `language` settings
- Ensure templates have `language = 'both'` if they should work for all locales

---

### **Cause 2: API Failure for User 2** ⚠️ **POSSIBLE**
**Problem:** API returns different results for User 2

**Solution:**
- Check API logs for User 2's requests
- Verify authentication is working
- Check if API returns same templates for both users

---

### **Cause 3: Template Status Mismatch** ⚠️ **POSSIBLE**
**Problem:** Templates have different `is_active` status in database vs static config

**Solution:**
- Verify database has `is_active = true` for both templates
- Verify static config has `isActive = true` for both templates
- Ensure database migration populated templates correctly

---

### **Cause 4: Frontend Filtering Bug** ⚠️ **LESS LIKELY**
**Problem:** Frontend filtering logic excludes templates for User 2

**Solution:**
- Check `TemplateDropdown.tsx` filtering logic
- Verify `getAllTemplates()` returns same templates for both users
- Check if language conversion is working correctly

---

## 🛠️ **Testing Steps**

### **Test 1: Check API Response**
```bash
# Test with User 1 token
curl -H "Authorization: Bearer <token1>" \
  https://api.alie.app/api/template-combinations?active=true

# Test with User 2 token
curl -H "Authorization: Bearer <token2>" \
  https://api.alie.app/api/template-combinations?active=true
```

**What to Check:**
- [ ] Same templates returned for both users
- [ ] `section7-rd` and `section7-ai-formatter` are in both responses
- [ ] Both have `is_active = true`

---

### **Test 2: Check Frontend Console**
**For User 1:**
1. Open browser console
2. Navigate to dictation page
3. Check console logs for:
   - `TemplateProvider: Loaded X templates from API`
   - `TemplateDropdown: Loaded X templates (modular) with language Y`
   - List of template titles

**For User 2:**
1. Open browser console
2. Navigate to dictation page
3. Check console logs for:
   - `TemplateProvider: Loaded X templates from API`
   - `TemplateDropdown: Loaded X templates (modular) with language Y`
   - List of template titles

**Compare:**
- [ ] Same number of templates loaded?
- [ ] Same template titles?
- [ ] Same language setting?

---

### **Test 3: Check Template Dropdown**
**For User 1:**
1. Select Section 7
2. Open template dropdown
3. Note available templates

**For User 2:**
1. Select Section 7
2. Open template dropdown
3. Note available templates

**Compare:**
- [ ] Same templates in dropdown?
- [ ] `section7-rd` appears for both?
- [ ] `section7-ai-formatter` appears for both?

---

## 📊 **Expected Results**

### **If Language Filtering is the Issue:**
- User 1 has `locale = 'fr-CA'`, templates have `language = 'fr'` → ✅ Works
- User 2 has `locale = 'en-CA'`, templates have `language = 'fr'` → ❌ Doesn't work

### **If API Failure is the Issue:**
- User 1 gets templates from API → ✅ Works
- User 2 gets templates from static config → ❌ May not work (if static config is outdated)

### **If Template Status is the Issue:**
- Templates in database have `is_active = false` for User 2 → ❌ Won't work
- Templates in database have `is_active = true` for User 1 → ✅ Works

---

## 🎯 **Quick Fix Options**

### **Option 1: Set Templates to `language = 'both'`**
```sql
UPDATE template_combinations 
SET language = 'both' 
WHERE id IN ('section7-rd', 'section7-ai-formatter');
```

**Pros:**
- Works for all locales
- No user changes needed

**Cons:**
- May not be intended behavior

---

### **Option 2: Set User Locale to Match Templates**
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

---

### **Option 3: Create Language-Specific Templates**
- Create `section7-ai-formatter-en` for English users
- Create `section7-ai-formatter-fr` for French users

**Pros:**
- Proper separation of concerns
- Language-specific optimizations

**Cons:**
- More complex
- Requires more maintenance

---

## 🚨 **Immediate Action Items**

1. **Run diagnostic queries** to identify root cause
2. **Check user locale settings** in database
3. **Check template language settings** in database
4. **Check API responses** for both users
5. **Check browser console logs** for both users

---

## 📋 **Checklist**

- [ ] User profiles checked (locale, consent)
- [ ] Template status checked (is_active, language)
- [ ] API responses compared (both users)
- [ ] Frontend console logs compared (both users)
- [ ] Template dropdown compared (both users)
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Fix tested with both users
- [ ] Documentation updated

---

**See:** `backend/scripts/diagnose-template-issue.sql` for diagnostic queries

