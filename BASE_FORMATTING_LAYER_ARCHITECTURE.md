# Base Formatting Layer Architecture

## Overview

Yes, there **IS** a sophisticated base formatting layer that both Smart Dictation (Mode 2) and Transcribe (Mode 3) build upon. The architecture is well-designed with multiple layers of abstraction and shared components.

## 🏗️ **Base Formatting Layer Components**

### **1. Core Shared Formatting Engine**

#### **File**: `backend/src/services/formatter/shared.ts`

```typescript
/**
 * Main formatting function with guardrails
 * This is the core function that implements Phase 2 requirements
 */
export async function formatWithGuardrails(
  section: '7' | '8' | '11',
  language: 'fr' | 'en',
  input: string,
  extra?: string,
  options?: { nameWhitelist?: string[] }
): Promise<FormattingResult>
```

**This is the foundational formatting engine that provides:**
- **OpenAI Integration**: Centralized AI formatting with consistent prompts
- **Guardrails System**: Validation and compliance checking
- **Name Whitelist Protection**: Prevents AI from inventing names
- **Post-Processing Pipeline**: Quote thinning, paragraph formatting, etc.
- **Section-Specific Processing**: Different rules for Sections 7, 8, 11

### **2. Layer Management System**

#### **File**: `backend/src/services/layers/LayerManager.ts`

```typescript
export class LayerManager {
  // Manages template combinations and layer configurations
  getEnabledLayers(comboName: string): LayerConfig[]
  validateCombination(comboName: string): { valid: boolean; errors: string[] }
  getTemplateCombination(comboName: string): TemplateCombination | null
}
```

**Provides modular layer system:**
- **Verbatim Layer**: Text protection and verbatim handling
- **Voice Commands Layer**: Command processing and execution
- **Template Combinations**: Configurable feature combinations
- **Fallback Mechanisms**: Graceful degradation when layers fail

### **3. AI Formatting Service**

#### **File**: `backend/src/services/aiFormattingService.ts`

```typescript
export class AIFormattingService {
  static async formatTemplateContent(content: string, options: FormattingOptions): Promise<FormattedContent>
  // Section-specific formatting methods
  private static formatSection7(content: string, changes: string[], options: FormattingOptions): string
  private static formatSection8(content: string, changes: string[], options: FormattingOptions): string
  private static formatSection11(content: string, changes: string[], options: FormattingOptions): string
}
```

**Provides high-level formatting orchestration:**
- **Section-Specific Rules**: Different formatting for each medical section
- **Language Support**: French and English formatting rules
- **Compliance Validation**: CNESST and medical standards
- **Statistics Generation**: Word counts, medical terms, compliance scores

## 🔄 **How Modes Build on the Base Layer**

### **Mode 2 (Smart Dictation) Architecture**

```typescript
// backend/src/services/formatter/mode2.ts
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
    const enabledLayers = this.layerManager.getEnabledLayers(templateCombo);
    // Process each layer in priority order
    // Apply shared formatting engine at the end
  }
}
```

**Mode 2 builds on base layer by:**
1. **Using `formatWithGuardrails`** - The core shared formatting engine
2. **Adding Layer Management** - Modular verbatim and voice command processing
3. **Template Combinations** - Configurable feature sets
4. **Fallback Mechanisms** - Graceful degradation to base formatting

### **Mode 3 (Transcribe) - Proposed Architecture**

```typescript
// Proposed: backend/src/services/formatter/mode3.ts
export class Mode3Formatter {
  private mode2Formatter: Mode2Formatter; // Reuse Mode 2's layer system

  async format(transcript: string, options: Mode3FormattingOptions): Promise<Mode3FormattingResult> {
    // Step 1: Multi-speaker processing (Mode 3 specific)
    const speakerTokens = this.parseSpeakerTokens(transcript);
    const cleanedTokens = this.mergeAndCleanTokens(speakerTokens);
    const roleAttribution = this.identifySpeakerRoles(cleanedTokens);
    const narrative = this.buildNarrative(cleanedTokens, roleAttribution);
    
    // Step 2: Use Mode 2 formatter (which uses base layer)
    const mode2Result = await this.mode2Formatter.format(narrative, {
      language: options.language,
      section: options.section,
      // ... other options
    });

    return {
      formatted: mode2Result.formatted,
      issues: mode2Result.issues,
      speaker_attribution: roleAttribution
    };
  }
}
```

**Mode 3 will build on base layer by:**
1. **Pre-processing** - Multi-speaker diarization and narrative building
2. **Delegating to Mode 2** - Reusing Mode 2's layer management and base formatting
3. **Adding Speaker Attribution** - Mode 3 specific metadata

## 📊 **Formatting Pipeline Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    BASE FORMATTING LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  formatWithGuardrails() - Core AI formatting engine             │
│  ├── OpenAI Integration                                         │
│  ├── Guardrails System                                         │
│  ├── Name Whitelist Protection                                 │
│  ├── Post-Processing Pipeline                                  │
│  └── Section-Specific Rules                                    │
├─────────────────────────────────────────────────────────────────┤
│  LayerManager - Modular feature system                         │
│  ├── Verbatim Layer                                            │
│  ├── Voice Commands Layer                                      │
│  ├── Template Combinations                                     │
│  └── Fallback Mechanisms                                       │
├─────────────────────────────────────────────────────────────────┤
│  AIFormattingService - High-level orchestration                │
│  ├── Section-Specific Formatting                               │
│  ├── Language Support                                          │
│  ├── Compliance Validation                                     │
│  └── Statistics Generation                                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MODE-SPECIFIC LAYERS                         │
├─────────────────────────────────────────────────────────────────┤
│  Mode 2 (Smart Dictation)                                      │
│  ├── Uses formatWithGuardrails() directly                      │
│  ├── Adds LayerManager for modular features                    │
│  ├── Template combination support                              │
│  └── Fallback to base formatting                               │
├─────────────────────────────────────────────────────────────────┤
│  Mode 3 (Transcribe) - Proposed                                │
│  ├── Multi-speaker pre-processing                              │
│  ├── Delegates to Mode2Formatter                               │
│  ├── Adds speaker attribution                                  │
│  └── Inherits all base layer features                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 **Shared Components Available to All Modes**

### **1. Core Formatting Engine**
- **`formatWithGuardrails()`** - The main AI formatting function
- **OpenAI Integration** - Consistent API calls and error handling
- **Prompt System** - Master prompts, golden examples, guardrails
- **Post-Processing** - Quote thinning, paragraph formatting, name protection

### **2. Validation and Compliance**
- **Guardrails System** - JSON-based validation rules
- **Name Whitelist Protection** - Prevents AI from inventing names
- **Compliance Checking** - CNESST and medical standards
- **Error Handling** - Graceful fallbacks and error reporting

### **3. Layer Management**
- **Modular Architecture** - Pluggable feature layers
- **Template Combinations** - Configurable feature sets
- **Dependency Management** - Layer ordering and validation
- **Fallback Mechanisms** - Graceful degradation

### **4. Section-Specific Processing**
- **Section 7** - Historical narrative formatting
- **Section 8** - Clinical examination formatting
- **Section 11** - Conclusion and recommendations
- **Language Support** - French and English rules

## 🔧 **Implementation Benefits**

### **For Smart Dictation (Mode 2)**
- ✅ **Already Uses Base Layer** - `formatWithGuardrails()` is the core
- ✅ **Layer Management** - Modular verbatim and voice command processing
- ✅ **Template Combinations** - Configurable feature sets
- ✅ **Fallback Support** - Graceful degradation when layers fail

### **For Transcribe (Mode 3)**
- ✅ **Can Reuse Mode 2** - Inherit all base layer functionality
- ✅ **Add Multi-Speaker Processing** - Mode 3 specific pre-processing
- ✅ **Speaker Attribution** - Additional metadata for diarization
- ✅ **Same Quality Output** - Same AI formatting and compliance

### **For Future Modes**
- ✅ **Consistent Architecture** - All modes use same base layer
- ✅ **Modular Design** - Easy to add new features
- ✅ **Quality Assurance** - Shared validation and compliance
- ✅ **Maintainability** - Single source of truth for formatting logic

## 📋 **Template System Integration**

### **Template Processing Flow**
```
Template Selection → Mode Processing → Base Formatting → Output
       │                    │              │
       ▼                    ▼              ▼
  Template Config    Mode-Specific    formatWithGuardrails()
  ├── Section        Processing       ├── OpenAI Integration
  ├── Language       ├── Mode 1:      ├── Guardrails System
  ├── Compatible     │   Word-for-    ├── Name Protection
  │   Modes          │   Word         ├── Post-Processing
  └── Processing     ├── Mode 2:      └── Validation
      Mode           │   Smart Dict.  
                     └── Mode 3:      
                         Transcribe   
```

### **Template Configuration**
```typescript
// All templates can use any mode that supports their section
{
  id: 'section7_template',
  section: '7',
  compatibleModes: ['mode1', 'mode2', 'mode3'], // All modes supported
  processingMode: 'mode2', // Default processing mode
  // ... other config
}
```

## 🚀 **Recommendations for Mode 3 Implementation**

### **1. Leverage Existing Architecture**
- **Use Mode2Formatter** - Don't reinvent the wheel
- **Add Pre-processing** - Multi-speaker diarization before Mode 2
- **Inherit Base Layer** - Get all formatting quality for free

### **2. Extend Layer System**
- **Add Speaker Layer** - New layer for speaker attribution
- **Template Combinations** - Mode 3 specific combinations
- **Fallback Support** - Graceful degradation to Mode 2

### **3. Maintain Consistency**
- **Same Output Quality** - Use same AI formatting engine
- **Same Validation** - Use same guardrails and compliance
- **Same Error Handling** - Use same fallback mechanisms

## ✅ **Conclusion**

**Yes, there is a robust base formatting layer** that provides:

1. **Core AI Formatting Engine** (`formatWithGuardrails`)
2. **Modular Layer System** (`LayerManager`)
3. **High-level Orchestration** (`AIFormattingService`)
4. **Section-Specific Processing** (Sections 7, 8, 11)
5. **Validation and Compliance** (Guardrails, name protection)
6. **Template Integration** (Configurable processing modes)

**Mode 2 (Smart Dictation)** already uses this base layer extensively and adds modular features on top.

**Mode 3 (Transcribe)** should be implemented to:
1. **Add multi-speaker pre-processing** (Mode 3 specific)
2. **Delegate to Mode2Formatter** (inherit base layer)
3. **Add speaker attribution** (Mode 3 specific metadata)

This architecture ensures **consistent quality**, **maintainable code**, and **extensible design** across all modes while allowing each mode to add its specific functionality on top of the solid foundation.
