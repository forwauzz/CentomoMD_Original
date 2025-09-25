# Medical Vocabulary Integration Implementation Plan

## 🎯 **Goals / 🚫 Non-Goals**

### **Goals:**
- Improve critical term accuracy in Smart Dictation & Ambient modes
- Preserve Word-for-Word mode purity (verbatim transcription)
- Add observability and easy rollback capabilities
- Implement mode-specific vocabulary policies
- Centralize medical term normalization

### **Non-Goals:**
- New AI models or major architectural refactors
- Prompt bloat or excessive token usage
- Storing PHI or sensitive medical data
- Universal vocabulary application across all modes

## 🔧 **Feature Flags & Policies**

### **Core Feature Flags:**
```bash
# Mode-specific vocabulary enablement
VOCAB_ENABLED_WORD_FOR_WORD=false    # Default: OFF (preserve verbatim)
VOCAB_ENABLED_SMART_DICTATION=true   # Default: ON (medical accuracy)
VOCAB_ENABLED_AMBIENT=true           # Default: ON (clinical extraction)

# Universal Cleanup Layer control
UNIVERSAL_CLEANUP_ENABLED=true       # Gates S7 in Smart Dictation

# Template vocabulary profile selection
TEMPLATE_VOCAB_PROFILE=general       # Options: general|ortho|neuro
```

### **Vocabulary Policy Matrix:**
| Mode | AWS Vocabulary | S7 Normalization | S8 Template Boosts |
|------|----------------|------------------|-------------------|
| Word-for-Word | ❌ OFF | ❌ OFF | ❌ OFF |
| Smart Dictation | ✅ ON | ✅ Conditional | ✅ ON |
| Ambient | ✅ ON | ✅ Always | ✅ ON |

## 📁 **Deliverables**

### **1. Versioned Vocabulary Packs**
```
lexicons/
├── general.fr.json          # General medical terms (French)
├── general.en.json          # General medical terms (English)
├── ortho.fr.json            # Orthopedic specialty terms
├── ortho.en.json            # Orthopedic specialty terms
├── neuro.fr.json            # Neurological specialty terms
└── neuro.en.json            # Neurological specialty terms
```

**Structure:**
```json
{
  "version": "1.0.0",
  "language": "fr",
  "specialty": "general",
  "terms": [
    {
      "canonical": "lombalgie",
      "variants": ["lombago", "mal de dos"],
      "category": "symptom"
    }
  ],
  "abbreviations": {
    "L5-S1": "L5-S1",
    "DRE": "examen rectal digital"
  }
}
```

### **2. S7 Medical Normalizer (Centralized)**
- **File:** `backend/src/services/medicalNormalizer.ts`
- **Purpose:** Maps variants → canonical terms, manages deny/allow mappings
- **Features:** Accent normalization, hyphen standardization, abbreviation expansion
- **Integration:** Universal Cleanup Layer (S7)

### **3. S8 Template Vocabulary Configuration**
- **File:** `backend/config/templates/vocab-profiles.json`
- **Purpose:** Per-template vocabulary boosts and constraints
- **Features:** Allowed terms, verbatim protection, abbreviation handling

### **4. Observability & Metrics**
- **Privacy-safe logging:** Mode, language, vocabulary version, term hits, latency
- **A/B comparison dashboard:** ON vs OFF performance metrics
- **Rollback tracking:** Version history and impact assessment

## 🚀 **Phased Implementation (6 Small PRs)**

### **PR1 — Feature Flags & Configuration**
**Scope:** Add environment variables and feature flags (no behavior change)

**Changes:**
- Add vocabulary feature flags to `.env.example`
- Update `backend/src/config/index.ts` with vocabulary settings
- Document default policies and flag locations
- Add vocabulary configuration validation

**Acceptance Criteria:**
- All modes behave exactly as before
- Feature flags are properly documented
- Configuration validation works

**Files Modified:**
- `.env.example`
- `backend/src/config/index.ts`
- `docs/MODE_AND_PIPELINE_ARCHITECTURE.md`

---

### **PR2 — AWS Custom Vocabulary Integration**
**Scope:** Implement AWS Transcribe custom vocabulary for Smart Dictation and Ambient modes

**Changes:**
- Create AWS vocabulary: `centomo_general_fr` (start with general French)
- Update `getModeSpecificConfig()` to include vocabulary for enabled modes
- Add vocabulary management utilities
- Implement vocabulary versioning

**Acceptance Criteria:**
- Smart Dictation and Ambient modes use AWS vocabulary
- Word-for-Word mode remains unchanged
- ≥ +5% Critical Term Accuracy (CTA) vs baseline
- Latency impact < 50ms per minute of audio

**Files Modified:**
- `backend/src/index.ts` (getModeSpecificConfig function)
- `backend/src/services/vocabularyManager.ts` (new)
- `backend/src/services/transcriptionService.ts`

---

### **PR3 — S7 Medical Normalizer**
**Scope:** Implement centralized medical term normalization

**Changes:**
- Create `MedicalNormalizer` service for S7 layer
- Implement accent normalization, hyphen standardization
- Add abbreviation expansion and variant mapping
- Integrate with Universal Cleanup Layer

**Acceptance Criteria:**
- Ambient mode always uses S7 normalization
- Smart Dictation uses S7 when `UNIVERSAL_CLEANUP_ENABLED=true`
- CTA improvement or stability maintained
- Zero regressions in headings/structure

**Files Modified:**
- `backend/src/services/medicalNormalizer.ts` (new)
- `backend/src/services/layers/UniversalCleanupLayer.ts`
- `backend/src/services/formatter/mode2.ts`

---

### **PR4 — S8 Template-Scoped Vocabulary Boosts**
**Scope:** Add per-template vocabulary configuration and integration

**Changes:**
- Create template vocabulary profiles
- Add vocabulary boosts to template pipeline
- Integrate with AI formatting guardrails
- Implement template-specific term constraints

**Acceptance Criteria:**
- Template outputs maintain exact medical terms
- Hallucination/rewrites reduced
- Section integrity maintained
- Prompt token overhead ≤ 200 tokens

**Files Modified:**
- `backend/config/templates/vocab-profiles.json` (new)
- `backend/src/services/formatter/TemplatePipeline.ts`
- `backend/src/services/aiFormattingService.ts`

---

### **PR5 — Observability & Metrics**
**Scope:** Add privacy-safe logging and monitoring

**Changes:**
- Implement vocabulary usage logging
- Add performance metrics tracking
- Create A/B comparison dashboard
- Add rollback tracking

**Acceptance Criteria:**
- Per-mode impact visible within one session
- No PHI stored in logs
- Vocabulary version tracking
- Latency and accuracy metrics

**Files Modified:**
- `backend/src/utils/vocabularyLogger.ts` (new)
- `backend/src/services/transcriptionService.ts`
- `frontend/src/components/VocabularyMetrics.tsx` (new)

---

### **PR6 — Bilingual & Specialty Expansion**
**Scope:** Add additional language and specialty vocabulary packs

**Changes:**
- Add neuro-fr, ortho-en vocabulary packs
- Implement vocabulary governance
- Add change management and review process
- Create rollback procedures

**Acceptance Criteria:**
- Packs are versioned with rollback notes
- Governance process documented
- Multi-language support working
- Specialty packs properly integrated

**Files Modified:**
- `lexicons/` directory (new vocabulary packs)
- `backend/src/services/vocabularyGovernance.ts` (new)
- `docs/VOCABULARY_GOVERNANCE.md` (new)

## 🧪 **Test Matrix**

### **Test Scenarios:**
| Mode | Vocabulary | Audio Quality | Domain | Expected Outcome |
|------|------------|---------------|---------|------------------|
| Word-for-Word | OFF | Quiet room | General | Unchanged verbatim output |
| Smart Dictation | ON/OFF | Clinic noise | Ortho | +5-10% CTA improvement |
| Ambient | ON/OFF | Phone mic | Neuro | Clinical extraction enhanced |

### **Edge Cases:**
- **Mixed FR/EN:** Proper language detection and vocabulary selection
- **Diacritics:** Accent normalization (é → e, ç → c)
- **Hyphenated levels:** L5-S1 standardization
- **Drug names:** Proper medical terminology
- **Reflexes:** Babinski/Hoffmann correct spelling

### **Performance Metrics:**
- **Critical Term Accuracy (CTA):** ≥ +5-10% vs baseline
- **Latency:** < +50ms per minute of audio
- **Diarization:** Unchanged in Ambient mode
- **Prompt size:** S8 additions ≤ 200 tokens

## 📊 **Acceptance Criteria (Overall)**

### **Smart Dictation & Ambient Modes:**
- CTA ≥ +5-10% vs baseline on golden test set
- Medical terminology accuracy improved
- Clinical entity extraction enhanced
- Template formatting maintained

### **Word-for-Word Mode:**
- Output completely unchanged (verbatim path preserved)
- No vocabulary interference
- Spoken commands still work
- Light clinical fixes maintained

### **System Performance:**
- Latency change < +50ms per minute of audio
- Memory usage stable
- No regression in existing functionality
- Rollback capability within 5 minutes

## 🧯 **Rollback & Risk Playbook**

### **Risk Scenarios & Mitigations:**

#### **1. Weird Bias/Homonyms**
**Symptoms:** Incorrect medical term substitutions
**Mitigation:** 
- Toggle `VOCAB_ENABLED[mode]=false`
- Trim vocabulary pack size
- Prefer specialty-scoped lists over general

#### **2. Over-Correction in S7**
**Symptoms:** Medical terms incorrectly normalized
**Mitigation:**
- Revert `normalizer_version`
- Add problematic mappings to deny list
- Adjust normalization rules

#### **3. Prompt Drift/Token Blow-up**
**Symptoms:** AI prompts too large, performance degradation
**Mitigation:**
- Reduce S8 vocabulary lists
- Keep `allowed_terms` ≤ 50 per template
- Optimize template vocabulary profiles

#### **4. Diarization Impact (Ambient)**
**Symptoms:** Speaker identification affected
**Mitigation:**
- Confirm diarization unchanged
- If affected, disable AWS vocabulary for Ambient temporarily
- Test with and without vocabulary

### **Rollback Procedures:**
1. **Immediate:** Set feature flags to `false`
2. **Short-term:** Revert to previous vocabulary version
3. **Long-term:** Full system rollback to pre-vocabulary state

## 📚 **Documentation Deliverables**

### **1. Architecture Decision Record (ADR)**
**File:** `docs/adr/medical-vocabulary-integration.md`
**Content:** Decision rationale, alternatives considered, implementation approach

### **2. Runbook**
**File:** `docs/runbooks/vocabulary-management.md`
**Content:** How to add/modify terms, test locally, promote changes, rollback procedures

### **3. Governance Documentation**
**File:** `docs/VOCABULARY_GOVERNANCE.md`
**Content:** Owners, changelogs, review checklist, approval process

### **4. API Documentation**
**File:** `docs/api/vocabulary-endpoints.md`
**Content:** Vocabulary management endpoints, configuration APIs

## 🎯 **Success Metrics**

### **Primary KPIs:**
- **Critical Term Accuracy:** +5-10% improvement
- **User Satisfaction:** Reduced manual corrections
- **System Performance:** < 50ms latency impact
- **Rollback Time:** < 5 minutes to restore previous state

### **Secondary KPIs:**
- **Vocabulary Coverage:** 90% of common medical terms
- **False Positive Rate:** < 2% incorrect substitutions
- **Template Integrity:** 100% section formatting preserved
- **Diarization Quality:** Unchanged in Ambient mode

---

**Implementation Timeline:** 6 weeks (1 week per PR)
**Team:** Backend developer, Frontend developer, QA tester
**Review Process:** Each PR requires code review and acceptance testing
**Deployment:** Feature flags enable gradual rollout and easy rollback
