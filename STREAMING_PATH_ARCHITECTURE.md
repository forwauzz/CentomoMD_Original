# CentomoMD - Complete Streaming Path Architecture

## 🎯 Overview

This document provides a complete technical reference for the streaming path from microphone input through AWS Transcribe to the UI, including all hooks, functions, and mode-specific implementations.

## 📋 Table of Contents

1. [Streaming Path Overview](#streaming-path-overview)
2. [Frontend Audio Capture](#frontend-audio-capture)
3. [WebSocket Communication](#websocket-communication)
4. [AWS Transcribe Integration](#aws-transcribe-integration)
5. [Mode-Specific Processing](#mode-specific-processing)
6. [Export System](#export-system)
7. [Consent & Session Management](#consent--session-management)
8. [Voice Commands](#voice-commands)
9. [Template System](#template-system)
10. [Error Handling](#error-handling)

---

## 🎤 Streaming Path Overview

```
Microphone → AudioContext → WebSocket → AWS Transcribe → UI Display
     ↓              ↓            ↓            ↓            ↓
  getUserMedia → ScriptProcessor → Binary Data → Streaming API → React State
```

### Key Components:
- **Audio Capture**: `frontend/src/hooks/useTranscription.ts`
- **WebSocket Handler**: `backend/src/index.ts`
- **AWS Service**: `backend/src/services/transcriptionService.ts`
- **UI Components**: `frontend/src/components/transcription/`

---

## 🎵 Frontend Audio Capture

### File: `frontend/src/hooks/useTranscription.ts`

#### Audio Context Creation
```typescript
const audioContext = new AudioContext({ 
  sampleRate: 16000  // Fixed sample rate for AWS Transcribe
});
```

#### Microphone Access
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    channelCount: 1,                    // Mono audio
    noiseSuppression: false,            // Disabled for medical accuracy
    echoCancellation: false,            // Disabled for medical accuracy
    autoGainControl: false,             // Disabled for medical accuracy
  },
});
```

#### Audio Processing Pipeline
```typescript
const source = audioContext.createMediaStreamSource(stream);
const proc = audioContext.createScriptProcessor(4096, 1, 1);

proc.onaudioprocess = (e) => {
  if (paused || ws.readyState !== WebSocket.OPEN) return;
  
  // Convert Float32 to Int16 PCM
  const ch = e.inputBuffer.getChannelData(0); // Float32 [-1..1]
  const pcm = new Int16Array(ch.length);      // 16-bit little-endian
  
  for (let i = 0; i < ch.length; i++) {
    const s = Math.max(-1, Math.min(1, ch[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Send binary audio data
  ws.send(pcm.buffer);  // 🔑 Binary transmission, not JSON
};
```

#### WebSocket Connection
```typescript
const ws = new WebSocket('ws://localhost:3001/ws/transcription');
ws.binaryType = 'arraybuffer';  // 🔑 Required for binary audio

// Start transcription message
const startMessage = {
  type: 'start_transcription',
  languageCode: 'fr-CA',  // Single language per session
  sampleRate: 16000
};

ws.send(JSON.stringify(startMessage));
```

---

## 🔌 WebSocket Communication

### File: `backend/src/index.ts`

#### Connection Handler
```typescript
const wss = new WebSocketServer({ server });
const activeSessions = new Map();

wss.on('connection', (ws, req) => {
  let started = false;
  let sessionId = `dev-session-id`;
  let pushAudio: ((u8: Uint8Array) => void) | null = null;
  let endAudio: (() => void) | null = null;

  console.log("WebSocket connection established", { sessionId });
```

#### Message Processing
```typescript
ws.on('message', async (data, isBinary) => {
  if (!started) {
    // First message: JSON start_transcription
    try {
      const msg = JSON.parse(data.toString());
      if (msg?.type !== 'start_transcription' || !['fr-CA','en-US'].includes(msg.languageCode)) {
        ws.send(JSON.stringify({ type: 'transcription_error', error: 'Invalid languageCode' }));
        return ws.close();
      }
      started = true;

      // Start AWS stream
      const { pushAudio: feeder, endAudio: ender } = transcriptionService.startStreamingTranscription(
        sessionId,
        { 
          language_code: msg.languageCode, 
          media_sample_rate_hz: msg.sampleRate ?? 16000, 
          show_speaker_labels: false 
        },
        (res) => ws.send(JSON.stringify({ 
          type: 'transcription_result', 
          resultId: res.resultId,
          startTime: res.startTime ?? null,
          endTime: res.endTime ?? null,
          text: res.transcript, 
          isFinal: !res.is_partial,           // 🔑 Partial flag handling
          language_detected: res.language_detected,
          confidence_score: res.confidence_score,
          speaker: res.speaker
        })),
        (err) => ws.send(JSON.stringify({ type: 'transcription_error', error: String(err) }))
      );

      pushAudio = feeder;
      endAudio = ender;

      // Store session info
      activeSessions.set(sessionId, { 
        ws, 
        pushAudio: feeder,
        endAudio: ender,
        config: msg
      });

      // Tell client to start mic
      ws.send(JSON.stringify({ type: 'stream_ready' }));
    } catch {
      ws.send(JSON.stringify({ type: 'transcription_error', error: 'Expected start_transcription JSON' }));
      return ws.close();
    }
    return;
  }

  // Subsequent messages: Binary audio data
  if (isBinary) {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
    if (buf.length && pushAudio) {
      pushAudio(new Uint8Array(buf));  // 🔑 Push to AWS
    }
    return;
  }

  // JSON control messages
  try {
    const msg = JSON.parse(data.toString());
    if (msg?.type === 'stop_transcription') endAudio?.();
    
    // Handle voice commands
    if (msg?.type === 'cmd.save') {
      console.log('Save command received for session:', sessionId);
      ws.send(JSON.stringify({ type:'cmd_ack', cmd:'save', ok:true }));
    }
    if (msg?.type === 'cmd.export') {
      console.log('Export command received for session:', sessionId);
      ws.send(JSON.stringify({ type:'cmd_ack', cmd:'export', ok:true }));
    }
  } catch {}
});
```

---

## ☁️ AWS Transcribe Integration

### File: `backend/src/services/transcriptionService.ts`

#### Service Configuration
```typescript
export class TranscriptionService {
  private client: TranscribeStreamingClient;
  private activeStreams: Map<string, TranscriptResultStream> = new Map();

  constructor() {
    this.client = new TranscribeStreamingClient({
      region: awsConfig.region,  // ca-central-1 (Montreal)
      credentials: {
        accessKeyId: awsConfig.credentials.accessKeyId,
        secretAccessKey: awsConfig.credentials.secretAccessKey,
      }
    });
  }
```

#### StartStreamTranscriptionCommand Configuration
```typescript
startStreamingTranscription(
  sessionId: string, 
  config: TranscriptionConfig,
  onTranscript: (result: TranscriptionResult) => void,
  onError: (error: Error) => void
): { pushAudio: (audioData: Uint8Array) => void; endAudio: () => void } {
  
  // Audio queue for streaming
  const queue: Uint8Array[] = [];
  let done = false;

  // Async iterable for continuous audio streaming
  const audioIterable = (async function* () {
    while (!done || queue.length) {
      if (queue.length) {
        const chunk = queue.shift()!;
        yield { AudioEvent: { AudioChunk: chunk } };
        continue;
      }
      await new Promise((r) => setTimeout(r, 10));
    }
  })();

  // AWS Transcribe configuration
  const cmdInput: StartStreamTranscriptionCommandInput = {
    LanguageCode: config.language_code || 'fr-CA',   // Single language per session
    MediaEncoding: 'pcm',                            // 🔑 AWS expects 'pcm', not 'pcm16'
    MediaSampleRateHertz: config.media_sample_rate_hz || 16000,
    AudioStream: audioIterable,
    ShowSpeakerLabels: true,                         // Enable speaker attribution
    MaxSpeakerLabels: 2,                             // PATIENT vs CLINICIAN
    EnablePartialResultsStabilization: true,
    PartialResultsStability: 'high',                 // 🔑 lowercase, not 'HIGH'
    // Custom vocabulary for medical terms (when available)
    ...(config.vocabulary_name && { VocabularyName: config.vocabulary_name }),
  };

  const command = new StartStreamTranscriptionCommand(cmdInput);
```

#### Partial Result Handling
```typescript
private async handleTranscriptEvents(
  sessionId: string,
  stream: TranscriptResultStream,
  onTranscript: (result: TranscriptionResult) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    for await (const evt of stream) {
      if (!evt.TranscriptEvent) continue;
      const results = evt.TranscriptEvent.Transcript?.Results ?? [];
      
      for (const r of results) {
        const alt = r.Alternatives?.[0];
        if (!alt?.Transcript) continue;
        
        // 🔑 FIXED: Proper partial flag logic
        onTranscript({
          transcript: alt.Transcript,
          is_partial: r.IsPartial === true,        // true means partial
          confidence_score: alt.Confidence,
          timestamp: new Date(),
          resultId: r.ResultId,                    // stable key for tracking
          startTime: r.StartTime ?? null,          // start time in seconds
          endTime: r.EndTime ?? null,              // end time in seconds
          speaker: alt?.Items?.[0]?.Speaker || null, // PATIENT vs CLINICIAN
        });
      }
    }
  } catch (error) {
    console.error(`Error handling transcript events for session ${sessionId}:`, error);
    this.handleTranscribeError(error, onError);
  }
}
```

#### Audio Feeder Functions
```typescript
// Return feeder functions immediately
return {
  pushAudio: (audioData: Uint8Array) => {
    if (!done && audioData && audioData.length > 0) {
      queue.push(audioData);
      console.log(`🎵 Queued ${audioData.length} bytes for session: ${sessionId}`);
    }
  },
  endAudio: () => {
    done = true;
    console.log(`🎵 Audio stream ended for session: ${sessionId}`);
  }
};
```

---

## 🎛️ Mode-Specific Processing

### Transcription Modes

| Mode | Description | Output Format | AWS Configuration |
|------|-------------|---------------|-------------------|
| **Word-for-Word** | Raw live speech-to-text | Plain paragraph | Basic transcription |
| **Smart Dictation** | AI-assisted, medical structured | Section 7–11 templates | Medical vocabulary + formatting |
| **Ambient** | Long-form capture, diarized | Streaming + merge | Speaker labels + extended capture |

### Mode Configuration Types
```typescript
// File: backend/src/types/index.ts
export enum TranscriptionMode {
  WORD_FOR_WORD = 'word_for_word',
  SMART_DICTATION = 'smart_dictation',
  AMBIENT = 'ambient'
}

export interface TranscriptionConfig {
  language_code?: string;
  identify_language?: boolean;  // Optional for single language sessions
  language_options?: string[];  // Optional for single language sessions
  preferred_language?: string;  // Optional for single language sessions
  media_sample_rate_hz: number;
  media_encoding?: 'pcm' | 'pcm16' | 'ogg-opus' | 'flac';
  vocabulary_name?: string;     // Medical vocabulary for Smart Dictation
  vocabulary_filter_name?: string;
  show_speaker_labels?: boolean; // Required for Ambient mode
  max_speaker_labels?: number;   // Default: 2 (PATIENT vs CLINICIAN)
}
```

### Mode-Specific AWS Configuration
```typescript
// Word-for-Word Mode
const wordForWordConfig: StartStreamTranscriptionCommandInput = {
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabels: false,  // No speaker attribution needed
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',
};

// Smart Dictation Mode
const smartDictationConfig: StartStreamTranscriptionCommandInput = {
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabels: true,
  MaxSpeakerLabels: 2,
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',
  VocabularyName: 'medical_terms_fr',  // Custom medical vocabulary
};

// Ambient Mode
const ambientConfig: StartStreamTranscriptionCommandInput = {
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabels: true,     // Required for diarization
  MaxSpeakerLabels: 2,         // PATIENT vs CLINICIAN
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'medium',  // Faster results for long sessions
};
```

---

## 📤 Export System

### Export Controller
**File:** `backend/src/controllers/exportController.ts`

```typescript
import { Router } from 'express';
import { logger } from '@/utils/logger.js';

const router = Router();

// POST /api/export - Export transcript
router.post('/', async (req, res) => {
  try {
    logger.info('POST /api/export - Export transcript');
    // 🔑 TODO: Implement mode-specific export logic
    res.json({ 
      success: true, 
      data: { downloadUrl: 'temp-download-url' },
      message: 'Export endpoint - not yet implemented'
    });
  } catch (error) {
    logger.error('Error exporting transcript:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});
```

### Export Types & Configuration
```typescript
// File: backend/src/types/index.ts
export interface ExportConfig {
  format: ExportFormat;           // 'docx' | 'pdf'
  fidelity: ExportFidelity;       // 'low' | 'medium' | 'high'
  sections: CNESSTSection[];      // ['section_7', 'section_8', 'section_11']
  include_signature?: boolean;
  locale: 'fr' | 'en';
}

export enum ExportFormat {
  DOCX = 'docx',
  PDF = 'pdf'
}

export enum ExportFidelity {
  LOW = 'low',      // Transcript Only - Raw transcription
  MEDIUM = 'medium', // Structured Report - Structured data (1-11)
  HIGH = 'high'     // Full Form - CNESST pixel-perfect form
}
```

### Mode-Specific Export Behavior

| Mode | Export Type | Fidelity | Content |
|------|-------------|----------|---------|
| **Word-for-Word** | Transcript Only | Low | Raw transcription text |
| **Smart Dictation** | Structured Report | Medium | Formatted CNESST sections |
| **Ambient** | Full Form | High | Complete session with speaker attribution |

### Export File Naming
```typescript
// File naming convention: CENTOMO_[SECTION#]_[YYYY-MM-DD]_[PT_LASTNAME].pdf
const generateFileName = (section: string, patientLastName: string): string => {
  const date = new Date().toISOString().split('T')[0];
  return `CENTOMO_${section}_${date}_${patientLastName}.pdf`;
};
```

---

## 🔐 Consent & Session Management

### Database Schema
**File:** `backend/src/database/schema.ts`

```typescript
// Sessions table with consent tracking
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  patient_id: varchar('patient_id', { length: 255 }).notNull(), // External patient identifier
  consent_verified: boolean('consent_verified').notNull().default(false), // 🔑 Consent flag
  status: text('status', { enum: ['active', 'paused', 'completed', 'cancelled'] }).notNull().default('active'),
  mode: text('mode', { enum: ['word_for_word', 'smart_dictation', 'ambient'] }).notNull().default('smart_dictation'),
  current_section: text('current_section', { enum: ['section_7', 'section_8', 'section_11'] }).notNull().default('section_7'),
  started_at: timestamp('started_at').defaultNow().notNull(),
  ended_at: timestamp('ended_at'),
  duration_seconds: integer('duration_seconds'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

### Session Controller
**File:** `backend/src/controllers/sessionController.ts`

```typescript
// POST /api/sessions - Create a new session
router.post('/', async (req, res) => {
  try {
    logger.info('POST /api/sessions - Create new session');
    
    // 🔑 TODO: Implement consent verification for Ambient mode
    const { patient_id, mode, consent_verified } = req.body;
    
    if (mode === 'ambient' && !consent_verified) {
      return res.status(400).json({
        success: false,
        error: 'Consent verification required for Ambient mode'
      });
    }
    
    res.json({ 
      success: true, 
      data: { id: 'temp-session-id' },
      message: 'Session creation endpoint - not yet implemented'
    });
  } catch (error) {
    logger.error('Error creating session:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});
```

### Consent Enforcement Logic
```typescript
// Ambient mode requires explicit consent
const validateConsentForMode = (mode: TranscriptionMode, consentVerified: boolean): boolean => {
  if (mode === 'ambient') {
    return consentVerified === true;
  }
  return true; // Other modes don't require special consent
};
```

---

## 🎙️ Voice Commands

### Core Commands
**File:** `frontend/src/voice/commands-core.ts`

```typescript
export type CommandIntent =
  | 'section.switch' | 'paragraph.break' | 'stream.pause' | 'stream.resume'
  | 'buffer.clear' | 'doc.save' | 'doc.export' | 'undo' | 'format.medical'
  | 'format.cnesst' | 'validation' | 'custom.vocabulary' | 'template.load';

export function detectCoreCommand(text: string, lang:'fr-CA'|'en-US'): {intent:CommandIntent; arg?:string} | null {
  const t = norm(text);
  if (t.length===0 || t.split(' ').length>6) return null; // short utterances only

  const FR = {
    paragraph: ['nouveau paragraphe','paragraphe'],
    pause:     ['pause','pause transcription'],
    resume:    ['reprendre','reprendre transcription','continuer'],
    clear:     ['effacer','vider'],
    save:      ['sauvegarder','enregistrer'],
    export:    ['export','exporter'],
    undo:      ['annuler','retour'],
    format:    ['formatage médical','formatage cnesst','format cnesst'],
    validation: ['validation','valider','vérifier'],
    vocabulary: ['vocabulaire personnalisé','vocabulaire médical'],
    template:  ['charger template','template'],
    section:   /^section\s+(\d{1,2})$/
  };
  
  const EN = {
    paragraph: ['new paragraph','paragraph'],
    pause:     ['pause','pause transcription'],
    resume:    ['resume','resume transcription','continue'],
    clear:     ['clear','erase'],
    save:      ['save'],
    export:    ['export'],
    undo:      ['undo','go back'],
    format:    ['medical formatting','cnesst formatting','format cnesst'],
    validation: ['validation','validate','verify'],
    vocabulary: ['custom vocabulary','medical vocabulary'],
    template:  ['load template','template'],
    section:   /^section\s+(\d{1,2})$/
  };

  const L = lang==='fr-CA'?FR:EN;
  if (L.paragraph.includes(t)) return {intent:'paragraph.break'};
  if (L.pause.includes(t))     return {intent:'stream.pause'};
  if (L.resume.includes(t))    return {intent:'stream.resume'};
  if (L.clear.includes(t))     return {intent:'buffer.clear'};
  if (L.save.includes(t))      return {intent:'doc.save'};
  if (L.export.includes(t))    return {intent:'doc.export'};
  if (L.undo.includes(t))      return {intent:'undo'};
  if (L.format.includes(t))    return {intent:'format.cnesst'};
  if (L.validation.includes(t)) return {intent:'validation'};
  if (L.vocabulary.includes(t)) return {intent:'custom.vocabulary'};
  if (L.template.includes(t))  return {intent:'template.load'};
  const m = t.match(L.section);
  if (m) return {intent:'section.switch', arg:m[1]};
  return null;
}
```

### Verbatim Commands
**File:** `frontend/src/voice/verbatim-commands.ts`

```typescript
// Text protection commands for Word-for-Word mode
export function detectVerbatimCmd(text: string, lang:'fr-CA'|'en-US'): {kind:'open'|'close'|'customOpen'|'customClose'; key?:string} | null {
  const t = norm(text);
  
  const FR = {
    open: ['début verbatim', 'ouvrir verbatim'],
    close: ['fin verbatim', 'fermer verbatim'],
    customOpen: ['rapport radiologique', 'impression radiologique'],
    customClose: ['fin rapport', 'fin impression']
  };
  
  const EN = {
    open: ['start verbatim', 'open verbatim'],
    close: ['end verbatim', 'close verbatim'],
    customOpen: ['radiology report', 'radiology impression'],
    customClose: ['end report', 'end impression']
  };
  
  const L = lang==='fr-CA'?FR:EN;
  
  if (L.open.includes(t)) return {kind:'open'};
  if (L.close.includes(t)) return {kind:'close'};
  if (L.customOpen.includes(t)) return {kind:'customOpen', key:t};
  if (L.customClose.includes(t)) return {kind:'customClose'};
  
  return null;
}
```

### Voice Command Processing
```typescript
// File: frontend/src/hooks/useTranscription.ts
if (seg.isFinal) {
  // 1) verbatim start/end/custom
  const v = detectVerbatimCmd(seg.text, currentLanguageCode as 'fr-CA'|'en-US');
  if (v) {
    addVoiceCommand({
      type: 'verbatim',
      command: seg.text,
      status: 'detected',
      details: `${v.kind}${v.key ? `: ${v.key}` : ''}`
    });
    
    if (v.kind==='open') verbatim.current.isOpen = true;
    if (v.kind==='close') verbatim.current.isOpen = false;
    if (v.kind==='customOpen') verbatim.current.customOpen = v.key;
    if (v.kind==='customClose') verbatim.current.customOpen = null;
    
    updateVoiceCommandStatus(seg.text, 'completed');
    console.log('Verbatim command detected:', v);
    return;
  }

  // 2) core commands
  const c = detectCoreCommand(seg.text, currentLanguageCode as 'fr-CA'|'en-US');
  if (c) {
    addVoiceCommand({
      type: 'core',
      command: seg.text,
      status: 'detected',
      details: `${c.intent}${c.arg ? `: ${c.arg}` : ''}`
    });
    
    // Execute command based on intent
    switch (c.intent) {
      case 'paragraph.break':
        // Add paragraph break
        break;
      case 'stream.pause':
        pauseMic();
        break;
      case 'stream.resume':
        resumeMic();
        break;
      case 'buffer.clear':
        clearLiveBuffer();
        break;
      case 'section.switch':
        if (c.arg) setActiveSection(`section_${c.arg}` as any);
        break;
    }
    
    updateVoiceCommandStatus(seg.text, 'completed');
    console.log('Core command detected:', c);
    return;
  }
}
```

---

## 📋 Template System

### Template Service
**File:** `backend/src/services/templateService.ts`

```typescript
export class TemplateService {
  private templates: Map<string, Template> = new Map();
  private voiceCommandMappings: Map<string, VoiceCommand> = new Map();

  constructor() {
    this.loadTemplates();
    this.buildVoiceCommandMappings();
  }

  /**
   * Load all templates from the templates directory
   */
  private loadTemplates(): void {
    try {
      const templatesDir = join(process.cwd(), 'templates');
      const files = readdirSync(templatesDir).filter(file => file.endsWith('.json'));

      for (const file of files) {
        const templatePath = join(templatesDir, file);
        const templateData = JSON.parse(readFileSync(templatePath, 'utf-8'));
        
        this.templates.set(templateData.id, templateData);
        
        logger.info('Template loaded', {
          templateId: templateData.id,
          section: templateData.section,
          language: templateData.language,
          version: templateData.version
        });
      }
    } catch (error) {
      logger.error('Failed to load templates', error);
      throw error;
    }
  }

  /**
   * Get template by section and language
   */
  getTemplate(section: CNESSTSection, language: 'fr' | 'en' = 'fr'): Template | null {
    const templateKey = `${section}_template_${language}`;
    return this.templates.get(templateKey) || null;
  }
}
```

### AI Formatting Service
**File:** `backend/src/services/aiFormattingService.ts`

```typescript
export class AIFormattingService {
  /**
   * Apply CNESST formatting rules to template content
   */
  static formatTemplateContent(content: string, options: FormattingOptions): FormattedContent {
    try {
      const changes: string[] = [];
      const suggestions: string[] = [];
      let formattedContent = content;

      // Section-specific formatting rules
      switch (options.section) {
        case "7":
          formattedContent = this.formatSection7(formattedContent, changes, options);
          break;
        case "8":
          formattedContent = this.formatSection8(formattedContent, changes, options);
          break;
        case "11":
          formattedContent = this.formatSection11(formattedContent, changes, options);
          break;
        default:
          console.warn(`Unknown section: ${options.section}`);
      }

      // Language-specific formatting
      if (options.language === "fr") {
        formattedContent = this.formatFrenchContent(formattedContent, changes, options);
      }

      // Advanced formatting based on level
      if (options.formattingLevel === "advanced") {
        formattedContent = this.applyAdvancedFormatting(formattedContent, changes, options);
      }

      // Generate suggestions if requested
      if (options.includeSuggestions) {
        suggestions.push(...this.generateSuggestions(formattedContent, options));
      }

      // Calculate statistics
      const statistics = this.calculateStatistics(formattedContent, options.language);

      // Enhanced compliance validation
      const compliance = this.validateCompliance(formattedContent, options);

      return {
        original: content,
        formatted: formattedContent,
        changes,
        suggestions,
        compliance,
        statistics
      };
    } catch (error) {
      console.error('Error in formatTemplateContent:', error);
      return {
        original: content,
        formatted: content,
        changes: [`Error during formatting: ${error}`],
        suggestions: ['Check content format and try again'],
        compliance: {
          cnesst: false,
          medical_terms: false,
          structure: false,
          terminology: false,
          chronology: false
        },
        statistics: {
          wordCount: 0,
          sentenceCount: 0,
          medicalTermsCount: 0,
          complianceScore: 0
        }
      };
    }
  }
}
```

### Template Library Structure
```
backend/template-library/
├── json/
│   ├── section7/
│   │   ├── template_001.json
│   │   ├── template_002.json
│   │   └── ...
│   ├── section8/
│   │   ├── template_001.json
│   │   └── ...
│   └── section11/
│       ├── template_001.json
│       └── ...
├── parse/
│   └── docx_to_template_json.py
└── index.ts
```

---

## ⚠️ Error Handling

### AWS Transcribe Error Handling
```typescript
// File: backend/src/services/transcriptionService.ts
private handleTranscribeError(error: any, onError: (error: Error) => void): void {
  let errorMessage = 'Unknown transcription error';
  
  if (error instanceof BadRequestException) {
    errorMessage = 'Invalid transcription request: ' + error.message;
  } else if (error instanceof InternalFailureException) {
    errorMessage = 'AWS Transcribe internal error: ' + error.message;
  } else if (error instanceof LimitExceededException) {
    errorMessage = 'Transcription limit exceeded: ' + error.message;
  } else if (error instanceof ServiceUnavailableException) {
    errorMessage = 'AWS Transcribe service unavailable: ' + error.message;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  console.error('Transcription error:', errorMessage);
  onError(new Error(errorMessage));
}
```

### WebSocket Error Handling
```typescript
// File: backend/src/index.ts
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
  activeSessions.delete(sessionId);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
  activeSessions.delete(sessionId);
  
  // Clean up AWS stream
  if (endAudio) {
    endAudio();
  }
});
```

### Frontend Error Handling
```typescript
// File: frontend/src/hooks/useTranscription.ts
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  updateState({ 
    isRecording: false, 
    isConnected: false, 
    error: 'Connection error' 
  });
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
  updateState({ 
    isRecording: false, 
    isConnected: false 
  });
};
```

### Auto-Reconnect Logic
```typescript
// Auto-reconnect with exponential backoff
const reconnectWithBackoff = async (attempt: number = 1) => {
  const maxAttempts = 3;
  const baseDelay = 2000;
  
  if (attempt > maxAttempts) {
    updateState({ 
      error: 'Failed to reconnect after 3 attempts' 
    });
    return;
  }
  
  const delay = baseDelay * Math.pow(2, attempt - 1);
  
  setTimeout(async () => {
    try {
      await startTranscription(currentLanguageCode);
      updateState({ error: undefined });
    } catch (error) {
      console.error(`Reconnect attempt ${attempt} failed:`, error);
      reconnectWithBackoff(attempt + 1);
    }
  }, delay);
};
```

---

## 🔧 Environment Configuration

### AWS Configuration
```bash
# File: env.example
AWS_REGION=ca-central-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# Transcribe Configuration
AWS_TRANSCRIBE_LANGUAGE_OPTIONS=en-US,fr-CA
AWS_TRANSCRIBE_PREFERRED_LANGUAGE=fr-CA
AWS_TRANSCRIBE_MEDIA_SAMPLE_RATE_HZ=16000
AWS_TRANSCRIBE_MEDIA_ENCODING=pcm
AWS_TRANSCRIBE_SHOW_SPEAKER_LABELS=true
AWS_TRANSCRIBE_MAX_SPEAKER_LABELS=2
```

### Transcription Configuration
```bash
# Transcription settings
TRANSCRIPTION_MAX_DURATION_SECONDS=3600  # 1 hour
TRANSCRIPTION_AUTO_RECONNECT=true
TRANSCRIPTION_MAX_RECONNECT_ATTEMPTS=3
TRANSCRIPTION_RECONNECT_DELAY_MS=2000

# Voice Commands
VOICE_COMMANDS_ENABLED=true
VOICE_COMMANDS_CONFIDENCE_THRESHOLD=0.8
```

### Export Configuration
```bash
# Export settings
EXPORT_MAX_FILE_SIZE_MB=50
EXPORT_ALLOWED_FORMATS=docx,pdf
EXPORT_TEMP_DIR=temp/exports/
EXPORT_CLEANUP_INTERVAL_HOURS=24
```

---

## 📊 Performance Monitoring

### Key Metrics
- **Audio Latency**: Time from mic input to AWS response
- **Transcription Accuracy**: Confidence scores from AWS
- **Connection Stability**: WebSocket reconnection frequency
- **Memory Usage**: Audio buffer management
- **CPU Usage**: Audio processing overhead

### Logging
```typescript
// Performance logging
console.log(`🎵 Queued ${audioData.length} bytes for session: ${sessionId}`);
console.log(`📝 Transcription result: ${result.transcript} (confidence: ${result.confidence_score})`);
console.log(`🔗 WebSocket reconnection attempt ${attempt} of ${maxAttempts}`);
```

---

## 🚀 Implementation Checklist

### Frontend ✅
- [x] Audio context creation with 16kHz sample rate
- [x] Microphone access with medical-grade settings
- [x] Float32 to Int16 PCM conversion
- [x] Binary WebSocket transmission
- [x] Real-time transcription display
- [x] Voice command detection
- [x] Mode toggle interface

### Backend ✅
- [x] WebSocket server with binary support
- [x] AWS Transcribe integration
- [x] Session management
- [x] Error handling and reconnection
- [x] Template system
- [x] Voice command processing

### AWS Integration ✅
- [x] Transcribe streaming client
- [x] Audio streaming with async iterable
- [x] Partial result handling
- [x] Speaker label support
- [x] Error handling for AWS exceptions

### Mode-Specific Features ⚠️
- [ ] Mode-specific AWS configuration
- [ ] Mode-specific export logic
- [ ] Ambient mode consent enforcement
- [ ] Smart Dictation template integration
- [ ] Word-for-Word plain text output

### Export System ⚠️
- [ ] DOCX export implementation
- [ ] PDF export implementation
- [ ] Mode-specific export formats
- [ ] File naming conventions
- [ ] Export history tracking

---

## 📝 Notes

1. **Binary Audio Transmission**: Critical for performance - sends raw PCM data directly to AWS
2. **Partial Result Handling**: Fixed inverted logic - `r.IsPartial === true` means partial
3. **Speaker Labels**: Limited to 2 speakers (PATIENT vs CLINICIAN) for medical context
4. **Consent Enforcement**: Ambient mode requires explicit consent verification
5. **Template Integration**: Smart Dictation mode uses CNESST templates for formatting
6. **Error Recovery**: Auto-reconnect with exponential backoff for network issues
7. **Compliance**: All data processed in ca-central-1 region for Canadian data residency

---

*Document Version: 1.0*  
*Last Updated: 2024-01-01*  
*Status: Active Development*
