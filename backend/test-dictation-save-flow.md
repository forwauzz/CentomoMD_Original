# 🧪 Dictation Save Flow Testing Script

## 📋 Pre-Test Checklist
- [ ] Frontend running on `http://localhost:5173`
- [ ] Backend running on `http://localhost:3001`
- [ ] All new routes mounted: `/api/sessions`, `/api/cases`, `/api/format`
- [ ] Feature flag enabled: `VITE_ENABLE_SCHEMA_DRIVEN_FORMS=true`

---

## 🎯 Test Scenarios

### **Test 1: New Case Page - Dictation Panel**
**Goal**: Verify dictation panel shows only "Go to Dictation" button

1. **Navigate to**: `http://localhost:5173/case/new`
2. **Click on Section 7** (or any audio-required section)
3. **Verify**:
   - [ ] Dictation panel appears on the right
   - [ ] Shows "Go to Dictation" button only
   - [ ] No manual transcription input
   - [ ] No "Save to Section" button
   - [ ] Current section shows correctly

**Expected Result**: Clean dictation panel with navigation only

---

### **Test 2: Dictation Page - Basic Save Functionality**
**Goal**: Test basic save to section functionality

1. **Navigate to**: `http://localhost:5173/dictation`
2. **Input some text** in the transcript area
3. **Click "Save to Section"**
4. **Verify**:
   - [ ] Save dropdown opens
   - [ ] Shows section selection options
   - [ ] Can select Section 7 or Section 8
   - [ ] Can choose text field (finalText/rawTranscript)
   - [ ] Save button works

**Expected Result**: Basic save functionality works

---

### **Test 3: Template-Based Recommendations**
**Goal**: Test template recommendations in save dropdown

1. **On dictation page**, select a **Section 7 template** (e.g., "Section 7 AI Formatter")
2. **Click "Save to Section"**
3. **Verify**:
   - [ ] Blue recommendation panel appears
   - [ ] Shows "Section 7 - Historique de faits et évolution (Recommandé)"
   - [ ] Template name shown in dropdown header
   - [ ] Can click recommendation to auto-select

**Expected Result**: Template recommendations work correctly

---

### **Test 4: Multi-Section Save Mode**
**Goal**: Test saving to multiple sections simultaneously

1. **On dictation page**, ensure multi-section mode is available
2. **Click "Save to Section"**
3. **Click "Multi-sections" mode**
4. **Select both Section 7 and Section 8** checkboxes
5. **Click Save**
6. **Verify**:
   - [ ] Both sections selected
   - [ ] Save button shows "Save to 2 sections"
   - [ ] Backend logs show session creation for both sections
   - [ ] Success message appears

**Expected Result**: Multi-section save works

---

### **Test 5: Backend Integration**
**Goal**: Verify backend API calls and database operations

**Watch backend terminal for**:
- [ ] `✅ Session created: [session-id]`
- [ ] `✅ Section [section-id] committed for case [case-id] from session [session-id]`
- [ ] No error messages

**Check browser console for**:
- [ ] `✅ Transcript saved to Section 7, Section 8`
- [ ] No JavaScript errors

**Expected Result**: Clean backend integration

---

### **Test 6: Section 11 Generate from Sections**
**Goal**: Test the "Generate from sections" button

1. **Navigate to**: `http://localhost:5173/case/new`
2. **Click on Section 11**
3. **Verify**:
   - [ ] "Generate from sections 7, 8, 9" button appears
   - [ ] Button shows loading state when clicked
   - [ ] Backend logs show section 11 generation
   - [ ] Generated content appears in Section 11

**Expected Result**: Section 11 generation works

---

### **Test 7: Error Handling**
**Goal**: Test error scenarios

1. **Try to save empty transcript**:
   - [ ] Save button disabled
   - [ ] No API calls made

2. **Test network error** (disable backend temporarily):
   - [ ] Error message shown
   - [ ] UI doesn't break

**Expected Result**: Graceful error handling

---

## 🔍 Debugging Commands

### **Check Backend Routes**
```bash
# In backend terminal, look for:
✅ /api/sessions routes mounted
✅ /api/cases routes mounted  
✅ /api/format routes mounted
```

### **Check Frontend Console**
```javascript
// Open browser console and check:
console.log('Schema loaded:', window.schema);
console.log('Feature flag enabled:', import.meta.env.VITE_ENABLE_SCHEMA_DRIVEN_FORMS);
```

### **Test API Endpoints Directly**
```bash
# Test session creation
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"sectionId":"section_7","transcript":"Test transcript","metadata":{}}'

# Test section commit
curl -X POST http://localhost:3001/api/cases/case_123/sections/section_7/commit \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"session_123","finalText":"Test final text"}'
```

---

## 📊 Test Results Template

```
Test Date: ___________
Tester: ___________

Test 1 - New Case Page: [ ] PASS [ ] FAIL
Notes: _________________________________

Test 2 - Basic Save: [ ] PASS [ ] FAIL  
Notes: _________________________________

Test 3 - Template Recommendations: [ ] PASS [ ] FAIL
Notes: _________________________________

Test 4 - Multi-Section Save: [ ] PASS [ ] FAIL
Notes: _________________________________

Test 5 - Backend Integration: [ ] PASS [ ] FAIL
Notes: _________________________________

Test 6 - Section 11 Generation: [ ] PASS [ ] FAIL
Notes: _________________________________

Test 7 - Error Handling: [ ] PASS [ ] FAIL
Notes: _________________________________

Overall Result: [ ] PASS [ ] FAIL
Issues Found: _________________________________
```

---

## 🚨 Common Issues & Solutions

### **Issue**: Save dropdown not opening
**Solution**: Check browser console for JavaScript errors

### **Issue**: Backend API calls failing
**Solution**: Verify backend is running and routes are mounted

### **Issue**: Template recommendations not showing
**Solution**: Check if template is properly selected and feature flag is enabled

### **Issue**: Multi-section mode not available
**Solution**: Ensure template includes "section" in name or mode is "ambient"

---

## 🎉 Success Criteria

All tests pass when:
- [ ] New Case page shows clean dictation panel
- [ ] Dictation page has enhanced save functionality
- [ ] Template recommendations work
- [ ] Multi-section save works
- [ ] Backend integration is clean
- [ ] Section 11 generation works
- [ ] Error handling is graceful

**Ready for production when all tests pass!** ✅
