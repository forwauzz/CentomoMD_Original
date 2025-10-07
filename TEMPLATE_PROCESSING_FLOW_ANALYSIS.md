# Template Processing Flow Analysis

## Overview

This document provides a comprehensive analysis of how each template is processed once selected, from user dictate action through final template application. The analysis identifies all files involved and the exact processing pipeline for each template type.

## Complete Flow: From Dictate to Template Application

### **PRE-TRANSCRIPTION (User Hits Dictate)**

**Files Involved:**
- `frontend/src/components/transcription/TranscriptionInterface.tsx` - UI button handler
- `frontend/src/hooks/useTranscription.ts` - WebSocket connection & audio capture
- `backend/src/index.ts` - WebSocket server & session management
- `backend/src/services/transcriptionService.ts` - AWS Transcribe integration

**Flow:**
1. User clicks "Start Dictating" button
2. `handleStartRecording()` called in TranscriptionInterface
3. `startTranscription()` called in useTranscription hook
4. WebSocket connection established to `ws://localhost:3001/ws/transcription`
5. Audio capture starts via `getUserMedia()` → `AudioContext` → `ScriptProcessor`
6. Binary PCM16 audio frames sent to backend
7. Backend routes to AWS Transcribe streaming service

### **DURING TRANSCRIPTION (Real-time Processing)**

**Files Involved:**
- `backend/src/services/transcriptionService.ts` - AWS Transcribe streaming
- `backend/src/index.ts` - WebSocket message handling
- `frontend/src/hooks/useTranscription.ts` - Real-time transcript updates

**Flow:**
1. Audio frames pushed to AWS Transcribe via streaming API
2. Partial results received and forwarded to frontend
3. Frontend updates live transcript display
4. Final results processed when speech segment ends

### **POST-TRANSCRIPTION (Template Application)**

**Files Involved:**
- `frontend/src/components/transcription/TranscriptionInterface.tsx` - Template selection UI
- `backend/src/services/processing/ProcessingOrchestrator.ts` - Main routing logic
- Various formatter services based on template type

## Template Processing Pipelines

### **1. Word-for-Word Formatter (`word-for-word-formatter`)**

```
User Clicks Template
        ↓
TranscriptionInterface.injectTemplateContent()
        ↓
Check: template.id === 'word-for-word-formatter'
        ↓
Call: /api/format/mode1 endpoint
        ↓
ProcessingOrchestrator.processWordForWordFormatter()
        ↓
Import: wordForWordFormatter.js
        ↓
formatWordForWordText(content)
        ↓
┌─────────────────────────────────────┐
│ DETERMINISTIC PROCESSING:           │
│ • Strip speaker prefixes (Pt:, Dr:) │
│ • Convert spoken commands           │
│ • Capitalize sentences              │
│ • Clean spacing                     │
│ • NO AI processing                  │
└─────────────────────────────────────┘
        ↓
Return formatted content
        ↓
Update UI with result
```

**Files Involved:**
- `frontend/src/components/transcription/TranscriptionInterface.tsx` (lines 288-301)
- `backend/src/index.ts` (lines 1612-1679) - `/api/format/mode1`
- `backend/src/services/processing/ProcessingOrchestrator.ts` (lines 497-519)
- `backend/src/utils/wordForWordFormatter.ts` - Core formatting logic

---

### **2. Word-for-Word with AI (`word-for-word-with-ai`)**

```
User Clicks Template
        ↓
TranscriptionInterface.injectTemplateContent()
        ↓
Check: template.id === 'word-for-word-with-ai'
        ↓
Call: /api/format/word-for-word-ai endpoint
        ↓
ProcessingOrchestrator.processWordForWordWithAI()
        ↓
┌─────────────────────────────────────┐
│ STEP 1: DETERMINISTIC FORMATTING   │
│ Import: wordForWordFormatter.js     │
│ formatWordForWordText(content)      │
│ • Strip speaker prefixes            │
│ • Convert spoken commands           │
│ • Basic formatting                  │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ STEP 2: AI FORMATTING              │
│ applyWordForWordAIFormatting()      │
│ • Load: prompts/word-for-word-ai-   │
│   formatting.md                     │
│ • Call OpenAI GPT-4o-mini           │
│ • Temperature: 0.1 (deterministic)  │
│ • Apply medical terminology fixes   │
└─────────────────────────────────────┘
        ↓
Return AI-enhanced content
        ↓
Update UI with result
```

**Files Involved:**
- `frontend/src/components/transcription/TranscriptionInterface.tsx` (lines 288-301)
- `backend/src/index.ts` (lines 1682-1761) - `/api/format/word-for-word-ai`
- `backend/src/services/processing/ProcessingOrchestrator.ts` (lines 369-492)
- `backend/src/utils/wordForWordFormatter.ts` - Step 1 formatting
- `backend/prompts/word-for-word-ai-formatting.md` - AI prompt
- OpenAI API integration

---

### **3. Section 7 AI Formatter (`section7-ai-formatter`)**

```
User Clicks Template
        ↓
TranscriptionInterface.injectTemplateContent()
        ↓
Check: template.id === 'section7-ai-formatter'
        ↓
Call: /api/format/mode2 endpoint
        ↓
ProcessingOrchestrator.processSection7AIFormatter()
        ↓
Import: AIFormattingService
        ↓
AIFormattingService.formatTemplateContent()
        ↓
┌─────────────────────────────────────┐
│ SECTION 7 AI PROCESSING:           │
│ • formatSection7()                  │
│ • Apply CNESST formatting rules     │
│ • Medical terminology enhancement   │
│ • Structure compliance              │
│ • Chronological ordering            │
│ • Compliance validation             │
└─────────────────────────────────────┘
        ↓
Return AI-formatted content
        ↓
Update UI with result
```

**Files Involved:**
- `frontend/src/components/transcription/TranscriptionInterface.tsx` (lines 288-301)
- `backend/src/index.ts` (lines 1828-1900) - `/api/format/mode2`
- `backend/src/services/processing/ProcessingOrchestrator.ts` (lines 524-555)
- `backend/src/services/aiFormattingService.ts` - Core AI formatting
- `backend/src/services/formatter/mode2.ts` - Mode 2 integration

---

### **4. History Evolution AI Formatter (`history-evolution-ai-formatter`)**

```
User Clicks Template
        ↓
TranscriptionInterface.injectTemplateContent()
        ↓
Check: template.id === 'history-evolution-ai-formatter'
        ↓
Call: /api/format-history-evolution endpoint
        ↓
ProcessingOrchestrator.processHistoryEvolutionAIFormatter()
        ↓
Import: AIFormattingService
        ↓
AIFormattingService.formatTemplateContent()
        ↓
┌─────────────────────────────────────┐
│ HISTORY EVOLUTION AI PROCESSING:   │
│ • formatHistoryEvolution()          │
│ • Chronological timeline structure  │
│ • Medical history formatting        │
│ • Doctor visit sequencing           │
│ • Treatment progression tracking    │
│ • CNESST compliance for history     │
└─────────────────────────────────────┘
        ↓
Return AI-formatted history
        ↓
Update UI with result
```

**Files Involved:**
- `frontend/src/components/transcription/TranscriptionInterface.tsx` (lines 288-301)
- `backend/src/index.ts` (lines 1764-1825) - `/api/format-history-evolution`
- `backend/src/services/processing/ProcessingOrchestrator.ts` (lines 560-595)
- `backend/src/services/aiFormattingService.ts` - Core AI formatting
- `backend/src/services/formatter/historyEvolution.ts` - History-specific logic

---

### **5. Section 7 Template Only (`section-7-only`)**

```
User Clicks Template
        ↓
TranscriptionInterface.injectTemplateContent()
        ↓
Check: template.id === 'section-7-only'
        ↓
Call: /api/format/mode2 endpoint
        ↓
ProcessingOrchestrator.processSection7TemplateOnly()
        ↓
┌─────────────────────────────────────┐
│ BASIC TEMPLATE PROCESSING:         │
│ • Normalize paragraph breaks        │
│ • Remove leading/trailing whitespace│
│ • Basic text cleanup                │
│ • NO AI processing                  │
│ • NO verbatim support               │
│ • NO voice commands                 │
└─────────────────────────────────────┘
        ↓
Return basic formatted content
        ↓
Update UI with result
```

**Files Involved:**
- `frontend/src/components/transcription/TranscriptionInterface.tsx` (lines 288-301)
- `backend/src/index.ts` (lines 1828-1900) - `/api/format/mode2`
- `backend/src/services/processing/ProcessingOrchestrator.ts` (lines 596-627)

---

### **6. Section 7 Template + Verbatim (`section-7-verbatim`)**

```
User Clicks Template
        ↓
TranscriptionInterface.injectTemplateContent()
        ↓
Check: template.id === 'section-7-verbatim'
        ↓
Call: /api/format/mode2 endpoint
        ↓
ProcessingOrchestrator.processSection7Verbatim()
        ↓
┌─────────────────────────────────────┐
│ TEMPLATE + VERBATIM PROCESSING:    │
│ • Basic template formatting         │
│ • Preserve exact wording            │
│ • Protect verbatim markers          │
│ • NO AI processing                  │
│ • NO voice commands                 │
└─────────────────────────────────────┘
        ↓
Return verbatim-protected content
        ↓
Update UI with result
```

**Files Involved:**
- `frontend/src/components/transcription/TranscriptionInterface.tsx` (lines 288-301)
- `backend/src/index.ts` (lines 1828-1900) - `/api/format/mode2`
- `backend/src/services/processing/ProcessingOrchestrator.ts` (lines 628-658)

---

### **7. Section 7 Template + Verbatim + Voice Commands (`section-7-full`)**

```
User Clicks Template
        ↓
TranscriptionInterface.injectTemplateContent()
        ↓
Check: template.id === 'section-7-full'
        ↓
Call: /api/format/mode2 endpoint
        ↓
ProcessingOrchestrator.processSection7Full()
        ↓
┌─────────────────────────────────────┐
│ FULL FEATURE PROCESSING:           │
│ • Basic template formatting         │
│ • Preserve exact wording            │
│ • Process voice commands            │
│ • Convert spoken formatting         │
│ • NO AI processing                  │
└─────────────────────────────────────┘
        ↓
Return fully processed content
        ↓
Update UI with result
```

**Files Involved:**
- `frontend/src/components/transcription/TranscriptionInterface.tsx` (lines 288-301)
- `backend/src/index.ts` (lines 1828-1900) - `/api/format/mode2`
- `backend/src/services/processing/ProcessingOrchestrator.ts` (lines 659-689)

---

## Key Files Summary

### **Pre-Transcription Files:**
- `frontend/src/components/transcription/TranscriptionInterface.tsx` - UI controls
- `frontend/src/hooks/useTranscription.ts` - Audio capture & WebSocket
- `backend/src/index.ts` - WebSocket server & session management
- `backend/src/services/transcriptionService.ts` - AWS Transcribe integration

### **Template Processing Files:**
- `backend/src/services/processing/ProcessingOrchestrator.ts` - Main routing
- `backend/src/utils/wordForWordFormatter.ts` - Deterministic formatting
- `backend/src/services/aiFormattingService.ts` - AI formatting service
- `backend/src/services/formatter/historyEvolution.ts` - History-specific logic
- `backend/src/services/formatter/mode2.ts` - Mode 2 integration
- `backend/prompts/word-for-word-ai-formatting.md` - AI prompt

### **API Endpoints:**
- `/api/format/mode1` - Word-for-Word formatter
- `/api/format/word-for-word-ai` - Word-for-Word with AI
- `/api/format/mode2` - Smart Dictation templates
- `/api/format-history-evolution` - History Evolution formatter

## Template Configuration

### **Template Registry Structure**
```typescript
export interface TemplateConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  type: 'content' | 'formatting' | 'processing' | 'combination';
  compatibleSections: string[];
  compatibleModes: string[];
  supportedLanguages: string[];
  content: {
    structure: string;
    placeholders: string[];
    validationRules: string[];
  };
  features: {
    verbatimSupport: boolean;
    voiceCommandsSupport: boolean;
    aiFormatting: boolean;
    postProcessing: boolean;
    realtimeProcessing: boolean;
  };
  configuration: {
    priority: number;
    timeout: number;
    retryAttempts: number;
    fallbackTemplate?: string;
  };
}
```

## Improvement Opportunities

Based on this analysis, here are the key areas where Smart dictation templates can be improved:

### **1. Template Routing Efficiency**
- **Current:** Each template has separate routing logic in `ProcessingOrchestrator.ts`
- **Improvement:** Implement a more dynamic template registry system

### **2. AI Processing Optimization**
- **Current:** AI formatting is called separately for each template
- **Improvement:** Consolidate AI processing with template-specific prompts

### **3. Error Handling & Fallbacks**
- **Current:** Basic error handling with fallback to original content
- **Improvement:** Implement progressive fallback strategies

### **4. Performance Optimization**
- **Current:** Each template processes content independently
- **Improvement:** Implement caching and batch processing for similar templates

### **5. Template Configuration**
- **Current:** Hardcoded template configurations
- **Improvement:** Dynamic template configuration system

## Processing Modes

### **Mode 1: Word-for-Word**
- **Purpose:** Preserves exact spoken words with minimal processing
- **Features:** Voice command conversion, basic formatting
- **Templates:** `word-for-word-formatter`, `word-for-word-with-ai`

### **Mode 2: Smart Dictation**
- **Purpose:** AI-enhanced formatting with medical terminology
- **Features:** AI processing, CNESST compliance, structure optimization
- **Templates:** `section7-ai-formatter`, `section-7-only`, `section-7-verbatim`, `section-7-full`

### **Mode 3: Ambient**
- **Purpose:** AWS handles punctuation, minimal backend processing
- **Features:** Real-time processing, speaker identification
- **Templates:** Basic formatting only

## Conclusion

This analysis provides the complete picture of how each template processes content from user dictate through final formatting. The system uses a decoupled architecture where templates are routed to specific processors based on their ID, with each processor handling the appropriate formatting logic for that template type.

The key insight is that template processing happens in distinct phases:
1. **Pre-processing:** Audio capture and transcription
2. **Template Selection:** User chooses appropriate template
3. **Processing:** Template-specific formatting logic applied
4. **Post-processing:** UI updates and result display

Each template has its own processing pipeline optimized for specific use cases, from basic deterministic formatting to advanced AI-enhanced medical document generation.
