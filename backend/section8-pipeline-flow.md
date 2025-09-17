# Section 8 Template Pipeline Flow

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (TranscriptionInterface.tsx)                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. User selects "Section 8 AI Formatter" template                              │
│    template.id = 'section8-ai-formatter'                                       │
│    template.compatibleSections = ['section_8', 'section_7', 'section_11', ...] │
│                                                                                 │
│ 2. Frontend determines section:                                                 │
│    section = template.compatibleSections[0] = 'section_8'                      │
│    console.log("Using section: 8 for template: section8-ai-formatter")         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 3. API Call: POST /api/format/mode2                                             │
│    {                                                                             │
│      transcript: "Raw transcript text...",                                      │
│      language: "fr",                                                             │
│      section: "8",                    ← Now correctly uses section 8            │
│      templateId: "section8-ai-formatter"                                        │
│    }                                                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Mode2Formatter)                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 4. Mode2Formatter.formatSection8()                                              │
│                                                                                 │
│    if (universalCleanupEnabled) {                                               │
│      // Path A: Universal Cleanup + Template Pipeline                           │
│      │                                                                          │
│      ▼                                                                          │
│      ┌─────────────────────────────────────────────────────────────────────────┐ │
│      │ 5. Universal Cleanup Layer (S7)                                        │ │
│      │    - Cleans transcript                                                  │ │
│      │    - Extracts clinical entities                                         │ │
│      │    - Returns CleanedInput:                                              │ │
│      │      {                                                                  │ │
│      │        cleaned_text: "Cleaned transcript...",                           │ │
│      │        clinical_entities: { language: 'fr', issues: [...] }            │ │
│      │      }                                                                  │ │
│      └─────────────────────────────────────────────────────────────────────────┘ │
│      │                                                                          │
│      ▼                                                                          │
│      ┌─────────────────────────────────────────────────────────────────────────┐ │
│      │ 6. Template Pipeline (S8)                                              │ │
│      │    - processSection8(cleanedInput, options)                             │ │
│      │    - Extracts name whitelist                                            │ │
│      │    - Calls formatWithGuardrails('8', ...)                              │ │
│      └─────────────────────────────────────────────────────────────────────────┘ │
│    } else {                                                                     │
│      // Path B: Direct fallback                                                 │
│      │                                                                          │
│      ▼                                                                          │
│      ┌─────────────────────────────────────────────────────────────────────────┐ │
│      │ 7. Direct formatWithGuardrails('8', language, transcript)              │ │
│      └─────────────────────────────────────────────────────────────────────────┘ │
│    }                                                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    formatWithGuardrails('8', ...)                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 8. Load Section 8 Specific Files:                                               │
│    - section8_master.md          ← Section 8 system prompts                    │
│    - section8_master.json        ← Section 8 guardrails & rules                │
│    - section8_golden_example.md  ← Section 8 golden examples                   │
│    - section8_master_en.md       ← English Section 8 prompts                   │
│    - section8_master_en.json     ← English Section 8 guardrails                │
│    - section8_golden_example_en.md ← English Section 8 examples                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 9. Construct User Message:                                                      │
│    const userMessage = `${input}${nameConstraint}${clinicalEntitiesConstraint}`; │
│                                                                                 │
│    Where:                                                                       │
│    - input = cleaned transcript text                                            │
│    - nameConstraint = extracted name whitelist                                  │
│    - clinicalEntitiesConstraint = JSON.stringify(clinicalEntities)             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 10. OpenAI API Call:                                                            │
│     - Uses Section 8 system prompts                                             │
│     - Uses Section 8 guardrails & rules                                         │
│     - Uses Section 8 golden examples                                            │
│     - Includes clinical entities in user message                                │
│     - Includes name whitelist constraints                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 11. Post-Processing:                                                            │
│     - Keep only radiology impression/conclusion                                 │
│     - Thin quotes (strategic quotes only)                                       │
│     - Ensure proper paragraph formatting                                        │
│     - Strip invented first names                                                │
│     - Enhanced validation with Section 8 checks                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 12. Return Formatted Result:                                                    │
│     {                                                                             │
│       formatted: "Properly formatted Section 8 content...",                      │
│       issues: [...],                                                              │
│       confidence_score: 0.8,                                                     │
│       clinical_entities: { ... }                                                 │
│     }                                                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Display Result)                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Alternative Path: ProcessingOrchestrator

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ProcessingOrchestrator (Direct Path)                         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ processSection8AIFormatter()                                                    │
│ - Uses formatWithGuardrails('8', language, content)                             │
│ - Same Section 8 files and processing as above                                  │
│ - No clinical entities (raw content only)                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 📁 File System Structure

```
backend/prompts/
├── section8_master.md              # Section 8 system prompts (French)
├── section8_master.json            # Section 8 guardrails & rules (French)
├── section8_golden_example.md      # Section 8 golden examples (French)
├── section8_master_en.md           # Section 8 system prompts (English)
├── section8_master_en.json         # Section 8 guardrails & rules (English)
└── section8_golden_example_en.md   # Section 8 golden examples (English)
```

## 🎯 Key Points

1. **Section 8 now uses its own prompts** (not Section 7's)
2. **Clinical entities are properly integrated** from Universal Cleanup
3. **Two processing paths**: Mode2Formatter (preferred) or ProcessingOrchestrator (fallback)
4. **All paths use formatWithGuardrails('8')** for consistency
5. **Section 8 specific files** are loaded based on language
6. **Real clinical entities** are passed to AI prompts for better formatting
