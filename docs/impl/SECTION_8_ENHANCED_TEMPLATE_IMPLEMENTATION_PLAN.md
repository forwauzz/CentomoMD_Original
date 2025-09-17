# Section 8 Enhanced Template Implementation Plan

## 🎯 Objective

Create a Section 8 Enhanced template that follows the exact same pattern as Section 7 Enhanced, integrating with the Universal Cleanup pipeline and providing comprehensive CNESST-compliant formatting for Section 8 content.

## 📋 Implementation Overview

Based on the Section 7 Enhanced template analysis, we will create a complete Section 8 Enhanced template with:

- **Bilingual Master Prompts** (French/English)
- **JSON Configuration Files** (French/English) 
- **Golden Standard Examples** (French/English)
- **Implementation Class** (Section8AI.ts)
- **Template Registry Integration**
- **Universal Cleanup Pipeline Integration**
- **Frontend Integration**

---

## 🏗️ File Structure

```
backend/prompts/
├── section8_master.md          # French master prompt
├── section8_master_en.md       # English master prompt
├── section8_master.json        # French JSON configuration
├── section8_master_en.json     # English JSON configuration
├── section8_golden_example.md  # French golden example
└── section8_golden_example_en.md # English golden example

backend/src/services/formatter/
└── section8AI.ts               # Implementation class

backend/src/config/
└── templates.ts                # Template registry (updated)

backend/config/layers/
└── template-combinations.json  # Layer combinations (updated)

frontend/src/config/
└── template-config.ts          # Frontend template config (updated)
```

---

## 📝 Implementation Steps

### **Step 1: Create Master Prompt Files**

#### **1.1 French Master Prompt** (`backend/prompts/section8_master.md`)
- **Purpose**: Core formatting instructions for French CNESST Section 8
- **Content**: 
  - Section 8 specific formatting rules
  - CNESST compliance requirements
  - Medical terminology preservation
  - Citation management rules
  - Quality assurance guidelines
- **Pattern**: Follow Section 7 Enhanced structure

#### **1.2 English Master Prompt** (`backend/prompts/section8_master_en.md`)
- **Purpose**: Core formatting instructions for English CNESST Section 8
- **Content**: 
  - English-specific formatting rules
  - Bilingual terminology handling
  - Cross-language consistency
- **Pattern**: Mirror French structure with English adaptations

### **Step 2: Create JSON Configuration Files**

#### **2.1 French JSON Config** (`backend/prompts/section8_master.json`)
- **Purpose**: Structured rules and validation for French Section 8
- **Content**:
  ```json
  {
    "metadata": {
      "section": "8",
      "nom": "Section 8 Title",
      "locale": "fr-CA",
      "version": "1.0.0"
    },
    "structure": {
      "contrat_entree": "Section 8 specific entry requirements",
      "regles_ordre": {
        "chronologique": true,
        "ascendant": true
      }
    },
    "regles_style": {
      "section8_specific_rules": true,
      "cnesst_compliance": true
    },
    "terminologie": {
      "preferes": {
        "section8_terms": "preferred_terms"
      },
      "interdits": ["forbidden_terms"]
    },
    "verifications_QA": {
      "section8_validation": true
    }
  }
  ```

#### **2.2 English JSON Config** (`backend/prompts/section8_master_en.json`)
- **Purpose**: Structured rules and validation for English Section 8
- **Content**: Mirror French structure with English adaptations

### **Step 3: Create Golden Standard Examples**

#### **3.1 French Golden Example** (`backend/prompts/section8_golden_example.md`)
- **Purpose**: Perfect reference implementation for French Section 8
- **Content**:
  - Professional-grade Section 8 formatting
  - Complete scenario coverage
  - CNESST compliance demonstration
  - Medical accuracy examples

#### **3.2 English Golden Example** (`backend/prompts/section8_golden_example_en.md`)
- **Purpose**: Perfect reference implementation for English Section 8
- **Content**: Mirror French structure with English adaptations

### **Step 4: Create Implementation Class**

#### **4.1 Section8AI.ts** (`backend/src/services/formatter/section8AI.ts`)
- **Purpose**: Processing logic following Section 7 Enhanced pattern
- **Pattern**: 6-step flowchart implementation
- **Content**:
  ```typescript
  export class Section8AIFormatter {
    static async formatSection8Content(
      content: string, 
      language: 'fr' | 'en' = 'fr'
    ): Promise<Section8AIResult> {
      // STEP 1: Load language-specific files
      // STEP 2-4: Construct comprehensive system prompt
      // STEP 5: Call OpenAI with comprehensive prompt
      // STEP 6: Post-processing and validation
    }
  }
  ```

### **Step 5: Template Registry Integration**

#### **5.1 Update Template Registry** (`backend/src/config/templates.ts`)
- **Add Section 8 Enhanced Template**:
  ```typescript
  'section8-ai-formatter': {
    id: 'section8-ai-formatter',
    name: 'Section 8 AI Formatter',
    nameEn: 'Section 8 AI Formatter',
    description: 'Enhanced AI-powered CNESST Section 8 formatting with comprehensive prompt system',
    descriptionEn: 'Enhanced AI-powered CNESST Section 8 formatting with comprehensive prompt system',
    type: 'formatting',
    compatibleSections: ['section_8'],
    compatibleModes: ['mode1', 'mode2', 'mode3'], // Include ambient mode
    supportedLanguages: ['fr', 'en'],
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

### **Step 6: Universal Cleanup Pipeline Integration**

#### **6.1 Update Template Combinations** (`backend/config/layers/template-combinations.json`)
- **Add Section 8 Enhanced Combination**:
  ```json
  {
    "section8-enhanced": {
      "name": "Section 8 Enhanced",
      "description": "Section 8 Enhanced with Universal Cleanup",
      "layers": ["universal-cleanup-layer"],
      "fallback": "template-only"
    }
  }
  ```

#### **6.2 Update Mode2Formatter** (`backend/src/services/formatter/mode2.ts`)
- **Add Section 8 Processing**:
  ```typescript
  private async formatSection8(
    transcript: string, 
    options: Mode2FormattingOptions
  ): Promise<Mode2FormattingResult> {
    // Use Universal Cleanup pipeline
    // Process with Section8AIFormatter
    // Return formatted result with clinical entities
  }
  ```

### **Step 7: Frontend Integration**

#### **7.1 Update Template Config** (`frontend/src/config/template-config.ts`)
- **Add Section 8 Enhanced Template**:
  ```typescript
  {
    id: 'section8-ai-formatter',
    name: 'Section 8 AI Formatter',
    nameFr: 'Section 8 AI Formatter',
    description: 'Enhanced AI-powered CNESST Section 8 formatting',
    descriptionFr: 'Formatage IA avancé pour la Section 8 CNESST',
    type: 'ai-formatter',
    compatibleSections: ['section_8'],
    compatibleModes: ['mode1', 'mode2', 'mode3'],
    language: 'both',
    complexity: 'high',
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: true
    }
  }
  ```

#### **7.2 Update Template Selection**
- **Ensure Section 8 Enhanced appears in template dropdown**
- **Update dictation page template selection**
- **Add to template combination page**

### **Step 8: Testing and Validation**

#### **8.1 Unit Tests**
- **Create Section8AI.test.ts**
- **Test 6-step flowchart implementation**
- **Test bilingual support**
- **Test error handling and fallback**

#### **8.2 Integration Tests**
- **Test with Universal Cleanup pipeline**
- **Test with ambient mode (Mode 3)**
- **Test template selection and processing**
- **Test clinical entity integration**

#### **8.3 Quality Assurance**
- **Validate CNESST compliance**
- **Test medical terminology preservation**
- **Verify citation management**
- **Check bilingual consistency**

---

## 🔄 Integration with Universal Cleanup Pipeline

### **Pipeline Flow**
```
User Input (Ambient Mode) 
    ↓
S1-S5: Raw Transcript
    ↓
S7-S8: Clinical Cleanup Layer
    ↓
Cleaned Transcript + Clinical Entities
    ↓
Template Type Selection
    ↓
Section 8 Enhanced Template
    ↓
Master Prompt + Master JSON + Golden Standard
    ↓
Final Formatted Output
    ↓
Frontend Display
```

### **Key Integration Points**

1. **Input**: Receives `CleanedInput` from Universal Cleanup Layer
2. **Processing**: Uses clinical entities for enhanced formatting
3. **Output**: Returns formatted text with clinical entity metadata
4. **Fallback**: Graceful degradation if Universal Cleanup fails

---

## 📊 Success Criteria

### **Functional Requirements**
- ✅ **Bilingual Support**: French and English prompts and examples
- ✅ **Universal Cleanup Integration**: Uses clinical entities from S7-S8 pipeline
- ✅ **CNESST Compliance**: Meets Section 8 formatting standards
- ✅ **Template Registry**: Properly registered and accessible
- ✅ **Frontend Integration**: Available in template selection

### **Quality Requirements**
- ✅ **Medical Accuracy**: Preserves medical terminology
- ✅ **Professional Formatting**: Matches Section 7 Enhanced quality
- ✅ **Error Handling**: Robust fallback mechanisms
- ✅ **Performance**: Efficient processing with proper logging
- ✅ **Consistency**: Bilingual consistency and cross-template compatibility

### **Technical Requirements**
- ✅ **6-Step Flowchart**: Follows Section 7 Enhanced pattern
- ✅ **OpenAI Integration**: Proper API usage and error handling
- ✅ **Layer System**: Integrates with existing layer architecture
- ✅ **Mode Compatibility**: Works with Mode 1, 2, and 3 (Ambient)
- ✅ **Testing**: Comprehensive unit and integration tests

---

## 🚀 Implementation Timeline

### **Phase 1: Core Files (Ready for User Input)**
1. Create master prompt files (FR/EN)
2. Create JSON configuration files (FR/EN)
3. Create golden example files (FR/EN)

### **Phase 2: Implementation**
4. Create Section8AI.ts implementation class
5. Update template registry
6. Integrate with Universal Cleanup pipeline

### **Phase 3: Frontend Integration**
7. Update frontend template configuration
8. Update template selection components
9. Update dictation page integration

### **Phase 4: Testing and Validation**
10. Create unit tests
11. Create integration tests
12. Quality assurance and validation

---

## 📋 Ready for Implementation

The implementation plan is complete and ready for execution. The structure follows the proven Section 7 Enhanced pattern while ensuring full integration with the Universal Cleanup pipeline.

**Next Steps:**
1. **User provides prompts, JSON, and examples** for Section 8
2. **Implementation begins** with file creation
3. **Integration testing** with Universal Cleanup pipeline
4. **Frontend integration** and template selection
5. **Quality assurance** and validation

The plan ensures that Section 8 Enhanced will be a first-class template in the system, providing the same high-quality formatting as Section 7 Enhanced while leveraging the full power of the Universal Cleanup pipeline for ambient mode users.
