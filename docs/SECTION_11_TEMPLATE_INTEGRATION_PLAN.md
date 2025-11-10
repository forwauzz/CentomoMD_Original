# Section 11 Template Integration Plan

**Date:** 2025-01-09  
**Purpose:** Integrate Section 11 artifacts with template system to work like Section 7/8

---

## Overview

Section 11 currently uses direct filesystem access for artifacts. We need to integrate it with the `PromptBundleResolver` system (like Section 7) to support versioning, remote storage, and consistent artifact loading.

---

## Implementation Steps

### Step 1: Create `resolveSection11RdPaths()` in PromptBundleResolver

**File:** `backend/src/services/artifacts/PromptBundleResolver.ts`

**Pattern:** Follow `resolveSection7RdPaths()` structure

**Artifacts to resolve:**
- `master_config` → `backend/configs/master_prompt_section11.json`
- `schema` → `prompts/section11_schema.json`
- `logicmap` → `prompts/section11_logicmap.yaml`
- `master_prompt` → `prompts/section11_master.fr.md`
- `golden_cases` → `training/section11_examples.jsonl`

**Manifest structure:**
```json
{
  "defaultVersion": "current",
  "versions": {
    "current": {
      "rd": {
        "master_config": "backend/configs/master_prompt_section11.json",
        "schema": "prompts/section11_schema.json",
        "logicmap": "prompts/section11_logicmap.yaml",
        "master_prompt": "prompts/section11_master.fr.md",
        "golden_cases": "training/section11_examples.jsonl"
      }
    }
  }
}
```

---

### Step 2: Update Section11RdService to use resolver

**File:** `backend/src/services/section11RdService.ts`

**Changes:**
- Replace direct filesystem access in `loadArtifacts()` with `resolveSection11RdPaths()`
- Support version parameter
- Support remote storage (if flag enabled)

**Before:**
```typescript
private async loadArtifacts(_templateVersion?: string): Promise<{...}> {
  const schemaPath = path.join(this.pipelineDir, 'prompts', 'section11_schema.json');
  const logicmapPath = path.join(this.pipelineDir, 'prompts', 'section11_logicmap.yaml');
  // ... direct filesystem access
}
```

**After:**
```typescript
private async loadArtifacts(templateVersion?: string): Promise<{...}> {
  const { resolveSection11RdPaths } = await import('../artifacts/PromptBundleResolver.js');
  const paths = await resolveSection11RdPaths(templateVersion);
  
  // Load from resolved paths
  const schema = JSON.parse(await fs.readFile(paths.schemaPath, 'utf-8'));
  const logicmap = yaml.load(await fs.readFile(paths.logicmapPath, 'utf-8'));
  // ...
}
```

---

### Step 3: Register Section 11 in backend template registry

**File:** `backend/src/config/templates.ts`

**Add:**
```typescript
'section11-rd': {
  id: 'section11-rd',
  name: 'Section 11 - R&D Pipeline',
  nameEn: 'Section 11 - R&D Pipeline',
  description: 'Section 11 - Conclusion (R&D Pipeline with multi-section synthesis)',
  descriptionEn: 'Section 11 - Conclusion (R&D Pipeline with multi-section synthesis)',
  type: 'formatting',
  compatibleSections: ['section_11'],
  compatibleModes: ['mode2', 'mode3'],
  supportedLanguages: ['fr'],
  content: {
    structure: 'cnesst-section11-rd',
    placeholders: ['synthesis', 'consolidation_logic', 'multi_section_data'],
    validationRules: ['cnesst_compliance', 'rd_pipeline_validation', 'synthesis_validation']
  },
  features: {
    verbatimSupport: false,
    voiceCommandsSupport: false,
    aiFormatting: true,
    postProcessing: true,
    realtimeProcessing: false, // Synthesis, not real-time
    comprehensivePrompts: true,
    languageAware: true,
    metadataTracking: true
  },
  configuration: {
    priority: 5,
    timeout: 90,
    retryAttempts: 2,
    fallbackTemplate: undefined, // No fallback for synthesis
    promptFiles: ['rd_pipeline', 'schema', 'logicmap', 'master_prompt']
  },
  metadata: {
    category: 'section_specific',
    tags: ['section-11', 'cnesst', 'rd', 'pipeline', 'synthesis', 'multi-section'],
    version: '1.0.0',
    author: 'CentomoMD R&D Team',
    implementation: 'rd-pipeline'
  }
}
```

---

### Step 4: Add ProcessingOrchestrator routing

**File:** `backend/src/services/processing/ProcessingOrchestrator.ts`

**Add routing in `applyTemplateProcessing()`:**
```typescript
// Handle Section 11 R&D Pipeline template
if (template.id === 'section11-rd') {
  console.log(`[${correlationId}] Routing to processSection11Rd`);
  return await this.processSection11Rd(content, template, request);
}
```

**Add method:**
```typescript
/**
 * Process Section 11 R&D Pipeline template
 */
private async processSection11Rd(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
  const correlationId = request.correlationId || 'no-correlation-id';
  
  try {
    console.log(`[${correlationId}] Processing Section 11 R&D Pipeline template: ${template.id}`);
    
    // Section 11 requires structured JSON input, not raw text
    // Parse content as JSON
    let inputData: any;
    try {
      inputData = JSON.parse(content);
    } catch (parseError) {
      console.error(`[${correlationId}] Section 11 requires JSON input, got text`);
      throw new Error('Section 11 template requires structured JSON input, not raw text');
    }
    
    // Import Section 11 R&D service
    const { Section11RdService } = await import('../../services/section11RdService.js');
    const section11Service = new Section11RdService();
    
    // Process input through Section 11 R&D pipeline
    const result = await section11Service.processInput(
      inputData,
      request.model,
      request.temperature,
      request.seed,
      request.templateVersion
    );
    
    if (!result.success) {
      console.error(`[${correlationId}] Section 11 R&D pipeline failed`);
      return content; // Return original on failure
    }
    
    const processedContent = result.formattedText;
    
    // Log compliance issues if any
    if (result.compliance.failedRules.length > 0) {
      console.warn(`[${correlationId}] Section 11 compliance issues:`, result.compliance.failedRules);
    }
    
    console.log(`[${correlationId}] Section 11 R&D pipeline completed`, {
      originalLength: JSON.stringify(inputData).length,
      processedLength: processedContent.length,
      templateId: template.id,
      hasIssues: result.compliance.failedRules.length > 0
    });
    
    return processedContent;
  } catch (error) {
    console.error(`[${correlationId}] Section 11 R&D pipeline error:`, error);
    // Return original content if processing fails
    return content;
  }
}
```

**Note:** Section 11 is different - it requires structured JSON input, not raw text. This is a key architectural difference.

---

### Step 5: Implement TemplatePipeline.processSection11()

**File:** `backend/src/services/formatter/TemplatePipeline.ts`

**Replace stub with real implementation:**
```typescript
private async processSection11(
  cleanedInput: CleanedInput,
  options: TemplatePipelineOptions
): Promise<TemplatePipelineResult> {
  const issues: string[] = [];
  
  try {
    // Section 11 requires structured JSON input from S1-S10
    // This is different from Section 7/8 which format raw transcript
    
    // For dictation mode, we need to extract structured data from the transcript
    // This is a synthesis operation, not formatting
    
    // TODO: Extract structured data from transcript for Section 11 synthesis
    // For now, return cleaned text with note that Section 11 requires structured input
    
    issues.push('Section 11 requires structured JSON input from S1-S10, not raw transcript. Use case form generation instead.');
    
    return {
      formatted: cleanedInput.cleaned_text,
      issues,
      confidence_score: 0.5,
      clinical_entities: cleanedInput.clinical_entities
    };
  } catch (error) {
    issues.push(`Section 11 processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      formatted: cleanedInput.cleaned_text,
      issues,
      confidence_score: 0,
      clinical_entities: cleanedInput.clinical_entities
    };
  }
}
```

**Note:** Section 11 is fundamentally different - it synthesizes structured data, not formats raw transcript. Dictation mode may not be applicable.

---

## Key Differences from Section 7/8

### Section 7/8 Pattern
- **Input:** Raw transcript text
- **Process:** Format transcript → formatted text
- **Use Case:** Dictation mode
- **Template:** Applied during transcription

### Section 11 Pattern
- **Input:** Structured JSON from S1-S10
- **Process:** Synthesize JSON → formatted conclusion
- **Use Case:** Case form generation
- **Template:** Applied during generation

### Architectural Implications

1. **Section 11 cannot be used in dictation mode** (requires structured JSON, not raw text)
2. **Section 11 uses synthesis, not formatting** (different operation)
3. **Section 11 requires data extraction** from S1-S10 before processing
4. **Section 11 has consolidation logic** (true/false branching via logicmap)

---

## Implementation Order

1. ✅ **Step 1:** Create `resolveSection11RdPaths()` in PromptBundleResolver
2. ✅ **Step 2:** Update Section11RdService to use resolver
3. ✅ **Step 3:** Register Section 11 in backend template registry
4. ✅ **Step 4:** Add ProcessingOrchestrator routing
5. ✅ **Step 5:** Implement TemplatePipeline.processSection11() (with note about limitations)

---

## Testing Checklist

- [ ] `resolveSection11RdPaths()` loads artifacts from manifest
- [ ] `resolveSection11RdPaths()` supports version parameter
- [ ] `resolveSection11RdPaths()` falls back to filesystem if manifest missing
- [ ] Section11RdService uses resolver instead of direct filesystem access
- [ ] Section 11 template appears in backend registry
- [ ] ProcessingOrchestrator routes `section11-rd` template correctly
- [ ] TemplatePipeline.processSection11() handles Section 11 appropriately
- [ ] Case form generation still works (existing functionality)
- [ ] Artifacts load correctly with versioning support

---

## Notes

- Section 11 is **synthesis-based**, not **formatting-based**
- Section 11 requires **structured JSON input**, not **raw transcript**
- Section 11 may not be applicable to **dictation mode** (different use case)
- Section 11 should work in **case form generation** (existing functionality)
- Integration with template system enables **versioning** and **remote storage** support

