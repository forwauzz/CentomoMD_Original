# 🧪 Section 7 CNESST Pipeline - Testing Guide

## Overview
This guide shows you how to test the Section 7 CNESST R&D Pipeline at different levels.

## 🎯 **Testing Levels**

### **Level 1: Basic Validation (Always Works)**
```bash
python eval/evaluator_section7.py
```
**What it tests:** Pipeline can read golden standards and generate reports
**Expected output:** Summary showing all 12 cases with similarity and rules scores

### **Level 2: Simple Component Testing**
```bash
python scripts/simple_test.py
```
**What it tests:** Individual components without subprocess calls
**Expected output:** 3-4 tests passing (file structure, evaluation logic, manager logic)

### **Level 3: Full Pipeline Testing**
```bash
python scripts/test_full_pipeline.py
```
**What it tests:** Complete pipeline with sample outputs
**Expected output:** Creates sample files, runs evaluation, shows detailed analysis

### **Level 4: Manager Review Testing**
```bash
# Mock test (no API key needed)
python scripts/test_manager_review.py

# Real test (requires OpenAI API key)
python scripts/run_manager_review.py
```
**What it tests:** Manager evaluation layer
**Expected output:** XML-formatted accept/reject decisions

## 🧩 **What Each Test Validates**

### **File Structure Test**
- ✅ All required files exist
- ✅ Directory structure is correct
- ✅ Golden cases are extracted

### **Evaluation Logic Test**
- ✅ Rules verification works (9 rules)
- ✅ Similarity calculation works
- ✅ Scoring system works
- ✅ JSON report generation works

### **Manager Logic Test**
- ✅ Manager prompt loads correctly
- ✅ Checklist loads correctly
- ✅ Prompt formatting works
- ✅ XML output format is correct

### **Golden Cases Test**
- ✅ Manifest has 12 entries
- ✅ Golden cases JSONL is readable
- ✅ Data extraction works

## 🚀 **Quick Test Commands**

### **Test Everything (Recommended)**
```bash
# Run all tests in sequence
python scripts/simple_test.py
python eval/evaluator_section7.py
python scripts/test_manager_review.py
```

### **Test Specific Components**
```bash
# Test only evaluation
python eval/evaluator_section7.py

# Test only manager logic
python scripts/test_manager_review.py

# Test only file structure
python scripts/simple_test.py
```

## 📊 **Expected Results**

### **Evaluation Pipeline**
```
=== SOMMAIRE ===
case_A | sim=0.000 | règles=0.667 | fichier=non
case_B | sim=0.000 | règles=0.667 | fichier=non
...
```
- **sim=0.000**: No output files yet (expected)
- **règles=0.667**: 6 out of 9 rules passed for empty files
- **fichier=non**: No output files generated yet

### **Manager Review**
```xml
<manager_verify>reject</manager_verify>
<manager_feedback>
- Problème(s) critique(s):
  1) Règle critique échouée: header
- Actions demandées:
  1) Corriger les règles critiques échouées
  2) Régénérer la sortie avec les corrections
</manager_feedback>
```

### **Simple Test**
```
File Structure: PASS
Golden Cases: PASS/FAIL (depends on JSONL parsing)
Evaluation Logic: PASS
Manager Logic: PASS
```

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Unicode Errors**
   - **Cause:** Windows console encoding issues
   - **Solution:** Tests work despite warnings, ignore Unicode errors

2. **Golden Cases JSONL Parsing**
   - **Cause:** Very long JSON lines with embedded newlines
   - **Solution:** Extraction script handles this, core functionality works

3. **Missing Files**
   - **Cause:** Files not created yet
   - **Solution:** Run extraction scripts first

### **If Tests Fail**

1. **Check file structure:**
   ```bash
   ls -la eval/
   ls -la prompts/
   ls -la data/golden/section7/
   ```

2. **Re-extract golden cases:**
   ```bash
   python scripts/extract_golden_cases.py
   ```

3. **Check Python path:**
   ```bash
   python --version
   ```

## ✅ **Success Criteria**

The pipeline is working correctly if:
- ✅ `python eval/evaluator_section7.py` runs without errors
- ✅ `python scripts/simple_test.py` shows 3+ tests passing
- ✅ `python scripts/test_manager_review.py` shows XML output
- ✅ All 12 cases are processed in evaluation
- ✅ JSON reports are generated in `eval/reports/`

## 🎉 **Ready for Production**

Once all tests pass, the pipeline is ready for:
- **Section 8 expansion** (duplicate and modify)
- **Real formatter integration** (connect to your AI model)
- **Production deployment** (with proper authentication)

## 📝 **Test Results Log**

Keep track of your test results:

```
Date: ___________
Tests Run: ___________
Results: ___________
Issues Found: ___________
Next Steps: ___________
```

---

**Remember:** This is a sandboxed R&D pipeline. It's designed for experimentation and testing, not production use.
