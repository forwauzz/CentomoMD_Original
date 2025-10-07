# Section 7 AI Formatter - Prompt File Injection Flow

## 🎯 **Complete Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SECTION 7 AI FORMATTER TEMPLATE                      │
│                              Prompt Injection Flow                             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   USER INPUT    │    │  LANGUAGE       │    │  TEMPLATE       │
│                 │    │  DETECTION      │    │  SELECTION      │
│ Raw Medical     │───▶│                 │───▶│                 │
│ Transcript      │    │ fr | en         │    │ section7-ai-    │
│                 │    │                 │    │ formatter       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        STEP 1: LOAD LANGUAGE-SPECIFIC FILES                    │
│                              loadLanguageSpecificFiles()                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRENCH PATH   │    │  ENGLISH PATH   │    │   FILE LOADING  │
│                 │    │                 │    │                 │
│ section7_       │    │ section7_       │    │ readFileSync()  │
│ master.md       │    │ master_en.md    │    │ JSON.parse()    │
│                 │    │                 │    │                 │
│ section7_       │    │ section7_       │    │ UTF-8 encoding  │
│ master.json     │    │ master_en.json  │    │                 │
│                 │    │                 │    │                 │
│ section7_       │    │ section7_       │    │ Error handling  │
│ golden_example  │    │ golden_example  │    │                 │
│ .md             │    │ _en.md          │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        STEP 2: CONSTRUCT SYSTEM PROMPT                         │
│                            constructSystemPrompt()                             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MASTER PROMPT │    │  GOLDEN EXAMPLE │    │  JSON CONFIG    │
│                 │    │                 │    │                 │
│ Base formatting │    │ Reference       │    │ Style rules     │
│ instructions    │    │ structure       │    │ Terminology     │
│                 │    │                 │    │ QA checks       │
│ Worker-first    │    │ CNESST format   │    │ Few-shot        │
│ rule            │    │                 │    │ examples        │
│                 │    │ Chronological   │    │                 │
│ Medical terms   │    │ order           │    │ Validation      │
│                 │    │                 │    │ rules           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        STEP 3: INJECT JSON CONFIGURATION                       │
│                          injectJSONConfiguration()                             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  STYLE RULES    │    │ TERMINOLOGY     │    │  QA CHECKS      │
│                 │    │                 │    │                 │
│ • worker_first  │    │ • preferred     │    │ • chronology    │
│ • chronological │    │   terms         │    │ • validation    │
│ • doctor_title  │    │ • prohibited    │    │ • duplicates    │
│ • quotes_keep   │    │   terms         │    │ • integrity     │
│                 │    │ • verbs         │    │                 │
│ • paragraph_    │    │ • specialties   │    │ • evolution     │
│   per_event     │    │ • lesions       │    │   mentions      │
│                 │    │ • exams         │    │                 │
│ • vary_verbs    │    │ • treatments    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        STEP 4: FINAL SYSTEM PROMPT ASSEMBLY                    │
│                              Complete Prompt Structure                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  COMPREHENSIVE SYSTEM PROMPT                                                   │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  1. MASTER PROMPT (Base Instructions)                                          │
│     ├── Worker-first rule enforcement                                          │
│     ├── Chronological ordering                                                 │
│     ├── Medical terminology preservation                                       │
│     ├── CNESST formatting standards                                            │
│     └── Language-specific instructions                                         │
│                                                                                 │
│  2. REFERENCE EXAMPLE (Golden Standard)                                        │
│     ├── Complete CNESST Section 7 example                                      │
│     ├── Proper structure demonstration                                         │
│     ├── Medical terminology usage                                              │
│     └── Chronological flow example                                             │
│                                                                                 │
│  3. STYLE RULES (Critical Requirements)                                        │
│     ├── Worker-first: REQUIRED                                                 │
│     ├── Chronological: REQUIRED                                                │
│     ├── Doctor title: REQUIRED                                                 │
│     └── Paragraph per event: REQUIRED                                          │
│                                                                                 │
│  4. TERMINOLOGY RULES                                                          │
│     ├── Replace "patient" with "worker"                                        │
│     ├── NEVER use prohibited terms                                             │
│     ├── Use approved medical terminology                                       │
│     └── Preserve specialized CNESST terms                                      │
│                                                                                 │
│  5. QA VERIFICATION RULES                                                      │
│     ├── Chronology enforcement                                                 │
│     ├── Duplicate sentence guard                                               │
│     ├── Quote integrity preservation                                           │
│     └── Evolution mentions required                                            │
│                                                                                 │
│  6. FEW-SHOT EXAMPLES                                                          │
│     ├── Input/Output pairs                                                     │
│     ├── Consultation formatting                                                │
│     ├── Date formatting                                                        │
│     └── Medical terminology usage                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        STEP 5: OPENAI API CALL                                 │
│                              callOpenAI()                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  SYSTEM MESSAGE │    │  USER MESSAGE   │    │  API RESPONSE   │
│                 │    │                 │    │                 │
│ Complete        │    │ "Format this    │    │ Formatted       │
│ system prompt   │    │ raw medical     │    │ Section 7       │
│ with all        │    │ text according  │    │ content         │
│ components      │    │ to CNESST       │    │                 │
│                 │    │ standards"      │    │ Worker-first    │
│ Temperature:    │    │                 │    │ structure       │
│ 0.2 (low)       │    │ + Raw transcript│    │                 │
│                 │    │                 │    │ Chronological   │
│ Max tokens:     │    │                 │    │ order           │
│ 4000            │    │                 │    │                 │
│                 │    │                 │    │ Medical terms   │
│ Model:          │    │                 │    │ preserved       │
│ gpt-4o-mini     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        STEP 6: POST-PROCESSING                                 │
│                              Clean & Validate                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  CLEAN OUTPUT   │    │  VALIDATION     │    │  FINAL RESULT   │
│                 │    │                 │    │                 │
│ Remove markdown │    │ Check worker-   │    │ Formatted       │
│ headers         │    │ first rule      │    │ Section 7       │
│                 │    │                 │    │ content         │
│ Trim whitespace │    │ Verify          │    │                 │
│                 │    │ chronological   │    │ Ready for       │
│ Normalize       │    │ order           │    │ CNESST          │
│ formatting      │    │                 │    │ submission      │
│                 │    │ Validate        │    │                 │
│ Error handling  │    │ medical terms   │    │ Success!        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 **File Injection Sequence**

### **Language Detection → File Selection**
```
Language: 'fr' (French)
├── section7_master.md          (Base instructions)
├── section7_master.json        (Configuration rules)
└── section7_golden_example.md  (Reference example)

Language: 'en' (English)  
├── section7_master_en.md       (Base instructions)
├── section7_master_en.json     (Configuration rules)
└── section7_golden_example_en.md (Reference example)
```

### **System Prompt Assembly Order**
1. **Master Prompt** (Base foundation)
2. **Golden Example** (Reference structure)
3. **JSON Configuration** (Rules & validation)
   - Style rules
   - Terminology rules
   - QA verification rules
   - Few-shot examples

## 🎯 **Key Features of This Flow**

- **Language-Aware**: Automatically selects correct files based on language
- **Modular**: Each file has a specific purpose and can be updated independently
- **Comprehensive**: Combines instructions, examples, and validation rules
- **Robust**: Includes error handling and fallback mechanisms
- **CNESST-Compliant**: Enforces Quebec medical reporting standards

## 📋 **File Purposes**

| File | Purpose | Content |
|------|---------|---------|
| `section7_master.md/en.md` | Base instructions | Worker-first rule, chronological order, medical terminology |
| `section7_master.json/en.json` | Configuration rules | Style rules, terminology, QA checks, few-shot examples |
| `section7_golden_example.md/en.md` | Reference example | Complete CNESST Section 7 example for structure reference |

This flow ensures that the Section 7 AI Formatter has access to all necessary instructions, examples, and validation rules to produce properly formatted CNESST-compliant medical reports.
