# Decoupled Architecture Documentation

## Overview

The CentomoMD platform now features a fully decoupled architecture where **sections**, **modes**, and **templates** operate independently of each other. This design enables maximum flexibility, maintainability, and scalability.

## Architecture Principles

### 1. **Independence**
- Sections define their own requirements and capabilities
- Modes specify their processing capabilities and supported contexts
- Templates define their features and compatibility requirements
- No hardcoded dependencies between components

### 2. **Compatibility-Based Design**
- Components declare their compatibility with other components
- Runtime compatibility checking ensures valid combinations
- Automatic fallback and best-match algorithms

### 3. **Dynamic Configuration**
- All components can be added, modified, or removed at runtime
- Configuration changes don't require code modifications
- Support for feature flags and conditional capabilities

## Component Definitions

### Sections (`backend/src/config/sections.ts`)

Sections represent different parts of medical reports or documents.

```typescript
interface SectionConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  order: number;
  audioRequired: boolean;
  supportedModes: string[];        // Which modes can process this section
  supportedLanguages: string[];    // Which languages are supported
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    requiredFields?: string[];
    formatRules?: string[];
  };
  metadata?: {
    category?: string;
    tags?: string[];
    version?: string;
  };
}
```

**Current Sections:**
- `section_7`: 7. Identification (Historique de faits et évolution)
- `section_8`: 8. Antécédents (Questionnaire subjectif)
- `section_11`: 11. Examen physique (Conclusion médicale)
- `section_custom`: Custom Section (for testing and extensibility)

### Modes (`backend/src/config/modes.ts`)

Modes represent different processing engines or approaches.

```typescript
interface ModeConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  processingType: 'realtime' | 'batch' | 'hybrid';
  supportedSections: string[];     // Which sections this mode can process
  supportedLanguages: string[];    // Which languages are supported
  capabilities: {
    voiceCommands: boolean;
    verbatimSupport: boolean;
    aiFormatting: boolean;
    postProcessing: boolean;
    realtimeProcessing: boolean;
  };
  configuration: {
    maxProcessingTime?: number;
    batchSize?: number;
    retryAttempts?: number;
    fallbackMode?: string;
  };
}
```

**Current Modes:**
- `mode1`: Word-for-Word (realtime processing with voice commands)
- `mode2`: Smart Dictation (hybrid AI processing with all features)
- `mode3`: Ambient (batch processing with diarization)

### Templates (`backend/src/config/templates.ts`)

Templates represent different content processing and formatting approaches.

```typescript
interface TemplateConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  type: 'content' | 'formatting' | 'processing' | 'combination';
  compatibleSections: string[];    // Which sections this template can be applied to
  compatibleModes: string[];       // Which modes this template can work with
  supportedLanguages: string[];    // Which languages are supported
  content: {
    structure: string;
    placeholders: string[];
    validationRules: string[];
  };
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
  };
}
```

**Current Templates:**
- `word-for-word-formatter`: Basic post-processing with voice commands
- `ai-formatter-basic`: AI formatting without additional layers
- `ai-formatter-verbatim`: AI formatting with verbatim text support
- `ai-formatter-full`: Complete AI formatting with all features

## Processing Orchestrator

The `ProcessingOrchestrator` (`backend/src/services/processing/ProcessingOrchestrator.ts`) coordinates the interaction between sections, modes, and templates.

### Key Features:

1. **Compatibility Checking**
   - Validates section/mode/template combinations
   - Provides detailed error messages and suggestions
   - Offers alternative combinations when incompatibilities are found

2. **Best-Match Algorithms**
   - Finds optimal templates based on required features
   - Selects best modes based on required capabilities
   - Calculates compatibility scores for combinations

3. **Dynamic Processing**
   - Handles runtime configuration changes
   - Supports fallback mechanisms
   - Provides comprehensive error handling

## Usage Examples

### Adding a New Section

```typescript
const newSection = {
  id: 'section_12',
  name: '12. Nouvelle Section',
  nameEn: '12. New Section',
  description: 'Description de la nouvelle section',
  descriptionEn: 'Description of the new section',
  order: 12,
  audioRequired: true,
  supportedModes: ['mode1', 'mode2'],
  supportedLanguages: ['fr', 'en'],
  validationRules: {
    minLength: 100,
    maxLength: 2000
  }
};

sectionManager.addSection(newSection);
```

### Finding Compatible Combinations

```typescript
// Get all compatible combinations for a section
const combinations = processingOrchestrator.getCompatibleCombinations('section_7', 'fr');

// Find the best template for specific requirements
const bestTemplate = templateManager.getBestTemplate(
  'section_7', 
  'mode2', 
  'fr', 
  ['aiFormatting', 'verbatimSupport']
);
```

### Processing Content

```typescript
const request = {
  sectionId: 'section_7',
  modeId: 'mode2',
  templateId: 'ai-formatter-verbatim',
  language: 'fr',
  content: 'Raw transcript content...'
};

const result = await processingOrchestrator.processContent(request);
```

## Benefits

### 1. **Modularity**
- Each component can be developed and tested independently
- Changes to one component don't affect others
- Clear separation of concerns

### 2. **Flexibility**
- Easy to add new sections, modes, or templates
- Support for different processing approaches
- Runtime configuration changes

### 3. **Maintainability**
- Well-defined interfaces and contracts
- Comprehensive error handling and validation
- Clear documentation and examples

### 4. **Scalability**
- Architecture supports dynamic growth
- Efficient compatibility checking
- Optimized processing algorithms

### 5. **Backward Compatibility**
- Existing functionality remains intact
- Gradual migration path for legacy code
- No breaking changes to existing APIs

## Testing

The decoupling is verified through comprehensive tests in `backend/test-decoupling.js`:

- ✅ Section independence verification
- ✅ Mode independence verification  
- ✅ Template independence verification
- ✅ Compatibility checking across all combinations
- ✅ Best-match algorithm testing
- ✅ Dynamic configuration testing
- ✅ Runtime addition/removal of components

## Migration Guide

### For Existing Code:

1. **Section References**: Update hardcoded section IDs to use the section manager
2. **Mode References**: Update hardcoded mode IDs to use the mode manager
3. **Template References**: Update hardcoded template IDs to use the template manager
4. **Processing Logic**: Use the ProcessingOrchestrator for coordinated processing

### For New Features:

1. **Define Components**: Create section/mode/template configurations
2. **Register Components**: Add to respective registries
3. **Test Compatibility**: Use orchestrator to validate combinations
4. **Implement Processing**: Use orchestrator for content processing

## Future Enhancements

1. **Plugin System**: Support for external component plugins
2. **Configuration UI**: Web interface for managing components
3. **Performance Optimization**: Caching and optimization strategies
4. **Advanced Analytics**: Processing metrics and performance monitoring
5. **A/B Testing**: Support for testing different component combinations

---

*This architecture ensures that the CentomoMD platform remains flexible, maintainable, and scalable as it grows to support new sections, processing modes, and formatting templates.*
