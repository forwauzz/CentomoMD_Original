# Output Language Implementation - Current Debug State

## 🎯 Problem
User pastes English transcript, selects "French" output language, applies Section 8 template, but output remains in English instead of being translated to French.

## ✅ What's Working
- Frontend correctly sends `outputLanguage: 'fr'` to backend API
- Backend receives parameters correctly in `/api/format/mode2` endpoint
- Section 8 template is correctly routed to `formatSection8Enhanced`
- Two-pass pipeline is being called with correct parameters
- No infinite re-render loops or React errors

## ❌ What's Not Working
- **Output language translation is not happening** - English input stays English output
- **French to French formatting also doesn't work** - This suggests the entire two-pass pipeline is failing
- The two-pass pipeline should translate English → French but doesn't
- **Critical**: If French→French doesn't work, the issue is with the entire pipeline, not just translation

## 🔧 Complete Implementation Flow

### 1. Frontend Language Selection & State Management

**UI Store (Zustand):**
```typescript
// frontend/src/stores/uiStore.ts
interface UIState {
  inputLanguage: 'fr' | 'en';     // For dictation (fr-CA/en-US)
  outputLanguage: 'fr' | 'en';    // For template output
  setInputLanguage: (lang: 'fr' | 'en') => void;
  setOutputLanguage: (lang: 'fr' | 'en') => void;
}

// One-way data flow (no more loops)
const dictationLanguage = inputLanguage === 'fr' ? 'fr-CA' : 'en-US';
```

**Language Selectors:**
```typescript
// Input Language (for dictation)
<InputLanguageSelector
  language={dictationLanguage}  // 'en-US' | 'fr-CA'
  onLanguageChange={handleInputLanguageChange}
/>

// Output Language (for templates)
<OutputLanguageSelector
  language={outputLanguage}     // 'en' | 'fr'
  onLanguageChange={handleOutputLanguageChange}
/>
```

### 2. Template Selection & Application Flow

**Template Selection Logic:**
```typescript
// frontend/src/components/transcription/TranscriptionInterface.tsx
const injectTemplateContent = useCallback(async (template: TemplateJSON) => {
  console.log('Template ID:', template.id);
  console.log('Template category:', template.category);
  
  // Determine section from template
  let section = '7'; // Default
  if (template.id === 'section8-ai-formatter') {
    section = '8';
  } else if (template.id === 'section11-ai-formatter') {
    section = '11';
  }
  
  // Route to appropriate flow
  if (featureFlags.universalCleanup && template.category === 'ai-formatter') {
    // Universal Cleanup Flow
    const response = await api('/api/format/mode2', {
      method: 'POST',
      body: JSON.stringify({
        transcript: rawTranscript,
        section: section,
        language: inputLanguage,        // Legacy
        inputLanguage: inputLanguage,   // 'en'
        outputLanguage: outputLanguage, // 'fr'
        useUniversal: true,
        templateId: template.id
      })
    });
  }
}, [inputLanguage, outputLanguage, selectedTemplate]);
```

### 3. Backend API Endpoint Processing

**Mode2 Endpoint:**
```typescript
// backend/src/index.ts
app.post('/api/format/mode2', async (req, res) => {
  const { 
    transcript, 
    section, 
    language,        // Legacy: 'fr' | 'en'
    inputLanguage,   // New: 'fr' | 'en'
    outputLanguage,  // New: 'fr' | 'en'
    templateId
  } = req.body;
  
  // Backward compatibility + new parameters
  const finalInputLanguage = inputLanguage || language || 'fr';
  const finalOutputLanguage = outputLanguage || ENV.CNESST_SECTIONS_DEFAULT_OUTPUT;
  
  // Policy gate for CNESST sections
  if (['7','8','11'].includes(section) && 
      finalOutputLanguage !== 'fr' && 
      !ENV.ALLOW_NON_FRENCH_OUTPUT) {
    return res.status(400).json({ 
      error: 'CNESST sections must output French when ALLOW_NON_FRENCH_OUTPUT is false' 
    });
  }
  
  // Route to formatter
  const formatter = new Mode2Formatter();
  const result = await formatter.format(transcript, {
    language: finalInputLanguage,     // Legacy
    inputLanguage: finalInputLanguage,
    outputLanguage: finalOutputLanguage,
    section: section as '7' | '8' | '11',
    templateId
  });
});
```

### 4. Mode2 Formatter Routing

**Section Routing:**
```typescript
// backend/src/services/formatter/mode2.ts
async format(transcript: string, options: Mode2FormattingOptions): Promise<Mode2FormattingResult> {
  switch (options.section) {
    case '7':
      return await this.formatSection7(transcript, options);
    case '8':
      return await this.formatSection8Enhanced(transcript, options);  // ← Section 8
    case '11':
      return await this.formatSection11(transcript, options);
  }
}

private async formatSection8Enhanced(transcript: string, options: Mode2FormattingOptions) {
  const inputLanguage = options.inputLanguage || options.language;
  const outputLanguage = options.outputLanguage || options.language;
  
  console.log(`[Mode2Formatter] Section 8 - Input: ${inputLanguage}, Output: ${outputLanguage}`);
  
  // Process with two-pass pipeline
  const result = await this.templatePipeline.processWithTwoPassPipeline(transcript, '8', {
    language: inputLanguage,     // Legacy
    inputLanguage,              // 'en'
    outputLanguage,             // 'fr'
    section: '8',
    templateId: options.templateId
  });
  
  return {
    formatted: result.formatted,
    issues: result.issues,
    sources_used: ['section8-ai-formatter'],
    confidence_score: result.confidence_score,
    clinical_entities: result.clinical_entities
  };
}
```

### 5. Two-Pass Pipeline (The Core Issue)

**TemplatePipeline Implementation:**
```typescript
// backend/src/services/formatter/TemplatePipeline.ts
async processWithTwoPassPipeline(
  transcript: string,
  section: '7'|'8'|'11',
  options: TemplatePipelineOptions
): Promise<TemplatePipelineResult> {
  const inputLanguage = options.inputLanguage || options.language;
  const outputLanguage = options.outputLanguage || options.language;
  
  console.log(`[TemplatePipeline] Section: ${section}, Input: ${inputLanguage}, Output: ${outputLanguage}`);
  
  // Pass 1: Extract clinical entities (INPUT language optimized)
  const clinicalEntities = await extractClinicalEntities(
    transcript, 
    section, 
    inputLanguage  // 'en' - extract in English
  );
  
  // Pass 2: Format with clinical entities (OUTPUT language optimized)
  const formatterPrompts = selectFormatterPrompts(section, outputLanguage); // 'fr'
  
  console.log(`[TemplatePipeline] Formatter prompts:`, formatterPrompts);
  
  let systemPrompt = await loadPromptFile(formatterPrompts.master);
  
  // Add language context if input ≠ output
  if (inputLanguage !== outputLanguage) {
    console.log(`[TemplatePipeline] Adding language context for ${inputLanguage} → ${outputLanguage}`);
    const context = buildLanguageContext(inputLanguage, outputLanguage, section);
    systemPrompt = context + systemPrompt;
  }
  
  // Format with OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${transcript}\n\nClinical Entities: ${JSON.stringify(clinicalEntities)}` }
    ],
    temperature: 0.2,
    max_tokens: 2000
  });
  
  return {
    formatted: completion.choices[0]?.message?.content || transcript,
    issues: [],
    confidence_score: 0.8,
    clinical_entities: clinicalEntities
  };
}
```

### 6. Language Utilities & Context

**Prompt Selection:**
```typescript
// backend/src/services/formatter/langUtils.ts
export function selectFormatterPrompts(section: string, outputLanguage: 'fr' | 'en') {
  const suffix = outputLanguage === 'en' ? '_en' : '';
  return {
    master: `section${section}_master${suffix}.md`,      // section8_master.md (French)
    guardrails: `section${section}_guardrails${suffix}.json`,
    goldenExample: `section${section}_golden_example${suffix}.md`
  };
}

export function buildLanguageContext(inputLanguage: 'fr' | 'en', outputLanguage: 'fr' | 'en', section: string): string {
  if (inputLanguage === 'en' && outputLanguage === 'fr') {
    return `
## CONTEXTE D'ENTRÉE: Anglais
Le contenu fourni est en anglais. Formatez et traduisez-le en français selon les standards médicaux CNESST du Québec.

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
`;
  }
  return '';
}
```

### 7. Frontend Result Processing

**Result Handling:**
```typescript
// frontend/src/components/transcription/TranscriptionInterface.tsx
const result: UniversalCleanupResponse = await response.json();

console.log('[UNIVERSAL] Result received:', {
  formatted: result.formatted,
  formattedLength: result.formatted?.length,
  issues: result.issues
});

// Set the formatted result
const formatted = result?.formatted ?? result?.text ?? result?.data?.formatted ?? '';
console.log('[FORMAT] Setting edited transcript with length:', formatted.length);
setEditedTranscript(formatted);
```

## 🐛 Debug Logs Added
Added comprehensive logging to trace:
- Mode2Formatter parameter handling
- TemplatePipeline language processing
- Formatter prompt selection
- Language context injection

## 🔍 Next Steps
1. Test scenario again to see backend debug logs
2. Identify where in the pipeline the translation is failing
3. Check if French prompts are being loaded correctly
4. Verify language context is being added to system prompt

## 📋 Test Scenario
1. Paste English transcript
2. Select "French" output language
3. Select Section 8 template
4. Click "Apply Template"
5. **Expected**: French formatted output
6. **Actual**: English output (no translation)

## 🚨 Critical Issue
**The entire two-pass pipeline is failing, not just translation!**

Since **French→French formatting also doesn't work**, this means:
1. The two-pass pipeline is either not being called at all
2. The two-pass pipeline is being called but failing silently
3. The two-pass pipeline is working but returning the original transcript unchanged

**Most likely causes:**
- Missing prompt files (`section8_master.md`)
- OpenAI API errors
- Clinical entity extraction failing
- Silent error handling returning original transcript

**Debug Strategy:**
- Added comprehensive error logging to catch silent failures
- Added logging to trace the entire pipeline execution
- Need to check if prompt files exist and are being loaded correctly
- Need to verify OpenAI API calls are successful

**The system should:**
1. Extract clinical entities (Pass 1)
2. Format with appropriate prompts (Pass 2) 
3. Return formatted output (not original transcript)

**Need to trace through the backend logs to identify the failure point.**
