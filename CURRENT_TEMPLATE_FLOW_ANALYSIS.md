# 🔍 Current Template Selection Flow Analysis

## 📋 **Complete User Journey: Section 7 AI Formatter (Enhanced)**

### **Step 1: User Clicks "Select Template" Button**
```typescript
// In TranscriptionInterface.tsx line 983
<Button 
  variant="outline" 
  size="sm" 
  className="flex items-center space-x-2"
  onClick={() => setShowTemplateModal(true)}  // Opens template modal
  disabled={isFormatting}
>
  <FileText className="h-4 w-4" />
  <span>{isFormatting ? 'Formatting...' : 'Select Template'}</span>
</Button>
```

### **Step 2: Template Dropdown Opens**
- **Component:** `TemplateDropdown.tsx`
- **Templates Loaded:** From `template-config.ts` via `useTemplates()` context
- **Filtering:** By language (fr-CA/en-US), section, tags, search query
- **Available Templates:** All active templates from `TEMPLATE_CONFIGS`

### **Step 3: User Selects "Section 7 AI Formatter (Enhanced)"**
```typescript
// Template selection triggers onTemplateSelect callback
onTemplateSelect={(template) => {
  console.log('Template selected:', template);
  setSelectedTemplate(template);
  setTemplateContent(template.content);
  setAiStepStatus(null);
  
  // Inject template content into the transcript
  injectTemplateContent(template);  // ← KEY FUNCTION
}}
```

### **Step 4: `injectTemplateContent()` Function Executes**
```typescript
// In TranscriptionInterface.tsx line 282
const injectTemplateContent = useCallback(async (template: TemplateJSON) => {
  console.log('Injecting template content:', template.title);
  
  setIsFormatting(true);
  setFormattingProgress('Initializing formatting...');
  
  // Get current transcript
  const rawTranscript = editedTranscript || (paragraphs.length > 0 ? paragraphs.join('\n\n') : currentTranscript);
  
  // Check if this is Section 7 AI formatter
  if (template.id === 'section7-ai-formatter' || template.category === 'template-combo') {
    console.log('Applying Section 7 AI formatting to current transcript');
    setFormattingProgress('Preparing Section 7 AI formatting...');
    
    // Authentication check
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      alert('Please log in to use Section 7 AI formatting.');
      return;
    }
    
    // Call backend API
    const result = await apiFetch('/api/format/mode2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: rawTranscript,
        section: '7',
        language: selectedLanguage === 'fr-CA' ? 'fr' : 'en',
        templateCombo: templateCombo,
        verbatimSupport: verbatimSupport,
        voiceCommandsSupport: voiceCommandsSupport
      })
    });
    
    // Update UI with formatted result
    setEditedTranscript(result.formatted);
    setIsEditing(true);
  }
}, [editedTranscript, paragraphs, currentTranscript, selectedLanguage, activeSection]);
```

### **Step 5: Backend API Call - `/api/format/mode2`**
```typescript
// In backend/src/index.ts line 1834
app.post('/api/format/mode2', async (req, res): Promise<void> => {
  try {
    const { transcript, section, language, templateCombo, verbatimSupport, voiceCommandsSupport } = req.body;
    
    // Use ProcessingOrchestrator
    const { processingOrchestrator } = await import('./services/processing/ProcessingOrchestrator.js');
    
    const result = await processingOrchestrator.processContent({
      sectionId: `section_${section}`,
      modeId: 'mode2',
      templateId: 'section7-ai-formatter',
      language: language as 'fr' | 'en',
      content: transcript,
      correlationId: `mode2-${Date.now()}`
    });
    
    res.json({
      formatted: result.content,
      issues: result.issues,
      confidence_score: result.confidence,
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Mode 2 formatting failed' });
  }
});
```

### **Step 6: ProcessingOrchestrator Routes to Section 7 AI Formatter**
```typescript
// In ProcessingOrchestrator.ts line 331
if (template.id === 'section7-ai-formatter') {
  console.log(`[${correlationId}] Routing to processSection7AIFormatter`);
  return await this.processSection7AIFormatter(content, template, request);
}
```

### **Step 7: `processSection7AIFormatter()` Executes**
```typescript
// In ProcessingOrchestrator.ts line 524
private async processSection7AIFormatter(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
  const correlationId = request.correlationId || 'no-correlation-id';
  
  try {
    console.log(`[${correlationId}] Processing Section 7 AI Formatter template: ${template.id}`);
    
    // Use the original Section 7 AI formatter
    const { Section7AIFormatter } = await import('../../services/formatter/section7AI.js');
    
    const result = await Section7AIFormatter.formatSection7Content(
      content,
      request.language as 'fr' | 'en'
    );
    
    return result.formatted;
  } catch (error) {
    console.error(`[${correlationId}] Section 7 AI formatting error:`, error);
    return content; // Fallback to original content
  }
}
```

### **Step 8: Section7AIFormatter.formatSection7Content() - 6-Step Flowchart**
```typescript
// In section7AI.ts line 38
static async formatSection7Content(content: string, language: 'fr' | 'en' = 'fr'): Promise<Section7AIResult> {
  const startTime = Date.now();
  const correlationId = `s7-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // STEP 1: Load language-specific files
    const promptFiles = await this.loadLanguageSpecificFiles(language, correlationId);
    
    // STEP 2-4: Construct comprehensive system prompt
    const { systemPrompt, promptLength } = this.constructSystemPrompt(promptFiles, language, correlationId);
    
    // STEP 5: Call OpenAI with comprehensive prompt
    const result = await this.callOpenAI(systemPrompt, content, language, correlationId);
    
    // STEP 6: Post-processing and validation
    const finalResult = this.postProcessResult(result, content, language, correlationId, startTime, promptFiles, promptLength);
    
    return finalResult;
  } catch (error) {
    return this.fallbackFormatting(content, language, correlationId, startTime);
  }
}
```

### **Step 9: Language-Specific File Loading**
```typescript
// Loads these files based on language:
if (language === 'fr') {
  masterPromptPath = join(basePath, 'section7_master.md');
  jsonConfigPath = join(basePath, 'section7_master.json');
  goldenExamplePath = join(basePath, 'section7_golden_example.md');
} else {
  masterPromptPath = join(basePath, 'section7_master_en.md');
  jsonConfigPath = join(basePath, 'section7_master_en.json');
  goldenExamplePath = join(basePath, 'section7_golden_example_en.md');
}
```

### **Step 10: OpenAI API Call**
```typescript
// Calls OpenAI with comprehensive prompt system
const result = await this.callOpenAI(systemPrompt, content, language, correlationId);
```

### **Step 11: Response Processing**
```typescript
// Post-processes OpenAI response
const finalResult = this.postProcessResult(result, content, language, correlationId, startTime, promptFiles, promptLength);
```

### **Step 12: Frontend Updates**
```typescript
// Updates UI with formatted result
setEditedTranscript(result.formatted);
setIsEditing(true);
setIsFormatting(false);
setFormattingProgress('');
```

---

## 🎯 **Key Integration Points for Clinical Extraction Layer**

### **Current Flow:**
```
User Click → Template Selection → injectTemplateContent() → Backend API → ProcessingOrchestrator → Section7AIFormatter → OpenAI → Response → UI Update
```

### **Enhanced Flow with Clinical Extraction:**
```
User Click → Template Selection → injectTemplateContent() → 
  ↓
Clinical Extraction Layer (NEW) → 
  ↓
Backend API → ProcessingOrchestrator → Section7AIFormatter → OpenAI → Response → UI Update
```

---

## 🔧 **Specific Integration Points**

### **1. Frontend Integration Point**
**File:** `frontend/src/components/transcription/TranscriptionInterface.tsx`
**Function:** `injectTemplateContent()` (line 282)
**Location:** Before the backend API call

```typescript
// NEW: Add clinical extraction before backend call
const injectTemplateContent = useCallback(async (template: TemplateJSON) => {
  // ... existing code ...
  
  if (template.id === 'section7-ai-formatter' || template.category === 'template-combo') {
    // NEW: Clinical content extraction
    setFormattingProgress('Extracting clinical entities...');
    const clinicalEntities = await clinicalProcessor.processClinicalContent(rawTranscript);
    
    // NEW: Template mapping based on clinical content
    setFormattingProgress('Mapping to appropriate template...');
    const mappedTemplate = await templateMapper.mapToTemplate(clinicalEntities, template);
    
    // Existing backend call with clinical context
    const result = await apiFetch('/api/format/mode2', {
      // ... existing code ...
      body: JSON.stringify({
        transcript: rawTranscript,
        clinicalEntities, // NEW: Add clinical context
        section: '7',
        language: selectedLanguage === 'fr-CA' ? 'fr' : 'en',
        // ... existing fields
      })
    });
  }
}, [editedTranscript, paragraphs, currentTranscript, selectedLanguage, activeSection]);
```

### **2. Backend Integration Point**
**File:** `backend/src/index.ts`
**Endpoint:** `/api/format/mode2` (line 1834)
**Location:** Before ProcessingOrchestrator call

```typescript
app.post('/api/format/mode2', async (req, res): Promise<void> => {
  try {
    const { transcript, clinicalEntities, section, language, templateCombo, verbatimSupport, voiceCommandsSupport } = req.body;
    
    // NEW: Enhanced processing with clinical context
    const result = await processingOrchestrator.processContent({
      sectionId: `section_${section}`,
      modeId: 'mode2',
      templateId: 'section7-ai-formatter',
      language: language as 'fr' | 'en',
      content: transcript,
      clinicalEntities, // NEW: Pass clinical context
      correlationId: `mode2-${Date.now()}`
    });
    
    res.json({
      formatted: result.content,
      clinicalEntities: result.clinicalEntities, // NEW: Return clinical context
      issues: result.issues,
      confidence_score: result.confidence,
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Mode 2 formatting failed' });
  }
});
```

### **3. ProcessingOrchestrator Integration Point**
**File:** `backend/src/services/processing/ProcessingOrchestrator.ts`
**Method:** `processSection7AIFormatter()` (line 524)
**Location:** Before Section7AIFormatter call

```typescript
private async processSection7AIFormatter(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
  const correlationId = request.correlationId || 'no-correlation-id';
  
  try {
    // NEW: Use clinical context for enhanced formatting
    const clinicalEntities = request.clinicalEntities;
    
    const result = await Section7AIFormatter.formatSection7Content(
      content,
      request.language as 'fr' | 'en',
      clinicalEntities // NEW: Pass clinical context
    );
    
    return result.formatted;
  } catch (error) {
    console.error(`[${correlationId}] Section 7 AI formatting error:`, error);
    return content;
  }
}
```

---

## 📊 **Current Template Configuration**

### **Section 7 AI Formatter (Enhanced) Template:**
```typescript
{
  id: 'section7-ai-formatter',
  name: 'Section 7 AI Formatter (Enhanced)',
  nameFr: 'Formateur IA Section 7 (Amélioré)',
  type: 'ai-formatter',
  compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
  compatibleModes: ['mode1', 'mode2', 'mode3'],
  language: 'both',
  complexity: 'high',
  features: {
    verbatimSupport: false,
    voiceCommandsSupport: false,
    aiFormatting: true,
    postProcessing: true,
    comprehensivePrompts: true,
    languageAware: true,
    metadataTracking: true
  },
  config: {
    mode: 'mode2',
    language: 'fr',
    enforceWorkerFirst: true,
    chronologicalOrder: true,
    medicalTerminology: true,
    comprehensivePrompts: true,
    promptFiles: ['master_prompt', 'json_config', 'golden_example'],
    implementation: '6-step-flowchart'
  }
}
```

---

## 🎯 **Clinical Extraction Layer Integration Strategy**

### **Phase 1: Frontend Clinical Processor**
- Add `ClinicalContentProcessor` class to frontend
- Integrate with `injectTemplateContent()` function
- Extract clinical entities before backend call
- Pass clinical context to backend

### **Phase 2: Backend Clinical Context**
- Modify `/api/format/mode2` endpoint to accept clinical entities
- Update `ProcessingOrchestrator` to handle clinical context
- Enhance `Section7AIFormatter` with clinical context
- Return clinical entities in response

### **Phase 3: Template Mapping**
- Add intelligent template selection based on clinical content
- Map clinical entities to appropriate template configurations
- Enhance template processing with clinical context
- Provide clinical-aware formatting

This analysis shows exactly where and how to integrate the clinical extraction layer into your existing template flow!
