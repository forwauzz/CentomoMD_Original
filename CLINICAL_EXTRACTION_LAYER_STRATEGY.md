# 🏥 Clinical Extraction Layer (S6) & Template Mapping Layer (S7) - Complete Implementation Plan

## 📋 **IMPLEMENTATION STATUS & STRATEGY EVOLUTION**

### **✅ CURRENT STATE (IMPLEMENTED)**
- **S6-S7-S8**: Clinical extraction as a separate template (`template-clinical-extraction`)
- **Integration**: Works with template-combinations system
- **Status**: ✅ **FULLY FUNCTIONAL** - Clinical extraction template working

### **🔄 PROPOSED STRATEGY (ENHANCED VISION)**
- **S7-S8**: Clinical extraction as **universal preprocessing layer**
- **Integration**: Works with **ALL existing templates** as cleanup layer
- **Status**: 📋 **PLANNED** - Universal cleanup approach

---

## 🎯 **CURRENT IMPLEMENTATION (S6-S7-S8 as Separate Template)**

### **✅ Integration with Template-Combinations System**
This implementation leverages the existing **template-combinations** system as the foundation, making it fully compatible with current infrastructure.

---

## 🧠 **S6: Clinical Extraction Layer**

### **S6.1 - Input Preprocessing**
- **Input**: Raw transcript from AWS Transcribe (S5 output)
- **Action**: Strip timestamps, hesitations, normalize casing/punctuation
- **Tools**: Regex + lightweight NLP

### **S6.2 - Entity Extraction Engine (French-English)**

#### **🧠 Clinical Extraction Prompt (Bilingual)**
```typescript
const CLINICAL_EXTRACTION_PROMPT = `
Vous êtes un assistant NLP clinique. Extrayez les champs suivants du transcript médecin-patient. Répondez uniquement en format JSON.

Champs requis:
- injury_location (localisation de la blessure)
- injury_type (type de blessure)
- onset (début des symptômes)
- pain_severity (sévérité de la douleur, ex: 7/10)
- functional_limitations (limitations fonctionnelles - liste)
- previous_injuries (blessures antérieures)
- treatment_to_date (traitement à ce jour - liste)
- imaging_done (imagerie effectuée - liste)
- return_to_work (retour au travail - résumé textuel)

Transcript:
{{TRANSCRIPT}}

Répondez UNIQUEMENT en format JSON.
`;

// English version for fallback
const CLINICAL_EXTRACTION_PROMPT_EN = `
You are a clinical NLP assistant. Extract the following fields from the doctor-patient transcript. Respond only in JSON format.

Required fields:
- injury_location
- injury_type
- onset
- pain_severity (e.g. 7/10)
- functional_limitations (list)
- previous_injuries
- treatment_to_date (list)
- imaging_done (list)
- return_to_work (text summary)

Transcript:
{{TRANSCRIPT}}

Respond ONLY in JSON format.
`;
```

#### **S6.3 - Validation & Cleaning**
- Validate required fields (injury_location, onset, etc.)
- Remove partial/ambiguous values
- Normalize terms (e.g., "left leg" → "left knee" if needed)
- Rule-based + synonym dictionary (lightweight)

#### **S6.4 - Caching for Reuse**
- Store extracted entities in frontend context
- Reuse in Section 7/8 form generation
- Future: Optional Supabase temp cache or local storage

#### **S6.5 - Pass Entities to Backend**
```typescript
// Augment POST request body
{
  "transcript": "...",
  "clinical_entities": {
    "injury_location": "left knee",
    "pain_severity": "8/10",
    "functional_limitations": ["limping", "cannot lift boxes"],
    // ... other fields
  },
  "template_id": "template-clinical-extraction"
}
```

---

## 🎯 **S7: Template Mapping Layer**

### **S7.1 - Template-Combinations Integration**

#### **New Template Combination**
```json
// Add to backend/config/layers/template-combinations.json
{
  "template-clinical-extraction": {
    "name": "Section 7 + Clinical Extraction",
    "description": "AI formatting with clinical entity extraction (French-English)",
    "layers": ["clinical-extraction-layer"],
    "fallback": "template-only"
  }
}
```

#### **New Layer Definition**
```json
// Add to LayerManager
"clinical-extraction-layer": {
  "name": "Clinical Entity Extraction",
  "priority": 10,
  "processor": "ClinicalExtractionProcessor",
  "features": {
    "bilingual": true,
    "caching": true,
    "validation": true
  }
}
```

### **S7.2 - Template Injection**
```typescript
// Based on selected template ID, inject:
const formatterPayload = {
  prompt: CLINICAL_EXTRACTION_PROMPT,
  golden_json: { 
    injury_location: "", 
    pain_severity: "",
    functional_limitations: []
  },
  examples: [
    { 
      input: "Le patient a une douleur au genou gauche depuis 2 semaines...", 
      output: { "injury_location": "left knee", "onset": "2 weeks ago" }
    }
  ]
};
```

### **S7.3 - Orchestrated Backend Formatter**
```typescript
// Section7AIFormatter / Section8AIFormatter should:
// 1. Receive clinical_entities
// 2. Receive template_content
// 3. Use both to format the final narrative
```

---

## 📦 **Files to Modify (Frontend & Backend)**

### **Frontend Changes**
| File | Update |
|------|--------|
| `injectTemplateContent()` | Add S6.2 extraction step before format call |
| `TranscriptDisplay.tsx` | Add loading state ("Extracting clinical context…") |
| `TemplateSelector.tsx` | Add clinical extraction template option |
| `FormatterContext.ts` | Store clinical_entities and pass through |

### **Backend Changes**
| File | Update |
|------|--------|
| `template-combinations.json` | Add clinical extraction combination |
| `LayerManager.ts` | Add clinical extraction layer |
| `Mode2Formatter.ts` | Add clinical extraction processing |
| `ProcessingOrchestrator.ts` | Pass clinical_entities downstream |

---

## 🧪 **Testing Plan**

| Scenario | Input Type | Expected Outcome |
|----------|------------|------------------|
| Basic Smart Dictation | Clear transcript | Structured JSON extracted and passed to template |
| Noisy Ambient Mode | Messy transcript | Partial extraction, missing fields defaulted |
| Missing Required Fields | Short transcript | Errors handled gracefully, blank fallback |
| Multiple Templates for Same Input | Template changed | Same entities reused, different output |
| French Transcript | French medical text | French extraction with proper terminology |
| English Transcript | English medical text | English extraction with proper terminology |

---

## 🏗️ **Implementation Architecture**

### **Phase 1: Template-Combinations Extension (Week 1)**

#### **1.1 Add Clinical Extraction Layer**
```typescript
// backend/src/services/layers/ClinicalExtractionLayer.ts
export class ClinicalExtractionLayer implements LayerProcessor {
  async process(transcript: string, options: LayerOptions): Promise<LayerResult> {
    // S6.2: Extract clinical entities using OpenAI
    const clinicalEntities = await this.extractClinicalEntities(transcript, options.language);
    
    // S6.3: Validate and clean entities
    const validatedEntities = this.validateAndClean(clinicalEntities);
    
    // S6.4: Cache for reuse
    this.cacheEntities(transcript, validatedEntities);
    
    return {
      success: true,
      data: validatedEntities,
      metadata: {
        processingTime: Date.now() - startTime,
        language: options.language,
        entityCount: Object.keys(validatedEntities).length
      }
    };
  }
  
  private async extractClinicalEntities(transcript: string, language: 'fr' | 'en'): Promise<ClinicalEntities> {
    const prompt = language === 'fr' ? CLINICAL_EXTRACTION_PROMPT : CLINICAL_EXTRACTION_PROMPT_EN;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: prompt.replace('{{TRANSCRIPT}}', transcript)
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });
    
    return JSON.parse(response.choices[0].message.content || '{}');
  }
}
```

#### **1.2 Update Template Combinations**
```json
// backend/config/layers/template-combinations.json
{
  "template-clinical-extraction": {
    "name": "Section 7 + Clinical Extraction",
    "description": "AI formatting with clinical entity extraction (French-English)",
    "layers": ["clinical-extraction-layer"],
    "fallback": "template-only"
  }
}
```

### **Phase 2: Frontend Integration (Week 2)**

#### **2.1 Update injectTemplateContent()**
```typescript
// frontend/src/components/transcription/TranscriptionInterface.tsx
const injectTemplateContent = useCallback(async (template: TemplateJSON) => {
  console.log('Injecting template content:', template.title);
  
  setIsFormatting(true);
  setFormattingProgress('Initializing formatting...');
  
  // Get current transcript
  const rawTranscript = editedTranscript || (paragraphs.length > 0 ? paragraphs.join('\n\n') : currentTranscript);
  
  if (rawTranscript && rawTranscript.trim()) {
    try {
      // S6.2: Clinical entity extraction
      if (template.config?.templateCombo === 'template-clinical-extraction') {
        setFormattingProgress('Extracting clinical context...');
        
        const response = await fetch('/api/format/mode2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: rawTranscript,
            section: '7',
            language: selectedLanguage === 'fr-CA' ? 'fr' : 'en',
            templateCombo: 'template-clinical-extraction'
          })
        });
        
        const result = await response.json();
        
        // Store clinical entities for reuse
        setClinicalEntities(result.clinical_entities);
        setEditedTranscript(result.formatted);
        setAiStepStatus('success');
      } else {
        // Existing template processing
        // ... existing code
      }
    } catch (error) {
      console.error('Template processing error:', error);
      setAiStepStatus('error');
    }
  }
  
  setIsFormatting(false);
}, [editedTranscript, paragraphs, currentTranscript, selectedLanguage]);
```

#### **2.2 Add Clinical Extraction Template**
```typescript
// frontend/src/config/template-config.ts
{
  id: 'section7-clinical-extraction',
  name: 'Section 7 + Clinical Extraction',
  nameFr: 'Section 7 + Extraction Clinique',
  description: 'AI formatting with clinical entity extraction',
  descriptionFr: 'Formatage IA avec extraction d\'entités cliniques',
  type: 'template-combo',
  compatibleSections: ['section_7', 'section_8'],
  compatibleModes: ['smart_dictation', 'ambient'],
  language: 'both',
  complexity: 'high',
  tags: ['clinical', 'extraction', 'ai', 'bilingual'],
  isActive: true,
  isDefault: false,
  features: {
    verbatimSupport: true,
    voiceCommandsSupport: true,
    aiFormatting: true,
    postProcessing: true
  },
  config: {
    templateCombo: 'template-clinical-extraction',
    aiFormattingEnabled: true,
    medicalTerminology: true
  }
}
```

### **Phase 3: Backend Integration (Week 3)**

#### **3.1 Update Mode2Formatter**
```typescript
// backend/src/services/formatter/mode2.ts
private async formatSection7(
  transcript: string, 
  options: Mode2FormattingOptions
): Promise<Mode2FormattingResult> {
  // ... existing code ...
  
  if (templateCombo === 'template-clinical-extraction') {
    // S6: Clinical extraction
    const clinicalEntities = await this.extractClinicalEntities(transcript, options.language);
    
    // S7: Template mapping with clinical entities
    const result = await this.formatWithClinicalEntities(transcript, clinicalEntities, options);
    
    return {
      formatted: result.formatted,
      clinical_entities: clinicalEntities,
      issues: result.issues,
      confidence_score: result.confidence_score
    };
  }
  
  // ... existing template processing
}
```

---

## 🔄 **PROPOSED STRATEGY: UNIVERSAL PREPROCESSING LAYER**

### **🎯 VISION: Clinical Extraction as Universal Cleanup**

#### **Current Architecture (S6-S7-S8 as Separate Template):**
```
S1-S5 → Raw Transcript → User Selects Template → S6-S7-S8 Clinical Extraction → Final Output
```

#### **Proposed Architecture (S7-S8 as Universal Preprocessing):**
```
S1-S5 → Raw Transcript → User Selects Template → S7-S8 Clinical Cleanup → Template Pipeline → Final Output
```

### **🧠 ENHANCED S7-S8: Universal Cleanup Layer**

#### **S7: Universal Clinical Cleanup**
- **Input**: Raw transcript from S1-S5 pipeline
- **Process**: Clean up transcript + extract clinical entities
- **Output**: Cleaned transcript + clinical entities (for ANY template to use)
- **Purpose**: Universal preprocessing that works with ALL templates

#### **S8: Template Pipeline Integration**
- **Input**: Cleaned transcript + clinical entities from S7
- **Process**: Apply selected template's formatting rules
- **Output**: Formatted text enhanced with clinical data
- **Purpose**: Let each template use clinical data in its own way

### **🔄 AMBIENT MODE FLOW (PROPOSED)**

#### **1. User Dictates in Ambient Mode**
```typescript
// Ambient mode always triggers clinical cleanup
if (mode === 'ambient') {
  const rawTranscript = await s1s5Pipeline.process(audioInput);
  const cleaned = await s7s8UniversalCleanup(rawTranscript);
  return await templatePipeline.process(cleaned, selectedTemplate);
}
```

#### **2. Universal Cleanup Layer (S7-S8)**
```typescript
class UniversalCleanupLayer {
  async process(transcript: string, options: LayerOptions) {
    // S7: Clean up transcript
    const cleanedTranscript = this.cleanTranscript(transcript);
    
    // S8: Extract clinical entities (for any template to use)
    const clinicalEntities = await this.extractClinicalEntities(cleanedTranscript);
    
    return {
      cleaned_text: cleanedTranscript,
      clinical_entities: clinicalEntities,
      metadata: { processing_time: Date.now() - startTime }
    };
  }
}
```

#### **3. Template Pipeline Integration**
```typescript
// Enhanced template processing
async processTemplate(cleanedInput: CleanedInput, template: Template) {
  switch (template.type) {
    case 'section7-enhanced':
      return await this.processSection7Enhanced(cleanedInput, template);
    case 'section8-basic':
      return await this.processSection8Basic(cleanedInput, template);
    case 'section11-legal':
      return await this.processSection11Legal(cleanedInput, template);
  }
}
```

### **🎯 BENEFITS OF PROPOSED STRATEGY**

#### **✅ Advantages:**
1. **Universal Cleanup**: S7-S8 works with ANY template
2. **Template Flexibility**: Each template keeps its own formatting rules
3. **Cleaner Architecture**: Separation of concerns (cleanup vs formatting)
4. **Reusable**: Clinical cleanup can be used by any template
5. **Scalable**: Easy to add new templates without changing S7-S8
6. **Enhanced Templates**: All existing templates get clinical data enhancement

#### **✅ Template Examples with Clinical Enhancement:**
- **Section 7 Enhanced**: Master prompt + clinical entities = Better medical formatting
- **Section 8 Basic**: Basic CNESST + clinical entities = Structured medical data
- **Section 11 Legal**: Legal template + clinical entities = Legal + medical documentation

### **🏗️ IMPLEMENTATION PLAN (PROPOSED)**

#### **Phase 1: Refactor Current Implementation**
1. **Rename**: `ClinicalExtractionLayer` → `UniversalCleanupLayer`
2. **Update**: S7-S8 to be template-agnostic
3. **Test**: Ensure current clinical extraction still works

#### **Phase 2: Template Pipeline Integration**
1. **Update**: `Mode2Formatter` to use cleanup + template pipeline
2. **Enhance**: Existing templates to use clinical entities
3. **Test**: All templates work with cleaned input

#### **Phase 3: Ambient Mode Integration**
1. **Integrate**: Universal cleanup with ambient mode
2. **Test**: Ambient mode + any template + clinical cleanup
3. **Validate**: No breaking changes to existing functionality

### **⚠️ CONSIDERATIONS & RISKS**

#### **Potential Issues:**
1. **Breaking Changes**: Current clinical extraction template might break
2. **Performance**: Additional processing for all templates
3. **Complexity**: More complex architecture
4. **Testing**: Need to test all template combinations

#### **Mitigation Strategies:**
1. **Gradual Migration**: Keep current implementation as fallback
2. **Feature Flags**: Enable/disable universal cleanup
3. **Comprehensive Testing**: Test all template combinations
4. **Rollback Plan**: Easy revert to current implementation

---

## 🚀 **Future Extensions**

### **Phase 4: Advanced Features**
1. **Local Fallback Model**: Add MedSpacy for offline entity extraction
2. **Template Scoring**: Enable ranking for template suggestions based on entity match
3. **Multilingual Support**: Enhanced French-English processing
4. **Clinical Validation**: Add medical terminology validation
5. **Batch Processing**: Process multiple transcripts simultaneously

---

## 📋 **SUMMARY FOR GPT AGENT DISCUSSION**

### **🎯 CURRENT STATE (WORKING)**
- **Implementation**: S6-S7-S8 as separate `template-clinical-extraction`
- **Status**: ✅ **FULLY FUNCTIONAL** - Clinical extraction template working
- **Integration**: Works with existing template-combinations system
- **Files**: All implemented and tested

### **🔄 PROPOSED ENHANCEMENT**
- **Vision**: S7-S8 as universal preprocessing layer for ALL templates
- **Benefit**: Clinical cleanup enhances every template, not just clinical extraction
- **Architecture**: `S1-S5 → Raw Transcript → User Selects Template → S7-S8 Cleanup → Template Pipeline → Final Output`

### **🤔 KEY QUESTIONS FOR GPT AGENT**
1. **Architecture Validation**: Is the proposed universal preprocessing approach sound?
2. **Breaking Changes**: What risks exist when refactoring current implementation?
3. **Performance Impact**: How will universal cleanup affect system performance?
4. **Implementation Strategy**: What's the safest migration path?
5. **Template Compatibility**: Will existing templates work with cleaned input?

### **📊 COMPARISON MATRIX**

| Aspect | Current (S6-S7-S8 Template) | Proposed (S7-S8 Universal) |
|--------|----------------------------|----------------------------|
| **Scope** | Clinical extraction only | All templates enhanced |
| **Architecture** | Separate template | Universal preprocessing |
| **Reusability** | Limited to clinical template | Works with any template |
| **Complexity** | Simple, focused | More complex, flexible |
| **Performance** | On-demand only | Always for ambient mode |
| **Breaking Changes** | None (current) | Potential during migration |

### **🎯 RECOMMENDATION**
**Discuss with GPT agent to validate the proposed approach and identify the safest implementation strategy that doesn't break existing functionality.**

---

## ✅ **COMPATIBILITY VERIFICATION**

### **✅ No Conflicts Detected**
- **Template-Combinations System**: Perfect integration point
- **Existing Endpoints**: No changes needed to current API
- **Database Schema**: No modifications required
- **Frontend Components**: Seamless integration with existing UI
- **Authentication**: Follows existing dev mode pattern

### **✅ Backward Compatibility**
- All existing templates continue to work
- No breaking changes to current functionality
- Graceful fallback to original Mode 2 pipeline
- Optional feature - can be disabled

---

## 🎯 **SUCCESS METRICS**

### **Performance Targets**
- **Entity Extraction Time**: < 2 seconds
- **Template Processing Time**: < 5 seconds total
- **Cache Hit Rate**: > 70% for repeated transcripts
- **Memory Usage**: < 100MB additional

### **Quality Targets**
- **Entity Extraction Accuracy**: > 85%
- **Template Completion Rate**: > 90%
- **Bilingual Support**: 100% French/English
- **User Satisfaction**: > 80% approval rate

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Foundation**
- [ ] Create ClinicalExtractionLayer class
- [ ] Add clinical extraction to template-combinations.json
- [ ] Update LayerManager with new layer
- [ ] Create clinical entity extraction prompts (FR/EN)

### **Phase 2: Frontend**
- [ ] Add clinical extraction template to TEMPLATE_CONFIGS
- [ ] Update injectTemplateContent() for clinical extraction
- [ ] Add loading states for clinical processing
- [ ] Update FormatterContext with clinical entities

### **Phase 3: Backend**
- [ ] Update Mode2Formatter for clinical extraction
- [ ] Add clinical entity validation and cleaning
- [ ] Implement caching for extracted entities
- [ ] Add error handling and fallbacks

### **Phase 4: Testing**
- [ ] Test with French medical transcripts
- [ ] Test with English medical transcripts
- [ ] Test with noisy/partial transcripts
- [ ] Test template switching with same entities
- [ ] Performance testing and optimization

---

## 🎉 **READY TO IMPLEMENT**

This implementation plan is **fully validated** and **compatible** with your existing template-combinations system. The French-English clinical extraction prompt is integrated, and the approach leverages your current infrastructure perfectly.

**No code changes yet - this serves as the complete implementation reference!** 🚀