# Section 11 Template Registration Plan

## 🎯 Goal
Ensure Section 11 template has the same behavior as Section 7/8 templates:
1. ✅ Selectable from dictation page "Select Template" dropdown
2. ✅ Added to `template_combinations` database table
3. ✅ Artifacts uploaded to Supabase Storage for versioning
4. ✅ Versioned bundle system (template_bundles, template_bundle_versions, template_bundle_artifacts)

---

## 📋 Implementation Steps

### **Step 1: Add Section 11 Template to `template-config.ts`**

**File:** `frontend/src/config/template-config.ts`

**Add Section 11 R&D template config:**

```typescript
{
  id: 'section11-rd',
  name: 'Section 11 - R&D Pipeline',
  nameFr: 'Section 11 - Pipeline R&D',
  description: 'Generate Section 11 conclusion from structured JSON data (S1-S10). Multi-section synthesis with consolidation logic.',
  descriptionFr: 'Générer la conclusion Section 11 à partir de données JSON structurées (S1-S10). Synthèse multi-sections avec logique de consolidation.',
  type: 'ai-formatter',
  compatibleSections: ['section_11'],
  compatibleModes: ['mode2', 'mode3'],
  language: 'fr',  // CNESST sections are French-only
  complexity: 'high',
  tags: ['section-11', 'rd-pipeline', 'synthesis', 'multi-section', 'consolidation'],
  isActive: true,
  isDefault: true,
  features: {
    verbatimSupport: false,
    voiceCommandsSupport: false,
    aiFormatting: true,
    postProcessing: false,
  },
  prompt: 'Generate Section 11 conclusion from structured JSON data. Apply consolidation logic and synthesize data from Sections 1-10.',
  promptFr: 'Générer la conclusion Section 11 à partir de données JSON structurées. Appliquer la logique de consolidation et synthétiser les données des Sections 1-10.',
  config: {
    section: '11',
    language: 'fr',
  },
  usage: {
    count: 0,
    successRate: 0,
  },
  created: '2024-12-19',
  updated: '2024-12-19',
}
```

---

### **Step 2: Update Bundle Name Validation**

**File:** `backend/src/routes/templateBundles.ts`

**Current validation (line 94):**
```typescript
if (!/^section[78](-ai-formatter|-rd)$/.test(bundleName)) {
```

**Update to:**
```typescript
if (!/^section(7|8|11)(-ai-formatter|-rd)$/.test(bundleName)) {
  return res.status(400).json({
    success: false,
    error: 'Invalid bundle name. Must be: section7-ai-formatter, section7-rd, section8-ai-formatter, or section11-rd'
  });
}
```

---

### **Step 3: Update Template-to-Bundle Mapping**

**File:** `backend/src/routes/templateBundles.ts`

**Current mapping (line 347):**
```typescript
const templateToBundleMap: Record<string, string> = {
  'section7-ai-formatter': 'section7-ai-formatter',
  'section7-rd': 'section7-rd',
  'section8-ai-formatter': 'section8-ai-formatter',
};
```

**Update to:**
```typescript
const templateToBundleMap: Record<string, string> = {
  'section7-ai-formatter': 'section7-ai-formatter',
  'section7-rd': 'section7-rd',
  'section8-ai-formatter': 'section8-ai-formatter',
  'section11-rd': 'section11-rd',
};
```

---

### **Step 4: Update Bundle Upload Component**

**File:** `frontend/src/components/bundles/BundleUpload.tsx`

**Add Section 11 to bundle options (line 37):**
```typescript
const bundleOptions = [
  { value: 'section7-ai-formatter', label: 'Section 7 AI Formatter' },
  { value: 'section7-rd', label: 'Section 7 R&D' },
  { value: 'section8-ai-formatter', label: 'Section 8 AI Formatter' },
  { value: 'section11-rd', label: 'Section 11 R&D' },  // NEW
];
```

**Update artifact kind detection (line 49):**
```typescript
const getArtifactKind = (filename: string): string => {
  const lower = filename.toLowerCase();
  if (lower.includes('master') && lower.includes('.md')) return 'master_prompt';
  if (lower.includes('master') && lower.includes('.json')) return 'json_config';
  if (lower.includes('golden')) return 'golden_example';
  if (lower.includes('master_config')) return 'master_config';
  if (lower.includes('system') && lower.includes('.xml')) return 'system_xml';
  if (lower.includes('plan') && lower.includes('.xml')) return 'plan_xml';
  if (lower.includes('golden_cases') || lower.includes('.jsonl')) return 'golden_cases';
  // Section 11 specific artifacts
  if (lower.includes('schema') && lower.includes('.json')) return 'schema_json';
  if (lower.includes('logicmap') && lower.includes('.yaml')) return 'logicmap_yaml';
  if (lower.includes('examples') && lower.includes('.jsonl')) return 'examples_jsonl';
  return 'unknown';
};
```

---

### **Step 5: Create Section 11 Upload Script**

**File:** `backend/scripts/upload-section11-bundle.ts`

**Create script to upload Section 11 artifacts:**

```typescript
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const bundleName = 'section11-rd';
const version = '1.0.0';

const artifacts = [
  { kind: 'schema_json', path: 'prompts/section11_schema.json', filename: 'section11_schema.json' },
  { kind: 'logicmap_yaml', path: 'prompts/section11_logicmap.yaml', filename: 'section11_logicmap.yaml' },
  { kind: 'master_prompt', path: 'prompts/section11_master.fr.md', filename: 'section11_master.fr.md', locale: 'fr' },
  { kind: 'examples_jsonl', path: 'training/section11_examples.jsonl', filename: 'section11_examples.jsonl' },
  { kind: 'master_config', path: 'backend/configs/master_prompt_section11.json', filename: 'master_prompt_section11.json' },
];

// Upload function (similar to upload-template-bundle.ts)
async function uploadSection11Bundle() {
  // Implementation here
}
```

---

### **Step 6: Add Section 11 to Template Combinations Table**

**File:** `backend/scripts/insert-section11-template.ts`

**Create script to insert Section 11 into `template_combinations` table:**

```typescript
import { getSql } from '../src/database/connection.js';

const TEMPLATE_DATA = {
  id: 'section11-rd',
  name: 'Section 11 - R&D Pipeline',
  name_fr: 'Section 11 - Pipeline R&D',
  name_en: 'Section 11 - R&D Pipeline',
  description: 'Generate Section 11 conclusion from structured JSON data (S1-S10)',
  description_fr: 'Générer la conclusion Section 11 à partir de données JSON structurées (S1-S10)',
  description_en: 'Generate Section 11 conclusion from structured JSON data (S1-S10)',
  type: 'ai-formatter',
  compatible_sections: ['section_11'],
  compatible_modes: ['mode2', 'mode3'],
  language: 'fr',
  complexity: 'high',
  tags: ['section-11', 'rd-pipeline', 'synthesis', 'multi-section'],
  is_active: true,
  is_default: true,
  features: {
    verbatimSupport: false,
    voiceCommandsSupport: false,
    aiFormatting: true,
    postProcessing: false,
  },
  prompt: 'Generate Section 11 conclusion from structured JSON data.',
  prompt_fr: 'Générer la conclusion Section 11 à partir de données JSON structurées.',
  config: {
    section: '11',
    language: 'fr',
  },
  usage_stats: {
    count: 0,
    successRate: 0,
  },
};

async function insertSection11Template() {
  // Implementation here (similar to insert-template-combination.ts)
}
```

---

### **Step 7: Update Artifact Resolver for Section 11**

**File:** `backend/src/services/artifacts/PromptBundleResolver.ts`

**Add Section 11 artifact kinds:**

```typescript
// Add to artifact kind mapping
const ARTIFACT_KINDS = {
  // ... existing kinds
  'schema_json': 'schema_json',
  'logicmap_yaml': 'logicmap_yaml',
  'examples_jsonl': 'examples_jsonl',
};
```

---

## 📊 Artifact Structure

### **Section 11 Artifacts:**

1. **`section11_schema.json`** → `kind: 'schema_json'`
   - JSON schema for structured input
   - Location: `prompts/section11_schema.json`

2. **`section11_logicmap.yaml`** → `kind: 'logicmap_yaml'`
   - Consolidation logic mapping
   - Location: `prompts/section11_logicmap.yaml`

3. **`section11_master.fr.md`** → `kind: 'master_prompt'`, `locale: 'fr'`
   - Master prompt for AI generation
   - Location: `prompts/section11_master.fr.md`

4. **`section11_examples.jsonl`** → `kind: 'examples_jsonl'`
   - Training examples manifest
   - Location: `training/section11_examples.jsonl`

5. **`master_prompt_section11.json`** → `kind: 'master_config'`
   - Master configuration
   - Location: `backend/configs/master_prompt_section11.json`

---

## 🔄 Workflow

### **1. Add Template Config**
- Add to `frontend/src/config/template-config.ts`
- Template appears in TemplateDropdown

### **2. Insert into Database**
- Run `insert-section11-template.ts` script
- Template appears in `template_combinations` table

### **3. Upload Artifacts**
- Run `upload-section11-bundle.ts` script
- Artifacts uploaded to Supabase Storage
- Metadata inserted into `template_bundles`, `template_bundle_versions`, `template_bundle_artifacts`

### **4. Verify**
- Check TemplateDropdown shows Section 11 template
- Check database tables have Section 11 entries
- Check Supabase Storage has artifacts

---

## ✅ Checklist

- [ ] Add Section 11 template to `template-config.ts`
- [ ] Update bundle name validation regex
- [ ] Update template-to-bundle mapping
- [ ] Update BundleUpload component
- [ ] Create upload script for Section 11
- [ ] Create insert script for template_combinations
- [ ] Update artifact resolver for Section 11 kinds
- [ ] Test template appears in dictation dropdown
- [ ] Test artifacts can be uploaded
- [ ] Test versioning works

