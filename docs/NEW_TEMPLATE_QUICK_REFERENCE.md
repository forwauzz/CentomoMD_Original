# New Template Creation - Quick Reference

## 🚀 Quick Start Checklist

When creating a new template, follow these steps:

### 1. Create Artifacts (5 minutes)
```
prompts/{templateId}/
  manifest.json
  backend/prompts/{templateId}_master.md
  backend/prompts/{templateId}_master.json
  backend/prompts/{templateId}_golden_example.md
```

### 2. Create Manifest (2 minutes)
```json
{
  "defaultVersion": "current",
  "versions": {
    "current": {
      "ai_formatter": {
        "fr": {
          "master": "backend/prompts/{templateId}_master.md",
          "json": "backend/prompts/{templateId}_master.json",
          "golden": "backend/prompts/{templateId}_golden_example.md"
        }
      }
    }
  }
}
```

### 3. Register Template (3 minutes)
Add to `backend/src/config/templates.ts`:
```typescript
'{templateId}-ai-formatter': {
  id: '{templateId}-ai-formatter',
  name: '{Template Name}',
  // ... rest of config
}
```

### 4. Add Routing (2 minutes)
Add to `ProcessingOrchestrator.ts` (line ~403):
```typescript
if (template.id === '{templateId}-ai-formatter') {
  return await this.process{TemplateId}AIFormatter(content, template, request);
}
```

### 5. Upload Bundle (Optional, 1 minute)
```bash
npx tsx scripts/upload-template-bundle.ts {templateId}-ai-formatter current --set-default
```

**Total Time: ~15 minutes** (without service implementation)

---

## 📋 Template ID Naming Convention

- **AI Formatter:** `{sectionId}-ai-formatter` (e.g., `section9-ai-formatter`)
- **R&D Pipeline:** `{sectionId}-rd` (e.g., `section9-rd`)
- **Custom:** `{name}-{type}` (e.g., `custom-analysis-formatter`)

---

## 🔧 Do I Need to Create a New Service?

### ✅ **Reuse Existing Service** if:
- Template uses same formatting logic as existing template
- Just needs different prompts/configs
- Example: Section 9 uses same logic as Section 7

### ❌ **Create New Service** if:
- Template needs different processing logic
- Different AI model requirements
- Different validation rules
- Example: Custom analysis template with unique logic

---

## 📝 Manifest Path Rules

**IMPORTANT:** All paths in `manifest.json` are **relative to repo root**, not `backend/`:

✅ **Correct:**
```json
"master": "backend/prompts/section9_master.md"
```

❌ **Wrong:**
```json
"master": "prompts/section9_master.md"  // Missing 'backend/'
"master": "../prompts/section9_master.md"  // Relative paths not supported
```

---

## 🎯 Common Patterns

### Pattern 1: Reuse Section 7 AI Formatter

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

**Routing:**
```typescript
// Route to existing Section7AIFormatter service
if (template.id === 'section9-ai-formatter') {
  return await this.processSection7AIFormatter(content, template, request);
}
```

### Pattern 2: New Service with Versioning

**Service:**
```typescript
// backend/src/services/formatter/section9AI.ts
import { resolveSection9AiPaths } from '../artifacts/PromptBundleResolver.js';

async loadLanguageSpecificFiles(language: Language, templateVersion?: string) {
  const paths = await resolveSection9AiPaths(language, templateVersion);
  // Load files from paths
}
```

**Resolver:**
Add to `PromptBundleResolver.ts`:
```typescript
export async function resolveSection9AiPaths(
  language: Language = 'fr',
  version?: string
): Promise<Section9AiPaths> {
  // Similar to resolveSection7AiPaths
}
```

---

## ⚠️ Common Mistakes

### 1. Wrong Manifest Path
❌ `"master": "prompts/section9_master.md"`
✅ `"master": "backend/prompts/section9_master.md"`

### 2. Template ID Mismatch
❌ Registry: `section9-ai-formatter`, Manifest: `section9`
✅ Use consistent IDs everywhere

### 3. Missing Routing
❌ Template registered but no routing in `ProcessingOrchestrator`
✅ Add routing in `applyTemplateProcessing()`

### 4. Version Selection Not Working
❌ `templateVersion` parameter ignored
✅ Check `FEATURE_TEMPLATE_VERSION_SELECTION=true` in `.env`
✅ Restart backend server

---

## 🧪 Testing Checklist

- [ ] Manifest.json loads correctly
- [ ] Artifacts found at specified paths
- [ ] Template registered in TEMPLATE_REGISTRY
- [ ] Routing works in ProcessingOrchestrator
- [ ] Processing succeeds end-to-end
- [ ] Version selection works (if enabled)
- [ ] Bundle uploads (if using remote storage)

---

## 📚 Examples

See existing templates for reference:
- **Section 7:** `prompts/section7/manifest.json`
- **Section 8:** `prompts/section8/manifest.json`
- **Registry:** `backend/src/config/templates.ts` (line 54+)
- **Routing:** `backend/src/services/processing/ProcessingOrchestrator.ts` (line 403+)

---

## 🆘 Need Help?

1. Check `docs/NEW_TEMPLATE_CREATION_GUIDE.md` for detailed guide
2. Review existing templates (`section7`, `section8`) as examples
3. Check test logs for `[PROOF]` messages showing resolver status
4. Verify flags are enabled: `FEATURE_TEMPLATE_VERSION_SELECTION=true`

