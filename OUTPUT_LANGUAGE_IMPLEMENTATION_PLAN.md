# Output Language Selection Implementation Plan

**Date**: 2025-01-11  
**Status**: Ready for Implementation  
**Scope**: End-to-end output language selection for CNESST templates

---

## 🎯 **Implementation Overview**

This plan implements a two-pass pipeline (Extract → Format) with complete input/output language control, eliminating the current dual-path inconsistency in Section 8 processing.

### **Key Goals**
- ✅ Add `outputLanguage` (en|fr) end-to-end
- ✅ Keep French default for CNESST (7/8/11), allow English when policy permits
- ✅ Single universal path (no legacy fallback)
- ✅ Two-pass pipeline: Extract (INPUT) → Format (OUTPUT)
- ✅ Header enforcement for S8 in both FR & EN
- ✅ Deterministic caching & observability

---

## 📋 **Implementation Phases**

### **Phase 1: Foundation Setup** (30-45 minutes)
**Goal**: Set up configuration, flags, and basic infrastructure

#### **Step 1.1: Environment Configuration**
**Files**: `backend/.env.example`, `backend/src/config/flags.ts`

```bash
# Add to backend/.env.example
ENABLE_OUTPUT_LANGUAGE_SELECTION=true
CNESST_SECTIONS_DEFAULT_OUTPUT=fr
ALLOW_NON_FRENCH_OUTPUT=false
UNIVERSAL_CLEANUP_ENABLED=true
UNIVERSAL_CLEANUP_SHADOW=false
SLO_P95_MS=5000
SLO_P99_MS=8000
CACHE_TTL_SECONDS=604800
```

**Tasks**:
- [ ] Add new environment variables to `.env.example`
- [ ] Update `backend/src/config/flags.ts` to read new flags
- [ ] Add validation for flag combinations
- [ ] Test flag loading with `console.log` in startup

**Validation**:
```bash
# Test flag loading
cd backend && node -e "require('./src/config/flags.ts'); console.log('Flags loaded successfully')"
```

#### **Step 1.2: Debug Configuration Route**
**Files**: `backend/src/index.ts`

```typescript
// Add debug route for staging
app.get('/api/config', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    res.json({
      ENABLE_OUTPUT_LANGUAGE_SELECTION: process.env.ENABLE_OUTPUT_LANGUAGE_SELECTION,
      CNESST_SECTIONS_DEFAULT_OUTPUT: process.env.CNESST_SECTIONS_DEFAULT_OUTPUT,
      ALLOW_NON_FRENCH_OUTPUT: process.env.ALLOW_NON_FRENCH_OUTPUT,
      UNIVERSAL_CLEANUP_ENABLED: process.env.UNIVERSAL_CLEANUP_ENABLED,
      UNIVERSAL_CLEANUP_SHADOW: process.env.UNIVERSAL_CLEANUP_SHADOW
    });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});
```

**Tasks**:
- [ ] Add `/api/config` debug route
- [ ] Test route in staging environment
- [ ] Verify all flags are exposed correctly

**Validation**:
```bash
# Test debug route
curl http://localhost:3001/api/config
```

---

### **Phase 2: Backend API Contract** (45-60 minutes)
**Goal**: Update API endpoints to accept both input and output languages

#### **Step 2.1: Update Mode 2 Endpoint**
**Files**: `backend/src/index.ts`

```typescript
// Update /api/format/mode2 endpoint
app.post('/api/format/mode2', async (req, res) => {
  const { 
    transcript, 
    section, 
    inputLanguage, 
    outputLanguage, 
    templateId 
  } = req.body;

  // Policy gate for CNESST sections
  if (['7','8','11'].includes(section) && 
      outputLanguage !== 'fr' && 
      process.env.ALLOW_NON_FRENCH_OUTPUT !== 'true') {
    return res.status(400).json({ 
      error: 'CNESST sections must output French when ALLOW_NON_FRENCH_OUTPUT is false' 
    });
  }

  // Default outputLanguage for CNESST sections
  const finalOutputLanguage = outputLanguage || 
    (['7','8','11'].includes(section) ? process.env.CNESST_SECTIONS_DEFAULT_OUTPUT : 'fr');

  // Continue with existing logic...
});
```

**Tasks**:
- [ ] Update `/api/format/mode2` endpoint signature
- [ ] Add policy gate for CNESST sections
- [ ] Add default outputLanguage logic
- [ ] Update error responses
- [ ] Test with curl commands

**Validation**:
```bash
# Test policy gate
curl -X POST http://localhost:3001/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{"transcript":"test","section":"8","inputLanguage":"en","outputLanguage":"en"}'

# Should return 400 error when ALLOW_NON_FRENCH_OUTPUT=false
```

#### **Step 2.2: Update Other Endpoints**
**Files**: `backend/src/index.ts`

**Tasks**:
- [ ] Update `/api/templates/format` endpoint
- [ ] Update `/api/format/mode1` endpoint  
- [ ] Update `/api/format-history-evolution` endpoint
- [ ] Add outputLanguage parameter to all formatting endpoints
- [ ] Test all endpoints with new parameters

---

### **Phase 3: Prompt Selection Modules** (60-90 minutes)
**Goal**: Create modular prompt selection system with template versioning

#### **Step 3.1: Create Language Utilities**
**Files**: `backend/src/services/formatter/langUtils.ts`

```typescript
import crypto from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Extractor (choose by INPUT language)
export function selectExtractorPrompts(section: '7'|'8'|'11', input: 'en'|'fr') {
  const sfx = input === 'en' ? '_en' : '';
  return {
    master: `section${section}_master${sfx}.md`,
    guardrails: `section${section}_master${sfx}.json`,
    golden: `section${section}_golden_example${sfx}.md`
  };
}

// Formatter (choose by OUTPUT language ONLY)
export function selectFormatterPrompts(section: '7'|'8'|'11', output: 'en'|'fr') {
  const sfx = output === 'en' ? '_en' : '';
  return {
    master: `section${section}_master${sfx}.md`,
    guardrails: `section${section}_master${sfx}.json`,
    golden: `section${section}_golden_example${sfx}.md`
  };
}

// Template versioning - derive from content hash
export async function getTemplateVersion(section: '7'|'8'|'11', output: 'en'|'fr'): Promise<string> {
  const prompts = selectFormatterPrompts(section, output);
  const promptPath = join(process.cwd(), 'backend', 'prompts');
  
  const masterContent = await readFile(join(promptPath, prompts.master), 'utf-8');
  const guardrailsContent = await readFile(join(promptPath, prompts.guardrails), 'utf-8');
  const goldenContent = await readFile(join(promptPath, prompts.golden), 'utf-8');
  
  const combinedContent = masterContent + guardrailsContent + goldenContent;
  return crypto.createHash('sha256').update(combinedContent).digest('hex').substring(0, 12);
}

export function buildLanguageContext(input: 'en'|'fr', output: 'en'|'fr', section: '7'|'8'|'11'): string {
  if (input === output) return '';
  
  // Load bilingual glossary
  const glossary = loadBilingualGlossary();
  
  if (input === 'en' && output === 'fr') {
    return `
## CONTEXTE D'ENTRÉE: Anglais
Le transcript ci-dessous est en anglais. Formatez-le selon les normes CNESST françaises pour la Section ${section}.

## INSTRUCTIONS DE TRADUCTION
- Traduisez le contenu anglais en français médical
- Maintenez la précision médicale pendant la traduction
- Utilisez la terminologie médicale française appropriée
- Préservez tous les détails cliniques et mesures
- Assurez-vous de la conformité CNESST en français
- Si une information manque, écrivez "Non rapporté"

## GLOSSAIRE BILINGUE (Anglais → Français)
${glossary.map(([en, fr]) => `- "${en}" → "${fr}"`).join('\n')}

---
`;
  }
  
  if (input === 'fr' && output === 'en') {
    return `
## INPUT CONTEXT: French
The transcript below is in French. Format it according to English medical standards for Section ${section}.

## TRANSLATION INSTRUCTIONS
- Translate French content to English medical terminology
- Maintain medical accuracy during translation
- Use appropriate English medical terminology
- Preserve all clinical details and measurements
- Ensure medical compliance in English
- If information is missing, write "Not reported"

## BILINGUAL GLOSSARY (French → English)
${glossary.map(([en, fr]) => `- "${fr}" → "${en}"`).join('\n')}

---
`;
  }
  
  return '';
}

// Load versioned bilingual glossary
function loadBilingualGlossary(): [string, string][] {
  // Load from versioned glossary file
  return [
    ["patient", "travailleur/travailleuse"],
    ["back pain", "douleur dorsale"],
    ["stabbing pain", "douleur lancinante"],
    ["burning pain", "douleur brûlante"],
    ["pressure pain", "douleur de pression"],
    ["night pain", "douleur nocturne"],
    ["morning stiffness", "raideur matinale"],
    ["lifting heavy objects", "soulèvement d'objets lourds"],
    ["going up and down hills", "monter et descendre des collines"],
    ["walking up and down steps", "monter et descendre des marches"],
    ["standing posture", "posture debout"],
    ["bending forward", "se pencher en avant"],
    ["painkillers", "analgésiques"],
    ["therapeutic plateau", "plateau thérapeutique"],
    ["functional impact", "impact fonctionnel"],
    ["neurological observations", "observations neurologiques"]
  ];
}
```

**Tasks**:
- [ ] Create `langUtils.ts` file
- [ ] Implement `selectExtractorPrompts()` function
- [ ] Implement `selectFormatterPrompts()` function (OUTPUT language ONLY)
- [ ] Implement `getTemplateVersion()` function with content hashing
- [ ] Implement `buildLanguageContext()` with bilingual glossary
- [ ] Create versioned bilingual glossary file
- [ ] Add unit tests for all functions
- [ ] Test prompt file selection logic
- [ ] Verify template versioning works correctly

**Validation**:
```typescript
// Test prompt selection
import { selectExtractorPrompts, selectFormatterPrompts, buildLanguageContext } from './langUtils';

console.log(selectExtractorPrompts('8', 'en')); // Should return _en files
console.log(selectFormatterPrompts('8', 'fr')); // Should return French files
console.log(buildLanguageContext('en', 'fr', '8')); // Should return translation context
```

#### **Step 3.2: Create Prompt Loader**
**Files**: `backend/src/services/formatter/promptLoader.ts`

```typescript
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function loadPromptFile(filename: string): Promise<string> {
  const promptPath = join(process.cwd(), 'backend', 'prompts', filename);
  return await readFile(promptPath, 'utf-8');
}

export async function loadGuardrailsFile(filename: string): Promise<any> {
  const guardrailsPath = join(process.cwd(), 'backend', 'prompts', filename);
  const content = await readFile(guardrailsPath, 'utf-8');
  return JSON.parse(content);
}

export async function loadGoldenExampleFile(filename: string): Promise<string> {
  const goldenPath = join(process.cwd(), 'backend', 'prompts', filename);
  return await readFile(goldenPath, 'utf-8');
}
```

**Tasks**:
- [ ] Create `promptLoader.ts` file
- [ ] Implement file loading functions
- [ ] Add error handling for missing files
- [ ] Test file loading with existing prompt files

---

### **Phase 4: Two-Pass Pipeline** (90-120 minutes)
**Goal**: Implement Extract → Format pipeline with ASR Quality Gate

#### **Step 4.0: ASR Quality Gate**
**Files**: `backend/src/services/formatter/ASRQualityGate.ts`

```typescript
export interface ASRQualityMetrics {
  avgConfidence: number;
  meanLogProb: number;
  lowConfidencePercent: number;
  languageMismatch: boolean;
  diarizationAnomalies: string[];
  transcriptLength: number;
  tokenCount: number;
}

export interface ASRQualityResult {
  status: 'PASS' | 'WARN' | 'FAIL';
  metrics: ASRQualityMetrics;
  issues: string[];
  recommendations: string[];
}

export async function assessASRQuality(
  transcript: string,
  expectedLanguage: 'en'|'fr',
  asrMetadata?: any
): Promise<ASRQualityResult> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Calculate basic metrics
  const metrics: ASRQualityMetrics = {
    avgConfidence: asrMetadata?.avgConfidence || 0.8,
    meanLogProb: asrMetadata?.meanLogProb || -0.5,
    lowConfidencePercent: asrMetadata?.lowConfidencePercent || 10,
    languageMismatch: false, // TODO: implement language detection
    diarizationAnomalies: asrMetadata?.diarizationAnomalies || [],
    transcriptLength: transcript.length,
    tokenCount: transcript.split(' ').length
  };
  
  // Quality thresholds
  if (metrics.avgConfidence < 0.7) {
    issues.push('Low average confidence score');
    recommendations.push('Consider re-recording or manual review');
  }
  
  if (metrics.lowConfidencePercent > 20) {
    issues.push('High percentage of low-confidence segments');
    recommendations.push('Review unclear segments manually');
  }
  
  if (metrics.transcriptLength < 50) {
    issues.push('Very short transcript');
    recommendations.push('Ensure complete dictation captured');
  }
  
  if (metrics.tokenCount > 2000) {
    issues.push('Very long transcript');
    recommendations.push('Consider splitting into multiple sections');
  }
  
  // Determine status
  let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
  if (issues.length > 2 || metrics.avgConfidence < 0.6) {
    status = 'FAIL';
  } else if (issues.length > 0) {
    status = 'WARN';
  }
  
  return { status, metrics, issues, recommendations };
}
```

#### **Step 4.1: Create Extractor Service**
**Files**: `backend/src/services/formatter/Extractor.ts`

```typescript
import { selectExtractorPrompts } from './langUtils';
import { loadPromptFile, loadGuardrailsFile } from './promptLoader';

export interface ClinicalEntities {
  injury_location?: { value: string | null; provenance?: string } | null;
  injury_type?: { value: string | null; provenance?: string } | null;
  onset?: { value: string | null; provenance?: string } | null;
  pain_severity?: { value: number | null; scale: string; provenance?: string } | null;
  functional_limitations?: { value: string | null; provenance?: string } | null;
  previous_injuries?: { value: string | null; provenance?: string } | null;
  treatment_to_date?: { value: string | null; provenance?: string } | null;
  imaging_done?: { value: string | null; provenance?: string } | null;
  return_to_work?: { value: string | null; provenance?: string } | null;
  language?: { value: string | null; provenance?: string } | null;
  issues?: { value: string | null; provenance?: string } | null;
  _provenance: Record<string, {start: number; end: number; text: string}[]>;
}

export async function extractClinicalEntities(
  transcript: string,
  section: '7'|'8'|'11',
  inputLanguage: 'en'|'fr'
): Promise<ClinicalEntities> {
  const prompts = selectExtractorPrompts(section, inputLanguage);
  
  const systemPrompt = await loadPromptFile(prompts.master);
  const guardrails = await loadGuardrailsFile(prompts.guardrails);
  
  // Enhanced system prompt with no-new-facts enforcement
  const enhancedPrompt = systemPrompt + `

## RÈGLES STRICTES D'EXTRACTION
- Si une information manque, écrivez "Non rapporté" / "Not reported"
- Ne jamais inventer de détails non mentionnés
- Inclure la provenance pour chaque champ non-null
- Utiliser un schéma canonique avec types stricts
- Temperature: 0-0.2 pour la cohérence

## SCHÉMA DE SORTIE OBLIGATOIRE
{
  "injury_location": {"value": "string|null", "provenance": "string"},
  "injury_type": {"value": "string|null", "provenance": "string"},
  "onset": {"value": "string|null", "provenance": "string"},
  "pain_severity": {"value": "number|null", "scale": "0-10", "provenance": "string"},
  "functional_limitations": {"value": "string|null", "provenance": "string"},
  "previous_injuries": {"value": "string|null", "provenance": "string"},
  "treatment_to_date": {"value": "string|null", "provenance": "string"},
  "imaging_done": {"value": "string|null", "provenance": "string"},
  "return_to_work": {"value": "string|null", "provenance": "string"},
  "language": {"value": "string|null", "provenance": "string"},
  "issues": {"value": "string|null", "provenance": "string"},
  "_provenance": {"field_name": [{"start": number, "end": number, "text": "string"}]}
}`;
  
  // Use OpenAI to extract clinical entities
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: enhancedPrompt },
      { role: "user", content: transcript }
    ],
    temperature: 0.1,
    max_tokens: 1000
  });
  
  // Parse and validate JSON response
  const extracted = JSON.parse(completion.choices[0].message.content || '{}');
  
  // Validate schema and enforce no-new-facts
  return validateAndNormalizeEntities(extracted);
}

function validateAndNormalizeEntities(extracted: any): ClinicalEntities {
  const normalized: ClinicalEntities = {
    _provenance: extracted._provenance || {}
  };
  
  // Normalize each field with strict typing
  const fields = [
    'injury_location', 'injury_type', 'onset', 'functional_limitations',
    'previous_injuries', 'treatment_to_date', 'imaging_done', 'return_to_work',
    'language', 'issues'
  ];
  
  fields.forEach(field => {
    if (extracted[field] && typeof extracted[field] === 'object') {
      normalized[field] = {
        value: extracted[field].value || null,
        provenance: extracted[field].provenance || null
      };
    } else {
      normalized[field] = { value: null, provenance: null };
    }
  });
  
  // Special handling for pain_severity with scale
  if (extracted.pain_severity && typeof extracted.pain_severity === 'object') {
    normalized.pain_severity = {
      value: typeof extracted.pain_severity.value === 'number' ? extracted.pain_severity.value : null,
      scale: extracted.pain_severity.scale || '0-10',
      provenance: extracted.pain_severity.provenance || null
    };
  } else {
    normalized.pain_severity = { value: null, scale: '0-10', provenance: null };
  }
  
  return normalized;
}
```

**Tasks**:
- [ ] Create `ASRQualityGate.ts` file
- [ ] Implement `assessASRQuality()` function
- [ ] Create `Extractor.ts` file
- [ ] Implement `extractClinicalEntities()` with strict schema
- [ ] Add ClinicalEntities interface with typed fields
- [ ] Add `validateAndNormalizeEntities()` function
- [ ] Add no-new-facts enforcement in prompts
- [ ] Test extraction with sample transcripts
- [ ] Test ASR quality gate with various scenarios

#### **Step 4.2: Update TemplatePipeline**
**Files**: `backend/src/services/formatter/TemplatePipeline.ts`

```typescript
import { selectFormatterPrompts, buildLanguageContext } from './langUtils';
import { loadPromptFile, loadGuardrailsFile } from './promptLoader';
import { extractClinicalEntities, ClinicalEntities } from './Extractor';

export interface TemplatePipelineOptions {
  language: 'fr' | 'en';
  inputLanguage: 'fr' | 'en';
  outputLanguage: 'fr' | 'en';
  templateId?: string;
}

export async function processWithTwoPassPipeline(
  transcript: string,
  section: '7'|'8'|'11',
  options: TemplatePipelineOptions
): Promise<TemplatePipelineResult> {
  // Pass 1: Extract clinical entities (INPUT language optimized)
  const clinicalEntities = await extractClinicalEntities(
    transcript, 
    section, 
    options.inputLanguage
  );
  
  // Pass 2: Format with clinical entities (OUTPUT language optimized)
  const formatterPrompts = selectFormatterPrompts(section, options.outputLanguage);
  
  let systemPrompt = await loadPromptFile(formatterPrompts.master);
  
  // Add language context if input ≠ output
  if (options.inputLanguage !== options.outputLanguage) {
    const context = buildLanguageContext(options.inputLanguage, options.outputLanguage, section);
    systemPrompt = context + systemPrompt;
  }
  
  const guardrails = await loadGuardrailsFile(formatterPrompts.guardrails);
  
  // Format with clinical entities
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${transcript}\n\nClinical Entities: ${JSON.stringify(clinicalEntities)}` }
    ],
    temperature: 0.2,
    max_tokens: 2000
  });
  
  const formatted = completion.choices[0].message.content || transcript;
  
  return {
    formatted,
    issues: [],
    confidence_score: 0.8,
    clinical_entities: clinicalEntities
  };
}
```

**Tasks**:
- [ ] Update `TemplatePipeline.ts` with two-pass logic
- [ ] Add new interface for pipeline options
- [ ] Implement `processWithTwoPassPipeline()` function
- [ ] Update existing `processSection8()` and `processSection7()` methods
- [ ] Test two-pass pipeline with all language combinations

#### **Step 4.3: Update shared.ts**
**Files**: `backend/src/services/formatter/shared.ts`

```typescript
import { processWithTwoPassPipeline } from './TemplatePipeline';

export async function formatWithGuardrails(
  section: '7' | '8' | '11',
  inputLanguage: 'fr' | 'en',
  outputLanguage: 'fr' | 'en',
  input: string,
  extra?: string,
  options?: { nameWhitelist?: string[], clinicalEntities?: any }
): Promise<FormattingResult> {
  try {
    // Use two-pass pipeline
    const result = await processWithTwoPassPipeline(input, section, {
      language: inputLanguage, // Keep for backward compatibility
      inputLanguage,
      outputLanguage,
      templateId: options?.templateId
    });
    
    // Apply post-processing
    const processed = await applyPostProcessing(result.formatted, section, outputLanguage);
    
    return {
      formatted: processed,
      issues: result.issues,
      confidence_score: result.confidence_score,
      clinical_entities: result.clinical_entities
    };
  } catch (error) {
    console.error('Error in formatWithGuardrails:', error);
    return {
      formatted: input,
      issues: [`Formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      confidence_score: 0.1,
      clinical_entities: null
    };
  }
}
```

**Tasks**:
- [ ] Update `formatWithGuardrails()` function signature
- [ ] Integrate two-pass pipeline
- [ ] Add post-processing logic
- [ ] Update error handling
- [ ] Test backward compatibility

---

### **Phase 5: Output Validation** (45-60 minutes)
**Goal**: Implement robust validation for headers and compliance

#### **Step 5.1: Create Validators**
**Files**: `backend/src/services/formatter/validators.ts`

```typescript
// Canonical header definitions with regex patterns
export const S8_FR_HEADERS = [
  { canonical: "Appréciation subjective de l'évolution", pattern: /appréciation\s+subjective\s+de\s+l'évolution/i },
  { canonical: "Plaintes et problèmes", pattern: /plaintes\s+et\s+problèmes/i },
  { canonical: "Impact fonctionnel", pattern: /impact\s+fonctionnel/i },
  { canonical: "Observations neurologiques", pattern: /observations?\s+neurologiques?/i },
  { canonical: "Autres observations", pattern: /autres\s+observations?/i },
  { canonical: "Exclusions / mentions négatives", pattern: /exclusions?\s*\/\s*mentions?\s+négatives?/i },
  { canonical: "Références externes", pattern: /références?\s+externes?/i }
];

export const S8_EN_HEADERS = [
  { canonical: "Subjective appraisal of progression", pattern: /subjective\s+appraisal\s+of\s+progression/i },
  { canonical: "Complaints and problems", pattern: /complaints?\s+and\s+problems?/i },
  { canonical: "Functional impact", pattern: /functional\s+impact/i },
  { canonical: "Neurological observations", pattern: /neurological\s+observations?/i },
  { canonical: "Other observations", pattern: /other\s+observations?/i },
  { canonical: "Exclusions / negative mentions", pattern: /exclusions?\s*\/\s*negative\s+mentions?/i },
  { canonical: "External references", pattern: /external\s+references?/i }
];

export const S7_FR_HEADERS = [
  { canonical: "7. Historique de faits et évolution", pattern: /7\.\s*historique\s+de\s+faits\s+et\s+évolution/i }
];

export const S7_EN_HEADERS = [
  { canonical: "7. History of Facts and Clinical Evolution", pattern: /7\.\s*history\s+of\s+facts\s+and\s+clinical\s+evolution/i }
];

// Normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Remove punctuation
    .replace(/\s+/g, ' ')      // Collapse spaces
    .trim();
}

// Normalize accents for French
function normalizeAccents(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
    .toLowerCase();
}

export function validateSection8Headers(
  formatted: string, 
  outputLanguage: 'en'|'fr'
): { valid: boolean; issues: string[]; foundHeaders: string[] } {
  const issues: string[] = [];
  const foundHeaders: string[] = [];
  const headers = outputLanguage === 'fr' ? S8_FR_HEADERS : S8_EN_HEADERS;
  
  for (const header of headers) {
    const normalizedFormatted = normalizeAccents(formatted);
    const normalizedHeader = normalizeAccents(header.canonical);
    
    if (header.pattern.test(normalizedFormatted) || normalizedFormatted.includes(normalizedHeader)) {
      foundHeaders.push(header.canonical);
    } else {
      issues.push(`Missing required header: ${header.canonical}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    foundHeaders
  };
}

export function validateSection7Headers(
  formatted: string, 
  outputLanguage: 'en'|'fr'
): { valid: boolean; issues: string[]; foundHeaders: string[] } {
  const issues: string[] = [];
  const foundHeaders: string[] = [];
  const headers = outputLanguage === 'fr' ? S7_FR_HEADERS : S7_EN_HEADERS;
  
  for (const header of headers) {
    const normalizedFormatted = normalizeAccents(formatted);
    const normalizedHeader = normalizeAccents(header.canonical);
    
    if (header.pattern.test(normalizedFormatted) || normalizedFormatted.includes(normalizedHeader)) {
      foundHeaders.push(header.canonical);
    } else {
      issues.push(`Missing required header: ${header.canonical}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    foundHeaders
  };
}

export function validateCNESSTCompliance(
  section: '7'|'8'|'11',
  outputLanguage: 'en'|'fr'
): { valid: boolean; issues: string[]; metadata: any } {
  const issues: string[] = [];
  const metadata: any = {};
  
  if (['7','8','11'].includes(section) && outputLanguage === 'en') {
    issues.push('Non-official translation — CNESST requires French');
    metadata.cnesstTranslated = true;
  } else {
    metadata.cnesstTranslated = false;
  }
  
  return {
    valid: issues.length === 0,
    issues,
    metadata
  };
}

// Locale-specific validation
export function lintLocale(
  formatted: string, 
  outputLanguage: 'en'|'fr'
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (outputLanguage === 'fr') {
    // French-Canadian specific rules
    if (!formatted.includes(' :') && formatted.includes(':')) {
      issues.push('Missing non-breaking space before colon in French');
    }
    if (!formatted.includes(' ;') && formatted.includes(';')) {
      issues.push('Missing non-breaking space before semicolon in French');
    }
    if (!formatted.includes(' !') && formatted.includes('!')) {
      issues.push('Missing non-breaking space before exclamation in French');
    }
    if (!formatted.includes(' ?') && formatted.includes('?')) {
      issues.push('Missing non-breaking space before question mark in French');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}
```

**Tasks**:
- [ ] Create `validators.ts` file
- [ ] Define header constants with regex patterns for S7 and S8
- [ ] Implement `validateSection8Headers()` with robust matching
- [ ] Implement `validateSection7Headers()` with robust matching
- [ ] Implement `validateCNESSTCompliance()` with metadata
- [ ] Implement `lintLocale()` for locale-specific rules
- [ ] Add text normalization functions
- [ ] Add unit tests for all validators
- [ ] Test with various header formats and edge cases

#### **Step 5.2: Integrate Validation**
**Files**: `backend/src/services/formatter/TemplatePipeline.ts`

```typescript
import { validateSection8Headers, validateSection7Headers, validateCNESSTCompliance } from './validators';

export async function processWithTwoPassPipeline(
  transcript: string,
  section: '7'|'8'|'11',
  options: TemplatePipelineOptions
): Promise<TemplatePipelineResult> {
  // ... existing extraction and formatting logic ...
  
  // Validate output
  const issues: string[] = [];
  
  // Validate headers
  if (section === '8') {
    const headerValidation = validateSection8Headers(formatted, options.outputLanguage);
    issues.push(...headerValidation.issues);
  } else if (section === '7') {
    const headerValidation = validateSection7Headers(formatted, options.outputLanguage);
    issues.push(...headerValidation.issues);
  }
  
  // Validate CNESST compliance
  const complianceValidation = validateCNESSTCompliance(section, options.outputLanguage);
  issues.push(...complianceValidation.issues);
  
  return {
    formatted,
    issues,
    confidence_score: issues.length === 0 ? 0.8 : 0.6,
    clinical_entities: clinicalEntities
  };
}
```

**Tasks**:
- [ ] Integrate validation into pipeline
- [ ] Add validation results to issues array
- [ ] Adjust confidence score based on validation
- [ ] Test validation with various outputs

---

### **Phase 6: Mode2Formatter Integration** (60-90 minutes)
**Goal**: Update Mode2Formatter to use single path with caching

#### **Step 6.1: Update Mode2Formatter**
**Files**: `backend/src/services/formatter/mode2.ts`

```typescript
import { processWithTwoPassPipeline } from './TemplatePipeline';
import { createCacheKey } from './util/cache';

export class Mode2Formatter {
  private async formatSection8Enhanced(
    transcript: string,
    options: Mode2FormattingOptions
  ): Promise<Mode2FormattingResult> {
    const issues: string[] = [];
    
    try {
      // Always use Universal Cleanup (single path)
      const cacheKey = createCacheKey(
        '8',
        options.templateId || 'default',
        '1.0.0', // template version
        options.outputLanguage || 'fr',
        transcript
      );
      
      // Check cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        console.log('Cache hit for Section 8 formatting');
        return cached;
      }
      
      // Process with two-pass pipeline
      const result = await processWithTwoPassPipeline(transcript, '8', {
        language: options.language,
        inputLanguage: options.inputLanguage || options.language,
        outputLanguage: options.outputLanguage || 'fr',
        templateId: options.templateId
      });
      
      const formattingResult: Mode2FormattingResult = {
        formatted: result.formatted,
        issues: result.issues,
        sources_used: ['section8-ai-formatter'],
        confidence_score: result.confidence_score,
        clinical_entities: result.clinical_entities
      };
      
      // Cache result
      await this.cache.set(cacheKey, formattingResult);
      
      return formattingResult;
      
    } catch (error) {
      console.error('Error in Section 8 formatting:', error);
      return {
        formatted: transcript,
        issues: [...issues, `Formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        sources_used: ['section8-ai-formatter'],
        confidence_score: 0.1,
        clinical_entities: null
      };
    }
  }
}
```

**Tasks**:
- [ ] Update `formatSection8Enhanced()` method
- [ ] Remove legacy fallback logic
- [ ] Add caching with output language scope
- [ ] Update error handling
- [ ] Test single path processing

#### **Step 6.2: Update Cache Implementation**
**Files**: `backend/src/services/util/cache.ts`

```typescript
import crypto from 'crypto';

// Split cache keys for Extract vs Format
export function createExtractCacheKey(
  section: string,
  inputLanguage: string,
  transcript: string
): string {
  const transcriptHash = crypto.createHash('md5').update(transcript).digest('hex');
  return `extract:${section}:${inputLanguage}:${transcriptHash}`;
}

export function createFormatCacheKey(
  section: string,
  outputLanguage: string,
  templateVersion: string,
  transcript: string
): string {
  const transcriptHash = crypto.createHash('md5').update(transcript).digest('hex');
  return `format:${section}:${outputLanguage}:${templateVersion}:${transcriptHash}`;
}

export class SplitLRUCache {
  private extractCache = new Map<string, any>();
  private formatCache = new Map<string, any>();
  private maxSize = 1000;
  
  async getExtract(key: string): Promise<any> {
    if (this.extractCache.has(key)) {
      const value = this.extractCache.get(key);
      // Move to end (most recently used)
      this.extractCache.delete(key);
      this.extractCache.set(key, value);
      return value;
    }
    return null;
  }
  
  async setExtract(key: string, value: any): Promise<void> {
    if (this.extractCache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.extractCache.keys().next().value;
      this.extractCache.delete(firstKey);
    }
    this.extractCache.set(key, value);
  }
  
  async getFormat(key: string): Promise<any> {
    if (this.formatCache.has(key)) {
      const value = this.formatCache.get(key);
      // Move to end (most recently used)
      this.formatCache.delete(key);
      this.formatCache.set(key, value);
      return value;
    }
    return null;
  }
  
  async setFormat(key: string, value: any): Promise<void> {
    if (this.formatCache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.formatCache.keys().next().value;
      this.formatCache.delete(firstKey);
    }
    this.formatCache.set(key, value);
  }
  
  // Get cache statistics
  getStats() {
    return {
      extractCacheSize: this.extractCache.size,
      formatCacheSize: this.formatCache.size,
      totalSize: this.extractCache.size + this.formatCache.size
    };
  }
}
```

**Tasks**:
- [ ] Implement split cache system (Extract vs Format)
- [ ] Update cache key generation for both stages
- [ ] Implement LRU cache with size limits for both caches
- [ ] Add cache hit/miss logging with stage identification
- [ ] Add cache statistics tracking
- [ ] Test caching with different language combinations
- [ ] Verify extract cache reuse across multiple outputs

#### **Step 6.3: Update Shadow Mode**
**Files**: `backend/src/services/shadow/ShadowModeHook.ts`

```typescript
export class ShadowModeHook {
  static async runShadowComparison(
    transcript: string,
    section: string,
    inputLanguage: string,
    outputLanguage: string
  ): Promise<void> {
    // Only run in development/staging, never production
    if (process.env.NODE_ENV === 'production') {
      console.log('Shadow mode disabled in production');
      return;
    }
    
    if (process.env.UNIVERSAL_CLEANUP_SHADOW !== 'true') {
      return;
    }
    
    console.log('🔄 SHADOW MODE: Running both legacy and universal cleanup paths...');
    
    // Run legacy path (if still exists)
    // Run universal path
    // Compare results
    // Log differences
  }
}
```

**Tasks**:
- [ ] Update shadow mode to never run in production
- [ ] Add output language to shadow comparison
- [ ] Update logging and comparison logic
- [ ] Test shadow mode in development

---

### **Phase 7: Frontend Integration** (90-120 minutes)
**Goal**: Add output language selection to frontend

#### **Step 7.1: Update UI Store**
**Files**: `frontend/src/stores/uiStore.ts`

```typescript
interface UIState {
  sidebarCollapsed: boolean;
  inputLanguage: 'fr' | 'en';
  outputLanguage: 'fr' | 'en'; // Add this
  toasts: Toast[];
  // ... other state
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      inputLanguage: 'fr',
      outputLanguage: 'fr', // Default to French
      toasts: [],
      
      // Actions
      setInputLanguage: (lang) => set({ inputLanguage: lang }),
      setOutputLanguage: (lang) => set({ outputLanguage: lang }),
      
      // Smart defaults for CNESST sections
      setOutputLanguageForSection: (section: string, lang: 'fr' | 'en') => {
        if (['7', '8', '11'].includes(section)) {
          // Default to French for CNESST sections
          set({ outputLanguage: 'fr' });
        } else {
          set({ outputLanguage: lang });
        }
      }
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        inputLanguage: state.inputLanguage,
        outputLanguage: state.outputLanguage,
      }),
    }
  )
);
```

**Tasks**:
- [ ] Add `outputLanguage` to UI state
- [ ] Add `setOutputLanguage` action
- [ ] Add smart defaults for CNESST sections
- [ ] Update persistence to include output language
- [ ] Test state management

#### **Step 7.2: Update Language Selector**
**Files**: `frontend/src/components/transcription/LanguageSelector.tsx`

```typescript
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  inputLanguage,
  outputLanguage,
  onInputLanguageChange,
  onOutputLanguageChange,
  section,
  disabled = false
}) => {
  const isCNESSTSection = ['7', '8', '11'].includes(section);
  
  return (
    <div className="space-y-4">
      {/* Input Language Selector */}
      <div>
        <Label htmlFor="input-language">Input Language</Label>
        <Select
          value={inputLanguage}
          onValueChange={onInputLanguageChange}
          disabled={disabled}
          items={[
            { label: "English", value: "en" },
            { label: "Français", value: "fr" },
          ]}
          buttonClassName="w-full bg-white border border-gray-300 rounded-md text-left"
        />
      </div>
      
      {/* Output Language Selector */}
      <div>
        <Label htmlFor="output-language">Output Language</Label>
        <Select
          value={outputLanguage}
          onValueChange={onOutputLanguageChange}
          disabled={disabled}
          items={[
            { label: "English", value: "en" },
            { label: "Français", value: "fr" },
          ]}
          buttonClassName="w-full bg-white border border-gray-300 rounded-md text-left"
        />
        {isCNESSTSection && outputLanguage === 'en' && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Non-official translation — CNESST requires French
          </p>
        )}
        {isCNESSTSection && outputLanguage === 'fr' && (
          <p className="text-xs text-green-600 mt-1">
            ✅ CNESST compliant output
          </p>
        )}
      </div>
    </div>
  );
};
```

**Tasks**:
- [ ] Add output language selector
- [ ] Add CNESST compliance warnings
- [ ] Update component props and interface
- [ ] Add visual indicators for compliance
- [ ] Test component rendering

#### **Step 7.3: Update Transcription Interface**
**Files**: `frontend/src/components/transcription/TranscriptionInterface.tsx`

```typescript
export const TranscriptionInterface: React.FC<TranscriptionInterfaceProps> = ({
  sessionId,
  language = 'en'
}) => {
  const { inputLanguage, outputLanguage, setInputLanguage, setOutputLanguage } = useUIStore();
  
  // Convert UI store languages to API format
  const selectedInputLanguage = inputLanguage === 'fr' ? 'fr-CA' : 'en-US';
  
  const handleInputLanguageChange = (newLanguage: string) => {
    const uiLanguageFormat = newLanguage === 'fr-CA' ? 'fr' : 'en';
    setInputLanguage(uiLanguageFormat);
  };
  
  const handleOutputLanguageChange = (newLanguage: string) => {
    setOutputLanguage(newLanguage as 'fr' | 'en');
  };
  
  const handleUniversalCleanupFormatting = useCallback(async (
    rawTranscript: string,
    template: TemplateJSON
  ): Promise<UniversalCleanupResponse> => {
    setFormattingProgress('Cleaning transcript...');
    
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
        inputLanguage: inputLanguage,
        outputLanguage: outputLanguage,
        useUniversal: true,
        templateId: template.id
      })
    });
    
    // ... rest of the logic
  }, [inputLanguage, outputLanguage]);
  
  return (
    <div>
      {/* Language Selectors */}
      <LanguageSelector
        inputLanguage={inputLanguage}
        outputLanguage={outputLanguage}
        onInputLanguageChange={handleInputLanguageChange}
        onOutputLanguageChange={handleOutputLanguageChange}
        section={section}
        disabled={isProcessing}
      />
      
      {/* Rest of the interface */}
    </div>
  );
};
```

**Tasks**:
- [ ] Update component to use both input and output languages
- [ ] Update API calls to send both languages
- [ ] Add language change handlers
- [ ] Update formatting service calls
- [ ] Test end-to-end flow

#### **Step 7.4: Update Formatting Service**
**Files**: `frontend/src/services/formattingService.ts`

```typescript
export const formattingService = {
  async formatWithMode2(
    transcript: string,
    section: string,
    inputLanguage: string,
    outputLanguage: string,
    templateId?: string
  ): Promise<FormattingResult> {
    const response = await api('/api/format/mode2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      credentials: 'include',
      body: JSON.stringify({
        transcript,
        section,
        inputLanguage,
        outputLanguage,
        templateId,
        useUniversal: true
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Formatting failed');
    }
    
    return await response.json();
  }
};
```

**Tasks**:
- [ ] Update formatting service to accept both languages
- [ ] Update API calls to include output language
- [ ] Add error handling for policy violations
- [ ] Test service with all language combinations

---

### **Phase 8: Testing Matrix** (60-90 minutes)
**Goal**: Comprehensive testing of all language combinations and edge cases

#### **Step 8.1: Create Test Suite**
**Files**: `backend/tests/output-language.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { selectExtractorPrompts, selectFormatterPrompts, buildLanguageContext, getTemplateVersion } from '../src/services/formatter/langUtils';
import { extractClinicalEntities } from '../src/services/formatter/Extractor';
import { processWithTwoPassPipeline } from '../src/services/formatter/TemplatePipeline';
import { assessASRQuality } from '../src/services/formatter/ASRQualityGate';
import { validateSection8Headers, validateSection7Headers, lintLocale } from '../src/services/formatter/validators';

describe('Output Language Selection', () => {
  const testMatrix = [
    // Section 8 Tests
    { input: 'en', output: 'fr', section: '8' as const, expected: 'French CNESST with headers' },
    { input: 'fr', output: 'fr', section: '8' as const, expected: 'French CNESST with headers' },
    { input: 'en', output: 'en', section: '8' as const, expected: 'English output' },
    { input: 'fr', output: 'en', section: '8' as const, expected: 'English output' },
    
    // Section 7 Tests
    { input: 'en', output: 'fr', section: '7' as const, expected: 'French CNESST' },
    { input: 'fr', output: 'fr', section: '7' as const, expected: 'French CNESST' },
    { input: 'en', output: 'en', section: '7' as const, expected: 'English output' },
    { input: 'fr', output: 'en', section: '7' as const, expected: 'English output' }
  ];
  
  testMatrix.forEach(({ input, output, section, expected }) => {
    it(`should handle ${input} input → ${output} output for Section ${section}`, async () => {
      // Test prompt selection
      const extractorPrompts = selectExtractorPrompts(section, input);
      const formatterPrompts = selectFormatterPrompts(section, output);
      
      expect(extractorPrompts.master).toContain(input === 'en' ? '_en' : '');
      expect(formatterPrompts.master).toContain(output === 'en' ? '_en' : '');
      
      // Test template versioning
      const templateVersion = await getTemplateVersion(section, output);
      expect(templateVersion).toMatch(/^[a-f0-9]{12}$/);
      
      // Test context injection
      const context = buildLanguageContext(input, output, section);
      if (input !== output) {
        expect(context).toContain('CONTEXTE D\'ENTRÉE' || 'INPUT CONTEXT');
        expect(context).toContain('GLOSSAIRE BILINGUE' || 'BILINGUAL GLOSSARY');
      } else {
        expect(context).toBe('');
      }
      
      // Test clinical entity extraction with strict schema
      const sampleTranscript = "Patient reports back pain 6/10, difficulty lifting";
      const entities = await extractClinicalEntities(sampleTranscript, section, input);
      
      expect(entities).toHaveProperty('injury_location');
      expect(entities).toHaveProperty('pain_severity');
      expect(entities).toHaveProperty('_provenance');
      expect(Object.keys(entities)).toHaveLength(12); // 11 keys + _provenance
      
      // Validate entity schema
      if (entities.pain_severity?.value !== null) {
        expect(typeof entities.pain_severity.value).toBe('number');
        expect(entities.pain_severity.scale).toBe('0-10');
        expect(entities.pain_severity.provenance).toBeDefined();
      }
      
      // Test two-pass pipeline
      const result = await processWithTwoPassPipeline(sampleTranscript, section, {
        language: input,
        inputLanguage: input,
        outputLanguage: output
      });
      
      expect(result.formatted).toBeDefined();
      expect(result.clinical_entities).toBeDefined();
      expect(result.confidence_score).toBeGreaterThan(0);
      
      // Validate headers for Section 8
      if (section === '8') {
        const headerValidation = validateSection8Headers(result.formatted, output);
        expect(headerValidation.valid).toBe(true);
        expect(headerValidation.foundHeaders.length).toBeGreaterThan(0);
      }
      
      // Validate headers for Section 7
      if (section === '7') {
        const headerValidation = validateSection7Headers(result.formatted, output);
        expect(headerValidation.valid).toBe(true);
        expect(headerValidation.foundHeaders.length).toBeGreaterThan(0);
      }
      
      // Test locale validation
      const localeValidation = lintLocale(result.formatted, output);
      if (output === 'fr' && !localeValidation.valid) {
        console.warn('Locale validation issues:', localeValidation.issues);
      }
    });
  });
  
  it('should enforce CNESST policy', async () => {
    // Test that CNESST sections default to French
    const result = await processWithTwoPassPipeline(
      "Sample transcript",
      '8',
      { language: 'en', inputLanguage: 'en', outputLanguage: 'en' }
    );
    
    expect(result.issues).toContain('Non-official translation — CNESST requires French');
  });
  
  it('should cache results by output language', async () => {
    const transcript = "Sample transcript for caching test";
    
    // First call
    const result1 = await processWithTwoPassPipeline(transcript, '8', {
      language: 'en',
      inputLanguage: 'en',
      outputLanguage: 'fr'
    });
    
    // Second call (should hit cache)
    const result2 = await processWithTwoPassPipeline(transcript, '8', {
      language: 'en',
      inputLanguage: 'en',
      outputLanguage: 'fr'
    });
    
    expect(result1.formatted).toBe(result2.formatted);
    expect(result1.clinical_entities).toEqual(result2.clinical_entities);
  });
  
  it('should handle ASR quality gate', async () => {
    const goodTranscript = "Patient reports back pain 6/10, difficulty lifting heavy objects";
    const badTranscript = "uh um patient uh pain uh";
    
    const goodQuality = await assessASRQuality(goodTranscript, 'en');
    const badQuality = await assessASRQuality(badTranscript, 'en');
    
    expect(goodQuality.status).toBe('PASS');
    expect(badQuality.status).toBe('WARN');
    expect(badQuality.issues.length).toBeGreaterThan(0);
  });
  
  it('should handle code-switching transcripts', async () => {
    const franglaisTranscript = "Le patient reports back pain, il a de la difficulté avec lifting";
    
    const result = await processWithTwoPassPipeline(franglaisTranscript, '8', {
      language: 'fr',
      inputLanguage: 'fr',
      outputLanguage: 'fr'
    });
    
    expect(result.formatted).toBeDefined();
    expect(result.issues.length).toBeGreaterThanOrEqual(0);
  });
  
  it('should handle long transcripts', async () => {
    const longTranscript = "Patient reports ".repeat(1000) + "back pain 6/10";
    
    const result = await processWithTwoPassPipeline(longTranscript, '8', {
      language: 'en',
      inputLanguage: 'en',
      outputLanguage: 'fr'
    });
    
    expect(result.formatted).toBeDefined();
    expect(result.issues).toContain('Very long transcript');
  });
  
  it('should preserve numeric fidelity', async () => {
    const numericTranscript = "Pain 6/10, dose 500mg, date 2024-01-15";
    
    const entities = await extractClinicalEntities(numericTranscript, '8', 'en');
    
    expect(entities.pain_severity?.value).toBe(6);
    expect(entities.pain_severity?.scale).toBe('0-10');
  });
});
```

**Tasks**:
- [ ] Create comprehensive test suite with edge cases
- [ ] Test all language combinations
- [ ] Test prompt selection and template versioning
- [ ] Test clinical entity extraction with strict schema
- [ ] Test header validation with robust matching
- [ ] Test split caching behavior (extract vs format)
- [ ] Test policy enforcement and CNESST compliance
- [ ] Test ASR quality gate functionality
- [ ] Test code-switching and long transcripts
- [ ] Test numeric fidelity preservation
- [ ] Test locale validation rules

#### **Step 8.2: Frontend Testing**
**Files**: `frontend/src/tests/output-language.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from '../components/transcription/LanguageSelector';

describe('Language Selector', () => {
  it('should show CNESST compliance warnings', () => {
    render(
      <LanguageSelector
        inputLanguage="en"
        outputLanguage="en"
        onInputLanguageChange={() => {}}
        onOutputLanguageChange={() => {}}
        section="8"
      />
    );
    
    expect(screen.getByText('⚠️ Non-official translation — CNESST requires French')).toBeInTheDocument();
  });
  
  it('should show CNESST compliance confirmation', () => {
    render(
      <LanguageSelector
        inputLanguage="en"
        outputLanguage="fr"
        onInputLanguageChange={() => {}}
        onOutputLanguageChange={() => {}}
        section="8"
      />
    );
    
    expect(screen.getByText('✅ CNESST compliant output')).toBeInTheDocument();
  });
});
```

**Tasks**:
- [ ] Test language selector component
- [ ] Test CNESST compliance warnings
- [ ] Test state management
- [ ] Test API integration
- [ ] Test error handling

---

### **Phase 9: Observability & Monitoring** (30-45 minutes)
**Goal**: Add comprehensive metrics and monitoring

#### **Step 9.1: Add Quality Metrics**
**Files**: `backend/src/metrics/index.ts`

```typescript
import { performance } from 'perf_hooks';

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics = {
    formattingTime: [] as number[],
    cacheHits: { extract: 0, format: 0 },
    cacheMisses: { extract: 0, format: 0 },
    headerMissingRate: 0,
    entityNullRate: {} as Record<string, number>,
    provenanceMissingRate: 0,
    policyBlockRate: 0,
    langMismatchRate: 0,
    asrQualityFailures: 0,
    cnesstTranslatedCount: 0
  };
  
  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }
  
  recordFormattingTime(section: string, inputLanguage: string, outputLanguage: string, duration: number) {
    this.metrics.formattingTime.push(duration);
    console.log(`[METRICS] Formatting time: ${duration}ms for ${section} (${inputLanguage}→${outputLanguage})`);
    
    // Record p50/p95/p99 metrics
    if (duration > 5000) {
      console.warn(`[METRICS] SLO violation: ${duration}ms > 5000ms threshold`);
    }
  }
  
  recordCacheHit(stage: 'extract' | 'format', section: string, language: string) {
    this.metrics.cacheHits[stage]++;
    console.log(`[METRICS] Cache hit for ${stage} ${section} (${language})`);
  }
  
  recordCacheMiss(stage: 'extract' | 'format', section: string, language: string) {
    this.metrics.cacheMisses[stage]++;
    console.log(`[METRICS] Cache miss for ${stage} ${section} (${language})`);
  }
  
  recordHeaderMissing(section: string, outputLanguage: string) {
    this.metrics.headerMissingRate++;
    console.log(`[METRICS] Header missing for ${section} (${outputLanguage})`);
  }
  
  recordEntityNull(field: string) {
    this.metrics.entityNullRate[field] = (this.metrics.entityNullRate[field] || 0) + 1;
  }
  
  recordProvenanceMissing() {
    this.metrics.provenanceMissingRate++;
  }
  
  recordPolicyBlock(section: string, outputLanguage: string) {
    this.metrics.policyBlockRate++;
    console.log(`[METRICS] Policy block for ${section} (${outputLanguage})`);
  }
  
  recordLanguageMismatch() {
    this.metrics.langMismatchRate++;
  }
  
  recordASRQualityFailure() {
    this.metrics.asrQualityFailures++;
  }
  
  recordCNESSTTranslated() {
    this.metrics.cnesstTranslatedCount++;
  }
  
  recordFormattingError(section: string, inputLanguage: string, outputLanguage: string, error: string) {
    console.error(`[METRICS] Formatting error for ${section} (${inputLanguage}→${outputLanguage}): ${error}`);
  }
  
  getMetrics() {
    const totalRequests = this.metrics.formattingTime.length;
    const sortedTimes = [...this.metrics.formattingTime].sort((a, b) => a - b);
    
    return {
      performance: {
        p50: sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0,
        p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0,
        p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0,
        totalRequests
      },
      cache: {
        extractHitRate: this.metrics.cacheHits.extract / (this.metrics.cacheHits.extract + this.metrics.cacheMisses.extract) || 0,
        formatHitRate: this.metrics.cacheHits.format / (this.metrics.cacheHits.format + this.metrics.cacheMisses.format) || 0
      },
      quality: {
        headerMissingRate: this.metrics.headerMissingRate / totalRequests || 0,
        entityNullRate: this.metrics.entityNullRate,
        provenanceMissingRate: this.metrics.provenanceMissingRate / totalRequests || 0,
        policyBlockRate: this.metrics.policyBlockRate / totalRequests || 0,
        langMismatchRate: this.metrics.langMismatchRate / totalRequests || 0,
        asrQualityFailures: this.metrics.asrQualityFailures,
        cnesstTranslatedCount: this.metrics.cnesstTranslatedCount
      }
    };
  }
}
```

**Tasks**:
- [ ] Create comprehensive metrics collector
- [ ] Add performance metrics (p50/p95/p99)
- [ ] Add split cache metrics (extract vs format)
- [ ] Add quality metrics (headers, entities, provenance)
- [ ] Add policy and compliance metrics
- [ ] Add ASR quality failure tracking
- [ ] Add CNESST translation tracking
- [ ] Add SLO violation alerts
- [ ] Add metrics aggregation and reporting

#### **Step 9.2: Add Tracing**
**Files**: `backend/src/services/formatter/TemplatePipeline.ts`

```typescript
import { MetricsCollector } from '../../metrics';

export async function processWithTwoPassPipeline(
  transcript: string,
  section: '7'|'8'|'11',
  options: TemplatePipelineOptions
): Promise<TemplatePipelineResult> {
  const startTime = performance.now();
  const metrics = MetricsCollector.getInstance();
  
  try {
    console.log(`[TRACE] Starting two-pass pipeline for ${section} (${options.inputLanguage}→${options.outputLanguage})`);
    
    // Pass 1: Extract
    const extractStart = performance.now();
    const clinicalEntities = await extractClinicalEntities(transcript, section, options.inputLanguage);
    const extractDuration = performance.now() - extractStart;
    console.log(`[TRACE] Extract completed in ${extractDuration}ms`);
    
    // Pass 2: Format
    const formatStart = performance.now();
    const result = await formatWithClinicalEntities(transcript, section, options, clinicalEntities);
    const formatDuration = performance.now() - formatStart;
    console.log(`[TRACE] Format completed in ${formatDuration}ms`);
    
    const totalDuration = performance.now() - startTime;
    metrics.recordFormattingTime(section, options.inputLanguage, options.outputLanguage, totalDuration);
    
    return result;
    
  } catch (error) {
    const totalDuration = performance.now() - startTime;
    metrics.recordFormattingError(section, options.inputLanguage, options.outputLanguage, error.message);
    throw error;
  }
}
```

**Tasks**:
- [ ] Add tracing to pipeline
- [ ] Add timing measurements
- [ ] Add error tracking
- [ ] Add performance logging
- [ ] Test observability

---

### **Phase 10: Rollout & Deployment** (30-45 minutes)
**Goal**: Deploy with feature flags and rollback capability

#### **Step 10.1: Staging Deployment**
**Tasks**:
- [ ] Deploy to staging with `ENABLE_OUTPUT_LANGUAGE_SELECTION=true`
- [ ] Keep `ALLOW_NON_FRENCH_OUTPUT=false`
- [ ] Run full test matrix
- [ ] Verify all language combinations work
- [ ] Test policy enforcement
- [ ] Monitor performance metrics

#### **Step 10.2: Canary Deployment**
**Tasks**:
- [ ] Enable `ALLOW_NON_FRENCH_OUTPUT=true` for one clinic
- [ ] Monitor Section 8 English output quality
- [ ] Verify headers are present
- [ ] Check user feedback
- [ ] Monitor error rates

#### **Step 10.3: Production Deployment**
**Tasks**:
- [ ] Deploy with `ALLOW_NON_FRENCH_OUTPUT=false` by default
- [ ] Monitor all metrics and SLOs
- [ ] Enable per-clinic as needed
- [ ] Document rollout process
- [ ] Prepare rollback plan

#### **Step 10.4: Rollback Plan**
**Tasks**:
- [ ] Set `ENABLE_OUTPUT_LANGUAGE_SELECTION=false` to hide frontend selector
- [ ] Server defaults to French for CNESST sections
- [ ] Verify existing functionality works
- [ ] Document rollback procedure

---

## 🎯 **Acceptance Criteria Checklist**

### **Core Functionality**
- [ ] CNESST (7/8/11) defaults to French output
- [ ] English output only when `ALLOW_NON_FRENCH_OUTPUT=true`
- [ ] Section 8 headers present in both FR and EN (100%) with robust validation
- [ ] 11 clinical entities always returned with provenance spans and strict schema
- [ ] Single universal path (no legacy fallback)
- [ ] Split cache scoped by extract vs format stages
- [ ] Template versioning prevents stale cache hits

### **Quality Assurance**
- [ ] All language combinations tested and working
- [ ] Input-optimized extraction, output-optimized formatting
- [ ] Clinical entity extraction consistent across languages with typed fields
- [ ] Header validation working for all sections with regex/canonical matching
- [ ] Policy enforcement preventing non-compliant requests
- [ ] ASR quality gate with WARN/FAIL banners
- [ ] No-new-facts enforcement with "Non rapporté" fallback
- [ ] Bilingual glossary injection for consistent translation

### **Performance & Reliability**
- [ ] p95 ≤ 5s on staging load
- [ ] Split cache hit rates > 80% for repeated requests
- [ ] Extract cache reuse across multiple output languages
- [ ] No performance degradation from current system
- [ ] SLO monitoring and alerting working
- [ ] Backpressure handling for high load
- [ ] Graceful degradation under pressure

### **User Experience**
- [ ] Frontend shows both input and output language selectors
- [ ] CNESST compliance warnings displayed with structured metadata
- [ ] Smart defaults for CNESST sections
- [ ] Clear error messages for policy violations
- [ ] Consistent behavior across all sections
- [ ] ASR quality warnings displayed to users

### **Production Readiness**
- [ ] Feature flags working correctly
- [ ] Rollback plan tested and documented
- [ ] Comprehensive monitoring and alerting configured
- [ ] Quality metrics collected (headers, entities, provenance)
- [ ] Performance metrics collected (p50/p95/p99, cache rates)
- [ ] Error tracking and logging working
- [ ] Locale-specific validation (FR-CA rules)
- [ ] Edge case handling (code-switching, long transcripts, numeric fidelity)

---

## 🚀 **Implementation Timeline**

| Phase | Duration | Dependencies | Critical Path | Key Improvements |
|-------|----------|--------------|---------------|------------------|
| 1. Foundation | 30-45 min | None | ✅ | Template versioning, ASR quality gate |
| 2. API Contract | 45-60 min | Phase 1 | ✅ | Policy gates, structured metadata |
| 3. Prompt Selection | 60-90 min | Phase 1 | ✅ | Bilingual glossary, no-new-facts enforcement |
| 4. Two-Pass Pipeline | 90-120 min | Phase 3 | ✅ | ASR quality gate, strict schema validation |
| 5. Validation | 45-60 min | Phase 4 | ✅ | Robust header matching, locale rules |
| 6. Mode2Formatter | 60-90 min | Phase 4,5 | ✅ | Split caching, template versioning |
| 7. Frontend | 90-120 min | Phase 2,6 | ✅ | CNESST metadata, quality banners |
| 8. Testing | 60-90 min | Phase 7 | ✅ | Edge cases, comprehensive matrix |
| 9. Observability | 30-45 min | Phase 6 | ✅ | Quality metrics, split cache tracking |
| 10. Rollout | 30-45 min | Phase 8,9 | ✅ | Staged deployment, rollback safety |

**Total Estimated Time**: 6-8 hours  
**Critical Path**: Phases 1-7 (Foundation → Frontend)  
**Parallel Work**: Phases 8-9 can run in parallel with Phase 7

## 🔧 **Key Production Hardening Improvements**

### **Added in This Update**
1. **ASR Quality Gate**: Prevents "faithfully wrong" formatting of bad transcripts
2. **Template Versioning**: Content-based hashing prevents stale cache hits
3. **Split Caching**: Extract vs Format caches for optimal reuse
4. **Robust Validation**: Regex/canonical matching for headers, locale rules
5. **Strict Schema**: Typed clinical entities with provenance enforcement
6. **Bilingual Glossary**: Versioned term mapping for consistent translation
7. **No-New-Facts**: Explicit "Non rapporté" fallback for missing information
8. **Quality Metrics**: Comprehensive tracking of headers, entities, provenance
9. **Edge Case Testing**: Code-switching, long transcripts, numeric fidelity
10. **Structured Metadata**: CNESST translation flags for UI consistency

### **Production Benefits**
- **Cost/Latency**: Split caching reduces duplicate LLM calls
- **Quality**: ASR gate prevents bad input from producing bad output
- **Reliability**: Template versioning ensures cache consistency
- **Compliance**: Robust validation ensures CNESST standards
- **Observability**: Comprehensive metrics for production monitoring
- **User Experience**: Quality banners and structured warnings

---

## 📋 **Quick Start Commands**

```bash
# 1. Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env with new flags

# 2. Start development
cd backend && npm run dev
cd frontend && npm run dev

# 3. Test API
curl -X POST http://localhost:3001/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{"transcript":"test","section":"8","inputLanguage":"en","outputLanguage":"fr"}'

# 4. Run tests
cd backend && npm test
cd frontend && npm test

# 5. Check configuration
curl http://localhost:3001/api/config
```

---

**This implementation plan provides a complete, step-by-step guide to implement the output language selection feature while maintaining quality, compliance, and production readiness.**
