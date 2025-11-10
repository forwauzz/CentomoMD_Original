# Template Combinations System - Comprehensive Review

**Date:** 2024-12-27  
**Purpose:** Complete review of the template combinations system, all layers, and their integration with processing pipelines.

---

## Table of Contents

1. [Overview](#overview)
2. [Template Combinations Architecture](#template-combinations-architecture)
3. [Available Layers](#available-layers)
4. [S1-S5 Pipeline (Mode 3)](#s1-s5-pipeline-mode-3)
5. [Layer Processing Flow](#layer-processing-flow)
6. [Integration Points](#integration-points)
7. [Template Combinations Configuration](#template-combinations-configuration)

---

## Overview

The **Template Combinations System** is a modular layer architecture that allows combining base templates with processing layers. It enables flexible formatting configurations with features like verbatim preservation, voice command processing, clinical extraction, and universal cleanup.

**Key Concept:** A template combination consists of:
- **Base Template** (e.g., `section7-ai-formatter`) - The core formatting template
- **Layer Stack** - Additional processing layers applied in priority order
- **Fallback Chain** - Graceful degradation if layers fail

---

## Template Combinations Architecture

### Layer Manager System

**Location:** `backend/src/services/layers/LayerManager.ts`

**Responsibilities:**
- Load layer configurations from JSON files
- Load template combinations configuration
- Validate template combinations
- Process layers for a template combination
- Manage fallback chains

**Key Methods:**
```typescript
class LayerManager {
  getTemplateCombination(comboName: string): TemplateCombination | null
  getEnabledLayers(comboName: string): LayerConfig[]
  validateCombination(comboName: string): { valid: boolean; errors: string[] }
  getFallbackCombination(comboName: string): string
  async processLayers(transcript: string, comboName: string, options: LayerOptions): Promise<LayerResult[]>
}
```

### Layer Configuration Structure

**Location:** `backend/config/layers/*.json`

Each layer configuration includes:
- `name`: Layer identifier
- `version`: Layer version
- `description`: Layer purpose
- `enabled`: Whether layer is active
- `priority`: Processing order (lower = higher priority)
- `dependencies`: Required layers
- `fallback`: Fallback behavior if layer fails
- `validation`: Validation checks

---

## Available Layers

### 1. Verbatim Layer

**Config:** `backend/config/layers/verbatim-layer.json`  
**Priority:** 1 (highest priority - runs first)  
**Status:** ✅ Enabled

**Purpose:** Preserves exact quotes and specific text that must remain unchanged.

**Features:**
- Pre-processing: Converts verbatim markers to placeholders before AI processing
- Post-processing: Restores verbatim content after AI processing
- Markers: `___VERBATIM_START___` / `___VERBATIM_END___`

**Processing Flow:**
```
Raw Transcript
    ↓
Pre-processing: Convert markers to placeholders
    ↓
AI Processing (placeholders protected)
    ↓
Post-processing: Restore verbatim content
    ↓
Formatted Output (with preserved quotes)
```

**Fallback:** Returns original transcript if verbatim processing fails

**Validation:**
- `marker_pairs_complete`: All start markers have matching end markers
- `content_preserved`: Verbatim content is preserved

---

### 2. Voice Commands Layer

**Config:** `backend/config/layers/voice-commands-layer.json`  
**Priority:** 2  
**Status:** ✅ Enabled

**Purpose:** Converts spoken commands to text replacements (e.g., "open parenthesis" → "(").

**Features:**
- Pre-processing: Converts voice commands to replacements before AI processing
- Command Source: Database (with fallback to default-commands.json)

**Processing Flow:**
```
Raw Transcript
    ↓
Pre-processing: Convert voice commands to replacements
    ↓
AI Processing
    ↓
Formatted Output
```

**Fallback:** Returns transcript unchanged if voice command processing fails

**Validation:**
- `commands_processed`: Voice commands are successfully converted
- `no_orphaned_triggers`: No unmatched voice command triggers

**Note:** This layer is typically used in Smart Dictation (Mode 2), not in Ambient Mode (Mode 3).

---

### 3. Clinical Extraction Layer

**Config:** `backend/config/layers/clinical-extraction-layer.json`  
**Implementation:** `backend/src/services/layers/ClinicalExtractionLayer.ts`  
**Priority:** 10 (lower priority - runs later)  
**Status:** ✅ Enabled

**Purpose:** Extracts clinical entities from French-English medical transcripts.

**Features:**
- Bilingual support (FR/EN input, FR output)
- Clinical entity extraction:
  - Injury location
  - Injury type
  - Onset
  - Pain severity
  - Functional limitations
  - Previous injuries
  - Treatment to date
  - Imaging done
  - Return to work
- Caching (LRU cache, 50 items max)
- S6 pipeline stages:
  - S6.1: Input Preprocessing
  - S6.2: Entity Extraction Engine
  - S6.3: Validation & Cleaning
  - S6.4: Caching for Reuse

**Processing Flow:**
```
Raw Transcript
    ↓
S6.1: Input Preprocessing (clean transcript)
    ↓
S6.2: Entity Extraction (OpenAI GPT-4o-mini)
    ↓
S6.3: Validation & Cleaning
    ↓
S6.4: Cache result (if successful)
    ↓
Clinical Entities JSON
```

**Fallback:** Returns empty clinical entities on extraction failure

**Validation:**
- `transcript_not_empty`: Transcript has content
- `language_supported`: Language is FR or EN
- `openai_api_available`: OpenAI API is accessible

**Note:** This layer is also referred to as "S6" in documentation.

---

### 4. Universal Cleanup Layer

**Config:** `backend/config/layers/universal-cleanup-layer.json`  
**Implementation:** `backend/src/services/layers/UniversalCleanupLayer.ts`  
**Priority:** 1 (highest priority - runs first)  
**Status:** ✅ Enabled

**Purpose:** Clean transcript + extract clinical entities (FR/EN) in a single step.

**Features:**
- Transcript cleaning:
  - Remove timestamps: `[00:12]` or `[01:02:03]`
  - Remove hesitations: `uh`, `um`, `euh`, `hm`
  - Normalize whitespace
- Clinical entity extraction (same as Clinical Extraction Layer)
- Bilingual support (FR/EN input, FR output)
- Caching (30-minute TTL)
- Source tracking: `ambient` or `smart_dictation`

**Processing Flow:**
```
Raw Transcript
    ↓
Text Cleaning (remove timestamps, hesitations, normalize)
    ↓
Clinical Entity Extraction (OpenAI GPT-4o-mini)
    ↓
Return: Cleaned Text + Clinical Entities
```

**Fallback:** Returns cleaned text only if clinical extraction fails

**Validation:**
- `transcript_not_empty`: Transcript has content
- `language_supported`: Language is FR or EN
- `openai_api_available`: OpenAI API is accessible

**Output Structure:**
```typescript
interface CleanedInput {
  cleaned_text: string;
  clinical_entities: ClinicalEntities;
  meta: {
    processing_ms: number;
    source: 'ambient' | 'smart_dictation';
    language: 'fr' | 'en';
    used_cache: boolean;
  };
}
```

---

## S1-S5 Pipeline (Mode 3)

**Note:** S1-S5 pipeline is specific to **Mode 3 (Ambient/Transcribe)** and processes AWS Transcribe JSON results. It is NOT part of the template combinations system, but operates in parallel for Mode 3.

**Location:** `backend/src/services/pipeline/index.ts`

### Pipeline Stages

#### S1: Ingest AWS JSON → IrDialog
- **Purpose:** Convert AWS Transcribe JSON to internal dialog format
- **Input:** AWS Transcribe Result (JSON)
- **Output:** IrDialog (internal representation)

#### S2: Merge Adjacent Turns
- **Purpose:** Consolidate similar speakers and merge adjacent turns
- **Input:** IrDialog
- **Output:** Merged IrDialog

#### S3: Role Mapping
- **Purpose:** Map speakers to roles (PATIENT/CLINICIAN)
- **Input:** IrDialog
- **Output:** RoleMap

#### S4: Cleanup
- **Purpose:** Text normalization and cleanup
- **Profiles:** `default` (fillers/spacing) or `clinical_light` (guarded clinical context)
- **Input:** IrDialog + RoleMap
- **Output:** CleanedDialog

#### S5: Generate Narrative
- **Purpose:** Generate final narrative output
- **Input:** CleanedDialog
- **Output:** NarrativeOutput

**Note:** S1-S5 pipeline is separate from template combinations. Template combinations apply to Mode 2 (Smart Dictation), while S1-S5 applies to Mode 3 (Ambient).

---

## Layer Processing Flow

### Template Combination Processing

**Location:** `backend/src/services/layers/LayerManager.ts:207-226`

**Flow:**
```
1. Get template combination configuration
    ↓
2. Get enabled layers for combination
    ↓
3. Sort layers by priority (lowest first)
    ↓
4. Process each layer in sequence:
   For each layer:
     - Load layer processor
     - Execute layer.process(transcript, options)
     - Collect results
     - Continue even if layer fails (graceful degradation)
    ↓
5. Return layer results array
```

### Layer Processor Interface

**Location:** `backend/src/services/layers/LayerManager.ts:22-24`

```typescript
interface LayerProcessor {
  process(transcript: string, options: LayerOptions): Promise<LayerResult>;
}
```

**LayerResult:**
```typescript
interface LayerResult {
  success: boolean;
  data: any;  // Layer-specific output
  metadata: {
    processingTime: number;
    language: 'fr' | 'en';
    [key: string]: any;
  };
}
```

### Layer Priority System

Layers are processed in priority order (lower number = higher priority):

| Layer | Priority | Processing Order |
|-------|----------|-----------------|
| `verbatim-layer` | 1 | 1st (runs first) |
| `universal-cleanup-layer` | 1 | 1st (runs first) |
| `voice-commands-layer` | 2 | 2nd |
| `clinical-extraction-layer` | 10 | Last |

**Note:** Multiple layers with the same priority are processed in the order they appear in the combination's `layers` array.

---

## Integration Points

### 1. Mode 2 (Smart Dictation) Integration

**Location:** `backend/src/services/formatter/mode2.ts` (referenced in docs)

**Flow:**
```
User selects template combination
    ↓
Mode2Formatter receives templateCombo parameter
    ↓
LayerManager.validateCombination(templateCombo)
    ↓
If valid:
  - Get enabled layers
  - Process each layer in priority order
  - Apply base formatting engine (formatWithGuardrails)
Else:
  - Fallback to original Mode 2 pipeline
```

**Note:** Currently, ProcessingOrchestrator handles template processing but may not fully integrate with LayerManager. This is a gap that should be addressed.

---

### 2. ProcessingOrchestrator Integration

**Location:** `backend/src/services/processing/ProcessingOrchestrator.ts`

**Current State:**
- ProcessingOrchestrator handles template-specific processing (by template ID)
- Template combinations are NOT fully integrated
- Layers are NOT processed through ProcessingOrchestrator

**Gap Identified:** Template combinations and layers should be processed through ProcessingOrchestrator to ensure consistent processing paths.

---

### 3. Transcript Analysis Page Integration

**Location:** `frontend/src/pages/TranscriptAnalysisPage.tsx`

**Current State:**
- Uses `getAllTemplates()` which returns base template configs
- Passes `templateCombo: templateId` where `templateId` is a base template ID
- **NOT using template combinations system** (passes base template IDs, not combination IDs)

**Gap Identified:** Transcript Analysis page should support template combinations, not just base templates.

---

## Template Combinations Configuration

**Location:** `backend/config/layers/template-combinations.json`

### Available Combinations

#### 1. `template-only`
- **Name:** Section 7 Template Only
- **Description:** Basic AI formatting without additional layers
- **Layers:** [] (no layers)
- **Fallback:** `original-mode2`

**Use Case:** Simple template formatting without extra features.

---

#### 2. `template-verbatim`
- **Name:** Section 7 Template + Verbatim
- **Description:** AI formatting with verbatim text support
- **Layers:** [`verbatim-layer`]
- **Fallback:** `template-only`

**Use Case:** Preserve exact quotes while applying AI formatting.

---

#### 3. `template-full`
- **Name:** Section 7 Template + Verbatim + Voice Commands
- **Description:** Full feature set with all layers
- **Layers:** [`verbatim-layer`, `voice-commands-layer`]
- **Fallback:** `template-verbatim`

**Use Case:** Maximum feature set with verbatim preservation and voice command processing.

**Processing Order:**
1. Verbatim layer (priority 1)
2. Voice commands layer (priority 2)
3. Base template formatting

---

#### 4. `universal-cleanup`
- **Name:** Universal Cleanup
- **Description:** Cleanup + Clinical Entity Extraction (FR/EN)
- **Layers:** [`universal-cleanup-layer`]
- **Fallback:** `template-only`

**Use Case:** Clean transcript and extract clinical entities in one step.

**Processing:**
- Removes timestamps and hesitations
- Normalizes whitespace
- Extracts clinical entities
- Returns cleaned text + clinical entities

---

#### 5. `template-clinical-extraction`
- **Name:** Section 7 + Clinical Extraction
- **Description:** Legacy clinical extraction template
- **Layers:** [`universal-cleanup-layer`]
- **Fallback:** `template-only`

**Use Case:** Same as `universal-cleanup` (legacy alias).

---

#### 6. `section8-enhanced`
- **Name:** Section 8 Enhanced
- **Description:** Section 8 Enhanced with Universal Cleanup
- **Layers:** [`universal-cleanup-layer`]
- **Fallback:** `template-only`

**Use Case:** Section 8 formatting with clinical extraction.

---

### Fallback Chain

**Default Combination:** `template-only`

**Fallback Hierarchy:**
```
template-full
  └─> template-verbatim
      └─> template-only
          └─> original-mode2

universal-cleanup
  └─> template-only
      └─> original-mode2

template-clinical-extraction
  └─> template-only
      └─> original-mode2

section8-enhanced
  └─> template-only
      └─> original-mode2
```

**Fallback Logic:** If a template combination fails, the system falls back to the next combination in the chain until it reaches `original-mode2`.

---

## Key Findings & Gaps

### 1. Template Combinations vs Base Templates

**Issue:** Confusion between:
- **Template Combinations** (e.g., `template-full`) - Layer configurations
- **Base Templates** (e.g., `section7-ai-formatter`) - Core formatting templates

**Current State:**
- Transcript Analysis page uses base template IDs
- Backend expects template combinations in some places
- ProcessingOrchestrator routes by base template ID, not combination ID

**Recommendation:** Clarify the distinction and ensure consistent usage throughout the system.

---

### 2. Layer Integration with ProcessingOrchestrator

**Issue:** Layers are NOT processed through ProcessingOrchestrator.

**Current State:**
- ProcessingOrchestrator handles template-specific processing
- Layers are managed by LayerManager
- No integration between the two

**Recommendation:** Integrate LayerManager with ProcessingOrchestrator so layers are applied during template processing.

---

### 3. Transcript Analysis Page Template Selection

**Issue:** Transcript Analysis page does NOT use template combinations.

**Current State:**
- Page uses `getAllTemplates()` which returns base templates
- Passes `templateCombo: templateId` where `templateId` is a base template ID
- Backend may not recognize this as a template combination

**Recommendation:** 
- Add template combination selection to Transcript Analysis page
- Pass actual template combination IDs (e.g., `template-full`)
- Support both base templates and template combinations

---

### 4. S1-S5 Pipeline Separation

**Issue:** S1-S5 pipeline (Mode 3) is separate from template combinations (Mode 2).

**Current State:**
- S1-S5 processes AWS Transcribe results for Mode 3
- Template combinations process transcripts for Mode 2
- No overlap or integration

**Recommendation:** Document this separation clearly. They serve different purposes:
- **S1-S5:** Mode 3 (Ambient) - AWS Transcribe processing
- **Template Combinations:** Mode 2 (Smart Dictation) - Layer-based formatting

---

## Summary

The Template Combinations System provides a modular, flexible approach to template processing with layers. However, there are integration gaps that need to be addressed:

1. **Clarify template vs combination distinction**
2. **Integrate layers with ProcessingOrchestrator**
3. **Support template combinations in Transcript Analysis page**
4. **Document S1-S5 pipeline separation**

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-27  
**Author:** System Review

