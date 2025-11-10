# Section 11 Template Implementation - Summary & Key Decisions

## 🎯 Quick Summary

**Goal**: Build a complete Section 11 template system following the Section 7 pattern, with versioning, Supabase storage, and future multi-section summary generation.

**Current State**: 
- ✅ Database schema supports Section 11
- ✅ 22 archived Section 11 templates exist
- ✅ **Artifacts defined** (schema, logicmap, master prompt, examples)
- ❌ Artifacts not yet created in codebase
- ❌ No R&D service implementation
- ❌ No versioning/storage setup

---

## 📊 Section 11 Structure (from CNESST Forms)

Section 11 typically contains:

1. **Résumé** (Summary)
   - Patient demographics
   - Injury/workplace event summary
   - Treatment history
   - Current status

2. **Diagnostic** (Diagnosis)
   - Accepted CNESST diagnosis
   - Consolidation dates
   - Permanent impairment status

3. **Existence de l'atteinte permanente** (Permanent Impairment)
   - Assessment of permanent physical/psychological impairment
   - Reference to Section 12 for percentages

4. **Existence de limitations fonctionnelles** (Functional Limitations)
   - Assessment of work-related functional limitations

5. **Évaluation des limitations fonctionnelles** (Functional Limitations Evaluation)
   - Specific restrictions (e.g., "avoid kneeling > 1-2 hours")
   - Equipment needs (e.g., "requires heated gloves")
   - Work modifications

---

## 🏗️ Architecture Pattern (Section 11 is DIFFERENT from Section 7!)

### Key Difference
**Section 11 is a MULTI-SECTION SYNTHESIS**, not a single-section formatter like Section 7:
- **Section 7**: Formats raw transcript → formatted Section 7 text
- **Section 11**: Synthesizes structured data from S1-S10 → formatted Section 11 conclusion

### File Structure
```
Section 11 Template/
├── prompts/
│   ├── section11_schema.json          # JSON schema for multi-section inputs
│   ├── section11_logicmap.yaml       # Consolidation logic branching
│   ├── section11_master.fr.md        # Master prompt (not XML!)
│   └── section11/manifest.json       # Version manifest
├── training/
│   ├── section11_examples.jsonl       # Training examples (input/output pairs)
│   ├── section11_inputs_*.json       # Input JSON examples
│   └── section11_example_*.fr.md     # Output markdown examples
├── configs/
│   └── master_prompt_section11.json  # Master config (references artifacts)
└── backend/src/services/
    └── section11RdService.ts         # R&D service (loads schema + logicmap + master)
```

### Database Tables
- `templates` (already supports section_11)
- `template_bundles` (create 'section11-rd' bundle)
- `template_bundle_versions` (track versions: 1.0.0, 1.1.0, etc.)
- `template_bundle_artifacts` (store artifact metadata)

### Supabase Storage
- Bucket: `template-artifacts`
- Path: `section11/v1.0.0/...`
- Artifacts: master config, system/plan XML, golden cases

---

## 🔑 Key Decisions Needed

### 1. Template Structure
**Question**: Should Section 11 follow exact Section 7 pattern, or adapt for its unique structure?

**✅ DECISION MADE**: **B) Adapted Pattern** - Section 11 uses:
- **JSON Schema** (`section11_schema.json`) - Structured input from S1-S10
- **Logic Map** (`section11_logicmap.yaml`) - Consolidation branching logic
- **Master Prompt** (`section11_master.fr.md`) - Markdown prompt (not XML)
- **Training Examples** (`section11_examples.jsonl`) - Input/output pairs

**Why Different?**
- Section 11 synthesizes data from multiple sections (S1-S10)
- Section 11 has consolidation logic (true/false branching)
- Section 11 requires structured JSON input, not raw transcript

---

### 2. Summary Generation (NOT Future - It's CORE!)
**✅ DECISION MADE**: **A) Phase 1** - Multi-section synthesis IS Section 11's core function!

**Section 11 Schema** (`section11_schema.json`) already defines:
- `S1_mandate_points` - From Section 1
- `S2_diagnostics_acceptes` - From Section 2
- `S5_antecedents_relevants` - From Section 5
- `S7_historique` - From Section 7 (array of events)
- `S8_subjectif` - From Section 8 (main complaints, AVQ/AVD)
- `S9_examen` - From Section 9 (physical exam findings)
- `S10_paraclinique` - From Section 10

**Synthesis Strategy**:
- Load structured data from S1-S10 (via schema)
- Apply consolidation logic (via logicmap)
- Generate Section 11 using master prompt
- Output: Résumé, Opinion clinique structurée, Motifs, Références

---

### 3. Training Data
**Question**: How many golden cases should we use?

**Options**:
- **A) All 22**: Use all archived templates
- **B) Curated 15-20**: Select best examples
- **C) Match Section 7**: Use 21 cases (like Section 7)

**Recommendation**: **B) Curated 15-20** - Quality over quantity, ensure variety

---

### 4. Versioning Strategy
**Question**: How should we handle versions?

**Options**:
- **A) Start with v1.0.0 draft**: Iterate before marking stable
- **B) Start with v1.0.0 stable**: Mark stable immediately

**Recommendation**: **A) Start with v1.0.0 draft** - Test thoroughly before stable

---

### 5. Language Support
**Question**: Should we start with French only, or include English?

**Options**:
- **A) French only**: Start with fr-CA, add English later
- **B) Both languages**: Include English from start

**Recommendation**: **A) French only** - Focus on quality, add English later

---

## 📋 Implementation Phases

### Phase 1: Template Artifacts (Foundation)
1. ✅ **Create `prompts/section11_schema.json`** - JSON schema for multi-section inputs
2. ✅ **Create `prompts/section11_logicmap.yaml`** - Consolidation logic branching
3. ✅ **Create `prompts/section11_master.fr.md`** - Master prompt (markdown, not XML)
4. ✅ **Create `training/section11_examples.jsonl`** - Training examples manifest
5. **Create input/output example files**:
   - `training/section11_inputs_*.json` - Input JSON examples (6+ cases)
   - `training/section11_example_*.fr.md` - Output markdown examples
6. **Create `configs/master_prompt_section11.json`** - Master config (references artifacts)
7. **Create `prompts/section11/manifest.json`** - Version manifest

### Phase 2: Service Layer
1. **Implement `section11RdService.ts`**:
   - Load `section11_schema.json` (validate input structure)
   - Load `section11_logicmap.yaml` (apply consolidation logic)
   - Load `section11_master.fr.md` (master prompt)
   - Load training examples from `section11_examples.jsonl`
   - Synthesize data from S1-S10 into Section 11 format
   - Apply consolidation branching (true/false)
   - Generate formatted Section 11 output
2. **Create `section11AI.ts` formatter** (if needed for fallback)
3. **Update `ProcessingOrchestrator.ts`** - Add Section 11 routing
4. **Update `TemplatePipeline.ts`** - Implement `processSection11()` (currently stub)
5. **Create data extraction service** - Extract structured data from S1-S10 for schema

### Phase 3: Database & Versioning
1. Create template bundle in database
2. Create version metadata
3. Upload artifacts to Supabase Storage
4. Create artifact metadata
5. Implement artifact resolver

### Phase 4: Evaluation Layer
1. Create manager review script
2. Create evaluator script
3. Test end-to-end flow

### Phase 5: Multi-Section Summary (Future)
1. Create summaryService.ts
2. Create summary-specific prompts
3. Implement merge endpoint
4. Test summary generation

---

## 🚀 Next Steps (Immediate)

1. **Create Artifact Files** (from provided artifacts):
   - ✅ `prompts/section11_schema.json` - JSON schema structure
   - ✅ `prompts/section11_logicmap.yaml` - Consolidation logic
   - ✅ `prompts/section11_master.fr.md` - Master prompt
   - ✅ `training/section11_examples.jsonl` - Examples manifest

2. **Create Training Examples**:
   - Extract 6+ cases from forms (cheville, genou, tibia_fibula, epicondylite_NC, rachis, quervain)
   - Create `training/section11_inputs_*.json` - Structured JSON inputs matching schema
   - Create `training/section11_example_*.fr.md` - Output markdown examples

3. **Create Master Config**:
   - `configs/master_prompt_section11.json`
   - Reference: schema, logicmap, master prompt, examples
   - Include artifact paths

4. **Create Manifest**:
   - `prompts/section11/manifest.json`
   - Version tracking (v1.0.0)
   - Artifact paths

5. **Implement Service**:
   - `backend/src/services/section11RdService.ts`
   - Load artifacts (schema, logicmap, master prompt)
   - Synthesize S1-S10 data into Section 11
   - Apply consolidation logic
   - Generate formatted output

---

## 📝 Notes

- **Section 11 is fundamentally different** from Section 7:
  - Section 7: Formats raw transcript → formatted text
  - Section 11: Synthesizes structured JSON from S1-S10 → formatted conclusion
- **Section 11 uses JSON schema** for structured input (not raw transcript)
- **Section 11 has consolidation logic** (true/false branching via logicmap)
- **Section 11 is multi-section synthesis** - core function, not future feature
- **Section 11 often references Section 12** (percentages for permanent impairment)
- **Section 11 requires data extraction** from S1-S10 to populate schema
- **Section 11 output format**: Résumé, Opinion clinique structurée, Motifs, Références

---

## 🔗 Related Files

- `backend/archived/template-library/json/section11/` - 22 archived templates
- `backend/archived/template-library/parse/docx_to_template_json.py` - Extraction script
- `backend/src/config/sections.ts` - Section 11 config
- `backend/src/database/schema.ts` - Database schema
- `backend/SECTION_7_FILE_STRUCTURE_AND_ROLES.md` - Section 7 pattern reference
- `prompts/section7/manifest.json` - Section 7 manifest example

---

## ✅ Success Criteria

1. Section 11 template artifacts created and versioned
2. Artifacts stored in Supabase Storage
3. Database versioning working
4. R&D service implemented
5. End-to-end processing working
6. Quality evaluation working
7. (Future) Multi-section summary generation working

