# Section 8 Template Consistency Audit & Output Language Option Implementation Plan

**Date**: 2025-01-11  
**Scope**: Section 8 template implementation, consistency issues, and output language option implementation  
**Status**: Analysis Complete - Ready for Implementation Planning

---

## 🎯 Executive Summary

The Section 8 template implementation suffers from **dual processing path inconsistency** and **rigid French-only output enforcement**. This audit identifies the root causes and provides a comprehensive plan to implement a flexible **output language option** that maintains quality while giving users control over their output language.

### Key Findings
- ❌ **Dual Processing Paths**: Legacy vs Universal Cleanup paths produce different results
- ❌ **Shadow Mode Interference**: Development shadow mode causes inconsistent behavior
- ❌ **Rigid French Enforcement**: Hardcoded "Output will always be in French" message
- ❌ **No Output Language Control**: Users cannot choose output language
- ✅ **Template Infrastructure**: Core template system is well-designed
- ✅ **French Prompts**: Section 8 has proper French master prompts

---

## 🔍 Current Architecture Analysis

### 1. Frontend Language Handling

#### **Current UI Implementation**
```typescript
// TranscriptionInterface.tsx - Line 857-860
<p className="text-xs text-gray-500">
  Output will always be in French (CNESST compliant)
</p>
```

#### **Language Selector Component**
```typescript
// LanguageSelector.tsx - Only handles INPUT language
interface InputLanguageSelectorProps {
  language: string; // Only input language
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
}

const languageItems = [
  { label: "English", value: "en-US" },
  { label: "Français", value: "fr-CA" },
];
```

#### **UI Store Configuration**
```typescript
// uiStore.ts - Only tracks input language
interface UIState {
  inputLanguage: 'fr' | 'en'; // Default to French for Quebec clinics
  // NO outputLanguage field
}
```

### 2. Backend Language Processing

#### **Mode 2 Formatting Endpoint**
```typescript
// index.ts - Line 1915-1919
if (!language || !['fr', 'en'].includes(language)) {
  return res.status(400).json({ 
    error: 'Language must be either "fr" or "en"' 
  });
}
```

#### **formatWithGuardrails Function**
```typescript
// shared.ts - Line 44-45
// Always use French files for Section 8
const suffix = (section === '8') ? '' : (language === 'en' ? '_en' : '');
```

#### **English Input Context (Section 8 Only)**
```typescript
// shared.ts - Line 52-84
if (section === '8' && language === 'en') {
  enhancedSystemPrompt = `
## CONTEXTE D'ENTRÉE: Anglais
Le contenu fourni est en anglais. Formatez et traduisez-le en français...
`;
}
```

### 3. Dual Processing Paths

#### **Path 1: Universal Cleanup (New)**
```typescript
// Mode2Formatter.formatSection8Enhanced()
if (universalCleanupEnabled) {
  const cleanupResult = await this.universalCleanupLayer.process(transcript, {
    language: options.language,
    source: 'ambient'
  });
  const templateResult = await this.templatePipeline.process(cleanedData, {
    section: '8',
    language: options.language,
    templateId: 'section8-ai-formatter'
  });
}
```

#### **Path 2: Legacy Direct (Old)**
```typescript
// Fallback to formatWithGuardrails
const result = await formatWithGuardrails('8', options.language, transcript);
```

---

## 📊 Consistency Issues Identified

### 1. Shadow Mode Comparison Results
```
🔍 SHADOW MODE COMPARISON:
==================================================
⏱️  Processing Time: 21433ms
📝 Formatted Text Checksums:
   Legacy:    6fcab7e63ffa7c56
   Universal: 329c4ae29b8d1ec6
   Match:     ❌

🏥 Clinical Entities:
   Legacy Keys:    []
   Universal Keys: [injury_location, injury_type, onset, pain_severity, functional_limitations, previous_injuries, treatment_to_date, imaging_done, return_to_work, language, issues]
   Match:          ❌
```

### 2. Language Handling Inconsistencies
- **Section 8**: Always uses French prompts, adds English context when needed
- **Section 7**: Uses English prompts when `language === 'en'`
- **No Output Language Control**: Users cannot choose output language
- **Hardcoded French Message**: UI shows "Output will always be in French"

### 3. Processing Time Variance
- **Legacy Path**: 21s, 14s, 13s (highly variable)
- **Universal Path**: More consistent but still variable
- **Root Cause**: Different AI model calls and processing complexity

---

## 🎯 Requirements & Standards

### 1. Output Language Option Requirements
- **User Control**: Users should be able to select output language (English/French)
- **Quality Maintenance**: Use optimal prompts for input language
- **CNESST Compliance**: Default French output for CNESST sections
- **Flexibility**: Allow English output when needed

### 2. Section 8 Template Requirements
- **Mandatory French Output Structure**: When French is selected as output language
- **Comprehensive Clinical Entity Extraction**: Consistent entity extraction
- **Prompt Optimization**: Maintain quality regardless of input/output language combination

### 3. Section 7 Template Requirements
- **Same Output Language Control**: Apply same logic as Section 8
- **Consistent Processing**: Use single processing path
- **Quality Maintenance**: Maintain current quality levels

---

## 🚀 Implementation Plan: Output Language Option

### **Step 1: Enhanced Environment Flags & Configuration**

```bash
# backend/.env.example
UNIVERSAL_CLEANUP_ENABLED=true
UNIVERSAL_CLEANUP_SHADOW=false  # Never on in production

# Language Configuration
DEFAULT_OUTPUT_LANGUAGE=fr  # Default output language
CNESST_SECTIONS_DEFAULT_OUTPUT=fr  # Default for CNESST sections (7, 8, 11)
ENABLE_OUTPUT_LANGUAGE_SELECTION=true  # Enable UI output language selector
INPUT_LANGUAGE_DETECTION=true  # Auto-detect input language

# Performance & Quality
SLO_P95_MS=5000
SLO_P99_MS=8000
CACHE_TTL_SECONDS=604800  # 7 days
```

### **Step 2: Frontend UI Enhancement**

#### **2.1 Enhanced Language Selector Component**
```typescript
// frontend/src/components/transcription/LanguageSelector.tsx
interface LanguageSelectorProps {
  inputLanguage: string;
  outputLanguage: string;
  onInputLanguageChange: (language: string) => void;
  onOutputLanguageChange: (language: string) => void;
  disabled?: boolean;
  showOutputSelector?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  inputLanguage,
  outputLanguage,
  onInputLanguageChange,
  onOutputLanguageChange,
  disabled = false,
  showOutputSelector = true
}) => {
  const languageItems = [
    { label: "English", value: "en-US" },
    { label: "Français", value: "fr-CA" },
  ];

  return (
    <div className="space-y-4">
      {/* Input Language */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Input Language</label>
        <Select
          value={inputLanguage}
          onValueChange={onInputLanguageChange}
          disabled={disabled}
          items={languageItems}
          buttonClassName="w-full bg-white border border-gray-300 rounded-md text-left"
        />
      </div>

      {/* Output Language */}
      {showOutputSelector && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Output Language</label>
          <Select
            value={outputLanguage}
            onValueChange={onOutputLanguageChange}
            disabled={disabled}
            items={languageItems}
            buttonClassName="w-full bg-white border border-gray-300 rounded-md text-left"
          />
          {outputLanguage === 'fr-CA' && (
            <p className="text-xs text-green-600 font-medium">
              ✓ CNESST Compliant
            </p>
          )}
        </div>
      )}
    </div>
  );
};
```

#### **2.2 Updated UI Store**
```typescript
// frontend/src/stores/uiStore.ts
interface UIState {
  sidebarCollapsed: boolean;
  inputLanguage: 'fr' | 'en';
  outputLanguage: 'fr' | 'en';  // NEW: Output language selection
  toasts: Toast[];
  
  // Actions
  setInputLanguage: (lang: 'fr' | 'en') => void;
  setOutputLanguage: (lang: 'fr' | 'en') => void;  // NEW
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      inputLanguage: 'fr', // Default to French for Quebec clinics
      outputLanguage: 'fr', // Default to French for CNESST compliance
      toasts: [],
      
      // Actions
      setInputLanguage: (lang) => set({ inputLanguage: lang }),
      setOutputLanguage: (lang) => set({ outputLanguage: lang }), // NEW
      
      // ... rest of implementation
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        inputLanguage: state.inputLanguage,
        outputLanguage: state.outputLanguage, // NEW: Persist output language
      }),
    }
  )
);
```

#### **2.3 Updated Transcription Interface**
```typescript
// frontend/src/components/transcription/TranscriptionInterface.tsx
export const TranscriptionInterface: React.FC<TranscriptionInterfaceProps> = ({
  sessionId,
  language = 'en'
}) => {
  const { inputLanguage, outputLanguage, setInputLanguage, setOutputLanguage } = useUIStore();
  
  // Convert UI store languages to dictation format
  const selectedInputLanguage = inputLanguage === 'fr' ? 'fr-CA' : 'en-US';
  const selectedOutputLanguage = outputLanguage === 'fr' ? 'fr-CA' : 'en-US';

  const handleInputLanguageChange = (newLanguage: string) => {
    const uiLanguageFormat = newLanguage === 'fr-CA' ? 'fr' : 'en';
    setInputLanguage(uiLanguageFormat);
  };

  const handleOutputLanguageChange = (newLanguage: string) => {
    const uiLanguageFormat = newLanguage === 'fr-CA' ? 'fr' : 'en';
    setOutputLanguage(uiLanguageFormat);
  };

  // ... rest of component

  return (
    <div className="space-y-6 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Dictation Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enhanced Language Selector */}
              <LanguageSelector
                inputLanguage={selectedInputLanguage}
                outputLanguage={selectedOutputLanguage}
                onInputLanguageChange={handleInputLanguageChange}
                onOutputLanguageChange={handleOutputLanguageChange}
                disabled={isRecording}
                showOutputSelector={true}
              />

              {/* Section Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Section</label>
                <SectionSelector
                  currentSection={activeSection}
                  onSectionChange={setActiveSection}
                />
              </div>

              {/* ... rest of controls */}
            </CardContent>
          </Card>
        </div>
        {/* ... rest of layout */}
      </div>
    </div>
  );
};
```

### **Step 3: Backend Language Processing Enhancement**

#### **3.1 Enhanced Language Utilities**
```typescript
// backend/src/services/formatter/langUtils.ts
export type CnesstSection = '7' | '8' | '11' | string;
export const isCnesstSection = (section: CnesstSection) => ['7', '8', '11'].includes(section);

export interface LanguageOptions {
  inputLanguage: 'en' | 'fr' | 'auto';
  outputLanguage: 'en' | 'fr';
  section: CnesstSection;
  cnesstDefaultOutput?: 'en' | 'fr';
}

export function buildOptimalSystemPrompt(options: LanguageOptions): string {
  const { inputLanguage, outputLanguage, section, cnesstDefaultOutput = 'fr' } = options;
  
  // Determine effective output language
  let effectiveOutputLanguage = outputLanguage;
  if (isCnesstSection(section) && cnesstDefaultOutput) {
    // For CNESST sections, use default if not explicitly overridden
    effectiveOutputLanguage = cnesstDefaultOutput;
  }
  
  // Determine input language for prompt selection
  const detectedInputLang = inputLanguage === 'auto' ? 'en' : inputLanguage;
  
  // Select optimal prompt based on input language
  const inputSuffix = detectedInputLang === 'en' ? '_en' : '';
  const basePrompt = loadPromptFile(`section${section}_master${inputSuffix}.md`);
  
  // Add output language context if different from input
  if (effectiveOutputLanguage !== detectedInputLang) {
    const context = buildLanguageContext(detectedInputLang, effectiveOutputLanguage, section);
    return context + basePrompt;
  }
  
  return basePrompt;
}

function buildLanguageContext(
  inputLang: 'en' | 'fr', 
  outputLang: 'en' | 'fr', 
  section: string
): string {
  if (inputLang === 'en' && outputLang === 'fr') {
    return `
## CONTEXTE D'ENTRÉE: Anglais
Le transcript ci-dessous est en anglais. Formatez-le selon les normes CNESST françaises pour la Section ${section}.

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
  
  if (inputLang === 'fr' && outputLang === 'en') {
    return `
## INPUT CONTEXT: French
The transcript below is in French. Format it according to English medical standards for Section ${section}.

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
`;
  }
  
  return '';
}
```

#### **3.2 Enhanced formatWithGuardrails Function**
```typescript
// backend/src/services/formatter/shared.ts
export async function formatWithGuardrails(
  section: '7' | '8' | '11',
  inputLanguage: 'fr' | 'en',
  outputLanguage: 'fr' | 'en',  // NEW: Explicit output language
  input: string,
  extra?: string,
  options?: { nameWhitelist?: string[], clinicalEntities?: any }
): Promise<FormattingResult> {
  try {
    // 1. Pre-parse: Extract name whitelist from raw transcript
    const nameWhitelist = options?.nameWhitelist || extractNameWhitelist(input);
    
    // 2. Build optimal system prompt using new language utilities
    const systemPrompt = await buildOptimalSystemPrompt({
      inputLanguage,
      outputLanguage,
      section,
      cnesstDefaultOutput: process.env.CNESST_SECTIONS_DEFAULT_OUTPUT as 'en' | 'fr' || 'fr'
    });
    
    const guardrails = await loadGuardrailsFile(`section${section}_master.json`);
    const goldenExample = await loadGoldenExampleFile(`section${section}_golden_example.md`);

    // 3. Prepare user message with constraints
    const nameConstraint = nameWhitelist.length > 0 
      ? `\n\n[Contrainte de noms autorisés]\n${nameWhitelist.join('; ')}`
      : '';
    
    const clinicalEntitiesConstraint = options?.clinicalEntities 
      ? `\n\n[Entités cliniques extraites]\n${JSON.stringify(options.clinicalEntities, null, 2)}`
      : '';
    
    const userMessage = extra 
      ? `${input}\n\n[Extra Context]\n${extra}${nameConstraint}${clinicalEntitiesConstraint}` 
      : `${input}${nameConstraint}${clinicalEntitiesConstraint}`;

    // 4. Call OpenAI with optimal prompt
    let formatted = await callOpenAI(systemPrompt, userMessage, goldenExample, guardrails, nameWhitelist);

    // 5. Post-format repair pipeline
    formatted = keepRadiologyImpressionOnly(formatted);
    formatted = thinQuotes(formatted, { maxTotal: 5, maxPerParagraph: 1 });
    formatted = ensureParagraphFormatting(formatted);
    formatted = stripInventedFirstNames(formatted, nameWhitelist);

    // 6. Enhanced validation
    const validation = await validateOutput(section, outputLanguage, formatted, input, guardrails, nameWhitelist);

    return {
      formatted,
      issues: validation.issues,
      confidence_score: validation.confidence_score
    };

  } catch (error) {
    console.error('Error in formatWithGuardrails:', error);
    return {
      formatted: input,
      issues: [`Formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      confidence_score: 0
    };
  }
}
```

#### **3.3 Enhanced Mode 2 Formatting Endpoint**
```typescript
// backend/src/index.ts - Mode 2 Formatting Endpoint
app.post('/api/format/mode2', async (req, res) => {
  try {
    const { 
      transcript, 
      section, 
      inputLanguage,    // NEW: Separate input language
      outputLanguage,   // NEW: Separate output language
      case_id, 
      selected_sections, 
      extra_dictation,
      templateCombo,
      verbatimSupport,
      voiceCommandsSupport
    } = req.body;
    
    // Validation
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ 
        error: 'Transcript is required and must be a string' 
      });
    }

    if (!section || !['7', '8', '11'].includes(section)) {
      return res.status(400).json({ 
        error: 'Section must be "7", "8", or "11"' 
      });
    }

    if (!inputLanguage || !['fr', 'en'].includes(inputLanguage)) {
      return res.status(400).json({ 
        error: 'Input language must be either "fr" or "en"' 
      });
    }

    if (!outputLanguage || !['fr', 'en'].includes(outputLanguage)) {
      return res.status(400).json({ 
        error: 'Output language must be either "fr" or "en"' 
      });
    }

    // Initialize Mode 2 formatter
    const formatter = new Mode2Formatter();
    
    // Format the transcript with AI using new language parameters
    const result = await formatter.format(transcript, {
      inputLanguage: inputLanguage as 'fr' | 'en',
      outputLanguage: outputLanguage as 'fr' | 'en',
      section: section as '7' | '8' | '11',
      case_id,
      selected_sections,
      extra_dictation,
      templateCombo,
      verbatimSupport,
      voiceCommandsSupport
    });

    // Run shadow mode comparison if enabled (development only)
    const shadowResult = await ShadowModeHook.runShadowComparison({
      transcript,
      section: section as '7' | '8' | '11',
      inputLanguage: inputLanguage as 'fr' | 'en',
      outputLanguage: outputLanguage as 'fr' | 'en',
      templateId: case_id
    });

    // Return the formatted result
    return res.json({
      formatted: result.formatted,
      issues: result.issues,
      sources_used: result.sources_used,
      confidence_score: result.confidence_score,
      clinical_entities: result.clinical_entities,
      success: true,
      shadowComparison: shadowResult // Only in development
    });

  } catch (error) {
    console.error('Mode 2 formatting error:', error);
    return res.status(500).json({ 
      error: 'Failed to format transcript',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

#### **3.4 Enhanced Mode2Formatter**
```typescript
// backend/src/services/formatter/mode2.ts
export interface Mode2FormattingOptions {
  inputLanguage: 'fr' | 'en';   // NEW: Separate input language
  outputLanguage: 'fr' | 'en';  // NEW: Separate output language
  section: '7' | '8' | '11';
  case_id?: string;
  selected_sections?: number[];
  extra_dictation?: string;
  templateCombo?: string;
  verbatimSupport?: boolean;
  voiceCommandsSupport?: boolean;
}

export class Mode2Formatter {
  private layerManager: LayerManager;
  private universalCleanupLayer: UniversalCleanupLayer;
  private templatePipeline: TemplatePipeline;

  constructor() {
    this.layerManager = new LayerManager();
    this.universalCleanupLayer = new UniversalCleanupLayer();
    this.templatePipeline = new TemplatePipeline();
  }

  async format(
    transcript: string, 
    options: Mode2FormattingOptions
  ): Promise<Mode2FormattingResult> {
    const { inputLanguage, outputLanguage, section } = options;
    
    // Always use Universal Cleanup path for consistency
    const cleanupResult = await this.universalCleanupLayer.process(transcript, {
      language: inputLanguage,
      source: 'ambient'
    });
    
    const cleanedData = cleanupResult.data?.cleaned_text || transcript;
    
    // Process with TemplatePipeline using both input and output languages
    const templateResult = await this.templatePipeline.process(cleanedData, {
      section,
      inputLanguage,
      outputLanguage,
      templateId: options.templateCombo || `section${section}-ai-formatter`
    });
    
    return {
      formatted: templateResult.formatted,
      issues: templateResult.issues || [],
      sources_used: ['universal-cleanup', 'template-pipeline'],
      confidence_score: templateResult.confidence_score || 0.8,
      clinical_entities: templateResult.clinical_entities
    };
  }
}
```

### **Step 4: Template Pipeline Enhancement**

#### **4.1 Enhanced TemplatePipeline**
```typescript
// backend/src/services/formatter/TemplatePipeline.ts
export interface TemplatePipelineOptions {
  section: string;
  inputLanguage: 'fr' | 'en';
  outputLanguage: 'fr' | 'en';  // NEW: Output language
  templateId: string;
}

export class TemplatePipeline {
  async process(
    input: string, 
    options: TemplatePipelineOptions
  ): Promise<TemplatePipelineResult> {
    const { section, inputLanguage, outputLanguage, templateId } = options;
    
    // 1. Extract clinical entities first
    const entities = await extractClinicalEntitiesFromTranscript(input, section as '7'|'8'|'11');
    
    // 2. Build optimal system prompt
    const systemPrompt = await buildOptimalSystemPrompt({
      inputLanguage,
      outputLanguage,
      section,
      cnesstDefaultOutput: process.env.CNESST_SECTIONS_DEFAULT_OUTPUT as 'en' | 'fr' || 'fr'
    });
    
    // 3. Apply template formatting
    const formatted = await this.applyTemplate(input, {
      templateId,
      section,
      inputLanguage,
      outputLanguage,
      entities,
      systemPrompt
    });
    
    // 4. Validate output
    const validation = await this.validateOutput(formatted, section, outputLanguage);
    
    return {
      formatted: formatted.text,
      issues: [...(formatted.issues || []), ...validation.issues],
      confidence_score: validation.confidence_score,
      clinical_entities: entities
    };
  }

  private async applyTemplate(
    input: string, 
    opts: {
      templateId: string;
      section: string;
      inputLanguage: 'fr' | 'en';
      outputLanguage: 'fr' | 'en';
      entities?: any;
      systemPrompt: string;
    }
  ): Promise<{ text: string; issues?: string[] }> {
    // Use the optimal system prompt for formatting
    const result = await this.templates[opts.templateId].render(input, {
      ...opts,
      systemPrompt: opts.systemPrompt
    });

    // Enforce mandatory headers for Section 8 (French output)
    if (opts.section === '8' && opts.outputLanguage === 'fr') {
      const mustHave = [
        'Appréciation subjective de l\'évolution :',
        'Plaintes et problèmes :',
        'Impact fonctionnel :',
        'Observations neurologiques :',
        'Autres observations :',
        'Exclusions / mentions négatives :',
        'Références externes :'
      ];
      const missing = mustHave.filter(h => !result.text.includes(h));
      if (missing.length) {
        result.issues = [...(result.issues ?? []), `Headers manquants (Section 8): ${missing.join(', ')}`];
      }
    }

    return result;
  }
}
```

### **Step 5: Frontend API Integration**

#### **5.1 Enhanced API Service**
```typescript
// frontend/src/services/formattingService.ts
export async function formatSection(payload: {
  transcript: string;
  section: '7'|'8'|'11';
  inputLanguage: 'en'|'fr';
  outputLanguage: 'en'|'fr';  // NEW: Output language
  templateId: string;
}): Promise<FormattingResponse> {
  const body = JSON.stringify({
    ...payload,
    // Ensure CNESST sections default to French if not specified
    outputLanguage: payload.outputLanguage || 
      (['7', '8', '11'].includes(payload.section) ? 'fr' : 'en')
  });
  
  const response = await fetch(`${API_BASE}/format/mode2`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    },
    credentials: 'include',
    body
  });
  
  if (!response.ok) {
    throw new Error(`Formatting failed: ${response.status}`);
  }
  
  return response.json();
}
```

#### **5.2 Updated Transcription Interface Integration**
```typescript
// frontend/src/components/transcription/TranscriptionInterface.tsx
const handleUniversalCleanupFormatting = useCallback(async (
  rawTranscript: string,
  template: TemplateJSON
): Promise<UniversalCleanupResponse> => {
  setFormattingProgress('Cleaning transcript...');
  
  // Determine section from template metadata
  let section = '7'; // Default fallback
  if (template.meta?.templateConfig?.compatibleSections?.[0]) {
    section = template.meta.templateConfig.compatibleSections[0].replace('section_', '');
  } else if (template.id?.includes('section-8')) {
    section = '8';
  } else if (template.id?.includes('section-11')) {
    section = '11';
  }
  
  console.log(`[Universal Cleanup] Using section: ${section} for template: ${template.id}`);
  console.log(`[Universal Cleanup] Input language: ${inputLanguage}, Output language: ${outputLanguage}`);
  
  const response = await api('/api/format/mode2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    },
    credentials: 'include',
    body: JSON.stringify({
      transcript: rawTranscript,
      section: section,
      inputLanguage: inputLanguage,    // NEW: Separate input language
      outputLanguage: outputLanguage,  // NEW: Separate output language
      templateId: template.id
    })
  });
  
  if (!response.ok) {
    throw new Error(`Universal Cleanup failed: ${response.status}`);
  }
  
  const result: UniversalCleanupResponse = await response.json();
  
  setFormattingProgress('Formatting...');
  
  // Store clinical entities for reuse
  if (result.clinical_entities) {
    console.log('Clinical entities extracted via Universal Cleanup:', result.clinical_entities);
    setClinicalEntities(result.clinical_entities);
  }
  
  return result;
}, [inputLanguage, outputLanguage]); // NEW: Dependencies on both languages
```

---

## 🧪 Testing Strategy

### 1. Language Combination Testing
```typescript
// Test all input/output language combinations
const testCases = [
  { input: 'en', output: 'fr', section: '8', expected: 'French CNESST output' },
  { input: 'fr', output: 'fr', section: '8', expected: 'French CNESST output' },
  { input: 'en', output: 'en', section: '8', expected: 'English output' },
  { input: 'fr', output: 'en', section: '8', expected: 'English output' },
  { input: 'en', output: 'fr', section: '7', expected: 'French CNESST output' },
  { input: 'fr', output: 'fr', section: '7', expected: 'French CNESST output' },
  { input: 'en', output: 'en', section: '7', expected: 'English output' },
  { input: 'fr', output: 'en', section: '7', expected: 'English output' }
];

// Validate:
// 1. Clinical entity extraction consistency
// 2. Medical terminology correctness
// 3. Language-specific compliance
// 4. Header inclusion (Section 8 French)
// 5. Processing time consistency
```

### 2. Quality Validation
```typescript
// Compare quality between approaches
const qualityTests = [
  {
    name: 'English Input → French Output (New)',
    input: englishTranscript,
    inputLang: 'en',
    outputLang: 'fr',
    expected: 'High quality French CNESST output'
  },
  {
    name: 'English Input → French Output (Legacy)',
    input: englishTranscript,
    inputLang: 'en',
    outputLang: 'fr',
    legacy: true,
    expected: 'High quality French CNESST output'
  }
];

// Measure:
// 1. Clinical entity extraction accuracy
// 2. Medical terminology correctness
// 3. CNESST compliance
// 4. Header inclusion
// 5. Processing time
```

---

## 🎯 Success Metrics

### Consistency Metrics
- **Processing Time Variance**: < 2s between runs
- **Clinical Entity Match Rate**: 100% for required entities
- **Header Inclusion Rate**: 100% for Section 8 French output
- **Language Output Accuracy**: 100% correct output language

### Quality Metrics
- **Hallucination Rate**: 0% (no invented content)
- **Transcription Fidelity**: > 95% (faithful to original)
- **Clinical Accuracy**: > 90% (medically accurate terminology)
- **CNESST Compliance**: 100% (follows Quebec standards when French output)

### User Experience Metrics
- **Output Language Control**: 100% user satisfaction
- **Quality Maintenance**: No degradation from current levels
- **Processing Time**: < 5s (95th percentile)
- **Error Rate**: < 1% (successful processing)

---

## 🚀 Implementation Phases

### **Phase 1: Core Infrastructure (Week 1)**
- [ ] Environment flags and configuration
- [ ] Enhanced language utilities
- [ ] Single processing path enforcement
- [ ] Shadow mode production protection

### **Phase 2: Frontend Enhancement (Week 2)**
- [ ] Enhanced language selector component
- [ ] Updated UI store with output language
- [ ] Updated transcription interface
- [ ] API service integration

### **Phase 3: Backend Processing (Week 3)**
- [ ] Enhanced formatWithGuardrails function
- [ ] Updated Mode2Formatter
- [ ] Enhanced TemplatePipeline
- [ ] Mode 2 endpoint updates

### **Phase 4: Testing & Validation (Week 4)**
- [ ] Language combination testing
- [ ] Quality validation
- [ ] Performance testing
- [ ] User acceptance testing

---

## 💡 GPT Brainstorming Areas

### Key Questions to Explore
1. **Prompt Engineering**: How can we optimize prompts for different input/output language combinations?
2. **Quality Assurance**: What automated tests can ensure consistent quality across all language combinations?
3. **Performance Optimization**: How can we reduce processing time while maintaining quality?
4. **User Experience**: What UI/UX improvements can make language selection more intuitive?
5. **CNESST Compliance**: How can we ensure 100% compliance while allowing flexibility?

### Areas for Innovation
1. **Smart Language Detection**: Automatic input language detection with user override
2. **Quality Prediction**: Predict output quality based on input language and content
3. **Adaptive Prompts**: Dynamically adjust prompts based on content complexity
4. **Real-time Validation**: Validate output quality in real-time during processing
5. **User Preferences**: Learn and remember user language preferences

### Implementation Priorities
1. **Immediate**: Fix dual processing paths and implement output language option
2. **Short-term**: Optimize prompts for all language combinations
3. **Medium-term**: Add quality prediction and adaptive prompts
4. **Long-term**: Implement smart language detection and user preference learning

---

## 📚 References

### Code Files Analyzed
- `frontend/src/components/transcription/LanguageSelector.tsx` - Current input-only language selector
- `frontend/src/components/transcription/TranscriptionInterface.tsx` - Main transcription interface
- `frontend/src/stores/uiStore.ts` - UI state management
- `frontend/src/pages/SettingsPage.tsx` - Settings page with language options
- `backend/src/index.ts` - Mode 2 formatting endpoint
- `backend/src/services/formatter/shared.ts` - formatWithGuardrails function
- `backend/src/services/formatter/mode2.ts` - Mode2Formatter implementation
- `backend/src/services/layers/UniversalCleanupLayer.ts` - Universal cleanup layer

### Documentation References
- `docs/impl/universal-cleanup-s7-s8.md` - Universal cleanup implementation plan
- `docs/dev/shadow-mode.md` - Shadow mode documentation
- `TEMPLATE_SECTION_8_CNESST.md` - Section 8 template requirements
- `CLINICAL_EXTRACTION_LAYER_STRATEGY.md` - Clinical extraction strategy

---

**Next Steps**: Use this comprehensive audit and implementation plan to brainstorm with GPT on specific prompt engineering strategies, quality assurance approaches, and user experience improvements for the output language option implementation.