# 🧪 Manual Testing Guide: New Case Creation and Section Filling

## Test Workflow Overview

This guide walks you through testing the complete case creation and section filling workflow manually in the browser.

---

## ✅ Prerequisites

1. **Backend server running** on `http://localhost:3001`
2. **Frontend server running** on `http://localhost:5173`
3. **Database migration completed** (status column added)
4. **User logged in** with valid authentication

---

## 📋 Test Scenarios

### Test 1: Create New Case

**Steps:**
1. Navigate to Dashboard (`http://localhost:5173/dashboard`)
2. Click **"Nouveau cas"** button or **"New Case"** in sidebar
3. **Clinic Selection Modal** should appear
4. Select a clinic (e.g., "Clinique Médicale de l'Or et des Bois")
5. Click **"Création..."** button

**Expected Results:**
- ✅ Modal closes
- ✅ Redirected to `/case/new?caseId=<id>`
- ✅ Case name editor shows "Nouveau cas"
- ✅ Case status shows "Brouillon" (draft)
- ✅ Section navigation panel appears on the left
- ✅ First section (Section A) should be active
- ✅ Overall progress bar shows 0%

**Console Check:**
- ✅ No errors in browser console
- ✅ Should see: `✅ Case created successfully: <caseId>`
- ✅ Should see: `✅ Case name updated`

---

### Test 2: Fill Section A (Patient Information)

**Steps:**
1. Verify you're on Section A
2. Fill in the form fields:
   - **Nom:** Test Patient
   - **ID:** PAT123
   - **Date de naissance:** 1990-01-01
   - **Genre:** M
   - **Téléphone:** 514-555-1234
   - **Courriel:** patient@example.com
   - **Adresse:** 123 Test St, Montreal, QC
3. Wait 2 seconds (auto-save should trigger)
4. Click **"Enregistrer"** button

**Expected Results:**
- ✅ "Sauvé maintenant" appears in Section A navigation item
- ✅ Section A shows blue "saved" icon
- ✅ Progress bar appears for Section A showing completion
- ✅ Save timestamp appears (e.g., "Sauvé il y a 0min")
- ✅ Status changes to "in_progress" or shows saved state

**Console Check:**
- ✅ Should see: `✅ Section auto-saved to database: section_a`
- ✅ Should see: `✅ Section saved to database: section_a`
- ✅ No errors

---

### Test 3: Navigate to Section B

**Steps:**
1. Click **"Suivant"** button (or click Section B in navigation)
2. Section B should load

**Expected Results:**
- ✅ Section B loads with physician information pre-filled from profile
- ✅ Section B navigation item shows as active (blue highlight)
- ✅ Section A still shows saved state
- ✅ Can see Section A progress bar and save timestamp

**Profile Data Check:**
- ✅ Nom: CENTOMO (or from profile)
- ✅ Prénom: Hugo (or from profile)
- ✅ No permis: 1-18154
- ✅ Adresse: 5777 Boul. Gouin Ouest...
- ✅ Téléphone: 514-331-1400
- ✅ Courriel: adjointe.orthopedie@gmail.com

---

### Test 4: Fill Section B (Physician Information)

**Steps:**
1. Verify profile data is pre-filled
2. Edit some fields (e.g., change phone number)
3. Wait 2 seconds (auto-save)
4. Click **"Enregistrer"** button

**Expected Results:**
- ✅ Section B shows saved state
- ✅ Save timestamp appears
- ✅ Progress bar updates
- ✅ Data persists after save

**Console Check:**
- ✅ Should see: `✅ Section auto-saved to database: section_b`
- ✅ Should see: `✅ Section saved to database: section_b`

---

### Test 5: Navigate Between Sections

**Steps:**
1. Click **"Précédent"** to go back to Section A
2. Verify Section A data is still there
3. Click **"Suivant"** again to go to Section B
4. Try clicking different sections in the navigation panel

**Expected Results:**
- ✅ Navigation works smoothly
- ✅ All filled data persists
- ✅ Save timestamps remain visible
- ✅ Active section highlights correctly
- ✅ Progress bars show correct completion

---

### Test 6: Edit Case Name

**Steps:**
1. Click the **edit icon** next to case name
2. Change name to: "Test Case - Patient: Test Patient"
3. Press **Enter** or click **✓** button

**Expected Results:**
- ✅ Case name updates immediately
- ✅ Name persists after page refresh
- ✅ Name appears in Recent Cases list

**Console Check:**
- ✅ Should see: `✅ Case name updated: Test Case - Patient: Test Patient`

---

### Test 7: Fill Multiple Sections

**Steps:**
1. Navigate to Section 7
2. Fill in main content textarea
3. Wait for auto-save
4. Navigate to Section 8
5. Fill in Section 8 data
6. Save Section 8

**Expected Results:**
- ✅ Each section saves independently
- ✅ All sections show progress bars
- ✅ Overall progress bar updates
- ✅ Multiple sections show save timestamps

**Console Check:**
- ✅ Should see saves for each section
- ✅ Overall progress calculation updates

---

### Test 8: Complete Case

**Steps:**
1. In the section navigation panel, scroll to the top
2. Look for **"Statut:"** badge (should show "En cours" or "Brouillon")
3. Click **"Terminer"** button

**Expected Results:**
- ✅ Status badge changes to **"Terminé"** (green)
- ✅ **"Terminer"** button disappears
- ✅ **"Reprendre"** button appears
- ✅ Overall progress bar still visible
- ✅ All section data remains intact

**Console Check:**
- ✅ Should see: `✅ Case marked as completed: <caseId>`

---

### Test 9: Resume Completed Case

**Steps:**
1. With case still completed, click **"Reprendre"** button
2. Status should change back

**Expected Results:**
- ✅ Status changes back to "En cours"
- ✅ Can continue editing sections
- ✅ Case can be completed again

**Console Check:**
- ✅ Should see: `✅ Case marked as in progress: <caseId>`

---

### Test 10: Verify Recent Cases

**Steps:**
1. Navigate back to Dashboard
2. Check **"Recent Cases"** section
3. Find your test case in the list

**Expected Results:**
- ✅ Test case appears in Recent Cases
- ✅ Case name shows: "Test Case - Patient: Test Patient"
- ✅ Status badge shows correct status
- ✅ Can click to reopen the case
- ✅ All data persists when reopening

---

### Test 11: Page Refresh Persistence

**Steps:**
1. With case open, refresh the browser page (F5)
2. Verify all data loads correctly

**Expected Results:**
- ✅ Case loads from database
- ✅ All filled sections show their data
- ✅ Save timestamps preserved
- ✅ Progress bars show correct values
- ✅ Case name persists
- ✅ Case status persists

---

### Test 12: Multiple Cases Workflow

**Steps:**
1. Create a second new case
2. Verify case name resets to "Nouveau cas"
3. Fill Section A with different data
4. Save and verify

**Expected Results:**
- ✅ Second case has independent name
- ✅ Second case has independent data
- ✅ No data leakage between cases
- ✅ Both cases appear in Recent Cases
- ✅ Can switch between cases without issues

---

## 🐛 Common Issues to Watch For

### ❌ If Case Creation Fails:
- Check backend console for errors
- Verify DATABASE_URL is set correctly
- Check if status column migration ran successfully
- Verify authentication token is valid

### ❌ If Sections Don't Save:
- Check browser console for API errors
- Verify backend is running
- Check network tab for failed requests
- Verify section data format

### ❌ If Progress Bars Don't Update:
- Check if section data is being saved correctly
- Verify progress calculation logic
- Check browser console for calculation errors

### ❌ If Case Name Persists Between Cases:
- Verify case name resets on new case creation
- Check useEffect dependencies in NewCasePage
- Verify currentCase?.id changes properly

---

## ✅ Success Criteria

All tests pass if:
- ✅ Case creation works without errors
- ✅ All sections can be filled and saved
- ✅ Auto-save works (2-second delay)
- ✅ Manual save works
- ✅ Navigation between sections works
- ✅ Case name editing works
- ✅ Case completion workflow works
- ✅ Data persists across page refreshes
- ✅ Multiple cases work independently
- ✅ Recent Cases list updates correctly
- ✅ Progress tracking works accurately
- ✅ Save status indicators show correctly

---

## 📊 Expected Database State

After completing all tests, check the database:

```sql
SELECT 
  id, 
  name, 
  status, 
  jsonb_object_keys(draft->'sections') as sections,
  updated_at
FROM cases 
ORDER BY updated_at DESC 
LIMIT 5;
```

Should show:
- ✅ Multiple cases with different names
- ✅ Status values: draft, in_progress, or completed
- ✅ Sections populated in draft JSON
- ✅ Updated timestamps reflect recent activity

---

## 🎯 Next Steps After Testing

If all tests pass:
1. ✅ Workflow is complete and working
2. ✅ Ready for export feature implementation
3. ✅ Ready for production testing

If any tests fail:
1. Note which test failed
2. Check console errors
3. Verify database state
4. Fix issues surgically
5. Retest from beginning

