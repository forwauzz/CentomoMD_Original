# AI Formatting Workflow Flowchart

## 🔄 **Complete Information Processing Flow**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           INPUT STAGE                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Raw French Transcript:                                                         │
│  "Première consultation en octobre deux mille vingt-deux, le travailleur est   │
│   allé voir docteur Bussière après un accident de voiture..."                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Mode2Formatter.format()                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Input: transcript, options {language: 'fr', section: '7'}              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    formatWithGuardrails() Function                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FILE LOADING STAGE                                     │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │ section7_master │  │ section7_master │  │ section7_golden │                │
│  │ .md (French)    │  │ .json (Config)  │  │ _example.md     │                │
│  │                 │  │                 │  │ (Reference)     │                │
│  │ • Instructions  │  │ • Guardrails    │  │ • Example       │                │
│  │ • Worker-first  │  │ • Validation    │  │ • Style ref     │                │
│  │ • No markdown   │  │ • Terminology   │  │ • Structure     │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PROMPT CONSTRUCTION                                      │
│                                                                                 │
│  buildSystemPrompt() combines:                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 1. Main Instructions (from .md file)                                   │   │
│  │ 2. Style Rules (from .json file)                                       │   │
│  │ 3. Terminology Rules (from .json file)                                 │   │
│  │ 4. Golden Example (from .md file)                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          AI PROCESSING STAGE                                    │
│                                                                                 │
│  OpenAI API Call:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ System Message: Combined prompt with all instructions                  │   │
│  │ User Message: Raw transcript                                           │   │
│  │ Model: gpt-4o-mini                                                     │   │
│  │ Temperature: 0.1 (low for consistency)                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        AI RESPONSE PROCESSING                                   │
│                                                                                 │
│  Raw AI Output:                                                                 │
│  "## Historique de faits et évolution                                          │
│   Le travailleur consulte le docteur Nicolas Bussière, en octobre 2022..."    │
│                                                                                 │
│  ↓ Post-Processing:                                                             │
│  • Remove markdown headings (##)                                               │
│  • Clean up formatting                                                         │
│                                                                                 │
│  Clean Output:                                                                  │
│  "Le travailleur consulte le docteur Nicolas Bussière, en octobre 2022..."    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          VALIDATION STAGE                                       │
│                                                                                 │
│  validateOutput() checks against guardrails:                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ✅ Worker-first rule: Starts with "Le travailleur"?                    │   │
│  │ ✅ No date-first: Doesn't start with date?                             │   │
│  │ ✅ No prohibited terms: No "patient" terms?                            │   │
│  │ ✅ No invented content: No added diagnoses?                            │   │
│  │ ✅ Confidence scoring: Based on validation results                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OUTPUT STAGE                                          │
│                                                                                 │
│  Final Result:                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ {                                                                       │   │
│  │   formatted: "Le travailleur consulte le docteur Nicolas Bussière...", │   │
│  │   issues: [],                                                           │   │
│  │   confidence_score: 100                                                 │   │
│  │ }                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT RECEIVES RESULT                                   │
│                                                                                 │
│  Professional Section 7 format ready for CNESST submission                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 **Key Processing Steps:**

### **1. Input Processing**
- Raw transcript received
- Language and section identified
- Mode2Formatter called

### **2. File Loading**
- Load French prompt file (`section7_master.md`)
- Load guardrails config (`section7_master.json`)
- Load golden example (`section7_golden_example.md`)

### **3. Prompt Construction**
- Combine all files into comprehensive system prompt
- Add validation rules from JSON
- Include reference example

### **4. AI Processing**
- Send to OpenAI with structured prompt
- AI applies medical formatting rules
- Returns formatted text

### **5. Post-Processing**
- Remove markdown headings
- Clean up formatting
- Prepare for validation

### **6. Validation**
- Check against guardrails
- Verify worker-first rule
- Detect hallucinations
- Calculate confidence score

### **7. Output**
- Return formatted text with validation results
- Client receives professional Section 7 format

## 🎯 **Data Flow Summary:**

```
Raw Text → File Loading → Prompt Building → AI Processing → Post-Processing → Validation → Final Output
```

Each stage adds value:
- **File Loading**: Provides context and rules
- **Prompt Building**: Creates comprehensive instructions
- **AI Processing**: Applies medical formatting expertise
- **Post-Processing**: Cleans up formatting
- **Validation**: Ensures quality and compliance
- **Output**: Delivers professional result
