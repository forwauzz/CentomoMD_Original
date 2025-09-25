# CentomoMD Transcription Modes & Pipeline Architecture

## 🎯 **3 Transcription Modes Overview**

### **1. Word-for-Word Mode** 
**Purpose:** Raw, verbatim transcription with minimal processing
- **AWS Configuration:** No speaker labels, high stability, no medical vocabulary
- **Pipeline:** S1-S5 → Word-for-Word Formatter → Output
- **Processing:** 
  - Strips speaker prefixes (Pt:, Dr:, etc.)
  - Converts spoken commands ("period" → ".", "new paragraph" → "\n\n")
  - Applies light clinical fixes (spine levels, doctor abbreviations)
  - Capitalizes sentences after punctuation
- **Layers Used:** **S1-S5 layers** + Word-for-Word specific formatter
- **Universal Cleanup:** ❌ **No** - uses dedicated word-for-word processing

### **2. Smart Dictation Mode**
**Purpose:** AI-assisted medical structured transcription
- **AWS Configuration:** No speaker labels, high stability, medical vocabulary (planned)
- **Pipeline:** S1-S5 → Mode2Formatter → Template Pipeline → AI Formatting → Output
- **Processing:**
  - Uses `formatWithGuardrails()` - the core AI formatting engine
  - Applies medical terminology and CNESST formatting
  - Supports verbatim text protection and voice commands
  - Template-based formatting for Sections 7, 8, 11
- **Layers Used:** **S1-S8 layers** + Mode2Formatter + Template combinations
- **Universal Cleanup:** ✅ **Yes** - when `UNIVERSAL_CLEANUP_ENABLED=true`

### **3. Ambient Mode**
**Purpose:** Long-form capture with speaker diarization
- **AWS Configuration:** Speaker labels enabled, high stability, no vocabulary
- **Pipeline:** S1-S5 → Universal Cleanup (S7-S8) → Template Pipeline → Output
- **Processing:**
  - AWS handles punctuation automatically
  - Speaker diarization (Patient vs Clinician)
  - Clinical entity extraction via Universal Cleanup Layer
  - Template-based formatting with clinical data integration
- **Layers Used:** **S1-S8 layers** + Universal Cleanup Layer
- **Universal Cleanup:** ✅ **Yes** - always uses S7-S8 Universal Cleanup

## 🏗️ **Layer Architecture Breakdown**

### **S1-S5 Layers (Base Processing)**
- **S1-S5:** Core transcription pipeline used by ALL modes
- **Purpose:** Raw audio → AWS Transcribe → Basic text processing
- **Used by:** Word-for-Word, Smart Dictation, Ambient

### **S6-S8 Layers (Advanced Processing)**
- **S6:** Template selection and compatibility checking
- **S7:** Universal Cleanup Layer (clinical entity extraction)
- **S8:** Template Pipeline (section-specific formatting)

### **Universal Cleanup Layer (S7-S8)**
- **Purpose:** Clean transcript + extract clinical entities for ANY template
- **Used by:** 
  - ✅ **Smart Dictation** (when feature flag enabled)
  - ✅ **Ambient Mode** (always)
  - ❌ **Word-for-Word** (uses dedicated formatter instead)

## 🎛️ **Mode-Specific AWS Configuration**

### **Word-for-Word Mode**
```typescript
const wordForWordConfig = {
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabels: false,  // No speaker attribution needed
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',
  // NO VocabularyName - raw transcription only
};
```

### **Smart Dictation Mode**
```typescript
const smartDictationConfig = {
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabels: false,  // No speaker labels for Mode 2
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',
  // VocabularyName: 'medical_terms_fr'  // TODO: Create medical vocabulary
};
```

### **Ambient Mode**
```typescript
const ambientConfig = {
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabels: true,   // Enable speaker labels for diarization
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',
  // NO VocabularyName - AWS handles punctuation automatically
};
```

## 🔄 **Processing Pipelines**

### **Word-for-Word Pipeline**
```
Audio Input → AWS Transcribe → S1-S5 Base Processing → Word-for-Word Formatter → Output
```

**Word-for-Word Formatter Steps:**
1. Strip speaker prefixes (Pt:, Dr:, etc.)
2. Convert spoken commands ("period" → ".", "new paragraph" → "\n\n")
3. Apply light clinical fixes (spine levels, doctor abbreviations)
4. Clean spacing and capitalize sentences
5. Return formatted text

### **Smart Dictation Pipeline**
```
Audio Input → AWS Transcribe → S1-S5 → Mode2Formatter → [Universal Cleanup?] → Template Pipeline → AI Formatting → Output
```

**Smart Dictation Processing:**
1. **Base Processing:** S1-S5 layers handle raw transcription
2. **Mode2Formatter:** Core formatting engine with `formatWithGuardrails()`
3. **Universal Cleanup (Optional):** When `UNIVERSAL_CLEANUP_ENABLED=true`
   - S7: Clean transcript + extract clinical entities
   - S8: Template pipeline integration
4. **AI Formatting:** Medical terminology, CNESST formatting, structure
5. **Template Support:** Sections 7, 8, 11 with verbatim protection

### **Ambient Pipeline**
```
Audio Input → AWS Transcribe → S1-S5 → Speaker Diarization → Universal Cleanup (S7-S8) → Template Pipeline → AI Formatting → Output
```

**Ambient Processing:**
1. **Base Processing:** S1-S5 layers handle raw transcription
2. **Speaker Diarization:** AWS identifies Patient vs Clinician speakers
3. **Universal Cleanup (Always):** S7-S8 clinical entity extraction
4. **Template Pipeline:** Section-specific formatting with clinical data
5. **AI Formatting:** Enhanced with speaker attribution and clinical entities

## 📊 **Mode Comparison Table**

| Feature | Word-for-Word | Smart Dictation | Ambient |
|---------|---------------|-----------------|---------|
| **Speaker Labels** | ❌ No | ❌ No | ✅ Yes |
| **Medical Vocabulary** | ❌ No | ✅ Planned | ❌ No |
| **Punctuation** | Manual (spoken commands) | AI + Manual | AWS Auto |
| **S1-S5 Layers** | ✅ Yes | ✅ Yes | ✅ Yes |
| **S6-S8 Layers** | ❌ No | ✅ Yes | ✅ Yes |
| **Universal Cleanup** | ❌ No | ✅ Optional | ✅ Always |
| **AI Formatting** | ❌ No | ✅ Yes | ✅ Yes |
| **Clinical Extraction** | ❌ No | ✅ Optional | ✅ Yes |
| **Template Support** | ❌ No | ✅ Yes | ✅ Yes |
| **Voice Commands** | ✅ Yes | ✅ Yes | ❌ No |
| **Verbatim Protection** | ❌ No | ✅ Yes | ❌ No |

## 🎯 **Key Implementation Files**

### **Core Configuration**
- `backend/src/index.ts` - `getModeSpecificConfig()` function
- `backend/src/types/index.ts` - `TranscriptionMode` enum
- `frontend/src/types/index.ts` - Frontend mode types

### **Word-for-Word Processing**
- `backend/src/utils/wordForWordFormatter.ts` - Core formatter
- `frontend/src/utils/wordForWordFormatter.ts` - Frontend formatter
- `backend/prompts/word-for-word-ai-formatting.md` - AI prompt
- `frontend/src/templates/wordForWordTemplate.json` - Template config

### **Smart Dictation Processing**
- `backend/src/services/formatter/mode2.ts` - Mode2Formatter class
- `backend/src/services/formatter/shared.ts` - `formatWithGuardrails()` function
- `backend/src/services/aiFormattingService.ts` - AI formatting service
- `backend/config/layers/template-combinations.json` - Layer combinations

### **Ambient Processing**
- `backend/src/services/layers/UniversalCleanupLayer.ts` - S7-S8 cleanup
- `backend/src/services/formatter/TemplatePipeline.ts` - S8 template pipeline
- `backend/src/services/processing/ProcessingOrchestrator.ts` - Orchestration

### **Layer Management**
- `backend/src/services/layers/LayerManager.ts` - Layer management system
- `backend/config/layers/template-combinations.json` - Template combinations

## 🔧 **Feature Flags & Environment Variables**

### **Universal Cleanup**
- `UNIVERSAL_CLEANUP_ENABLED=false` - Controls S7-S8 cleanup layer
- When enabled: Smart Dictation and Ambient use clinical entity extraction
- When disabled: Smart Dictation uses direct AI formatting

### **Mode-Specific Features**
- `VITE_WS_URL` - WebSocket URL for real-time transcription
- `OPENAI_API_KEY` - Required for AI formatting in Smart Dictation and Ambient
- `AWS_REGION` - AWS Transcribe region configuration

## 🚀 **Usage Guidelines**

### **When to Use Word-for-Word**
- Fast, accurate capture needed
- Minimal processing required
- Verbatim transcription important
- No AI formatting needed

### **When to Use Smart Dictation**
- Medical structured transcription needed
- AI formatting and templates required
- Voice commands and verbatim protection needed
- CNESST compliance required

### **When to Use Ambient**
- Long-form capture needed
- Speaker diarization required
- Clinical entity extraction needed
- Multi-speaker conversations

## 📝 **Notes**

- **Punctuation Handling:** Word-for-Word uses manual spoken commands, Smart Dictation uses AI + manual, Ambient uses AWS auto-punctuation
- **Speaker Diarization:** Only Ambient mode supports speaker identification
- **Clinical Extraction:** Universal Cleanup Layer (S7-S8) provides clinical entity extraction for Smart Dictation and Ambient
- **Template Support:** Only Smart Dictation and Ambient support CNESST section templates
- **Voice Commands:** Word-for-Word and Smart Dictation support spoken formatting commands

---

*Last Updated: 2025-09-23*
*Version: 1.0.0*
