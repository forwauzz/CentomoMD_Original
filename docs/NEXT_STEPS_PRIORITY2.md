# Priority 2 Testing - Next Steps

**Date:** 2025-01-09  
**Focus:** Diagnose why Section 7 templates work for one user but not another

---

## 🎯 **Immediate Action Items**

### **Step 1: Run Quick Diagnostic Query** ⚡ **DO THIS FIRST**

**File:** `backend/scripts/quick-diagnose-template-issue.sql`

**How to run:**
```bash
# Connect to your database and run:
psql -d your_database -f backend/scripts/quick-diagnose-template-issue.sql

# Or copy/paste the SQL queries into your database client
```

**What it checks:**
1. ✅ User profiles (locale, consent)
2. ✅ Template settings (language, is_active)
3. ✅ Compatibility between users and templates
4. ✅ Summary diagnosis

**Expected Output:**
- Shows user locales
- Shows template language settings
- Shows compatibility status for each user/template pair
- **DIAGNOSIS:** Either "✅ All templates compatible" or "⚠️ LANGUAGE FILTERING ISSUE DETECTED"

---

### **Step 2: Record Results** 📝

**File:** `docs/TEMPLATE_USER_DIFFERENCES_DIAGNOSTIC.md`

**What to record:**
1. User 1's `locale` value
2. User 2's `locale` value
3. Template `language` values
4. Compatibility status for each user/template pair
5. Diagnosis summary

---

### **Step 3: Apply Fix** 🛠️

**Based on diagnostic results:**

#### **If Language Filtering is the Issue:**

**Option A: Set Templates to `both`** (Recommended)
```sql
UPDATE template_combinations 
SET language = 'both' 
WHERE id IN ('section7-rd', 'section7-ai-formatter');
```

**Option B: Check User Locale**
- If User 2 has wrong locale, update it:
```sql
UPDATE profiles 
SET locale = 'fr-CA' 
WHERE email = 'uzzielt@techehealthservices.com';
```

**Option C: Check if templates should be language-specific**
- If templates should work for both languages, use Option A
- If templates should be language-specific, consider creating language-specific versions

---

### **Step 4: Test Fix** ✅

**After applying fix:**

1. **Refresh browser** for both users
2. **Check template dropdown** - Section 7 templates should appear for both users
3. **Try applying template** - Should work for both users
4. **Check console logs** - Should show same templates loaded for both users

---

### **Step 5: Verify** ✅

**Check:**
- [ ] User 1 can see Section 7 templates ✅
- [ ] User 2 can see Section 7 templates ✅
- [ ] User 1 can apply Section 7 templates ✅
- [ ] User 2 can apply Section 7 templates ✅
- [ ] Loading overlay appears for both users ✅
- [ ] Progress messages update for both users ✅
- [ ] Usage tracking works for both users ✅

---

## 📋 **Testing Checklist**

### **Pre-Fix Testing**
- [ ] Run diagnostic query
- [ ] Record results
- [ ] Identify root cause

### **Fix Application**
- [ ] Apply fix (SQL update)
- [ ] Verify fix in database

### **Post-Fix Testing**
- [ ] Test with User 1
- [ ] Test with User 2
- [ ] Verify both users can use Section 7 templates
- [ ] Check loading overlay works
- [ ] Check progress messages work
- [ ] Check usage tracking works

---

## 🚨 **If Issue Persists**

### **Additional Diagnostics:**

1. **Check API Response:**
   - Use browser DevTools Network tab
   - Check `/api/template-combinations?active=true` response
   - Compare responses for both users

2. **Check Frontend Console:**
   - Open browser console
   - Look for template loading messages
   - Compare logs for both users

3. **Check Browser Cache:**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Test again

4. **Check Authentication:**
   - Verify both users are authenticated
   - Check JWT tokens are valid
   - Verify API requests include auth headers

---

## 📊 **Success Criteria**

**All of these should be true:**

- ✅ Diagnostic query runs successfully
- ✅ Root cause identified
- ✅ Fix applied successfully
- ✅ Both users can see Section 7 templates
- ✅ Both users can apply Section 7 templates
- ✅ Loading overlay works for both users
- ✅ Progress messages work for both users
- ✅ Usage tracking works for both users

---

## 🔗 **Related Files**

- `backend/scripts/quick-diagnose-template-issue.sql` - Quick diagnostic query
- `backend/scripts/diagnose-template-issue.sql` - Detailed diagnostic queries
- `docs/TEMPLATE_USER_DIFFERENCES_INVESTIGATION.md` - Investigation guide
- `docs/TEMPLATE_USER_DIFFERENCES_DIAGNOSTIC.md` - Diagnostic report template

---

**Ready to diagnose!** 🚀

