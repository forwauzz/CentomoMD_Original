# New Template Creation Guide

This guide walks you through creating a new template with versioning support.

## Overview

When creating a new template, you need to:

1. **Create template artifacts** (prompts, configs, examples)
2. **Create manifest.json** (defines artifact paths and versions)
3. **Register template** in `TEMPLATE_REGISTRY` (backend configuration)
4. **Implement processing logic** (optional, if new service needed)
5. **Upload bundle** (optional, for remote storage)

---

## Step 1: Create Template Artifacts

### 1.1 Create Directory Structure

Create a directory for your template artifacts:

```bash
prompts/
  {templateId}/           # e.g., section9, custom-template
    manifest.json          # Required: Defines artifact paths
    artifacts/             # Optional: Organize artifacts here
      master.md
      config.json
      golden_example.md
```

**Example for Section 9:**

```bash
prompts/
  section9/
    manifest.json
    backend/
      prompts/
        section9_master.md
        section9_master.json
        section9_golden_example.md
```

### 1.2 Create Artifact Files

Create your template artifacts:

- **Master Prompt** (`master.md`): Main prompt template
- **JSON Config** (`master.json`): Configuration/metadata
- **Golden Example** (`golden_example.md`): Example output
- **Additional files** as needed (XML, JSONL, etc.)

**Example structure:**

```
prompts/section9/
  backend/
    prompts/
      section9_master.md          # Main prompt
      section9_master.json        # JSON config
      section9_golden_example.md  # Example output
      section9_master_en.md       # English version (optional)
      section9_master_en.json     # English config (optional)
```

---

## Step 2: Create Manifest.json

Create `prompts/{templateId}/manifest.json` to define artifact paths and versions.

### 2.1 Basic Manifest Structure

```json
{
  "defaultVersion": "current",
  "versions": {
    "current": {
      "ai_formatter": {
        "fr": {
          "master": "backend/prompts/section9_master.md",
          "json": "backend/prompts/section9_master.json",
          "golden": "backend/prompts/section9_golden_example.md"
        },
        "en": {
          "master": "backend/prompts/section9_master_en.md",
          "json": "backend/prompts/section9_master_en.json",
          "golden": "backend/prompts/section9_golden_example_en.md"
        }
      }
    }
  }
}
```

### 2.2 Manifest Structure Explained

**Top Level:**
- `defaultVersion`: Default version to use (e.g., `"current"`, `"1.0.0"`)
- `versions`: Object mapping version IDs to artifact configurations

**Version Object:**
- `ai_formatter`: For AI formatting templates
- `rd`: For R&D pipeline templates (optional)
- Other template types as needed

**Language Object (`fr`, `en`):**
- `master`: Path to master prompt (relative to repo root)
- `json`: Path to JSON config (relative to repo root)
- `golden`: Path to golden example (relative to repo root)
- Additional artifact types as needed

### 2.3 Multiple Versions Example

```json
{
  "defaultVersion": "1.0.0",
  "versions": {
    "1.0.0": {
      "ai_formatter": {
        "fr": {
          "master": "backend/prompts/section9_master_v1.md",
          "json": "backend/prompts/section9_master_v1.json",
          "golden": "backend/prompts/section9_golden_example_v1.md"
        }
      }
    },
    "2.0.0": {
      "ai_formatter": {
        "fr": {
          "master": "backend/prompts/section9_master_v2.md",
          "json": "backend/prompts/section9_master_v2.json",
          "golden": "backend/prompts/section9_golden_example_v2.md"
        }
      }
    }
  }
}
```

### 2.4 R&D Pipeline Example

If your template uses the R&D pipeline (like Section 7 R&D):

```json
{
  "defaultVersion": "current",
  "versions": {
    "current": {
      "rd": {
        "master_config": "backend/configs/master_prompt_section9.json",
        "system_xml": "backend/prompts/system_section9_fr.xml",
        "plan_xml": "backend/prompts/plan_section9_fr.xml",
        "golden_cases": "backend/training/golden_cases_section9.jsonl"
      }
    }
  }
}
```

---

## Step 3: Register Template in TEMPLATE_REGISTRY

Add your template to `backend/src/config/templates.ts`:

### 3.1 Basic Template Registration

```typescript
export const TEMPLATE_REGISTRY: TemplateRegistry = {
  // ... existing templates ...
  
  'section9-ai-formatter': {
    id: 'section9-ai-formatter',
    name: 'Section 9 AI Formatter',
    nameEn: 'Section 9 AI Formatter',
    description: 'Formatage Section 9 avec IA',
    descriptionEn: 'Section 9 formatting with AI',
    type: 'formatting',
    compatibleSections: ['section_9'],
    compatibleModes: ['mode2'], // or ['mode1', 'mode2']
    supportedLanguages: ['fr', 'en'],
    content: {
      structure: 'ai_formatting',
      placeholders: ['content', 'metadata'],
      validationRules: ['cnesst_compliance', 'section9_specific']
    },
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: true,
      realtimeProcessing: false,
      comprehensivePrompts: true,
      languageAware: true
    },
    configuration: {
      priority: 1,
      timeout: 60,
      retryAttempts: 3,
      promptFiles: ['master_prompt', 'json_config', 'golden_example']
    },
    metadata: {
      category: 'section_9',
      tags: ['section9', 'ai_formatting', 'cnesst'],
      version: '1.0.0',
      author: 'your-name'
    }
  }
};
```

### 3.2 Template Configuration Fields

**Required Fields:**
- `id`: Unique template identifier (e.g., `'section9-ai-formatter'`)
- `name`: Display name (French)
- `nameEn`: Display name (English)
- `description`: Description (French)
- `descriptionEn`: Description (English)
- `type`: Template type (`'content' | 'formatting' | 'processing' | 'combination'`)
- `compatibleSections`: Array of section IDs this template works with
- `compatibleModes`: Array of mode IDs this template works with
- `supportedLanguages`: Array of language codes (`['fr', 'en']`)

**Optional Fields:**
- `configuration.promptFiles`: List of prompt file types (for versioning)
- `metadata`: Additional metadata (version, author, tags, etc.)

---

## Step 4: Implement Processing Logic (If Needed)

### 4.1 If Using Existing Service

If your template uses an existing service (e.g., `Section7AIFormatter`), you may need to:

1. **Add template routing** in `ProcessingOrchestrator.ts`
2. **Update service** to handle new template ID
3. **Wire up version selection** if using versioning

**Example in `ProcessingOrchestrator.ts`:**

```typescript
// In applyTemplateProcessing() method (around line 403)
if (template.id === 'section9-ai-formatter') {
  console.log(`[${correlationId}] Routing to processSection9AIFormatter`);
  return await this.processSection9AIFormatter(content, template, request);
}
```

**Note:** If you're reusing an existing service (like `Section7AIFormatter`), you can route multiple template IDs to the same service:

```typescript
// Route both section7 and section9 to same service
if (template.id === 'section7-ai-formatter' || template.id === 'section9-ai-formatter') {
  console.log(`[${correlationId}] Routing to processSection7AIFormatter`);
  return await this.processSection7AIFormatter(content, template, request);
}
```

### 4.2 If Creating New Service

If you need a new processing service:

1. **Create service file** (e.g., `backend/src/services/formatter/section9AI.ts`)
2. **Implement formatting logic** similar to `section7AI.ts`
3. **Use `PromptBundleResolver`** for versioned artifacts:

```typescript
import { resolveSection9AiPaths } from '../artifacts/PromptBundleResolver.js';

// In your service:
const paths = await resolveSection9AiPaths(language, templateVersion);
const masterPrompt = readFileSync(paths.masterPromptPath, 'utf8');
const jsonConfig = JSON.parse(readFileSync(paths.jsonConfigPath, 'utf8'));
const goldenExample = readFileSync(paths.goldenExamplePath, 'utf8');
```

### 4.3 Add Resolver Functions

If creating a new template type, add resolver functions to `PromptBundleResolver.ts`:

```typescript
export async function resolveSection9AiPaths(
  language: Language = 'fr',
  version?: string
): Promise<Section9AiPaths> {
  // Similar to resolveSection7AiPaths
  // Returns paths for master, json, golden based on manifest
}
```

---

## Step 5: Upload Bundle (Optional)

### 5.1 Upload via CLI Script

Upload your template bundle to Supabase Storage:

```bash
cd backend
npx tsx scripts/upload-template-bundle.ts {bundleName} {version} [--set-default]
```

**Example:**

```bash
# Upload Section 9 AI Formatter
npx tsx scripts/upload-template-bundle.ts section9-ai-formatter current --set-default

# Upload all bundles for Section 9
npx tsx scripts/upload-template-bundle.ts all current --set-default
```

**Bundle Name Convention:**
- `{templateId}-ai-formatter` → e.g., `section9-ai-formatter`
- `{templateId}-rd` → e.g., `section9-rd`
- Or custom bundle name

### 5.2 Upload via UI

1. Navigate to **Templates → Bundle Management** tab
2. Fill in:
   - **Bundle Name**: e.g., `section9-ai-formatter`
   - **Version**: e.g., `current` or `1.0.0`
   - **Set as Default**: ✓ (optional)
   - **Artifacts**: Select files (master.md, config.json, golden.md)
3. Click **Upload Bundle**

### 5.3 Verify Upload

Check that bundles are uploaded:

```bash
# List bundles
curl http://localhost:3001/api/templates/bundles

# Get specific bundle
curl http://localhost:3001/api/templates/bundles/section9-ai-formatter
```

---

## Step 6: Test Your Template

### 6.1 Test via ProcessingOrchestrator

```typescript
import { ProcessingOrchestrator } from './services/processing/ProcessingOrchestrator.js';

const orchestrator = new ProcessingOrchestrator();
const result = await orchestrator.processContent({
  sectionId: 'section_9',
  modeId: 'mode2',
  templateId: 'section9-ai-formatter',
  language: 'fr',
  content: 'Your test transcript here',
  templateVersion: 'current' // Optional: specify version
});
```

### 6.2 Test via API

```bash
# Format endpoint
curl -X POST http://localhost:3001/api/format/mode2 \
  -H "Content-Type: application/json" \
  -d '{
    "sectionId": "section_9",
    "templateId": "section9-ai-formatter",
    "language": "fr",
    "content": "Your test transcript",
    "templateVersion": "current"
  }'
```

### 6.3 Test Version Selection

Test with different versions:

```bash
# Use default version
curl -X POST ... -d '{"templateVersion": null}'

# Use specific version
curl -X POST ... -d '{"templateVersion": "1.0.0"}'

# Use version alias
curl -X POST ... -d '{"templateVersion": "latest"}'
curl -X POST ... -d '{"templateVersion": "stable"}'
```

---

## Checklist

### ✅ Template Creation Checklist

- [ ] Created directory structure: `prompts/{templateId}/`
- [ ] Created manifest.json with artifact paths
- [ ] Created artifact files (master.md, config.json, golden.md)
- [ ] Registered template in `TEMPLATE_REGISTRY`
- [ ] Implemented processing logic (if needed)
- [ ] Added resolver functions (if new template type)
- [ ] Tested template processing
- [ ] Uploaded bundle to Supabase (optional)
- [ ] Verified version selection works
- [ ] Updated frontend config (if needed)

---

## Examples

### Example 1: Section 9 AI Formatter

**Directory:**
```
prompts/section9/
  manifest.json
  backend/
    prompts/
      section9_master.md
      section9_master.json
      section9_golden_example.md
```

**Manifest:**
```json
{
  "defaultVersion": "current",
  "versions": {
    "current": {
      "ai_formatter": {
        "fr": {
          "master": "backend/prompts/section9_master.md",
          "json": "backend/prompts/section9_master.json",
          "golden": "backend/prompts/section9_golden_example.md"
        }
      }
    }
  }
}
```

**Template ID:** `section9-ai-formatter`

### Example 2: Custom Template with Multiple Versions

**Manifest:**
```json
{
  "defaultVersion": "2.0.0",
  "versions": {
    "1.0.0": {
      "ai_formatter": {
        "fr": {
          "master": "backend/prompts/custom_master_v1.md",
          "json": "backend/prompts/custom_config_v1.json",
          "golden": "backend/prompts/custom_golden_v1.md"
        }
      }
    },
    "2.0.0": {
      "ai_formatter": {
        "fr": {
          "master": "backend/prompts/custom_master_v2.md",
          "json": "backend/prompts/custom_config_v2.json",
          "golden": "backend/prompts/custom_golden_v2.md"
        }
      }
    }
  }
}
```

---

## Troubleshooting

### Template Not Found

**Error:** `Template not found: section9-ai-formatter`

**Solution:**
1. Check template is registered in `TEMPLATE_REGISTRY`
2. Verify template ID matches exactly
3. Restart backend server

### Artifacts Not Found

**Error:** `[PROOF] template=section9 version=current source=filesystem status=fallback`

**Solution:**
1. Check manifest.json paths are correct (relative to repo root)
2. Verify artifact files exist at specified paths
3. Check manifest structure matches expected format

### Version Selection Not Working

**Error:** Version parameter ignored, using default

**Solution:**
1. Ensure `FEATURE_TEMPLATE_VERSION_SELECTION=true` in `.env`
2. Restart backend server
3. Check resolver function exists for your template type
4. Verify version exists in manifest.json

### Bundle Upload Fails

**Error:** `Bundle not found` or `Artifacts missing`

**Solution:**
1. Verify manifest.json exists at `prompts/{templateId}/manifest.json`
2. Check artifact files exist at paths specified in manifest
3. Verify bundle name matches template ID pattern
4. Check Supabase credentials are configured

---

## Next Steps

1. **Test with real transcripts** - Verify formatting quality
2. **Iterate on prompts** - Improve based on results
3. **Create new versions** - Add to manifest as needed
4. **Rollback if needed** - Use version selection UI to switch versions
5. **Monitor usage** - Track template performance and errors

---

## Summary

Creating a new template involves:

1. ✅ **Create artifacts** (prompts, configs, examples)
2. ✅ **Create manifest.json** (defines paths and versions)
3. ✅ **Register in TEMPLATE_REGISTRY** (backend configuration)
4. ✅ **Implement processing** (if needed)
5. ✅ **Upload bundle** (optional, for remote storage)
6. ✅ **Test** (verify it works end-to-end)

**Key Points:**
- Manifest paths are **relative to repo root**
- Template IDs must match between registry and manifest
- Version selection works automatically once flag is enabled
- Bundles can be uploaded via CLI or UI

---

**Questions?** Check the existing templates (`section7`, `section8`) for reference examples.

