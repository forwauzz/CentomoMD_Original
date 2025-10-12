# Prompt Selection Flowchart & Processing Logic

**Date**: 2025-01-11  
**Scope**: Output Language Option Implementation - Prompt Selection and Processing Flow  
**Status**: Implementation Ready

---

## 🎯 Overview

This document details which prompts will be used in the new output language option implementation and provides a complete flowchart of the processing logic.

---

## 📁 Available Prompt Files

### **Section 7 Prompts**
- `section7_master.md` - French master prompt (CNESST compliant)
- `section7_master_en.md` - English master prompt
- `section7_master.json` - French guardrails configuration
- `section7_master_en.json` - English guardrails configuration
- `section7_golden_example.md` - French golden example
- `section7_golden_example_en.md` - English golden example

### **Section 8 Prompts**
- `section8_master.md` - French master prompt (CNESST compliant)
- `section8_master_en.md` - English master prompt
- `section8_master.json` - French guardrails configuration
- `section8_master_en.json` - English guardrails configuration
- `section8_golden_example.md` - French golden example
- `section8_golden_example_en.md` - English golden example

---

## 🔄 Prompt Selection Logic

### **Decision Matrix**

| Input Language | Output Language | Section | Master Prompt | Guardrails | Golden Example | Context Added |
|----------------|-----------------|---------|---------------|------------|----------------|---------------|
| `en` | `fr` | `7` | `section7_master_en.md` | `section7_master_en.json` | `section7_golden_example_en.md` | ✅ French Output Context |
| `fr` | `fr` | `7` | `section7_master.md` | `section7_master.json` | `section7_golden_example.md` | ❌ No Context |
| `en` | `en` | `7` | `section7_master_en.md` | `section7_master_en.json` | `section7_golden_example_en.md` | ❌ No Context |
| `fr` | `en` | `7` | `section7_master.md` | `section7_master.json` | `section7_golden_example.md` | ✅ English Output Context |
| `en` | `fr` | `8` | `section8_master_en.md` | `section8_master_en.json` | `section8_golden_example_en.md` | ✅ French Output Context |
| `fr` | `fr` | `8` | `section8_master.md` | `section8_master.json` | `section8_golden_example.md` | ❌ No Context |
| `en` | `en` | `8` | `section8_master_en.md` | `section8_master_en.json` | `section8_golden_example_en.md` | ❌ No Context |
| `fr` | `en` | `8` | `section8_master.md` | `section8_master.json` | `section8_golden_example.md` | ✅ English Output Context |

---

## 🎯 Processing Flowchart

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           USER INPUT                                            │
│  Input Language: [en/fr]  Output Language: [en/fr]  Section: [7/8/11]         │
└─────────────────────┬───────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    PROMPT SELECTION LOGIC                                      │
│                                                                                 │
│  if (inputLanguage === 'en') {                                                  │
│    masterPrompt = loadPromptFile(`section${section}_master_en.md`)             │
│    guardrails = loadGuardrailsFile(`section${section}_master_en.json`)         │
│    goldenExample = loadGoldenExampleFile(`section${section}_golden_example_en.md`) │
│  } else {                                                                       │
│    masterPrompt = loadPromptFile(`section${section}_master.md`)                 │
│    guardrails = loadGuardrailsFile(`section${section}_master.json`)             │
│    goldenExample = loadGoldenExampleFile(`section${section}_golden_example.md`) │
│  }                                                                              │
└─────────────────────┬───────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CONTEXT INJECTION LOGIC                                     │
│                                                                                 │
│  if (inputLanguage !== outputLanguage) {                                        │
│    context = buildLanguageContext(inputLanguage, outputLanguage, section)      │
│    enhancedPrompt = context + masterPrompt                                      │
│  } else {                                                                       │
│    enhancedPrompt = masterPrompt                                                │
│  }                                                                              │
└─────────────────────┬───────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    OPENAI PROCESSING                                           │
│                                                                                 │
│  systemPrompt = enhancedPrompt                                                  │
│  userMessage = transcript + nameConstraints + clinicalEntities                 │
│                                                                                 │
│  completion = await openai.chat.completions.create({                            │
│    model: "gpt-4o-mini",                                                       │
│    messages: [                                                                  │
│      { role: "system", content: systemPrompt },                                │
│      { role: "user", content: userMessage }                                    │
│    ],                                                                           │
│    temperature: 0.2,                                                            │
│    max_tokens: 2000                                                             │
│  })                                                                             │
└─────────────────────┬───────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    POST-PROCESSING                                             │
│                                                                                 │
│  1. keepRadiologyImpressionOnly(formatted)                                     │
│  2. thinQuotes(formatted, { maxTotal: 5, maxPerParagraph: 1 })                 │
│  3. ensureParagraphFormatting(formatted)                                       │
│  4. stripInventedFirstNames(formatted, nameWhitelist)                          │
└─────────────────────┬───────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    VALIDATION                                                  │
│                                                                                 │
│  if (section === '8' && outputLanguage === 'fr') {                             │
│    validateSection8Headers(formatted)                                          │
│  }                                                                              │
│                                                                                 │
│  validateOutput(section, outputLanguage, formatted, original, guardrails)      │
└─────────────────────┬───────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OUTPUT                                               │
│  {                                                                              │
│    formatted: string,                                                           │
│    issues: string[],                                                            │
│    confidence_score: number,                                                    │
│    clinical_entities: ClinicalEntities                                         │
│  }                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Context Injection Examples

### **English Input → French Output Context**

```markdown
## CONTEXTE D'ENTRÉE: Anglais
Le transcript ci-dessous est en anglais. Formatez-le selon les normes CNESST françaises pour la Section 8.

## INSTRUCTIONS DE TRADUCTION
- Traduisez le contenu anglais en français médical
- Maintenez la précision médicale pendant la traduction
- Utilisez la terminologie médicale française appropriée
- Préservez tous les détails cliniques et mesures
- Assurez-vous de la conformité CNESST en français

## TRADUCTION MÉDICALE (Anglais → Français)
- "patient" → "travailleur/travailleuse"
- "back pain" → "douleur dorsale"
- "stabbing pain" → "douleur lancinante"
- "burning pain" → "douleur brûlante"
- "pressure pain" → "douleur de pression"
- "night pain" → "douleur nocturne"
- "morning stiffness" → "raideur matinale"
- "lifting heavy objects" → "soulèvement d'objets lourds"
- "going up and down hills" → "monter et descendre des collines"
- "walking up and down steps" → "monter et descendre des marches"
- "standing posture" → "posture debout"
- "bending forward" → "se pencher en avant"
- "painkillers" → "analgésiques"
- "therapeutic plateau" → "plateau thérapeutique"
- "functional impact" → "impact fonctionnel"
- "neurological observations" → "observations neurologiques"

---
[ORIGINAL FRENCH PROMPT FOLLOWS HERE]
```

### **French Input → English Output Context**

```markdown
## INPUT CONTEXT: French
The transcript below is in French. Format it according to English medical standards for Section 8.

## TRANSLATION INSTRUCTIONS
- Translate French content to English medical terminology
- Maintain medical accuracy during translation
- Use appropriate English medical terminology
- Preserve all clinical details and measurements
- Ensure medical compliance in English

## MEDICAL TRANSLATION (French → English)
- "travailleur/travailleuse" → "patient"
- "douleur dorsale" → "back pain"
- "douleur lancinante" → "stabbing pain"
- "douleur brûlante" → "burning pain"
- "douleur de pression" → "pressure pain"
- "douleur nocturne" → "night pain"
- "raideur matinale" → "morning stiffness"
- "soulèvement d'objets lourds" → "lifting heavy objects"
- "monter et descendre des collines" → "going up and down hills"
- "monter et descendre des marches" → "walking up and down steps"
- "posture debout" → "standing posture"
- "se pencher en avant" → "bending forward"
- "analgésiques" → "painkillers"
- "plateau thérapeutique" → "therapeutic plateau"
- "impact fonctionnel" → "functional impact"
- "observations neurologiques" → "neurological observations"

---
[ORIGINAL ENGLISH PROMPT FOLLOWS HERE]
```

---

## 🎯 Specific Use Cases

### **Use Case 1: English Input → French Output (Section 8)**

**User Selection:**
- Input Language: English
- Output Language: French
- Section: 8

**Prompt Selection:**
- Master Prompt: `section8_master_en.md` (English-optimized for better English input understanding)
- Guardrails: `section8_master_en.json`
- Golden Example: `section8_golden_example_en.md`

**Context Added:**
- French Output Context (English → French translation instructions)

**Result:**
- High-quality French CNESST output with proper Section 8 headers
- Uses English-optimized prompts for better English input understanding
- Adds French output context for proper translation

### **Use Case 2: French Input → French Output (Section 8)**

**User Selection:**
- Input Language: French
- Output Language: French
- Section: 8

**Prompt Selection:**
- Master Prompt: `section8_master.md` (French-optimized)
- Guardrails: `section8_master.json`
- Golden Example: `section8_golden_example.md`

**Context Added:**
- No additional context needed

**Result:**
- High-quality French CNESST output with proper Section 8 headers
- Uses French-optimized prompts for optimal French input processing

### **Use Case 3: English Input → English Output (Section 8)**

**User Selection:**
- Input Language: English
- Output Language: English
- Section: 8

**Prompt Selection:**
- Master Prompt: `section8_master_en.md` (English-optimized)
- Guardrails: `section8_master_en.json`
- Golden Example: `section8_golden_example_en.md`

**Context Added:**
- No additional context needed

**Result:**
- High-quality English output
- Uses English-optimized prompts for optimal English input processing

### **Use Case 4: French Input → English Output (Section 8)**

**User Selection:**
- Input Language: French
- Output Language: English
- Section: 8

**Prompt Selection:**
- Master Prompt: `section8_master.md` (French-optimized for better French input understanding)
- Guardrails: `section8_master.json`
- Golden Example: `section8_golden_example.md`

**Context Added:**
- English Output Context (French → English translation instructions)

**Result:**
- High-quality English output
- Uses French-optimized prompts for better French input understanding
- Adds English output context for proper translation

---

## 🔍 Quality Assurance

### **Prompt Quality Validation**

1. **Input Language Optimization**: Always use prompts optimized for the input language
2. **Output Language Context**: Add translation context when input ≠ output language
3. **Section-Specific Headers**: Validate Section 8 headers when output is French
4. **Clinical Entity Extraction**: Consistent extraction regardless of language combination

### **Testing Matrix**

```typescript
const testCases = [
  // Section 8 Tests
  { input: 'en', output: 'fr', section: '8', expected: 'French CNESST with headers' },
  { input: 'fr', output: 'fr', section: '8', expected: 'French CNESST with headers' },
  { input: 'en', output: 'en', section: '8', expected: 'English output' },
  { input: 'fr', output: 'en', section: '8', expected: 'English output' },
  
  // Section 7 Tests
  { input: 'en', output: 'fr', section: '7', expected: 'French CNESST' },
  { input: 'fr', output: 'fr', section: '7', expected: 'French CNESST' },
  { input: 'en', output: 'en', section: '7', expected: 'English output' },
  { input: 'fr', output: 'en', section: '7', expected: 'English output' }
];

// Validate for each test case:
// 1. Correct prompt selection
// 2. Appropriate context injection
// 3. Output language accuracy
// 4. Section-specific compliance
// 5. Clinical entity extraction
// 6. Processing time consistency
```

---

## 🚀 Implementation Benefits

### **Quality Benefits**
- ✅ **Optimal Input Processing**: Uses prompts optimized for input language
- ✅ **Accurate Translation**: Context injection ensures proper language translation
- ✅ **Consistent Output**: Same quality regardless of language combination
- ✅ **Section Compliance**: Maintains CNESST compliance when French output selected

### **User Experience Benefits**
- ✅ **Language Control**: Users can choose both input and output languages
- ✅ **Flexibility**: Can output English or French based on needs
- ✅ **Quality Maintenance**: No degradation from current quality levels
- ✅ **Consistency**: Same interface for all sections

### **Technical Benefits**
- ✅ **Single Processing Path**: Eliminates dual path inconsistency
- ✅ **Modular Design**: Easy to add new languages or sections
- ✅ **Performance**: Optimal prompt selection reduces processing time
- ✅ **Maintainability**: Clear separation of concerns

---

## 📋 Implementation Checklist

### **Phase 1: Prompt Infrastructure**
- [ ] Verify all prompt files exist and are properly formatted
- [ ] Implement `buildOptimalSystemPrompt()` function
- [ ] Implement `buildLanguageContext()` function
- [ ] Test prompt selection logic for all combinations

### **Phase 2: Processing Integration**
- [ ] Update `formatWithGuardrails()` to use new prompt selection
- [ ] Update `TemplatePipeline` to handle input/output language separation
- [ ] Update `Mode2Formatter` to pass both languages
- [ ] Test processing flow for all language combinations

### **Phase 3: Validation & Testing**
- [ ] Implement comprehensive test suite for all language combinations
- [ ] Validate Section 8 header inclusion for French output
- [ ] Test clinical entity extraction consistency
- [ ] Performance testing for all combinations

### **Phase 4: Frontend Integration**
- [ ] Update frontend to send both input and output languages
- [ ] Update API endpoints to handle separate language parameters
- [ ] Test end-to-end flow with all language combinations
- [ ] User acceptance testing

---

**This flowchart and prompt selection logic ensures optimal quality while providing users with complete language control for their CNESST documentation needs.**
