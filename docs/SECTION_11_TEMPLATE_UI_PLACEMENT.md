# Section 11 Template UI Placement

## 🎯 Current Template Availability in UI

### **1. TranscriptionInterface (Dictation Page)**
**Location:** `/transcription` or `/dictation`

**Component:** `TemplateDropdown` in `TranscriptionInterface.tsx`

**Current Behavior:**
- Shows **ALL active templates** regardless of section
- Filters only by:
  - Language (fr-CA/en-US)
  - Active status (`isActive: true`)
- **Does NOT filter by `compatibleSections`**

**Code Reference:**
```118:128:frontend/src/components/transcription/TemplateDropdown.tsx
      // Load ALL templates (truly modular - not section-dependent)
      const availableTemplates = getAllTemplates().filter(config => {
        // Filter by language (both or specific language)
        // Convert currentLanguage (fr-CA/en-US) to template language format (fr/en)
        const templateLanguage = (currentLanguage as string) === 'fr-CA' ? 'fr' : 'en';
        if (config.language !== 'both' && config.language !== templateLanguage) {
          return false;
        }
        
        // Only show active templates
        return config.isActive;
      });
```

**Current Section 11 Status:**
- ❌ **Section 11 template NOT in template-config.ts yet**
- ❌ **Not filtered by section compatibility**
- ✅ **Would appear if added to template-config.ts and set `isActive: true`**

---

### **2. Section 11 Form (Case Form)**
**Location:** `/cases/:caseId` → Section 11 tab

**Component:** `SectionForm.tsx` → `renderSection11()`

**Current Behavior:**
- Has "Generate from Sections" button
- **Does NOT use TemplateDropdown**
- Calls `/api/format/merge/section11` directly
- Uses structured JSON input (not template selection)

**Code Reference:**
```781:826:frontend/src/components/case/SectionForm.tsx
  const renderSection11 = () => {
    const { generateSection11FromSections } = useCaseStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateFromSections = async () => {
      setIsGenerating(true);
      try {
        await generateSection11FromSections();
        // Refresh form data after generation
        const currentSection = sections.find(s => s.id === sectionId);
        if (currentSection) {
          setFormData(currentSection.data);
        }
      } catch (error) {
        console.error('Failed to generate section 11:', error);
        // TODO: Show user-friendly error message
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">11. Conclusion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              onClick={handleGenerateFromSections}
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Génération...
                </>
              ) : (
                <>
                  <span className="mr-2">🤖</span>
                  Générer à partir des sections 7, 8, 9
                </>
              )}
            </Button>
          </div>
```

**Current Section 11 Status:**
- ✅ **Has generation button**
- ❌ **No template selection UI**
- ❌ **Uses hardcoded endpoint (not template-based)**

---

### **3. Transcript Analysis Page**
**Location:** `/transcript-analysis`

**Component:** `TranscriptAnalysisPage.tsx`

**Current Behavior:**
- Shows template dropdown for benchmark/testing
- Filters by `isActive` only
- **Does NOT filter by section**

**Code Reference:**
```2722:2726:frontend/src/pages/TranscriptAnalysisPage.tsx
                                  <option value="">Select template...</option>
                                  {getAllTemplates().filter(t => t.isActive).map((template) => (
                                    <option key={template.id} value={template.id}>
                                      {template.name}
                                    </option>
                                  ))}
```

**Current Section 11 Status:**
- ❌ **Section 11 template NOT in template-config.ts yet**
- ✅ **Would appear if added and `isActive: true`**

---

## 📋 Template Configuration System

### **Template Config Structure**
Templates are defined in `frontend/src/config/template-config.ts`:

```typescript
export interface TemplateConfig {
  id: string;
  name: string;
  nameFr: string;
  compatibleSections: string[];  // e.g., ['section_7', 'section_11']
  compatibleModes: string[];
  language: 'fr' | 'en' | 'both';
  isActive: boolean;
  isDefault: boolean;
  // ... other fields
}
```

### **Current Section 11 Templates**
**Status:** ❌ **No Section 11 templates in template-config.ts**

**Existing Section 7/8 Templates:**
- `section7-ai-formatter` → `compatibleSections: ['section_7']`
- `section7-rd` → `compatibleSections: ['section_7']`
- `section8-ai-formatter` → `compatibleSections: ['section_8']`

---

## 🎨 Where Section 11 Template Should Appear

### **Option 1: TranscriptionInterface (Dictation Page)**
**Use Case:** User dictating Section 11 content

**Pros:**
- Consistent with Section 7/8 templates
- Users can format Section 11 transcript directly
- Follows existing pattern

**Cons:**
- Section 11 is typically generated from structured data, not dictated
- Less common use case

**Implementation:**
1. Add Section 11 template to `template-config.ts`
2. Set `compatibleSections: ['section_11']`
3. Set `isActive: true`
4. Template will appear in TemplateDropdown when `currentSection === 'section_11'`

**Note:** Currently TemplateDropdown doesn't filter by section, so it would appear for ALL sections. Would need to add section filtering.

---

### **Option 2: Section 11 Form (Case Form) - RECOMMENDED**
**Use Case:** User generating Section 11 from structured data (S1-S10)

**Pros:**
- Matches actual Section 11 workflow (synthesis, not dictation)
- Already has "Generate" button
- Uses structured JSON input (matches Section 11 R&D service)

**Cons:**
- Different from Section 7/8 pattern (they use templates in dictation)
- Would need to add template selection UI

**Implementation:**
1. Add Section 11 template to `template-config.ts`
2. Add TemplateDropdown to Section 11 form
3. Allow user to select template before generating
4. Pass template info to `/api/format/merge/section11` endpoint

---

### **Option 3: Both Locations**
**Use Case:** Support both dictation and generation workflows

**Pros:**
- Maximum flexibility
- Supports all use cases

**Cons:**
- More complex
- May confuse users (which one to use?)

---

## 🔧 Recommended Implementation

### **Phase 1: Add Section 11 Template Config**

Add to `frontend/src/config/template-config.ts`:

```typescript
{
  id: 'section11-rd',
  name: 'Section 11 - R&D Pipeline',
  nameFr: 'Section 11 - Pipeline R&D',
  description: 'Generate Section 11 conclusion from structured JSON data (S1-S10)',
  descriptionFr: 'Générer la conclusion Section 11 à partir de données JSON structurées (S1-S10)',
  type: 'ai-formatter',
  compatibleSections: ['section_11'],
  compatibleModes: ['mode2', 'mode3'],
  language: 'fr',  // CNESST sections are French-only
  complexity: 'high',
  tags: ['section-11', 'rd-pipeline', 'synthesis', 'multi-section'],
  isActive: true,
  isDefault: true,
  features: {
    verbatimSupport: false,
    voiceCommandsSupport: false,
    aiFormatting: true,
    postProcessing: false,
  },
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

### **Phase 2: Add Template Selection to Section 11 Form**

**Update `SectionForm.tsx` → `renderSection11()`:**

```typescript
const renderSection11 = () => {
  const { generateSection11FromSections } = useCaseStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateJSON | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">11. Conclusion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Selection */}
        <div className="mb-4">
          <Label>Template</Label>
          <TemplateDropdown
            currentSection="section_11"
            currentLanguage="fr-CA"
            selectedTemplate={selectedTemplate}
            onTemplateSelect={setSelectedTemplate}
          />
        </div>

        {/* Generate Button */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleGenerateFromSections}
            disabled={isGenerating || !selectedTemplate}
            variant="outline"
            size="sm"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Génération...
              </>
            ) : (
              <>
                <span className="mr-2">🤖</span>
                Générer à partir des sections 1-10
              </>
            )}
          </Button>
        </div>
        
        {/* Generated Content */}
        {/* ... */}
      </CardContent>
    </Card>
  );
};
```

---

### **Phase 3: Add Section Filtering to TemplateDropdown (Optional)**

**Update `TemplateDropdown.tsx` → `loadTemplates()`:**

```typescript
const loadTemplates = async () => {
  setLoading(true);
  try {
    const availableTemplates = getAllTemplates().filter(config => {
      // Filter by language
      const templateLanguage = (currentLanguage as string) === 'fr-CA' ? 'fr' : 'en';
      if (config.language !== 'both' && config.language !== templateLanguage) {
        return false;
      }
      
      // Filter by section compatibility (NEW)
      if (config.compatibleSections && config.compatibleSections.length > 0) {
        if (!config.compatibleSections.includes(currentSection)) {
          return false;
        }
      }
      
      // Only show active templates
      return config.isActive;
    });
    
    // ... rest of code
  }
};
```

---

## 📊 Summary

### **Current State:**
- ❌ No Section 11 template in `template-config.ts`
- ❌ TemplateDropdown doesn't filter by section
- ✅ Section 11 form has "Generate" button (but no template selection)

### **Recommended Approach:**
1. **Add Section 11 template to `template-config.ts`** (Phase 1)
2. **Add TemplateDropdown to Section 11 form** (Phase 2)
3. **Optionally add section filtering to TemplateDropdown** (Phase 3)

### **Where Section 11 Template Will Appear:**
1. ✅ **Section 11 Form** (Case Form) - Primary location
2. ⚠️ **TranscriptionInterface** (Dictation Page) - Only if section filtering is added
3. ✅ **Transcript Analysis Page** - For testing/benchmarking

---

## 🎯 Next Steps

1. Add Section 11 template config to `template-config.ts`
2. Update Section 11 form to include TemplateDropdown
3. Update `generateSection11FromSections` to pass template info
4. (Optional) Add section filtering to TemplateDropdown for better UX

