# 🏥 Clinical Content Processing Layer Strategy

## 📋 Current Template Flow Analysis

### **Current User Journey:**
1. **Dictation Page** → User dictates with ambient mode
2. **S1-S5 Pipeline** → Generates speaker-labeled transcript
3. **Template Selection** → User clicks "Select Template" button
4. **Template Dropdown** → Shows available templates (formatter, ai-formatter, template-combo)
5. **Template Application** → `injectTemplateContent()` processes transcript
6. **Formatting** → Backend `ProcessingOrchestrator` applies template-specific processing
7. **Final Output** → Formatted medical document

### **Current Template Types:**
- **`word-for-word-formatter`** - Basic post-processing
- **`word-for-word-with-ai`** - Deterministic + GPT cleanup
- **`section7-ai-formatter`** - Enhanced CNESST formatting
- **`section-7-only`** - Template only
- **`section-7-verbatim`** - Template + verbatim support
- **`section-7-full`** - Full feature set
- **`history-evolution-ai-formatter`** - History of evolution formatting

---

## 🎯 **Clinical Extraction Layer Integration Strategy**

### **Enhanced Pipeline Flow:**
```
S1 (AWS Ingest) → S2 (Merge) → S3 (Role Map) → S4 (Cleanup) → S5 (Narrative) 
    ↓
S6 (Clinical Extraction) ← NEW LAYER
    ↓
S7 (Template Mapping) ← NEW LAYER
    ↓
Template Selection → Template Application → Final Output
```

---

## 🧠 **Lightweight Transformer Model Strategy**

### **Model Selection Priority:**

#### **1. Primary Choice: DistilBERT (66M parameters)**
- **Size:** 60% smaller than BERT
- **Performance:** 97% of BERT performance
- **Memory:** ~250MB RAM
- **Inference:** <50ms per transcript
- **Medical Variants:** Clinical-DistilBERT, Bio-DistilBERT

#### **2. Alternative: TinyBERT (14M parameters)**
- **Size:** 96% smaller than BERT
- **Performance:** 96% of BERT performance
- **Memory:** ~50MB RAM
- **Inference:** <20ms per transcript
- **Best for:** Edge deployment, mobile

#### **3. Fallback: MobileBERT (25M parameters)**
- **Size:** 75% smaller than BERT
- **Performance:** 98% of BERT performance
- **Memory:** ~100MB RAM
- **Inference:** <30ms per transcript
- **Optimized for:** Mobile/edge computing

---

## 🏗️ **Implementation Architecture**

### **Phase 1: Clinical Content Processor (Week 1-2)**

```typescript
// New Clinical Content Processing Layer
class ClinicalContentProcessor {
  private model: DistilBERT;
  private medicalNER: MedicalEntityRecognizer;
  private templateMapper: CNESSTTemplateMapper;
  private cache: Map<string, ClinicalEntities>;

  constructor() {
    this.model = new DistilBERT({
      modelPath: 'clinical-distilbert-base',
      maxLength: 512,
      batchSize: 1
    });
    
    this.medicalNER = new MedicalEntityRecognizer();
    this.templateMapper = new CNESSTTemplateMapper();
    this.cache = new Map();
  }

  async processClinicalContent(transcript: string): Promise<ClinicalEntities> {
    // Check cache first
    const hash = this.hashTranscript(transcript);
    if (this.cache.has(hash)) {
      return this.cache.get(hash)!;
    }
    
    // Extract medical entities
    const entities = await this.extractEntities(transcript);
    
    // Map to CNESST structure
    const structured = await this.templateMapper.map(entities);
    
    // Cache result
    this.cache.set(hash, structured);
    
    return structured;
  }
}
```

### **Phase 2: Entity Extraction Pipeline (Week 3-4)**

```typescript
interface ClinicalEntities {
  chiefComplaint: string;
  history: {
    onset: string;
    mechanism: string;
    duration: string;
    frequency: string;
  };
  painAssessment: {
    scale: number;
    quality: string;
    location: string;
    radiation: string;
  };
  examination: {
    bodyParts: string[];
    findings: string[];
    rangeOfMotion: string;
  };
  assessment: {
    diagnosis: string;
    differential: string[];
    severity: string;
  };
  plan: {
    investigations: string[];
    treatments: string[];
    followUp: string;
  };
  metadata: {
    confidence: number;
    language: 'fr' | 'en';
    processingTime: number;
    modelVersion: string;
  };
}
```

---

## 🔄 **Integration with Existing Flow**

### **Enhanced TranscriptionInterface.tsx:**

```typescript
// In TranscriptionInterface.tsx - injectTemplateContent method
const injectTemplateContent = useCallback(async (template: TemplateJSON) => {
  console.log('Injecting template content:', template.title);
  
  setIsFormatting(true);
  setFormattingProgress('Initializing formatting...');
  
  // Get current transcript
  const rawTranscript = editedTranscript || (paragraphs.length > 0 ? paragraphs.join('\n\n') : currentTranscript);
  
  if (rawTranscript && rawTranscript.trim()) {
    try {
      // NEW: Clinical content extraction
      setFormattingProgress('Extracting clinical entities...');
      const clinicalEntities = await clinicalProcessor.processClinicalContent(rawTranscript);
      
      // NEW: Template mapping based on clinical content
      setFormattingProgress('Mapping to appropriate template...');
      const mappedTemplate = await templateMapper.mapToTemplate(clinicalEntities, template);
      
      // Existing template processing
      setFormattingProgress('Applying template formatting...');
      const formattedContent = await FormattingService.formatContent(rawTranscript, {
        template: mappedTemplate,
        clinicalEntities,
        language: selectedLanguage,
        section: activeSection
      });
      
      setEditedTranscript(formattedContent);
      setAiStepStatus('success');
      
    } catch (error) {
      console.error('Template processing error:', error);
      setAiStepStatus('error');
    }
  }
  
  setIsFormatting(false);
}, [editedTranscript, paragraphs, currentTranscript, selectedLanguage, activeSection]);
```

### **Enhanced ProcessingOrchestrator.ts:**

```typescript
// In ProcessingOrchestrator.ts - applyTemplateProcessing method
private async applyTemplateProcessing(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
  const correlationId = request.correlationId || 'no-correlation-id';
  
  // NEW: Clinical content extraction
  const clinicalEntities = await this.clinicalProcessor.processClinicalContent(content);
  
  // Enhanced template processing with clinical context
  if (template.id === 'section7-ai-formatter') {
    return await this.processSection7AIFormatter(content, template, request, clinicalEntities);
  }
  
  if (template.id === 'word-for-word-with-ai') {
    return await this.processWordForWordWithAI(content, template, request, clinicalEntities);
  }
  
  // ... existing template processing
}
```

---

## 🎯 **Template Mapping Strategy**

### **Intelligent Template Selection:**

```typescript
class CNESSTTemplateMapper {
  mapToTemplate(entities: ClinicalEntities, selectedTemplate: TemplateJSON): TemplateJSON {
    // Analyze clinical content
    const complexity = this.assessComplexity(entities);
    const section = this.determineSection(entities);
    const language = entities.metadata.language;
    
    // Map to appropriate template
    if (complexity === 'high' && section === '7') {
      return this.getTemplate('section7-ai-formatter', language);
    }
    
    if (entities.assessment.diagnosis && entities.plan.investigations.length > 0) {
      return this.getTemplate('section-7-full', language);
    }
    
    if (entities.history.onset && entities.painAssessment.scale > 0) {
      return this.getTemplate('section-7-verbatim', language);
    }
    
    // Default to selected template
    return selectedTemplate;
  }
  
  private assessComplexity(entities: ClinicalEntities): 'low' | 'medium' | 'high' {
    let score = 0;
    
    if (entities.assessment.differential.length > 1) score += 2;
    if (entities.plan.investigations.length > 2) score += 2;
    if (entities.examination.findings.length > 3) score += 2;
    if (entities.plan.treatments.length > 1) score += 1;
    
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }
}
```

---

## 📊 **Performance Optimization**

### **Caching Strategy:**
```typescript
class ClinicalProcessor {
  private cache = new Map<string, ClinicalEntities>();
  private cacheSize = 100; // Limit cache size
  
  async processClinicalContent(transcript: string): Promise<ClinicalEntities> {
    const hash = this.hashTranscript(transcript);
    
    // Check cache first
    if (this.cache.has(hash)) {
      return this.cache.get(hash)!;
    }
    
    // Process with model
    const result = await this.extractEntities(transcript);
    
    // Cache management
    if (this.cache.size >= this.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(hash, result);
    return result;
  }
}
```

### **Batch Processing:**
```typescript
class BatchProcessor {
  private queue: string[] = [];
  private batchSize = 4;
  private processing = false;
  
  async addToQueue(transcript: string): Promise<ClinicalEntities> {
    this.queue.push(transcript);
    
    if (this.queue.length >= this.batchSize && !this.processing) {
      return await this.processBatch();
    }
    
    return this.processSingle(transcript);
  }
}
```

---

## 🚀 **Deployment Strategy**

### **Docker Container:**
```dockerfile
FROM python:3.9-slim

# Install lightweight model
RUN pip install transformers torch

# Copy model files
COPY models/clinical-distilbert /app/models/

# Copy application
COPY src/ /app/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health/clinical || exit 1

CMD ["python", "app.py"]
```

### **API Endpoint:**
```typescript
// Express.js endpoint
app.post('/api/clinical/extract', async (req, res) => {
  try {
    const { transcript, language, section } = req.body;
    
    const entities = await clinicalProcessor.processClinicalContent(transcript);
    const mappedTemplate = await templateMapper.mapToTemplate(entities, { section, language });
    
    res.json({
      success: true,
      clinicalEntities: entities,
      recommendedTemplate: mappedTemplate,
      processingTime: entities.metadata.processingTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📈 **Success Metrics**

### **Performance Targets:**
- **Processing Time:** < 100ms per transcript
- **Memory Usage:** < 1GB RAM
- **Accuracy:** > 85% entity extraction
- **Uptime:** > 99.9%
- **Cache Hit Rate:** > 70%

### **Quality Targets:**
- **Template Completion:** > 90% of required fields
- **Medical Accuracy:** > 80% doctor approval rate
- **Multilingual Support:** English + French
- **Clinical Relevance:** > 85% appropriate template selection

---

## 🔧 **Implementation Phases**

### **Phase 1: Foundation (Week 1-2)**
- [ ] Set up DistilBERT model
- [ ] Create ClinicalContentProcessor class
- [ ] Implement basic entity extraction
- [ ] Add caching mechanism

### **Phase 2: Integration (Week 3-4)**
- [ ] Integrate with existing template flow
- [ ] Enhance ProcessingOrchestrator
- [ ] Update TranscriptionInterface
- [ ] Add template mapping logic

### **Phase 3: Optimization (Week 5-6)**
- [ ] Performance optimization
- [ ] Batch processing
- [ ] Error handling
- [ ] Monitoring and metrics

### **Phase 4: Production (Week 7-8)**
- [ ] Docker deployment
- [ ] API endpoints
- [ ] Health checks
- [ ] Documentation

---

## 💡 **Key Advantages**

1. **Real-time Processing:** < 100ms inference time
2. **Low Memory Footprint:** < 1GB RAM usage
3. **Intelligent Template Selection:** Based on clinical content
4. **Multilingual Support:** English + French
5. **Caching:** 70%+ cache hit rate
6. **Scalable:** Batch processing support
7. **Medical Accuracy:** 85%+ entity extraction
8. **Seamless Integration:** Works with existing flow

---

## 🎯 **Next Steps**

1. **Choose specific model** (DistilBERT recommended)
2. **Set up development environment** with model
3. **Create entity extraction pipeline**
4. **Integrate with existing S1-S5 flow**
5. **Test with completed forms**
6. **Deploy and monitor**

This lightweight approach gives you **professional clinical extraction** without the computational overhead of large models, seamlessly integrated into your existing template flow!
