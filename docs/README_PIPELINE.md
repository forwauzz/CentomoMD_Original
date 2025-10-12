# 🧠 Section 7 CNESST R&D Pipeline — CentomoMD (fr-CA)

## 🩺 Overview
This pipeline is a **sandboxed research and development system** for the *Section 7 – Historique de faits et évolution* formatter.  
It operates **independently** from the production Section 7 formatter currently used in CentomoMD, ensuring full isolation for experimentation, evaluation, and future automation.

---

## ⚙️ Architecture

### Directory Structure

```
configs/
└── master_prompt_section7.json
prompts/
├── plan_section7_fr.xml
├── manager_eval_section7_fr.xml
├── manager_section7_fr.md
└── checklist_manager_section7.json
system/
└── system_section7_fr-ca.md
training/
└── golden_cases_section7.jsonl
eval/
├── evaluator_section7.py
├── validation_manifest.jsonl
├── reports/ # generated after evaluation
outputs/
└── section7/ # model outputs saved here
docs/
├── README_PIPELINE.md
└── FLOW_SECTION7.txt
scripts/
├── run_manager_review.py
├── extract_golden_cases.py
└── test_manager_review.py
data/
└── golden/
    └── section7/ # extracted golden cases
```

---

## 🧩 Pipeline Layers

| Layer | Description | Key Files |
|--------|--------------|-----------|
| **1. Configuration Layer** | Defines global parameters, language, and pipeline connections | `configs/master_prompt_section7.json` |
| **2. Processing Layer** | Executes the 8-phase formatting plan, applies medical formatting, paragraph structuring, and citation rules | `prompts/plan_section7_fr.xml` |
| **3. Quality Assurance Layer** | Evaluates AI outputs against clinical and structural standards | `eval/evaluator_section7.py`, `manager_eval_section7_fr.xml` |
| **4. Training & Validation Layer** | Uses real anonymized CNESST cases for calibration and regression testing | `training/golden_cases_section7.jsonl`, `eval/validation_manifest.jsonl` |
| **5. Manager Evaluation Layer** | Human-in-the-loop review stage for acceptance/rejection and feedback | `prompts/manager_section7_fr.md`, `prompts/checklist_manager_section7.json` |
| **6. Output Layer** | Stores formatted Section 7 drafts for comparison and analysis | `outputs/section7/` |
| **7. Documentation Layer** | Pipeline logic, flow reference, and operating guide | `docs/README_PIPELINE.md`, `docs/FLOW_SECTION7.txt` |

---

## 🧭 Flow Summary

1. **Input**  
   Raw unformatted case (Markdown or text).

2. **Formatting Engine (Plan 7)**  
   The 8-phase plan (`plan_section7_fr.xml`) applies:
   - Standardized header  
   - Chronological organization  
   - One-event-per-paragraph rule  
   - Proper medical terminology (fr-CA)  
   - Citation management ("« »" only for the worker's claim)  

3. **Output Generation**  
   Each formatted case is saved under:
   ```
   outputs/section7/case_X.md
   ```

4. **Evaluation Script (`eval/evaluator_section7.py`)**  
   Compares each output against:
   - Golden standard reference  
   - 9 compliance rules  
   - Similarity (line-by-line) score  
   - JSON report generated under:
     ```
     eval/reports/case_X.json
     ```

5. **Manager Review (`run_manager_review.py`)**  
   Human-in-the-loop validation using:
   - Manager policy prompt (`manager_section7_fr.md`)  
   - Checklist JSON (`checklist_manager_section7.json`)  
   Generates `<manager_verify>` verdict:
   ```xml
   <manager_verify>accept</manager_verify>
   ```
   or
   ```xml
   <manager_verify>reject</manager_verify>
   <manager_feedback> ... </manager_feedback>
   ```

6. **Reports Aggregation**  
   Consolidated results appear in terminal and JSON form, allowing regression tracking between versions.

---

## 🧮 Evaluation Metrics

| Metric | Description |
|--------|-------------|
| Line Similarity | Mean of difflib.SequenceMatcher ratios between GOLD and output lines |
| Rules Score | Ratio of compliance rules passed (out of 9 total) |
| Chronology Check | Verifies all extracted dates appear in ascending order |
| Naming Integrity | Confirms doctor and radiologist names are literal and diacritic-preserved |
| Quotation Compliance | Ensures only the claim is quoted; radiology never is |
| Spinal Level Normalization | Detects invalid formats like "L5 S1"; requires "L5-S1" |

---

## 🧱 Golden Standards

**File:** `training/golden_cases_section7.jsonl`

Contains 12 anonymized CNESST medical cases (A–L)

**Format:**
```json
{"case_id": "CASE_A", "gold_text": "7. Historique de faits et évolution…"}
```

**Used both for:**
- fine-tuning evaluation logic
- regression testing new formatting strategies

---

## 🧰 How to Run

### 1️⃣ Validate Generated Outputs
```bash
python eval/evaluator_section7.py
```

**Results:**
```
=== SOMMAIRE ===
case_A | sim=0.91 | règles=0.89 | fichier=oui
case_B | sim=0.95 | règles=1.00 | fichier=oui
```

### 2️⃣ Trigger Manager Review
```bash
python scripts/run_manager_review.py
```

**Output:**
```xml
<manager_verify>reject</manager_verify>
<manager_feedback>
- Problème(s) critique(s):
  1) Citation radiologique détectée
- Actions demandées:
  1) Supprimer les guillemets du paragraphe d'imagerie.
</manager_feedback>
```

### 3️⃣ Test Manager Review (Mock)
```bash
python scripts/test_manager_review.py
```

**Output:**
```
=== Mock Manager Review for case_A ===
<manager_verify>reject</manager_verify>
<manager_feedback>
- Problème(s) critique(s):
  1) Règle critique échouée: header
- Actions demandées:
  1) Corriger les règles critiques échouées
  2) Régénérer la sortie avec les corrections
</manager_feedback>
```

---

## 🧪 How to Extend to Other Sections

To clone this framework for another section (e.g., Section 8 – Questionnaire subjectif):

1. **Duplicate the folder structure**
2. **Replace:**
   - All mentions of "7. Historique de faits et évolution" with "8. Questionnaire subjectif et état actuel"
   - Section numbers in filenames
3. **Add new golden cases** (`training/golden_cases_section8.jsonl`)
4. **Update validation manifest and plan template** accordingly

This modular design supports LEGO-style expansion — each section can reuse the same evaluation logic and structure with minimal edits.

---

## 🧾 Compliance Notes

- **Language:** fr-CA
- **Framework:** PIPEDA / Loi 25 compliant (zero-retention testing)
- **Usage:** For R&D and model evaluation only
- **Not linked to production formatting logic**

---

## 🧰 Technical Stack

- **Python 3.11+**
- **OpenAI GPT-4o** (for manager evaluation)
- **Difflib / Regex / JSONL**
- **Cursor & Git** for managed context
- **UTF-8 everywhere** (no BOM)

---

## ✅ Status Summary

| Component | Status |
|-----------|--------|
| Configs | ✅ Done |
| Prompts | ✅ Done |
| System Conductor | ✅ Done |
| Golden Cases | ✅ 12 cases uploaded |
| Evaluator | ✅ Functional |
| Manager Eval | ✅ Connected |
| Reports | 🔁 Auto-generated |
| Docs | ✅ Complete |

---

## 🔒 Context Isolation

All files in this pipeline are isolated under:
- **Context:** `centomomd_section7_pipeline`
- **Branch:** `rnd_section7_pipeline`

They do not interact with:
- Production Section 7 formatter
- CentomoMD backend/frontend pipelines
- Live user data

---

## 🧭 Next Steps

| Goal | Action |
|------|--------|
| ✅ Validate pipeline on 12 cases | `python eval/evaluator_section7.py` |
| ✅ Run manager evaluation | `python scripts/run_manager_review.py` |
| 🧠 Refine plan for Section 8 | Duplicate and rename plan template |
| 🧩 Integrate automatic scoring dashboard | (future phase) |
| 🧾 Publish results internally | Save evaluation summary CSV |

---

## 📁 New Files Added (v1.1.0)

- `prompts/manager_section7_fr.md` - Manager evaluation prompt
- `prompts/checklist_manager_section7.json` - Compliance checklist
- `scripts/run_manager_review.py` - Manager review script
- `scripts/extract_golden_cases.py` - Golden cases extraction
- `scripts/test_manager_review.py` - Mock testing script
- `data/golden/section7/` - Extracted golden cases directory

---

**Author:** CentomoMD  
**R&D Pipeline Maintainer:** Uzziel Tamon  
**Version:** v1.1.0 — October 2025  
**License:** Internal Use Only