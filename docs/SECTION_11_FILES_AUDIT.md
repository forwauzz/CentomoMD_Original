# Section 11 Files Audit

**Date:** 2025-01-09  
**Purpose:** Verify which Section 11 prompt files exist before implementing fixes

---

## File Inventory

### ✅ Files That EXIST

#### For JSON Synthesis (Section11RdService)
1. ✅ `prompts/section11_master.fr.md` - Master prompt for synthesis
2. ✅ `prompts/section11_schema.json` - JSON schema for input validation
3. ✅ `prompts/section11_logicmap.yaml` - Consolidation logic branching
4. ✅ `training/section11_examples.jsonl` - Training examples
5. ✅ `backend/configs/master_prompt_section11.json` - Master config for R&D pipeline
6. ✅ `prompts/section11/manifest.json` - Version manifest

#### Training Examples
7. ✅ `training/section11_example_cheville.fr.md`
8. ✅ `training/section11_example_genou.fr.md`
9. ✅ `training/section11_example_quervain.fr.md`
10. ✅ `training/section11_example_rachis.fr.md`
11. ✅ `training/section11_example_tibia_fibula.fr.md`
12. ✅ `training/section11_example_epicondylite_NC.fr.md`
13. ✅ `training/section11_inputs_cheville.json`
14. ✅ `training/section11_inputs_genou.json`
15. ✅ `training/section11_inputs_quervain.json`
16. ✅ `training/section11_inputs_rachis.json`
17. ✅ `training/section11_inputs_tibia_fibula.json`
18. ✅ `training/section11_inputs_epicondylite_NC.json`

---

### ❌ Files That Are MISSING

#### For Raw Transcript Formatting (formatWithGuardrails)
1. ❌ `prompts/section11_master.json` - **MISSING** (guardrails config)
   - **Needed for:** `formatWithGuardrails('11', ...)` guardrails parameter
   - **Location:** Should be in `prompts/` or `backend/prompts/`
   - **Reference:** Section 7 has `backend/prompts/section7_master.json`

2. ❌ `prompts/section11_golden_example.fr.md` - **MISSING** (golden example)
   - **Needed for:** `formatWithGuardrails('11', ...)` golden example parameter
   - **Location:** Should be in `prompts/` or `backend/prompts/`
   - **Reference:** Section 7 has `backend/prompts/section7_golden_example.md`

---

## File Loading Logic

### For JSON Synthesis (Section11RdService)
**Uses:** `resolveSection11RdPaths()` → loads from:
- `prompts/section11_master.fr.md` ✅
- `prompts/section11_schema.json` ✅
- `prompts/section11_logicmap.yaml` ✅
- `training/section11_examples.jsonl` ✅

### For Raw Transcript Formatting (formatWithGuardrails)
**Uses:** `loadPromptFile()`, `loadGuardrailsFile()`, `loadGoldenExampleFile()`

**Loading logic:**
```typescript
// backend/src/services/formatter/shared.ts:44-47
const suffix = (section === '8') ? '' : (outputLanguage === 'en' ? '_en' : '');
const systemPrompt = await loadPromptFile(`section${section}_master${suffix}.md`);
const guardrails = await loadGuardrailsFile(`section${section}_master${suffix}.json`);
const goldenExample = await loadGoldenExampleFile(`section${section}_golden_example${suffix}.md`);
```

**For Section 11 (French):**
- `section11_master.fr.md` → `section11_master.fr.md` ✅ EXISTS
- `section11_master.json` → `section11_master.json` ❌ MISSING
- `section11_golden_example.fr.md` → `section11_golden_example.fr.md` ❌ MISSING

**File search paths:**
- If running from `backend/`: `prompts/section11_master.json`
- If running from root: `backend/prompts/section11_master.json`

---

## Comparison with Section 7

### Section 7 Files (for reference)
- ✅ `backend/prompts/section7_master.md`
- ✅ `backend/prompts/section7_master.json` ← **Section 11 needs this**
- ✅ `backend/prompts/section7_golden_example.md` ← **Section 11 needs this**
- ✅ `backend/prompts/section7_master_en.md` (optional)
- ✅ `backend/prompts/section7_master_en.json` (optional)
- ✅ `backend/prompts/section7_golden_example_en.md` (optional)

### Section 11 Files (current)
- ✅ `prompts/section11_master.fr.md` (exists, but in different location)
- ❌ `prompts/section11_master.json` (missing)
- ❌ `prompts/section11_golden_example.fr.md` (missing)

---

## Impact Analysis

### Current Behavior
When `formatWithGuardrails('11', ...)` is called:
1. ✅ Loads `section11_master.fr.md` successfully
2. ⚠️ Loads `section11_master.json` → returns `{}` (empty object, no guardrails)
3. ⚠️ Loads `section11_golden_example.fr.md` → returns `''` (empty string, no example)

### Result
- Section 11 transcript formatting **works** but with:
  - ❌ No guardrails/validation rules
  - ❌ No golden example for AI to learn from
  - ⚠️ Reduced formatting quality compared to Section 7/8

---

## Recommendations

### Priority: HIGH
Create the missing files to ensure Section 11 transcript formatting quality matches Section 7/8:

1. **Create `prompts/section11_master.json`**
   - Based on `backend/prompts/section7_master.json`
   - Adapt for Section 11 (Conclusion) specific rules
   - Include CNESST compliance rules for conclusions

2. **Create `prompts/section11_golden_example.fr.md`**
   - Based on `backend/prompts/section7_golden_example.md`
   - Show example of properly formatted Section 11 conclusion
   - Include all required sections (Résumé, Opinion clinique, Motifs, Références)

### Alternative: Use Existing Files
If `prompts/section11_master.fr.md` is suitable for transcript formatting (not just synthesis), we could:
- Keep using it for both use cases
- Still need to create the `.json` guardrails file
- Still need to create the golden example file

---

## File Locations Summary

### Current Structure
```
prompts/
  ├── section11_master.fr.md ✅ (for synthesis)
  ├── section11_schema.json ✅ (for synthesis)
  ├── section11_logicmap.yaml ✅ (for synthesis)
  ├── section11_master.json ❌ MISSING (for formatting)
  ├── section11_golden_example.fr.md ❌ MISSING (for formatting)
  └── section11/
      └── manifest.json ✅

backend/prompts/
  ├── section7_master.json ✅ (reference)
  ├── section7_golden_example.md ✅ (reference)
  └── (no section11 files here)
```

### Recommended Structure
```
prompts/
  ├── section11_master.fr.md ✅ (used for both)
  ├── section11_schema.json ✅
  ├── section11_logicmap.yaml ✅
  ├── section11_master.json ⚠️ CREATE THIS
  └── section11_golden_example.fr.md ⚠️ CREATE THIS

backend/prompts/
  └── (optional: could also put section11 files here for consistency)
```

---

## Next Steps

1. ✅ **AUDIT COMPLETE** - Verified all Section 11 files
2. ⚠️ **CREATE MISSING FILES** - `section11_master.json` and `section11_golden_example.fr.md`
3. ⚠️ **TEST** - Verify Section 11 transcript formatting quality improves

