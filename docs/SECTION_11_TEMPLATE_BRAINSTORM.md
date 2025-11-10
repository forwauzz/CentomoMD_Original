# Section 11 Template Implementation - Brainstorming & Planning

## 🎯 Objective

Build a complete Section 11 template system with:
1. **Template artifacts** (versioned, stored in Supabase)
2. **Database integration** (templates table, versioning tables)
3. **Future iteration**: Multi-section summary generation

---

## 📋 Current State Analysis

### ✅ What Already Exists

1. **Database Schema** - Section 11 already supported:
   - `templates` table: `section: 'section_7' | 'section_8' | 'section_11'`
   - `template_bundles`, `template_bundle_versions`, `template_bundle_artifacts` tables
   - Section 11 config in `backend/src/config/sections.ts`

2. **Existing Section 11 Templates** (Archived):
   - 22 JSON templates in `backend/archived/template-library/json/section11/`
   - Extracted from CNESST forms (204_*.docx, 205_*.docx)
   - Contains: résumé, diagnostic, consolidation, limitations fonctionnelles

3. **Code References**:
   - Section 11 validator: `Section11Validator`
   - Section 11 formatter stubs: `processSection11()`, `formatSection11()`
   - Frontend UI: Section 11 form rendering
   - Merge endpoint: `/api/format/merge/section11` (stub)

### ❌ What's Missing

1. **Template Artifacts** (like Section 7):
   - No `prompts/section11/manifest.json`
   - No master config JSON
   - No system/plan XML prompts
   - No golden cases training data
   - No R&D service implementation

2. **Versioning & Storage**:
   - No Section 11 artifacts in Supabase Storage
   - No version metadata in database
   - No artifact resolver for Section 11

3. **AI Processing**:
   - Section 11 formatters are stubs (TODO comments)
   - No integration with clinical entities
   - No multi-section summary generation

---

## 📊 Section 11 Structure Analysis

### From CNESST Forms (temp_docs/combined/*.docx)

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

### Template Structure Pattern (from archived templates)

```json
{
  "section": "11",
  "title": "Section 11 - Conclusion",
  "content": "...",
  "tags": [
    "résumé_conclusion",
    "diagnostic",
    "lien_travail",
    "pronostic",
    "consolidation",
    "atteinte_permanente"
  ],
  "source_file": "204_*.docx",
  "language": "fr",
  "category": "resume_conclusion",
  "complexity": "high"
}
```

---

## 🏗️ Proposed Architecture (Following Section 7 Pattern)

### File Structure

```
Section 11 Template/
├── 🎯 CONFIGURATION LAYER
│   ├── configs/
│   │   └── master_prompt_section11.json          # Master template configuration
│   └── prompts/
│       ├── section11/
│       │   └── manifest.json                     # Version manifest
│       ├── system_section11_fr.xml               # System conductor/orchestrator
│       ├── plan_section11_fr.xml                 # Formatting plan & rules
│       └── manager_eval_section11_fr.xml        # Manager evaluator
│
├── 📚 TRAINING DATA LAYER
│   ├── training/
│   │   └── golden_cases_section11.jsonl         # RAG training examples
│   └── data/golden/section11/
│       ├── case_A_gold.md                        # Reference standards
│       ├── case_B_gold.md
│       └── ...
│
├── ⚙️ SERVICE LAYER
│   └── src/services/
│       ├── section11RdService.ts                 # Main R&D pipeline orchestrator
│       ├── formatter/
│       │   └── section11AI.ts                    # Basic AI formatter
│       └── processing/
│           └── ProcessingOrchestrator.ts          # (already exists, needs Section 11 integration)
│
└── 🔍 EVALUATION LAYER
    ├── scripts/
    │   └── run_manager_review_section11.py       # Manager evaluation pipeline
    └── eval/
        └── evaluator_section11.py                 # Comprehensive evaluation metrics
```

---

## 📝 Implementation Plan

### Phase 1: Template Artifacts Creation

#### 1.1 Extract & Structure Section 11 Content
- [ ] Extract Section 11 content from all 22 forms in `temp_docs/combined/`
- [ ] Create structured JSON templates (similar to archived templates)
- [ ] Identify common patterns:
  - Résumé structure
  - Diagnostic format
  - Consolidation date patterns
  - Functional limitations format

#### 1.2 Create Master Configuration
- [ ] `configs/master_prompt_section11.json`
  - Template ID: `section11_pipeline_frCA`
  - Language: `fr-CA`
  - Artifact paths
  - Metadata (section: 11, version: 1.0.0)

#### 1.3 Create Prompt Artifacts
- [ ] `prompts/system_section11_fr.xml`
  - System conductor/orchestrator
  - Integration instructions
  - Quality improvements
  - Verbatim rules

- [ ] `prompts/plan_section11_fr.xml`
  - Formatting plan & rules
  - Medical terminology
  - CNESST compliance rules
  - Structure requirements

- [ ] `prompts/manager_eval_section11_fr.xml`
  - Quality checks
  - Conformity validation
  - Scoring system

#### 1.4 Create Training Data
- [ ] `training/golden_cases_section11.jsonl`
  - Extract 15-20 high-quality Section 11 examples from forms
  - Structure as JSONL (one case per line)
  - Include input/output pairs

- [ ] `data/golden/section11/case_*.md`
  - Reference standards for evaluation
  - Professional CNESST formatting examples

#### 1.5 Create Manifest
- [ ] `prompts/section11/manifest.json`
  - Version tracking
  - Artifact paths
  - Default version

---

### Phase 2: Service Layer Implementation

#### 2.1 Create Section 11 R&D Service
- [ ] `backend/src/services/section11RdService.ts`
  - Load master config
  - Load artifacts (system, plan, manager)
  - Load golden cases
  - Integrate with OpenAI API
  - Return formatted Section 11 content

#### 2.2 Create Section 11 AI Formatter
- [ ] `backend/src/services/formatter/section11AI.ts`
  - Language-specific prompts
  - Golden examples integration
  - Fallback formatting

#### 2.3 Update Processing Orchestrator
- [ ] `backend/src/services/processing/ProcessingOrchestrator.ts`
  - Add Section 11 routing
  - Integrate section11RdService
  - Handle Section 11 requests

#### 2.4 Update Template Pipeline
- [ ] `backend/src/services/formatter/TemplatePipeline.ts`
  - Implement `processSection11()` (currently stub)
  - Integrate with clinical entities
  - Add multi-section summary support

---

### Phase 3: Database & Versioning

#### 3.1 Create Template Bundle
- [ ] Insert into `template_bundles`:
  ```sql
  INSERT INTO template_bundles (name, enabled)
  VALUES ('section11-rd', true);
  ```

#### 3.2 Create Version Metadata
- [ ] Insert into `template_bundle_versions`:
  ```sql
  INSERT INTO template_bundle_versions (
    template_bundle_id, semver, status, changelog
  ) VALUES (
    (SELECT id FROM template_bundles WHERE name = 'section11-rd'),
    '1.0.0',
    'draft',
    'Initial Section 11 template implementation'
  );
  ```

#### 3.3 Upload Artifacts to Supabase Storage
- [ ] Create Supabase Storage bucket: `template-artifacts`
- [ ] Upload artifacts:
  - `section11/v1.0.0/master_prompt_section11.json`
  - `section11/v1.0.0/system_section11_fr.xml`
  - `section11/v1.0.0/plan_section11_fr.xml`
  - `section11/v1.0.0/manager_eval_section11_fr.xml`
  - `section11/v1.0.0/golden_cases_section11.jsonl`

#### 3.4 Create Artifact Metadata
- [ ] Insert into `template_bundle_artifacts`:
  - One row per artifact file
  - Include: kind, storage_path, sha256, size_bytes, content_type, locale

#### 3.5 Create Artifact Resolver
- [ ] Update artifact resolver to support Section 11
- [ ] Fallback chain: Supabase Storage → Local Cache → Filesystem

---

### Phase 4: Evaluation Layer

#### 4.1 Create Manager Review Script
- [ ] `backend/scripts/run_manager_review_section11.py`
  - Python-based evaluation
  - Quality scoring
  - Uses manager_eval_section11_fr.xml

#### 4.2 Create Evaluator
- [ ] `backend/eval/evaluator_section11.py`
  - Comprehensive evaluation metrics
  - Line-by-line similarity
  - Rule-based validation

---

### Phase 5: Multi-Section Summary Generation (Future Iteration)

#### 5.1 Summary Service
- [ ] `backend/src/services/summaryService.ts`
  - Extract key information from Section 7, 8, 11
  - Generate Section 11 summary from other sections
  - Integrate clinical entities

#### 5.2 Summary Prompts
- [ ] Create summary-specific prompts:
  - Extract diagnostic from Section 7
  - Extract physical findings from Section 8
  - Synthesize into Section 11 conclusion

#### 5.3 Update Merge Endpoint
- [ ] Implement `/api/format/merge/section11`:
  - Accept case ID
  - Load Section 7, 8 content
  - Generate Section 11 summary
  - Return formatted Section 11

---

## 🔄 Processing Flow

### Current Flow (Section 7 Pattern)
```
1. Raw Input → ProcessingOrchestrator.ts
2. Orchestrator → section11RdService.ts
3. Service → Loads master_prompt_section11.json
4. Service → Loads system_section11_fr.xml
5. System → Loads plan_section11_fr.xml
6. System → Loads manager_eval_section11_fr.xml
7. Service → Loads golden_cases_section11.jsonl
8. Service → Calls OpenAI with all artifacts
9. OpenAI → Returns formatted Section 11 content
10. Service → Returns processed result
```

### Future Flow (Multi-Section Summary)
```
1. User requests Section 11 generation
2. System loads Section 7, 8, 11 content
3. SummaryService extracts key information:
   - From Section 7: Injury history, evolution
   - From Section 8: Physical findings, clinical assessment
   - From Section 11: Existing conclusion (if any)
4. AI synthesizes into Section 11 format:
   - Résumé (from Section 7)
   - Diagnostic (from Section 8 + clinical entities)
   - Limitations fonctionnelles (from Section 8)
5. Returns formatted Section 11
```

---

## 📊 Database Schema Integration

### Templates Table
```sql
INSERT INTO templates (
  section, name, description, content, language, version, is_active
) VALUES (
  'section_11',
  'Section 11 - Conclusion médicale',
  'Template for Section 11 medical conclusion',
  '{"structure": {...}}',
  'fr',
  '1.0.0',
  true
);
```

### Template Bundle Versions
- Link to `template_bundles` table
- Track versions: 1.0.0, 1.1.0, etc.
- Status: draft → stable → deprecated

### Template Bundle Artifacts
- Store artifact metadata
- Link to Supabase Storage paths
- Include integrity hashes (sha256)

---

## 🎯 Key Decisions Needed

1. **Template Structure**:
   - Should Section 11 follow exact Section 7 pattern?
   - Or adapt for Section 11's unique structure (résumé, diagnostic, limitations)?

2. **Summary Generation**:
   - Should summary generation be part of Phase 1?
   - Or separate future iteration?
   - What sections should feed into Section 11 summary?

3. **Versioning Strategy**:
   - Start with v1.0.0 as draft?
   - When to mark as stable?
   - How to handle breaking changes?

4. **Training Data**:
   - How many golden cases? (Section 7 has 21)
   - Should we use all 22 archived templates?
   - Or curate best examples?

5. **Language Support**:
   - Start with French only?
   - Add English later?
   - Same structure for both?

---

## 🚀 Next Steps

1. **Extract Section 11 content** from forms
2. **Create master config** JSON
3. **Draft system/plan XML prompts**
4. **Create golden cases** training data
5. **Implement section11RdService.ts**
6. **Set up database versioning**
7. **Upload artifacts to Supabase**
8. **Test end-to-end flow**

---

## 📝 Notes

- Section 11 is more structured than Section 7 (résumé, diagnostic, limitations)
- Section 11 often references Section 12 (percentages)
- Section 11 requires integration with clinical entities
- Multi-section summary is a key differentiator for Section 11
- Consider Section 11 as "synthesis" of Sections 7 & 8

