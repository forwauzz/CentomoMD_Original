# Section 7 R&D Template - Complete File Structure & Roles

## 📁 File Structure Overview

```
Section 7 R&D Template/
├── 🎯 CONFIGURATION LAYER
│   ├── configs/
│   │   └── master_prompt_section7.json          # Master template configuration
│   └── prompts/
│       ├── system_section7_fr.xml               # System conductor/orchestrator
│       ├── plan_section7_fr.xml                 # Formatting plan & rules
│       └── manager_eval_section7_fr.xml         # Manager evaluator
│
├── 📚 TRAINING DATA LAYER
│   ├── training/
│   │   └── golden_cases_section7.jsonl          # 21 RAG training examples (A-U)
│   └── data/golden/section7/
│       ├── case_A_gold.md                       # Reference standards
│       ├── case_B_gold.md                       # for evaluation
│       ├── ...                                  # (A through L)
│       └── case_L_gold.md
│
├── ⚙️ SERVICE LAYER
│   └── src/services/
│       ├── section7RdService.ts                 # Main R&D pipeline orchestrator
│       ├── formatter/
│       │   └── section7AI.ts                    # Basic AI formatter
│       └── processing/
│           └── ProcessingOrchestrator.ts        # Request routing & coordination
│
└── 🔍 EVALUATION LAYER
    ├── scripts/
    │   └── run_manager_review.py                # Manager evaluation pipeline
    └── eval/
        └── evaluator_section7.py                # Comprehensive evaluation metrics
```

## 🔄 Processing Flow & File Roles

### 1. **INPUT PROCESSING**
```
Raw Transcript → ProcessingOrchestrator.ts
```

### 2. **CONFIGURATION LOADING**
```
ProcessingOrchestrator.ts → section7RdService.ts
section7RdService.ts → master_prompt_section7.json
```

### 3. **ARTIFACT INTEGRATION**
```
master_prompt_section7.json → system_section7_fr.xml
system_section7_fr.xml → plan_section7_fr.xml
system_section7_fr.xml → manager_eval_section7_fr.xml
```

### 4. **TRAINING DATA LOADING**
```
section7RdService.ts → golden_cases_section7.jsonl (21 cases)
section7RdService.ts → case_A_gold.md to case_L_gold.md (12 references)
```

### 5. **AI PROCESSING**
```
section7RdService.ts → OpenAI API (with all artifacts)
OpenAI API → Formatted Section 7 content
```

### 6. **QUALITY EVALUATION**
```
Formatted content → run_manager_review.py
Formatted content → evaluator_section7.py
```

## 📊 Detailed File Roles

### 🎯 **CONFIGURATION FILES**

#### `master_prompt_section7.json` (1.2KB)
- **Role**: Master template configuration
- **Impact**: Defines the entire Section 7 pipeline structure
- **Contains**: Template ID, language, artifact paths, metadata
- **Used by**: section7RdService.ts

#### `system_section7_fr.xml` (4.1KB)
- **Role**: System conductor/orchestrator
- **Impact**: Orchestrates the entire Section 7 pipeline
- **Contains**: Integration instructions, quality improvements, verbatim rules
- **Used by**: section7RdService.ts → OpenAI API

#### `plan_section7_fr.xml` (15.7KB)
- **Role**: Formatting plan & rules
- **Impact**: Provides step-by-step formatting instructions
- **Contains**: Transcription cleanup, doctor names, medical terminology, chronology
- **Used by**: system_section7_fr.xml → OpenAI API

#### `manager_eval_section7_fr.xml` (4.1KB)
- **Role**: Manager evaluator
- **Impact**: Enables quality assessment and feedback
- **Contains**: Quality checks, conformity validation, scoring system
- **Used by**: run_manager_review.py

### 📚 **TRAINING DATA FILES**

#### `golden_cases_section7.jsonl` (110KB)
- **Role**: RAG training examples
- **Impact**: Provides 21 real medical cases for AI learning
- **Contains**: Authentic medical documentation (cases A-U)
- **Used by**: section7RdService.ts → OpenAI API

#### `case_A_gold.md` to `case_L_gold.md` (12 files)
- **Role**: Reference standards for evaluation
- **Impact**: Provides quality benchmarks and evaluation references
- **Contains**: Professional CNESST formatting examples
- **Used by**: evaluator_section7.py, run_manager_review.py

### ⚙️ **SERVICE LAYER FILES**

#### `section7RdService.ts` (18.9KB)
- **Role**: Main R&D pipeline orchestrator
- **Impact**: Coordinates the complete Section 7 processing
- **Contains**: Master config loading, artifact integration, OpenAI API calls
- **Used by**: ProcessingOrchestrator.ts

#### `section7AI.ts` (19.9KB)
- **Role**: Basic AI formatter
- **Impact**: Provides fallback AI formatting capabilities
- **Contains**: Language-specific prompts, golden examples integration
- **Used by**: section7RdService.ts (fallback)

#### `ProcessingOrchestrator.ts` (33.8KB)
- **Role**: Request routing & coordination
- **Impact**: Routes requests to appropriate templates and services
- **Contains**: Section/mode/template routing, compatibility checking
- **Used by**: External API calls

### 🔍 **EVALUATION LAYER FILES**

#### `run_manager_review.py` (2.9KB)
- **Role**: Manager evaluation pipeline
- **Impact**: Executes quality assessment using OpenAI
- **Contains**: Python-based evaluation, quality scoring
- **Used by**: section7RdService.ts (post-processing)

#### `evaluator_section7.py` (10.7KB)
- **Role**: Comprehensive evaluation metrics
- **Impact**: Provides detailed quality metrics and validation
- **Contains**: Line-by-line similarity, rule-based validation
- **Used by**: External evaluation calls

## 🎯 **Processing Impact Summary**

### **High Impact Files** (Critical for processing):
1. `master_prompt_section7.json` - Defines entire pipeline
2. `system_section7_fr.xml` - Orchestrates processing
3. `plan_section7_fr.xml` - Provides formatting rules
4. `section7RdService.ts` - Main processing engine
5. `golden_cases_section7.jsonl` - RAG training data

### **Medium Impact Files** (Quality & evaluation):
1. `manager_eval_section7_fr.xml` - Quality assessment
2. `case_A_gold.md` to `case_L_gold.md` - Reference standards
3. `run_manager_review.py` - Manager evaluation
4. `evaluator_section7.py` - Metrics calculation

### **Supporting Files** (Infrastructure):
1. `ProcessingOrchestrator.ts` - Request routing
2. `section7AI.ts` - Fallback formatting

## 🔄 **Complete Processing Cycle**

```
1. Raw Input → ProcessingOrchestrator.ts
2. Orchestrator → section7RdService.ts
3. Service → Loads master_prompt_section7.json
4. Service → Loads system_section7_fr.xml
5. System → Loads plan_section7_fr.xml
6. System → Loads manager_eval_section7_fr.xml
7. Service → Loads golden_cases_section7.jsonl
8. Service → Loads case_A_gold.md to case_L_gold.md
9. Service → Calls OpenAI with all artifacts
10. OpenAI → Returns formatted content
11. Service → Returns processed result
12. Manager → run_manager_review.py evaluates quality
13. Evaluator → evaluator_section7.py provides metrics
```

## 📈 **File Size & Complexity Analysis**

| File | Size | Complexity | Impact Level |
|------|------|------------|--------------|
| ProcessingOrchestrator.ts | 33.8KB | High | Infrastructure |
| plan_section7_fr.xml | 15.7KB | High | Critical |
| section7RdService.ts | 18.9KB | High | Critical |
| section7AI.ts | 19.9KB | High | Supporting |
| evaluator_section7.py | 10.7KB | Medium | Quality |
| golden_cases_section7.jsonl | 110KB | Medium | Critical |
| system_section7_fr.xml | 4.1KB | Medium | Critical |
| manager_eval_section7_fr.xml | 4.1KB | Medium | Quality |
| run_manager_review.py | 2.9KB | Low | Quality |
| master_prompt_section7.json | 1.2KB | Low | Critical |

## 🎉 **Summary**

The Section 7 R&D Template consists of **15 key files** working together to provide:
- **Professional medical documentation formatting**
- **Enhanced RAG system with 21 training examples**
- **Comprehensive quality evaluation**
- **Authentic CNESST compliance**

All files are properly integrated and validated, providing a robust, production-ready system for processing medical transcripts into professional Section 7 documentation.
