# Template and Ambient Mode Comprehensive Audit

## Executive Summary

This audit provides a complete analysis of the template system and ambient mode (Mode 3) architecture in the Scribe transcription system. The system implements a sophisticated, modular architecture where templates are decoupled from sections and modes, enabling flexible combinations for different use cases.

**Key Findings:**
- ✅ **Modular Template Architecture**: Templates are completely decoupled from sections and modes
- ✅ **Layer-Based Processing**: Sophisticated layer system with fallback mechanisms
- ✅ **Ambient Mode Implementation**: Complete S1-S5 pipeline with speaker diarization
- ✅ **Section 7 Enhanced Template**: Best-in-class template with comprehensive prompt system
- ⚠️ **Mode 3 Template Gap**: Limited template compatibility with ambient mode
- ⚠️ **Template-Mode Integration**: Some templates not optimized for ambient mode

---

## 1. Template System Architecture

### 1.1 Core Template Philosophy

**Templates are modular and reusable components that can be applied to any section or mode combination.**

```typescript
// Template Configuration Structure
export interface TemplateConfig {
  id: string;
  name: string;
  compatibleSections: string[];  // Which sections this template can be applied to
  compatibleModes: string[];     // Which modes this template can work with
  supportedLanguages: string[];  // Which languages are supported
  features: {
    verbatimSupport: boolean;
    voiceCommandsSupport: boolean;
    aiFormatting: boolean;
    postProcessing: boolean;
    realtimeProcessing: boolean;
  };
  configuration: {
    priority: number;
    timeout: number;
    retryAttempts: number;
    fallbackTemplate?: string;
    promptFiles?: string[];
  };
}
```

### 1.2 Template Registry

**Location**: `backend/src/config/templates.ts`

The system maintains a comprehensive registry of templates with explicit mode compatibility:

| Template ID | Mode 1 | Mode 2 | Mode 3 | Features | Best For |
|-------------|--------|--------|--------|----------|----------|
| `word-for-word-formatter` | ✅ | ✅ | ❌ | Post-processing only | Basic formatting |
| `word-for-word-with-ai` | ✅ | ✅ | ❌ | AI + Voice Commands | Enhanced word-for-word |
| `ai-formatter-basic` | ❌ | ✅ | ✅ | Basic AI formatting | **Ambient mode ready** |
| `ai-formatter-verbatim` | ❌ | ✅ | ✅ | AI + Verbatim | **Ambient mode ready** |
| `ai-formatter-full` | ❌ | ✅ | ✅ | AI + Verbatim + Voice Commands | **Ambient mode ready** |
| `section7-ai-formatter` | ✅ | ✅ | ❌ | Enhanced Section 7 | **Best template** |
| `section-7-only` | ✅ | ❌ | ❌ | Basic Section 7 | Legacy |
| `section-7-verbatim` | ✅ | ✅ | ❌ | Section 7 + Verbatim | Legacy |
| `section-7-full` | ✅ | ✅ | ❌ | Section 7 + All Features | Legacy |
| `history-evolution-ai-formatter` | ✅ | ✅ | ✅ | History Evolution | **Ambient mode ready** |

### 1.3 Template Processing Flow

```
Template Selection → Mode Processing → Layer System → AI Formatting → Output
       │                    │              │              │
       ▼                    ▼              ▼              ▼
  Template Config    Mode-Specific    Layer Manager    OpenAI API
  ├── Section        Processing       ├── Verbatim     ├── Master Prompts
  ├── Language       ├── Mode 1:      ├── Voice Cmds   ├── JSON Config
  ├── Compatible     │   Word-for-    ├── Clinical     ├── Golden Examples
  │   Modes          │   Word         │   Extraction   └── Post-Processing
  └── Processing     ├── Mode 2:      └── Universal
      Mode           │   Smart Dict.      Cleanup
                     └── Mode 3:      
                         Ambient      
```

---

## 2. Ambient Mode (Mode 3) Architecture

### 2.1 Mode 3 Configuration

**Location**: `backend/src/config/modes.ts`

```typescript
'mode3': {
  id: 'mode3',
  name: 'Ambient',
  description: 'Long-form capture with diarization',
  processingType: 'batch',
  supportedSections: ['section_7', 'section_8', 'section_11'],
  capabilities: {
    voiceCommands: false,
    verbatimSupport: false,
    aiFormatting: true,
    postProcessing: true,
    realtimeProcessing: false
  },
  configuration: {
    maxProcessingTime: 300,
    maxSpeakerLabels: 2  // PATIENT vs CLINICIAN
  }
}
```

### 2.2 S1-S5 Pipeline Implementation

**Location**: `backend/src/services/pipeline/index.ts`

The ambient mode implements a complete 5-stage pipeline:

```
Audio Input → S1: AWS Transcribe → S2: Speaker Merge → S3: Role Mapping → S4: Cleanup → S5: Narrative
     ↓              ↓                    ↓                ↓              ↓              ↓
  WebSocket    Speaker Labels        Speaker Groups   PATIENT/      Text Cleanup   Final Output
                              (spk_0, spk_1)        CLINICIAN
```

#### **S1: AWS Transcribe Integration**
- **Speaker Diarization**: `show_speaker_labels: true`
- **Partial Results**: `partial_results_stability: 'medium'`
- **Language Support**: French and English
- **Output**: Raw transcript with speaker labels

#### **S2: Speaker Merge**
- **Purpose**: Consolidate similar speakers
- **Logic**: Merge speakers based on content similarity
- **Output**: Cleaned speaker groups

#### **S3: Role Mapping**
- **Purpose**: Map speakers to roles (PATIENT/CLINICIAN)
- **Logic**: Content-based role assignment
- **Output**: Role-annotated transcript

#### **S4: Cleanup**
- **Purpose**: Text normalization and cleanup
- **Logic**: Remove artifacts, normalize formatting
- **Output**: Clean transcript

#### **S5: Narrative Generation**
- **Purpose**: Generate final narrative
- **Logic**: Structure content into coherent narrative
- **Output**: Final formatted text

### 2.3 AWS Transcribe Configuration

**Location**: `backend/src/index.ts`

```typescript
case 'ambient':
  return {
    ...config,
    show_speaker_labels: true,
    partial_results_stability: 'medium' as const
    // vocabulary_name omitted - will be undefined
  };
```

---

## 3. Layer System Architecture

### 3.1 Layer Manager

**Location**: `backend/src/services/layers/LayerManager.ts`

The layer system provides modular processing capabilities:

```typescript
export interface LayerProcessor {
  process(transcript: string, options: LayerOptions): Promise<LayerResult>;
}

export interface LayerResult {
  success: boolean;
  data: any;
  metadata: {
    processingTime: number;
    language: 'fr' | 'en';
  };
}
```

### 3.2 Available Layers

| Layer | Purpose | Status | Ambient Compatible |
|-------|---------|--------|-------------------|
| `verbatim-layer` | Preserve exact quotes | ✅ Implemented | ✅ Yes |
| `voice-commands-layer` | Process voice commands | ✅ Implemented | ❌ No (not applicable) |
| `clinical-extraction-layer` | Extract clinical entities | ✅ Implemented | ✅ Yes |
| `universal-cleanup-layer` | Clean + extract entities | ✅ Implemented | ✅ Yes |

### 3.3 Template Combinations

**Location**: `backend/config/layers/template-combinations.json`

```json
{
  "combinations": {
    "template-only": {
      "name": "Section 7 Template Only",
      "layers": [],
      "fallback": "original-mode2"
    },
    "template-verbatim": {
      "name": "Section 7 Template + Verbatim",
      "layers": ["verbatim-layer"],
      "fallback": "template-only"
    },
    "template-full": {
      "name": "Section 7 Template + Verbatim + Voice Commands",
      "layers": ["verbatim-layer", "voice-commands-layer"],
      "fallback": "template-verbatim"
    },
    "universal-cleanup": {
      "name": "Universal Cleanup",
      "layers": ["universal-cleanup-layer"],
      "fallback": "template-only"
    }
  }
}
```

---

## 4. Section 7 Enhanced Template Analysis

### 4.1 Template Structure

**Location**: `backend/src/services/formatter/section7AI.ts`

The Section 7 Enhanced template is the best-in-class implementation with:

#### **6-Step Flowchart Implementation**
1. **Load Language-Specific Files** - Master prompts, JSON config, golden examples
2. **Construct System Prompt** - Combine all components
3. **Call OpenAI API** - Process with comprehensive prompt
4. **Post-Processing** - Validation and cleanup
5. **Quality Assurance** - Final checks
6. **Return Result** - Formatted output with metadata

#### **File Structure**
```
backend/prompts/
├── section7_master.md          # French master prompt
├── section7_master_en.md       # English master prompt
├── section7_master.json        # French JSON configuration
├── section7_master_en.json     # English JSON configuration
├── section7_golden_example.md  # French golden example
└── section7_golden_example_en.md # English golden example
```

### 4.2 Master Prompt Analysis

**Key Features of Section 7 Master Prompt:**

#### **Specialized Instructions**
- Format rules for CNESST Section 7 "Historique de faits et évolution"
- Mandatory header: "7. Historique de faits et évolution"
- Worker-first terminology: "Le travailleur" / "La travailleuse" (never "patient")
- Chronological structure with worker-first format

#### **Critical Elements Preservation**
- Medical terminology with exact precision
- Doctor names with complete titles
- Medical specialties (chirurgien orthopédiste, physiatre, radiologiste)
- Diagnostic terminology with exact wording
- Treatment and procedure details

#### **Citation Management**
- **Worker Citations**: Only first accident/birth description in quotes
- **Medical Citations**: Never quote - always paraphrase
- **Maximum**: 1 citation per document
- **Format**: French quotes « ... »

#### **Variation Requirements**
- Vary consultation verbs: "consulte", "rencontre", "revoit", "obtient un rendez-vous avec"
- Avoid mechanical repetition
- Natural flow with alternating sentence structures

### 4.3 JSON Configuration Analysis

**Key Features of Section 7 JSON Config:**

#### **Structure Rules**
```json
{
  "structure": {
    "contrat_entree": "Chaque entrée doit décrire un événement, une consultation ou une procédure distincte.",
    "regles_ordre": {
      "chronologique": true,
      "ascendant": true,
      "meme_jour_plusieurs": true
    },
    "indice_modele_entree": "Le travailleur/La travailleuse [verbe] le docteur/la docteure [Nom], le [date]. [contenu]"
  }
}
```

#### **Style Rules**
```json
{
  "regles_style": {
    "travailleur_en_premier": true,
    "interdire_date_en_premier": true,
    "titre_medecin_obligatoire": true,
    "guillemets_conserves": true,
    "terme_patient_interdit": true,
    "paragraphe_par_evenement": true,
    "varier_les_verbes": true,
    "eviter_repetition_mecanique": true
  }
}
```

#### **Terminology Management**
```json
{
  "terminologie": {
    "preferes": {
      "patient": "le travailleur",
      "la patiente": "la travailleuse",
      "Docteur": "docteur"
    },
    "interdits": [
      "le patient",
      "la patiente",
      "On [0-9]{1,2}\\s*[A-Za-zéû]+\\s*[0-9]{4},?\\s*le travailleur"
    ],
    "verbes_consultation": [
      "consulte", "rencontre", "revoit", 
      "obtient un rendez-vous avec", "se présente chez"
    ]
  }
}
```

#### **Quality Assurance**
```json
{
  "verifications_QA": {
    "exiger_travailleur_en_premier": true,
    "interdire_commencer_par_date": true,
    "exiger_titre_medecin_par_entree": true,
    "exiger_date_par_entree": true,
    "exiger_paragraphe_par_evenement": true,
    "exiger_variation_verbes": {
      "minimum_verbes_distincts": 2
    },
    "validation_noms_professionnels": {
      "exiger_noms_complets": true,
      "detecter_troncation": true,
      "signaler_noms_incomplets": true,
      "maintenir_coherence_documentaire": true
    }
  }
}
```

### 4.4 Golden Example Analysis

**Key Features of Section 7 Golden Example:**

#### **Structure Pattern**
```
7. Historique de faits et évolution

[Background context]

[Worker's initial description in quotes]

[Employer's report in quotes]

Le travailleur consulte le docteur [Full Name], le [date]. [Diagnosis and treatment details].

Le travailleur revoit le docteur [Full Name], le [date]. [Follow-up details].

[Continues with chronological progression]
```

#### **Quality Standards**
- **Complete doctor names**: "docteur Jonathan-Jared Cooperman", "docteur Pierre Deslandes"
- **Proper chronology**: Events in chronological order
- **Medical accuracy**: Precise terminology and procedures
- **Professional formatting**: Clean, readable structure
- **Citation management**: Limited, strategic use of quotes

---

## 5. Ambient Mode Template Compatibility Analysis

### 5.1 Current State

**Templates Compatible with Ambient Mode (Mode 3):**
- ✅ `ai-formatter-basic` - Basic AI formatting
- ✅ `ai-formatter-verbatim` - AI + Verbatim support
- ✅ `ai-formatter-full` - AI + Verbatim + Voice Commands
- ✅ `history-evolution-ai-formatter` - History evolution formatting

**Templates NOT Compatible with Ambient Mode:**
- ❌ `section7-ai-formatter` - **Best template but no Mode 3 support**
- ❌ `word-for-word-formatter` - Post-processing only
- ❌ `word-for-word-with-ai` - Mode 1/2 only
- ❌ All legacy Section 7 templates

### 5.2 Gap Analysis

**Critical Gap**: The best template (`section7-ai-formatter`) is not compatible with ambient mode, creating a significant limitation for ambient mode users who need high-quality Section 7 formatting.

**Impact**:
- Ambient mode users cannot access the most sophisticated formatting
- Limited to basic AI formatters that lack Section 7 specialization
- Reduced quality for medico-legal documentation

### 5.3 Recommended Solution

**Enable Section 7 Enhanced Template for Ambient Mode:**

1. **Update Template Configuration**:
```typescript
'section7-ai-formatter': {
  // ... existing config
  compatibleModes: ['mode1', 'mode2', 'mode3'], // Add mode3
  features: {
    // ... existing features
    realtimeProcessing: false, // Ambient mode is batch processing
  }
}
```

2. **Layer Integration**: Use `universal-cleanup` combination for ambient mode
3. **Pipeline Integration**: Integrate with S1-S5 pipeline output

---

## 6. Template Creation Pattern (Based on Section 7 Enhanced)

### 6.1 Required Components

**For a new template following the Section 7 Enhanced pattern:**

#### **1. Master Prompt File** (`template_master.md`)
- **Purpose**: Core formatting instructions
- **Content**: Specialized rules, terminology, structure requirements
- **Language**: Bilingual support (FR/EN)
- **Format**: Markdown with clear sections

#### **2. JSON Configuration** (`template_master.json`)
- **Purpose**: Structured rules and validation
- **Content**: Style rules, terminology, quality assurance
- **Structure**: Organized sections for easy maintenance
- **Validation**: Built-in quality checks

#### **3. Golden Example** (`template_golden_example.md`)
- **Purpose**: Reference implementation
- **Content**: Perfect example of expected output
- **Quality**: Professional-grade formatting
- **Coverage**: Comprehensive scenario coverage

#### **4. Implementation Class** (`templateAI.ts`)
- **Purpose**: Processing logic
- **Pattern**: 6-step flowchart implementation
- **Features**: Error handling, fallback, logging
- **Integration**: OpenAI API integration

### 6.2 Implementation Pattern

```typescript
export class TemplateAIFormatter {
  static async formatContent(
    content: string, 
    language: 'fr' | 'en' = 'fr'
  ): Promise<TemplateResult> {
    const startTime = Date.now();
    const correlationId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // STEP 1: Load language-specific files
      const promptFiles = await this.loadLanguageSpecificFiles(language, correlationId);
      
      // STEP 2-4: Construct comprehensive system prompt
      const { systemPrompt, promptLength } = this.constructSystemPrompt(promptFiles, language, correlationId);
      
      // STEP 5: Call OpenAI with comprehensive prompt
      const result = await this.callOpenAI(systemPrompt, content, language, correlationId);
      
      // STEP 6: Post-processing and validation
      const finalResult = this.postProcessResult(result, content, language, correlationId, startTime, promptFiles, promptLength);
      
      return finalResult;
      
    } catch (error) {
      // Fallback to basic formatting
      return this.fallbackFormatting(content, language, correlationId, startTime);
    }
  }
}
```

### 6.3 File Structure Template

```
backend/prompts/
├── [template]_master.md          # Master prompt (FR)
├── [template]_master_en.md       # Master prompt (EN)
├── [template]_master.json        # JSON configuration (FR)
├── [template]_master_en.json     # JSON configuration (EN)
├── [template]_golden_example.md  # Golden example (FR)
└── [template]_golden_example_en.md # Golden example (EN)

backend/src/services/formatter/
└── [template]AI.ts               # Implementation class
```

---

## 7. Recommendations for Ambient Mode Template Creation

### 7.1 Template Design Principles

**For ambient mode templates, follow these principles:**

1. **Batch Processing Optimized**: Design for post-processing rather than real-time
2. **Speaker-Aware**: Leverage speaker diarization information
3. **Clinical Entity Integration**: Use universal cleanup layer
4. **Comprehensive Prompts**: Follow Section 7 Enhanced pattern
5. **Quality Assurance**: Built-in validation and fallback

### 7.2 Ambient Mode Specific Considerations

#### **Speaker Information Integration**
```typescript
// Leverage speaker diarization from S1-S5 pipeline
interface AmbientModeInput {
  transcript: string;
  speakers: {
    spk_0: 'PATIENT' | 'CLINICIAN';
    spk_1: 'PATIENT' | 'CLINICIAN';
  };
  clinicalEntities: ClinicalEntities;
  metadata: {
    processingTime: number;
    language: 'fr' | 'en';
  };
}
```

#### **Clinical Entity Integration**
```typescript
// Use clinical entities from universal cleanup layer
interface TemplateWithClinicalEntities {
  cleaned_text: string;
  clinical_entities: {
    injury_location?: string;
    injury_type?: string;
    onset?: string;
    pain_severity?: string;
    functional_limitations?: string[];
    // ... other entities
  };
}
```

### 7.3 Template Configuration for Ambient Mode

```typescript
'new-template-ambient': {
  id: 'new-template-ambient',
  name: 'New Template for Ambient Mode',
  compatibleSections: ['section_7', 'section_8', 'section_11'],
  compatibleModes: ['mode3'], // Ambient mode only
  supportedLanguages: ['fr', 'en'],
  features: {
    verbatimSupport: true,
    voiceCommandsSupport: false, // Not applicable to ambient
    aiFormatting: true,
    postProcessing: true,
    realtimeProcessing: false, // Batch processing
    comprehensivePrompts: true,
    languageAware: true,
    metadataTracking: true
  },
  configuration: {
    priority: 2,
    timeout: 60,
    retryAttempts: 2,
    promptFiles: ['master_prompt', 'json_config', 'golden_example']
  }
}
```

---

## 8. Conclusion and Next Steps

### 8.1 Key Findings

1. **Template System**: Well-architected, modular, and flexible
2. **Ambient Mode**: Complete implementation with S1-S5 pipeline
3. **Section 7 Enhanced**: Best-in-class template with comprehensive prompt system
4. **Gap**: Section 7 Enhanced not compatible with ambient mode
5. **Pattern**: Clear pattern for creating new templates

### 8.2 Immediate Recommendations

1. **Enable Section 7 Enhanced for Ambient Mode**
   - Update template configuration
   - Test integration with S1-S5 pipeline
   - Validate output quality

2. **Create Ambient-Optimized Template**
   - Follow Section 7 Enhanced pattern
   - Integrate speaker diarization
   - Use clinical entity extraction
   - Implement comprehensive prompts

3. **Template Development Process**
   - Use Section 7 Enhanced as reference
   - Create master prompt, JSON config, golden example
   - Implement 6-step flowchart pattern
   - Include quality assurance and fallback

### 8.3 Success Metrics

- **Template Quality**: Match or exceed Section 7 Enhanced standards
- **Ambient Integration**: Seamless integration with S1-S5 pipeline
- **Clinical Accuracy**: Proper medical terminology and structure
- **User Experience**: Intuitive template selection and processing
- **Performance**: Efficient processing with proper error handling

The template system provides an excellent foundation for creating high-quality, ambient-mode-optimized templates that can leverage the full power of the S1-S5 pipeline and clinical entity extraction.
