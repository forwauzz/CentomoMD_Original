# Section 11 User Experience Flow

## 🎯 Overview

Section 11 is a **multi-section synthesis** that generates a medical conclusion from structured data collected across Sections 1-10. Unlike Section 7 (which formats raw transcript), Section 11 synthesizes structured JSON data into a formatted conclusion.

---

## 📊 Current User Experience Flow

### **Current Flow (Stub Implementation)**

```
1. User fills out Sections 1-10 in case form
   ├── Section 1: Mandate points
   ├── Section 2: Accepted diagnoses
   ├── Section 5: Relevant history
   ├── Section 7: History of facts and evolution
   ├── Section 8: Subjective complaints
   ├── Section 9: Physical examination
   └── Section 10: Paraclinical exams

2. User navigates to Section 11

3. User clicks "Generate from Sections" button
   └── Calls: POST /api/format/merge/section11
       └── Currently: Returns stub response

4. Section 11 is populated with generated content
   └── Currently: Not implemented
```

---

## 🏗️ Proposed User Experience Flow

### **Phase 1: Data Collection (Sections 1-10)**

**User fills out structured forms:**

1. **Section A: Worker Information** (Meta)
   - Age, sex, dominance
   - Occupation, employment status
   - Visit date

2. **Section 1: Mandate Points**
   - Checkboxes or list of mandate points

3. **Section 2: Accepted Diagnoses**
   - List of CNESST-accepted diagnoses

4. **Section 5: Relevant History**
   - Medical history
   - Surgical history
   - Site-specific history
   - Accidents
   - Habits

5. **Section 7: History of Facts and Evolution**
   - Chronological events (date, event, source)
   - Array of events

6. **Section 8: Subjective Complaints**
   - Main complaints (array)
   - AVQ/AVD (activities of daily living)

7. **Section 9: Physical Examination**
   - Regional findings (ankle, knee, elbow, shoulder, spine)
   - Findings summary

8. **Section 10: Paraclinical Exams**
   - List of imaging/exams

9. **Clinician Interpretations**
   - Therapeutic plateau (boolean)
   - Treatment sufficiency
   - Limitations exist (boolean)
   - Limitations description

10. **Consolidation Status**
    - Consolidation (boolean)
    - AIPP percentage (if applicable)

---

### **Phase 2: Section 11 Generation**

**User clicks "Generate Section 11" button:**

```
1. Frontend collects structured data from Sections 1-10
   └── Transforms form data into Section11Input JSON schema

2. Frontend calls: POST /api/format/merge/section11
   └── Body: {
         caseId: string,
         inputData: Section11Input  // Structured JSON matching schema
       }

3. Backend processes:
   ├── Loads Section 11 artifacts:
   │   ├── schema.json (validates input)
   │   ├── logicmap.yaml (applies consolidation logic)
   │   ├── master.fr.md (master prompt)
   │   └── examples.jsonl (training examples)
   │
   ├── Applies consolidation logic:
   │   ├── If consolidation = true:
   │   │   └── Standard format (diagnostic, date, AIPP, limitations)
   │   └── If consolidation = false:
   │       └── "Non consolidé" format (placeholders, cannot state)
   │
   ├── Calls AI with structured prompt:
   │   ├── System prompt: master.fr.md + logicmap instructions
   │   ├── User message: Structured JSON input
   │   └── Examples: Training examples for reference
   │
   └── Returns formatted Section 11 text:
       ├── Résumé (8-12 sentences)
       ├── Opinion clinique structurée:
       │   ├── Diagnostic(s)
       │   ├── Date de consolidation
       │   ├── Nature, nécessité, suffisance des soins
       │   ├── Atteinte permanente (existence)
       │   ├── Limitations fonctionnelles (existence)
       │   └── Évaluation des limitations fonctionnelles
       ├── Motifs (anchored by source sections S1-S10)
       └── Références internes

4. Frontend displays generated Section 11
   └── User can review and edit if needed

5. User saves Section 11
   └── Saved to case draft
```

---

## 🎨 UI/UX Design

### **Section 11 Form Layout**

```
┌─────────────────────────────────────────────────┐
│ 11. Conclusion                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│ [🤖 Générer à partir des sections 1-10]         │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Résumé :                                     │ │
│ │ [Generated text appears here...]            │ │
│ │                                              │ │
│ │ Il s'agit d'un homme de 43 ans...           │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Opinion clinique structurée :               │ │
│ │                                              │ │
│ │ Diagnostic :                                 │ │
│ │ Bursite rotulienne au genou gauche...       │ │
│ │                                              │ │
│ │ Date de consolidation :                     │ │
│ │ Le travailleur est consolidé...             │ │
│ │                                              │ │
│ │ Existence de l'atteinte permanente :        │ │
│ │ Considérant le diagnostic...                │ │
│ │                                              │ │
│ │ Évaluation des limitations fonctionnelles : │ │
│ │ Le travailleur devrait éviter...            │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ [💾 Enregistrer] [📄 Exporter]                  │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Case Form (Sections 1-10)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Section A: Meta (age, sex, occupation)                     │
│  Section 1: Mandate points                                  │
│  Section 2: Accepted diagnoses                             │
│  Section 5: Relevant history                                │
│  Section 7: History events (array)                         │
│  Section 8: Subjective complaints                           │
│  Section 9: Physical exam findings                         │
│  Section 10: Paraclinical exams                            │
│  Consolidation: boolean                                     │
│                                                              │
│  [User clicks "Generate Section 11"]                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Transform form data → Section11Input JSON            │  │
│  │ {                                                     │  │
│  │   meta: { age, sex, dominance, ... },                │  │
│  │   S1_mandate_points: [...],                           │  │
│  │   S2_diagnostics_acceptes: [...],                    │  │
│  │   S7_historique: [{ date, event, source }, ...],      │  │
│  │   S8_subjectif: { main_complaints: [...], AVQ_AVD },  │  │
│  │   S9_examen: { regions: {...}, findings_summary },   │  │
│  │   consolidation: boolean,                           │  │
│  │   ...                                                 │  │
│  │ }                                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  POST /api/format/merge/section11                           │
│  { caseId, inputData: Section11Input }                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: Section 11 R&D Service                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Validate input against schema.json                       │
│     └── Check required fields (meta, S1, S2, S7, S8, S9)   │
│                                                              │
│  2. Load artifacts:                                         │
│     ├── schema.json (input structure)                       │
│     ├── logicmap.yaml (consolidation logic)                │
│     ├── master.fr.md (master prompt)                        │
│     └── examples.jsonl (training examples)                 │
│                                                              │
│  3. Apply consolidation logic:                              │
│     ├── If consolidation = true:                           │
│     │   └── Use standard format                            │
│     └── If consolidation = false:                          │
│         └── Use "Non consolidé" format                      │
│                                                              │
│  4. Construct AI prompt:                                    │
│     ├── System: master.fr.md + logicmap instructions      │
│     ├── User: Structured JSON input                        │
│     └── Examples: Training examples                        │
│                                                              │
│  5. Call AI provider:                                       │
│     └── Generate formatted Section 11 text                 │
│                                                              │
│  6. Return formatted text:                                  │
│     └── Résumé + Opinion clinique + Motifs + Références   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Display Generated Section 11                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 11. Conclusion                                        │  │
│  │                                                       │  │
│  │ Résumé :                                             │  │
│  │ [Generated text...]                                  │  │
│  │                                                       │  │
│  │ Opinion clinique structurée :                        │  │
│  │ [Generated text...]                                  │  │
│  │                                                       │  │
│  │ [User can edit if needed]                            │  │
│  │                                                       │  │
│  │ [💾 Save] [📄 Export]                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Differences from Section 7

### **Section 7 Flow:**
```
Raw Transcript → AI Formatting → Formatted Section 7 Text
```

### **Section 11 Flow:**
```
Structured JSON (S1-S10) → AI Synthesis → Formatted Section 11 Conclusion
```

**Key Differences:**
1. **Input**: Section 7 uses raw transcript; Section 11 uses structured JSON
2. **Source**: Section 7 is single-section; Section 11 is multi-section synthesis
3. **Logic**: Section 11 has consolidation branching (true/false)
4. **Output**: Section 7 is narrative; Section 11 is structured conclusion

---

## 📝 Implementation Steps

### **Phase 1: Data Collection UI**
- [ ] Create structured form fields for Sections 1-10
- [ ] Map form data to Section11Input schema
- [ ] Validate required fields before generation

### **Phase 2: Backend Integration**
- [ ] Implement `/api/format/merge/section11` endpoint
- [ ] Integrate `section11RdService.ts`
- [ ] Handle consolidation logic branching

### **Phase 3: Frontend Integration**
- [ ] Update "Generate Section 11" button handler
- [ ] Transform form data to Section11Input JSON
- [ ] Display generated Section 11 text
- [ ] Allow user to edit generated content

### **Phase 4: Error Handling**
- [ ] Handle missing required fields
- [ ] Handle AI generation failures
- [ ] Show user-friendly error messages

---

## 🎯 User Experience Goals

1. **Seamless Data Collection**: User fills out Sections 1-10 naturally
2. **One-Click Generation**: Single button generates complete Section 11
3. **Transparent Process**: User sees progress during generation
4. **Editable Output**: User can review and edit generated content
5. **Consistent Format**: Generated content follows CNESST standards

---

## 📊 Example User Journey

1. **Dr. Centomo opens a case**
   - Fills out worker information (Section A)
   - Enters mandate points (Section 1)
   - Lists accepted diagnoses (Section 2)
   - Records medical history (Section 5)
   - Documents events chronologically (Section 7)
   - Records patient complaints (Section 8)
   - Documents physical exam findings (Section 9)
   - Lists imaging/exams (Section 10)
   - Sets consolidation status

2. **Dr. Centomo navigates to Section 11**
   - Sees "Generate from Sections" button
   - Clicks button

3. **System processes:**
   - Collects all data from Sections 1-10
   - Transforms to structured JSON
   - Validates against schema
   - Applies consolidation logic
   - Generates Section 11 using AI

4. **Dr. Centomo reviews generated Section 11**
   - Sees formatted conclusion
   - Reviews résumé, diagnostic, limitations
   - Edits if needed
   - Saves to case

5. **Dr. Centomo exports case**
   - Section 11 is included in final document
   - Follows CNESST format standards

---

## 🔄 Future Enhancements

1. **Incremental Generation**: Generate Section 11 as sections are completed
2. **Preview Mode**: Preview Section 11 before finalizing
3. **Version History**: Track changes to Section 11
4. **Template Variations**: Different Section 11 templates for different case types
5. **Multi-Language**: Support English Section 11 generation

