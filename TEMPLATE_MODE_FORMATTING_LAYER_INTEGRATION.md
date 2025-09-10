# Template Mode Formatting Layer Integration Analysis

## Overview

**YES** - The templates extensively use modes and formatting layers through a sophisticated, decoupled architecture. The system is well-designed with clear separation of concerns and modular integration.

## 🏗️ **Template-Mode-Layer Architecture**

### **1. Template Configuration System**

#### **Backend Template Registry** (`backend/src/config/templates.ts`)

**Templates are configured with explicit mode compatibility:**

```typescript
export interface TemplateConfig {
  id: string;
  name: string;
  compatibleSections: string[]; // Which sections this template can be applied to
  compatibleModes: string[];    // Which modes this template can work with
  supportedLanguages: string[]; // Which languages are supported
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

### **2. Mode Compatibility Matrix**

#### **Templates and Their Mode Support:**

| Template ID | Mode 1 | Mode 2 | Mode 3 | Features |
|-------------|--------|--------|--------|----------|
| `word-for-word-formatter` | ✅ | ✅ | ❌ | Post-processing only |
| `word-for-word-with-ai` | ✅ | ✅ | ❌ | AI + Voice Commands |
| `ai-formatter-basic` | ❌ | ✅ | ✅ | Basic AI formatting |
| `ai-formatter-verbatim` | ❌ | ✅ | ✅ | AI + Verbatim |
| `ai-formatter-full` | ❌ | ✅ | ✅ | AI + Verbatim + Voice Commands |
| `section7-ai-formatter` | ✅ | ✅ | ❌ | Enhanced Section 7 |
| `section-7-only` | ✅ | ❌ | ❌ | Basic Section 7 |
| `section-7-verbatim` | ✅ | ✅ | ❌ | Section 7 + Verbatim |
| `section-7-full` | ✅ | ✅ | ❌ | Section 7 + All Features |
| `history-evolution-ai-formatter` | ✅ | ✅ | ✅ | History Evolution |

### **3. Formatting Layer Integration**

#### **Layer Management System** (`backend/src/services/layers/LayerManager.ts`)

**Templates use the LayerManager to access formatting layers:**

```typescript
export class LayerManager {
  // Manages template combinations and layer configurations
  getEnabledLayers(comboName: string): LayerConfig[]
  validateCombination(comboName: string): { valid: boolean; errors: string[] }
  getTemplateCombination(comboName: string): TemplateCombination | null
}
```

#### **Available Formatting Layers:**

1. **Verbatim Layer** (`verbatim-layer.json`)
   - **Purpose**: Preserves exact quotes and specific text
   - **Markers**: `___VERBATIM_START___` / `___VERBATIM_END___`
   - **Processing**: Pre-processing (convert to placeholders) + Post-processing (restore content)
   - **Status**: `enabled: false` (available but not active by default)

2. **Voice Commands Layer** (`voice-commands-layer.json`)
   - **Purpose**: Converts spoken commands to text replacements
   - **Processing**: Pre-processing (convert commands to replacements)
   - **Status**: `enabled: true` (active by default)

#### **Template Combinations** (`template-combinations.json`)

```json
{
  "combinations": {
    "template-only": {
      "name": "Section 7 Template Only",
      "description": "Basic AI formatting without additional layers",
      "layers": [],
      "fallback": "original-mode2"
    },
    "template-verbatim": {
      "name": "Section 7 Template + Verbatim",
      "description": "AI formatting with verbatim text support",
      "layers": ["verbatim-layer"],
      "fallback": "template-only"
    },
    "template-full": {
      "name": "Section 7 Template + Verbatim + Voice Commands",
      "description": "Full feature set with all layers",
      "layers": ["verbatim-layer", "voice-commands-layer"],
      "fallback": "template-verbatim"
    }
  }
}
```

## 🔄 **How Templates Use Modes and Layers**

### **1. Mode 2 (Smart Dictation) Integration**

#### **Mode2Formatter** (`backend/src/services/formatter/mode2.ts`)

```typescript
export class Mode2Formatter {
  private layerManager: LayerManager;

  async format(transcript: string, options: Mode2FormattingOptions): Promise<Mode2FormattingResult> {
    // BACKWARD COMPATIBILITY: Use shared formatting engine
    if (!options.templateCombo) {
      const nameWhitelist = extractNameWhitelist(transcript);
      const result = await formatWithGuardrails('7', options.language, transcript, undefined, { nameWhitelist });
      return result;
    }

    // NEW LAYER SYSTEM: Process with template combinations
    const templateCombo = options.templateCombo;
    const validation = this.layerManager.validateCombination(templateCombo);
    
    if (!validation.valid) {
      // Fall back to original Mode 2 pipeline
      return this.formatSection7(transcript, optionsWithoutCombo);
    }

    // Get enabled layers for this combination
    const enabledLayers = this.layerManager.getEnabledLayers(templateCombo);
    
    // Process each enabled layer in priority order
    let processedTranscript = transcript;
    for (const layer of enabledLayers) {
      processedTranscript = await this.processLayer(processedTranscript, layer);
    }

    // Apply base formatting engine at the end
    const result = await formatWithGuardrails('7', options.language, processedTranscript, undefined, { nameWhitelist });
    return result;
  }
}
```

**Mode 2 uses templates and layers by:**
1. **Template Combination Selection** - Chooses which layers to apply
2. **Layer Processing** - Processes verbatim and voice command layers
3. **Base Formatting** - Applies the shared `formatWithGuardrails` engine
4. **Fallback Support** - Graceful degradation when layers fail

### **2. Processing Orchestrator Integration**

#### **ProcessingOrchestrator** (`backend/src/services/processing/ProcessingOrchestrator.ts`)

```typescript
export class ProcessingOrchestrator {
  async processContent(request: ProcessingRequest): Promise<ProcessingResult> {
    // Check compatibility between section, mode, and template
    const compatibility = this.checkCompatibility(request);
    
    // Get configurations
    const section = sectionManager.getSection(request.sectionId);
    const mode = modeManager.getMode(request.modeId);
    const template = request.templateId ? templateManager.getTemplate(request.templateId) : null;

    // Process content based on mode and template
    let processedContent = request.content;

    // Apply template processing if template is specified
    if (template) {
      processedContent = await this.applyTemplateProcessing(processedContent, template, request);
    }

    // Apply mode-specific processing
    processedContent = await this.applyModeProcessing(processedContent, mode, request);

    return {
      success: true,
      processedContent,
      metadata: { /* ... */ }
    };
  }
}
```

**The orchestrator coordinates:**
1. **Compatibility Checking** - Ensures section/mode/template compatibility
2. **Template Processing** - Applies template-specific formatting
3. **Mode Processing** - Applies mode-specific processing
4. **Layer Integration** - Manages formatting layer execution

## 📊 **Template Processing Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEMPLATE PROCESSING FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│  Template Selection → Mode Processing → Layer Processing → Output │
│       │                    │              │              │
│       ▼                    ▼              ▼              ▼
│  Template Config    Mode-Specific    Layer Manager    Formatted
│  ├── Section        Processing       ├── Verbatim     Content
│  ├── Language       ├── Mode 1:      ├── Voice        ├── AI
│  ├── Compatible     │   Word-for-    │   Commands     │   Formatting
│  │   Modes          │   Word         ├── Template     ├── Validation
│  ├── Features       ├── Mode 2:      │   Combinations ├── Compliance
│  │   ├── Verbatim   │   Smart Dict.  └── Fallbacks    └── Metadata
│  │   ├── Voice      └── Mode 3:      
│  │   │   Commands       Transcribe   
│  │   ├── AI Format.     
│  │   └── Post Proc.     
│  └── Configuration  
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 **Specific Template Examples**

### **1. Section 7 AI Formatter (Enhanced)**

```typescript
'section7-ai-formatter': {
  id: 'section7-ai-formatter',
  name: 'Section 7 AI Formatter',
  compatibleSections: ['section_7'],
  compatibleModes: ['mode1', 'mode2'], // Mode 3 NOT supported
  features: {
    verbatimSupport: false,
    voiceCommandsSupport: false,
    aiFormatting: true,
    postProcessing: true,
    realtimeProcessing: true,
    comprehensivePrompts: true,
    languageAware: true,
    metadataTracking: true
  },
  configuration: {
    priority: 3,
    timeout: 45,
    retryAttempts: 2,
    promptFiles: ['master_prompt', 'json_config', 'golden_example']
  }
}
```

**This template:**
- ✅ **Uses Mode 1 & 2** - Word-for-word and Smart Dictation
- ❌ **Doesn't use Mode 3** - Transcribe not supported
- ✅ **Uses Base Formatting** - `formatWithGuardrails` engine
- ✅ **Uses Layer System** - Through Mode2Formatter
- ✅ **Uses AI Formatting** - Enhanced Section 7 prompts

### **2. AI Formatter Full**

```typescript
'ai-formatter-full': {
  id: 'ai-formatter-full',
  name: 'AI Formatter + Verbatim + Voice Commands',
  compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
  compatibleModes: ['mode2', 'mode3'], // Mode 1 NOT supported
  features: {
    verbatimSupport: true,
    voiceCommandsSupport: true,
    aiFormatting: true,
    postProcessing: true,
    realtimeProcessing: false
  },
  configuration: {
    priority: 4,
    timeout: 120,
    retryAttempts: 2,
    fallbackTemplate: 'ai-formatter-verbatim'
  }
}
```

**This template:**
- ❌ **Doesn't use Mode 1** - Word-for-word not supported
- ✅ **Uses Mode 2 & 3** - Smart Dictation and Transcribe
- ✅ **Uses All Layers** - Verbatim + Voice Commands
- ✅ **Uses Base Formatting** - Through Mode2Formatter
- ✅ **Has Fallback** - Graceful degradation

### **3. History Evolution AI Formatter**

```typescript
'history-evolution-ai-formatter': {
  id: 'history-evolution-ai-formatter',
  name: 'History of Evolution AI Formatter',
  compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom', 'history_evolution'],
  compatibleModes: ['mode1', 'mode2', 'mode3'], // ALL modes supported
  features: {
    verbatimSupport: true,
    voiceCommandsSupport: true,
    aiFormatting: true,
    postProcessing: true,
    realtimeProcessing: true
  }
}
```

**This template:**
- ✅ **Uses ALL Modes** - Mode 1, 2, and 3
- ✅ **Uses All Features** - Verbatim + Voice Commands + AI
- ✅ **Uses All Sections** - Comprehensive coverage
- ✅ **Uses Base Formatting** - Through all mode formatters

## 🔧 **Layer Processing Implementation**

### **1. Verbatim Layer Processing**

```typescript
// When verbatim layer is enabled
const verbatimLayer = {
  name: 'verbatim-layer',
  processing: {
    preProcessing: {
      enabled: true,
      function: 'processVerbatimMarkers' // Convert markers to placeholders
    },
    postProcessing: {
      enabled: true,
      function: 'restoreVerbatimContent' // Restore after AI processing
    }
  }
};
```

**Processing Flow:**
1. **Pre-processing**: Convert `___VERBATIM_START___` markers to placeholders
2. **AI Processing**: Apply formatting to non-verbatim content
3. **Post-processing**: Restore verbatim content from placeholders

### **2. Voice Commands Layer Processing**

```typescript
// When voice commands layer is enabled
const voiceCommandsLayer = {
  name: 'voice-commands-layer',
  processing: {
    preProcessing: {
      enabled: true,
      function: 'processVoiceCommands' // Convert commands to replacements
    }
  }
};
```

**Processing Flow:**
1. **Pre-processing**: Convert spoken commands to text replacements
2. **AI Processing**: Apply formatting to processed content
3. **Output**: Formatted content with command replacements

## 📋 **Template-Mode-Layer Compatibility Matrix**

| Template | Mode 1 | Mode 2 | Mode 3 | Verbatim | Voice Commands | AI Formatting |
|----------|--------|--------|--------|----------|----------------|---------------|
| `word-for-word-formatter` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `word-for-word-with-ai` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `ai-formatter-basic` | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `ai-formatter-verbatim` | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `ai-formatter-full` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `section7-ai-formatter` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `section-7-only` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `section-7-verbatim` | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `section-7-full` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| `history-evolution-ai-formatter` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🚀 **Key Integration Points**

### **1. Template Selection**
- **Frontend**: User selects template based on section and mode
- **Backend**: `templateManager.getCompatibleTemplates(section, mode, language)`
- **Validation**: `templateManager.isModeCompatible(templateId, modeId)`

### **2. Mode Processing**
- **Mode 1**: Direct formatting without layers
- **Mode 2**: Uses `Mode2Formatter` with layer management
- **Mode 3**: Will use `Mode3Formatter` (planned) with layer management

### **3. Layer Execution**
- **LayerManager**: Manages layer configurations and combinations
- **Template Combinations**: Define which layers to apply
- **Fallback Chain**: Graceful degradation when layers fail

### **4. Base Formatting**
- **Shared Engine**: All modes use `formatWithGuardrails` for AI formatting
- **Consistent Quality**: Same validation, compliance, and error handling
- **Section-Specific**: Different prompts and rules for each section

## ✅ **Conclusion**

**YES - Templates extensively use modes and formatting layers through:**

1. **Explicit Mode Compatibility** - Each template declares which modes it supports
2. **Feature-Based Configuration** - Templates specify which formatting features they use
3. **Layer Management Integration** - Templates use the LayerManager for modular processing
4. **Template Combinations** - Configurable layer combinations for different use cases
5. **Processing Orchestration** - Coordinated execution of templates, modes, and layers
6. **Fallback Mechanisms** - Graceful degradation when components fail
7. **Base Formatting Integration** - All templates use the shared formatting engine

**The architecture is:**
- ✅ **Modular** - Clear separation of concerns
- ✅ **Extensible** - Easy to add new templates, modes, and layers
- ✅ **Robust** - Comprehensive fallback and error handling
- ✅ **Consistent** - Shared base formatting ensures quality
- ✅ **Flexible** - Templates can be configured for different use cases

**For Mode 3 (Transcribe) implementation:**
- ✅ **Templates are ready** - Many already support Mode 3
- ✅ **Layers are available** - Verbatim and voice command layers exist
- ✅ **Base formatting exists** - Can be used through Mode2Formatter
- 🔧 **Mode3Formatter needed** - To add multi-speaker pre-processing
- 🔧 **Layer integration needed** - To connect Mode 3 with existing layers

The template system is well-designed and ready for Mode 3 integration!

## 🚀 **Mode 3 (Transcribe) Integration Plan**

### **Phase 1: Create Mode3Formatter Class**

#### **File**: `backend/src/services/formatter/mode3.ts`

```typescript
import { Mode2Formatter, Mode2FormattingOptions, Mode2FormattingResult } from './mode2.js';
import { formatWithGuardrails } from './shared.js';

export interface Mode3FormattingOptions extends Mode2FormattingOptions {
  // Mode 3 specific options
  speakerDiarization?: boolean;
  speakerAttribution?: boolean;
  narrativeBuilding?: boolean;
}

export interface Mode3FormattingResult extends Mode2FormattingResult {
  // Mode 3 specific results
  speaker_attribution?: {
    patient_segments: string[];
    clinician_segments: string[];
    confidence_scores: number[];
  };
  diarization_metadata?: {
    total_speakers: number;
    speaker_changes: number;
    processing_time: number;
  };
}

export class Mode3Formatter {
  private mode2Formatter: Mode2Formatter;

  constructor() {
    this.mode2Formatter = new Mode2Formatter();
  }

  /**
   * Format transcript using Mode 3 (Transcribe) processing
   * 1. Multi-speaker diarization and narrative building
   * 2. Delegate to Mode2Formatter for base formatting
   * 3. Add speaker attribution metadata
   */
  async format(
    transcript: string, 
    options: Mode3FormattingOptions
  ): Promise<Mode3FormattingResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    
    try {
      // Step 1: Multi-speaker pre-processing (Mode 3 specific)
      const speakerTokens = this.parseSpeakerTokens(transcript);
      const cleanedTokens = this.mergeAndCleanTokens(speakerTokens);
      const roleAttribution = this.identifySpeakerRoles(cleanedTokens);
      const narrative = this.buildNarrative(cleanedTokens, roleAttribution);
      
      // Step 2: Use Mode 2 formatter (inherit base layer)
      const mode2Result = await this.mode2Formatter.format(narrative, {
        language: options.language,
        section: options.section,
        case_id: options.case_id,
        selected_sections: options.selected_sections,
        extra_dictation: options.extra_dictation,
        templateCombo: options.templateCombo,
        verbatimSupport: options.verbatimSupport,
        voiceCommandsSupport: options.voiceCommandsSupport
      });

      // Step 3: Add Mode 3 specific metadata
      const processingTime = Date.now() - startTime;
      
      return {
        formatted: mode2Result.formatted,
        issues: [...mode2Result.issues, ...issues],
        sources_used: mode2Result.sources_used,
        confidence_score: mode2Result.confidence_score,
        speaker_attribution: {
          patient_segments: roleAttribution.patient_segments,
          clinician_segments: roleAttribution.clinician_segments,
          confidence_scores: roleAttribution.confidence_scores
        },
        diarization_metadata: {
          total_speakers: roleAttribution.total_speakers,
          speaker_changes: roleAttribution.speaker_changes,
          processing_time: processingTime
        }
      };

    } catch (error) {
      issues.push(`Mode 3 formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        formatted: transcript, // Return original on error
        issues,
        confidence_score: 0,
        speaker_attribution: {
          patient_segments: [],
          clinician_segments: [],
          confidence_scores: []
        },
        diarization_metadata: {
          total_speakers: 0,
          speaker_changes: 0,
          processing_time: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Parse speaker tokens from AWS Transcribe output
   * Handles speaker labels like "spk_0", "spk_1", etc.
   */
  private parseSpeakerTokens(transcript: string): Array<{
    speaker: string;
    text: string;
    start_time?: number;
    end_time?: number;
    confidence?: number;
  }> {
    // Implementation for parsing AWS Transcribe speaker diarization output
    // This would handle the actual AWS Transcribe format
    const tokens: Array<{
      speaker: string;
      text: string;
      start_time?: number;
      end_time?: number;
      confidence?: number;
    }> = [];

    // Parse transcript with speaker labels
    // Example: "spk_0: Hello, how are you? spk_1: I'm fine, thank you."
    const speakerPattern = /(spk_\d+):\s*([^spk_]+?)(?=spk_\d+:|$)/g;
    let match;
    
    while ((match = speakerPattern.exec(transcript)) !== null) {
      tokens.push({
        speaker: match[1],
        text: match[2].trim(),
        confidence: 0.9 // Default confidence
      });
    }

    return tokens;
  }

  /**
   * Merge and clean speaker tokens
   * Combines consecutive tokens from same speaker
   */
  private mergeAndCleanTokens(tokens: Array<{
    speaker: string;
    text: string;
    start_time?: number;
    end_time?: number;
    confidence?: number;
  }>): Array<{
    speaker: string;
    text: string;
    start_time?: number;
    end_time?: number;
    confidence?: number;
  }> {
    if (tokens.length === 0) return tokens;

    const merged: Array<{
      speaker: string;
      text: string;
      start_time?: number;
      end_time?: number;
      confidence?: number;
    }> = [];

    let current = { ...tokens[0] };

    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.speaker === current.speaker) {
        // Merge consecutive tokens from same speaker
        current.text += ' ' + token.text;
        current.end_time = token.end_time;
        current.confidence = Math.min(current.confidence || 0.9, token.confidence || 0.9);
      } else {
        // Different speaker, save current and start new
        merged.push(current);
        current = { ...token };
      }
    }

    merged.push(current);
    return merged;
  }

  /**
   * Identify speaker roles (patient vs clinician)
   * Uses heuristics and medical terminology analysis
   */
  private identifySpeakerRoles(tokens: Array<{
    speaker: string;
    text: string;
    start_time?: number;
    end_time?: number;
    confidence?: number;
  }>): {
    patient_segments: string[];
    clinician_segments: string[];
    confidence_scores: number[];
    total_speakers: number;
    speaker_changes: number;
  } {
    const patient_segments: string[] = [];
    const clinician_segments: string[] = [];
    const confidence_scores: number[] = [];
    const speakerRoles = new Map<string, 'patient' | 'clinician' | 'unknown'>();
    
    // Analyze each speaker's content to determine role
    for (const token of tokens) {
      const role = this.analyzeSpeakerRole(token.text);
      speakerRoles.set(token.speaker, role);
      
      if (role === 'patient') {
        patient_segments.push(token.text);
        confidence_scores.push(token.confidence || 0.8);
      } else if (role === 'clinician') {
        clinician_segments.push(token.text);
        confidence_scores.push(token.confidence || 0.9);
      }
    }

    return {
      patient_segments,
      clinician_segments,
      confidence_scores,
      total_speakers: speakerRoles.size,
      speaker_changes: tokens.length - 1
    };
  }

  /**
   * Analyze speaker role based on content
   * Uses medical terminology and conversation patterns
   */
  private analyzeSpeakerRole(text: string): 'patient' | 'clinician' | 'unknown' {
    const lowerText = text.toLowerCase();
    
    // Clinician indicators
    const clinicianPatterns = [
      /doctor|dr\.|physician|nurse|therapist|specialist/i,
      /diagnosis|treatment|prescription|medication|therapy/i,
      /examination|assessment|evaluation|consultation/i,
      /recommend|suggest|advise|prescribe|order/i,
      /follow.?up|appointment|schedule|refer/i
    ];
    
    // Patient indicators
    const patientPatterns = [
      /i feel|i have|i'm experiencing|my pain|my symptoms/i,
      /it hurts|it's painful|i can't|i'm unable/i,
      /when did|how long|what should|can you help/i,
      /thank you|yes|no|okay|i understand/i
    ];
    
    let clinicianScore = 0;
    let patientScore = 0;
    
    // Score based on patterns
    for (const pattern of clinicianPatterns) {
      if (pattern.test(lowerText)) clinicianScore++;
    }
    
    for (const pattern of patientPatterns) {
      if (pattern.test(lowerText)) patientScore++;
    }
    
    // Determine role based on scores
    if (clinicianScore > patientScore && clinicianScore > 0) {
      return 'clinician';
    } else if (patientScore > clinicianScore && patientScore > 0) {
      return 'patient';
    } else {
      return 'unknown';
    }
  }

  /**
   * Build narrative from speaker tokens
   * Creates a coherent narrative for AI formatting
   */
  private buildNarrative(tokens: Array<{
    speaker: string;
    text: string;
    start_time?: number;
    end_time?: number;
    confidence?: number;
  }>, roleAttribution: {
    patient_segments: string[];
    clinician_segments: string[];
    confidence_scores: number[];
    total_speakers: number;
    speaker_changes: number;
  }): string {
    // Build narrative by combining speaker segments
    // This creates a coherent text for AI formatting
    let narrative = '';
    
    for (const token of tokens) {
      // Add speaker context if needed
      if (roleAttribution.total_speakers > 1) {
        const role = this.analyzeSpeakerRole(token.text);
        if (role === 'patient') {
          narrative += `[Patient]: ${token.text}\n`;
        } else if (role === 'clinician') {
          narrative += `[Clinician]: ${token.text}\n`;
        } else {
          narrative += `${token.text}\n`;
        }
      } else {
        narrative += `${token.text}\n`;
      }
    }
    
    return narrative.trim();
  }
}
```

### **Phase 2: Add Mode 3 Endpoint**

#### **File**: `backend/src/index.ts` (add to existing endpoints)

```typescript
// Mode 3 Formatting Endpoint (Transcribe)
app.post('/api/format/mode3', async (req, res): Promise<void> => {
  try {
    const { 
      transcript, 
      section, 
      language, 
      case_id, 
      selected_sections, 
      extra_dictation,
      // Template combination parameters
      templateCombo,
      verbatimSupport,
      voiceCommandsSupport,
      // Mode 3 specific parameters
      speakerDiarization,
      speakerAttribution,
      narrativeBuilding
    } = req.body;
    
    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({ 
        error: 'Transcript is required and must be a string' 
      });
      return;
    }

    if (!section || !['7', '8', '11'].includes(section)) {
      res.status(400).json({ 
        error: 'Section must be "7", "8", or "11"' 
      });
      return;
    }

    if (!language || !['fr', 'en'].includes(language)) {
      res.status(400).json({ 
        error: 'Language must be either "fr" or "en"' 
      });
      return;
    }

    // Development mode: no auth required

    // Initialize Mode 3 formatter
    const formatter = new Mode3Formatter();
    
    // Format the transcript with AI
    const result = await formatter.format(transcript, {
      language: language as 'fr' | 'en',
      section: section as '7' | '8' | '11',
      case_id,
      selected_sections,
      extra_dictation,
      // Template combination parameters
      templateCombo,
      verbatimSupport,
      voiceCommandsSupport,
      // Mode 3 specific parameters
      speakerDiarization,
      speakerAttribution,
      narrativeBuilding
    });

    // Return the formatted result
    res.json({
      formatted: result.formatted,
      issues: result.issues,
      sources_used: result.sources_used,
      confidence_score: result.confidence_score,
      speaker_attribution: result.speaker_attribution,
      diarization_metadata: result.diarization_metadata,
      success: true
    });

  } catch (error) {
    console.error('Mode 3 formatting error:', error);
    res.status(500).json({ 
      error: 'Failed to format transcript',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

### **Phase 3: Update Template Configurations**

#### **File**: `backend/src/config/templates.ts` (update existing templates)

```typescript
// Update templates to support Mode 3
export const TEMPLATE_REGISTRY: TemplateRegistry = {
  // ... existing templates ...
  
  'ai-formatter-basic': {
    id: 'ai-formatter-basic',
    name: 'AI Formatter Basic',
    nameEn: 'AI Formatter Basic',
    description: 'Formatage IA de base sans couches supplémentaires',
    descriptionEn: 'Basic AI formatting without additional layers',
    type: 'formatting',
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode2', 'mode3'], // Already supports Mode 3
    supportedLanguages: ['fr', 'en'],
    // ... rest of configuration
  },
  
  'ai-formatter-verbatim': {
    id: 'ai-formatter-verbatim',
    name: 'AI Formatter + Verbatim',
    nameEn: 'AI Formatter + Verbatim',
    description: 'Formatage IA avec support de texte verbatim',
    descriptionEn: 'AI formatting with verbatim text support',
    type: 'combination',
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode2', 'mode3'], // Already supports Mode 3
    supportedLanguages: ['fr', 'en'],
    // ... rest of configuration
  },
  
  'ai-formatter-full': {
    id: 'ai-formatter-full',
    name: 'AI Formatter + Verbatim + Voice Commands',
    nameEn: 'AI Formatter + Verbatim + Voice Commands',
    description: 'Formatage IA complet avec toutes les fonctionnalités',
    descriptionEn: 'Complete AI formatting with all features',
    type: 'combination',
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode2', 'mode3'], // Already supports Mode 3
    supportedLanguages: ['fr', 'en'],
    // ... rest of configuration
  },
  
  // Add new Mode 3 specific template
  'mode3-transcribe-formatter': {
    id: 'mode3-transcribe-formatter',
    name: 'Mode 3 Transcribe Formatter',
    nameEn: 'Mode 3 Transcribe Formatter',
    description: 'Formatage IA spécialisé pour la transcription multi-locuteurs',
    descriptionEn: 'AI formatting specialized for multi-speaker transcription',
    type: 'formatting',
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode3'], // Mode 3 only
    supportedLanguages: ['fr', 'en'],
    content: {
      structure: 'multi_speaker_ai_formatting',
      placeholders: ['speaker_attribution', 'narrative_building', 'ai_content'],
      validationRules: ['speaker_identification', 'narrative_coherence', 'ai_accuracy']
    },
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: true,
      realtimeProcessing: false,
      speakerDiarization: true,
      narrativeBuilding: true
    },
    configuration: {
      priority: 3,
      timeout: 90,
      retryAttempts: 2,
      fallbackTemplate: 'ai-formatter-basic'
    },
    metadata: {
      category: 'mode_specific',
      tags: ['mode3', 'transcribe', 'multi-speaker', 'diarization'],
      version: '1.0.0',
      author: 'CentomoMD'
    }
  }
};
```

### **Phase 4: Update Processing Orchestrator**

#### **File**: `backend/src/services/processing/ProcessingOrchestrator.ts` (add Mode 3 support)

```typescript
// Add Mode 3 processing method
private async processMode3(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
  console.log(`[${request.correlationId}] Processing Mode 3 with template: ${template.id}`);
  
  try {
    // Import Mode3Formatter dynamically to avoid circular dependencies
    const { Mode3Formatter } = await import('../formatter/mode3.js');
    const formatter = new Mode3Formatter();
    
    // Format with Mode 3
    const result = await formatter.format(content, {
      language: request.language as 'fr' | 'en',
      section: request.sectionId.replace('section_', '') as '7' | '8' | '11',
      case_id: request.options?.case_id,
      selected_sections: request.options?.selected_sections,
      extra_dictation: request.options?.extra_dictation,
      templateCombo: template.configuration.templateCombo,
      verbatimSupport: template.features.verbatimSupport,
      voiceCommandsSupport: template.features.voiceCommandsSupport,
      speakerDiarization: true,
      speakerAttribution: true,
      narrativeBuilding: true
    });
    
    if (result.issues.length > 0) {
      console.warn(`[${request.correlationId}] Mode 3 formatting issues:`, result.issues);
    }
    
    return result.formatted;
    
  } catch (error) {
    console.error(`[${request.correlationId}] Mode 3 processing error:`, error);
    throw new Error(`Mode 3 processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Update the main processing method to handle Mode 3
async processContent(request: ProcessingRequest): Promise<ProcessingResult> {
  // ... existing code ...
  
  // Process content based on mode and template
  let processedContent = request.content;

  // Apply template processing if template is specified
  if (template) {
    if (request.modeId === 'mode3') {
      processedContent = await this.processMode3(processedContent, template, request);
    } else if (request.modeId === 'mode2') {
      processedContent = await this.processMode2(processedContent, template, request);
    } else if (request.modeId === 'mode1') {
      processedContent = await this.processMode1(processedContent, template, request);
    } else {
      throw new Error(`Unsupported mode: ${request.modeId}`);
    }
  }

  // ... rest of existing code ...
}
```

### **Phase 5: Update Frontend Integration**

#### **File**: `frontend/src/hooks/useTranscription.ts` (add Mode 3 support)

```typescript
// Add Mode 3 formatting support
const formatWithMode3 = async (transcript: string, options: {
  section: string;
  language: string;
  templateId?: string;
  speakerDiarization?: boolean;
  speakerAttribution?: boolean;
  narrativeBuilding?: boolean;
}) => {
  try {
    const response = await fetch('/api/format/mode3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript,
        section: options.section,
        language: options.language,
        templateCombo: options.templateId,
        speakerDiarization: options.speakerDiarization ?? true,
        speakerAttribution: options.speakerAttribution ?? true,
        narrativeBuilding: options.narrativeBuilding ?? true
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Mode 3 formatting failed');
    }

    return {
      formatted: result.formatted,
      issues: result.issues || [],
      confidence_score: result.confidence_score || 0,
      speaker_attribution: result.speaker_attribution,
      diarization_metadata: result.diarization_metadata
    };
    
  } catch (error) {
    console.error('Mode 3 formatting error:', error);
    throw error;
  }
};

// Update the main formatting function to support Mode 3
const formatTranscript = async (transcript: string, mode: string, options: any) => {
  switch (mode) {
    case 'mode1':
      return await formatWithMode1(transcript, options);
    case 'mode2':
      return await formatWithMode2(transcript, options);
    case 'mode3':
      return await formatWithMode3(transcript, options);
    default:
      throw new Error(`Unsupported mode: ${mode}`);
  }
};
```

### **Phase 6: Update Mode Configuration**

#### **File**: `backend/src/config/modes.ts` (ensure Mode 3 is properly configured)

```typescript
export const MODE_REGISTRY: Record<string, ModeConfig> = {
  // ... existing modes ...
  
  mode3: {
    id: 'mode3',
    name: 'Ambient',
    nameEn: 'Ambient',
    description: 'Transcription multi-locuteurs avec formatage IA',
    descriptionEn: 'Multi-speaker transcription with AI formatting',
    processingType: 'batch',
    capabilities: {
      voiceCommands: false,
      verbatimSupport: false,
      aiFormatting: true,
      postProcessing: true,
      realtimeProcessing: false,
      speakerDiarization: true,
      narrativeBuilding: true
    },
    configuration: {
      show_speaker_labels: true,
      partial_results_stability: 'medium',
      vocabulary_name: undefined
    },
    supportedSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    supportedLanguages: ['fr', 'en'],
    isActive: true,
    isDefault: false
  }
};
```

### **Phase 7: Testing and Validation**

#### **File**: `backend/test-mode3-integration.js`

```javascript
const { Mode3Formatter } = require('./src/services/formatter/mode3.js');

async function testMode3Integration() {
  console.log('🧪 Testing Mode 3 Integration...');
  
  const formatter = new Mode3Formatter();
  
  // Test transcript with speaker diarization
  const testTranscript = `
    spk_0: Bonjour, comment allez-vous aujourd'hui?
    spk_1: Bonjour docteur, j'ai mal au dos depuis une semaine.
    spk_0: Pouvez-vous me décrire la douleur?
    spk_1: C'est une douleur aiguë dans le bas du dos, surtout le matin.
    spk_0: Avez-vous pris des médicaments?
    spk_1: Oui, j'ai pris de l'ibuprofène mais ça n'a pas aidé.
  `;
  
  try {
    const result = await formatter.format(testTranscript, {
      language: 'fr',
      section: '7',
      speakerDiarization: true,
      speakerAttribution: true,
      narrativeBuilding: true
    });
    
    console.log('✅ Mode 3 formatting successful');
    console.log('📝 Formatted content:', result.formatted);
    console.log('👥 Speaker attribution:', result.speaker_attribution);
    console.log('📊 Diarization metadata:', result.diarization_metadata);
    console.log('⚠️ Issues:', result.issues);
    
  } catch (error) {
    console.error('❌ Mode 3 formatting failed:', error);
  }
}

// Run test
testMode3Integration();
```

## 🎯 **Implementation Timeline**

### **Week 1: Core Implementation**
- [ ] Create `Mode3Formatter` class
- [ ] Implement speaker token parsing
- [ ] Implement speaker role identification
- [ ] Implement narrative building

### **Week 2: Integration**
- [ ] Add Mode 3 endpoint to backend
- [ ] Update template configurations
- [ ] Update processing orchestrator
- [ ] Add frontend support

### **Week 3: Testing & Validation**
- [ ] Create integration tests
- [ ] Test with real AWS Transcribe output
- [ ] Validate speaker attribution accuracy
- [ ] Performance testing

### **Week 4: Documentation & Deployment**
- [ ] Update documentation
- [ ] Create user guides
- [ ] Deploy to staging
- [ ] Production deployment

## ✅ **Success Criteria**

1. **✅ Mode 3 Formatter Created** - Multi-speaker processing implemented
2. **✅ Template Integration** - All compatible templates work with Mode 3
3. **✅ Layer System Integration** - Mode 3 uses existing formatting layers
4. **✅ Base Formatting Integration** - Mode 3 uses shared formatting engine
5. **✅ Speaker Attribution** - Accurate patient/clinician identification
6. **✅ Narrative Building** - Coherent text for AI formatting
7. **✅ Fallback Support** - Graceful degradation when components fail
8. **✅ Performance** - Processing time under 30 seconds for typical transcripts
9. **✅ Accuracy** - Speaker attribution accuracy > 85%
10. **✅ Integration** - Seamless integration with existing architecture

## 🔧 **Key Benefits of This Approach**

1. **✅ Leverages Existing Architecture** - Uses Mode2Formatter and base formatting
2. **✅ Modular Design** - Easy to extend and maintain
3. **✅ Template Compatibility** - Works with existing template system
4. **✅ Layer Integration** - Uses existing formatting layers
5. **✅ Fallback Support** - Graceful degradation when components fail
6. **✅ Consistent Quality** - Same AI formatting and validation
7. **✅ Extensible** - Easy to add new features and improvements
8. **✅ Testable** - Clear separation of concerns for testing

This integration plan ensures Mode 3 (Transcribe) seamlessly integrates with the existing template and formatting layer architecture while adding the specific multi-speaker capabilities needed for ambient transcription scenarios.
