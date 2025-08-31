# CentomoMD - Mode Seams & AWS Parameters Analysis

## 🎯 Overview

This document provides a detailed technical analysis of mode seams, AWS Transcribe parameters, and audio processing specifics for the CentomoMD streaming architecture.

## 📋 Table of Contents

1. [AWS Transcribe Command Analysis](#aws-transcribe-command-analysis)
2. [Mode-Specific Parameter Seams](#mode-specific-parameter-seams)
3. [IsPartial Handling Chain](#ispartial-handling-chain)
4. [Audio Processing Pipeline](#audio-processing-pipeline)
5. [Binary WebSocket Transmission](#binary-websocket-transmission)
6. [Parameter Configuration Matrix](#parameter-configuration-matrix)

---

## ☁️ AWS Transcribe Command Analysis

### StartStreamTranscriptionCommand Configuration

**File:** `backend/src/services/transcriptionService.ts`

#### Current Implementation
```typescript
// Lines 47-60: StartStreamTranscriptionCommand configuration
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
```

#### All Available Parameters
```typescript
interface StartStreamTranscriptionCommandInput {
  // Language Configuration
  LanguageCode?: string;                           // 'fr-CA' | 'en-US'
  IdentifyLanguage?: boolean;                      // ❌ NOT USED - single language per session
  LanguageOptions?: string[];                      // ❌ NOT USED - single language per session
  PreferredLanguage?: string;                      // ❌ NOT USED - single language per session
  
  // Audio Configuration
  MediaEncoding: 'pcm' | 'pcm16' | 'ogg-opus' | 'flac';
  MediaSampleRateHertz: number;                    // 16000 Hz
  AudioStream: AsyncIterable<AudioStream>;
  
  // Speaker Identification
  ShowSpeakerLabels?: boolean;                     // true for Ambient/Smart Dictation
  MaxSpeakerLabels?: number;                       // 2 (PATIENT vs CLINICIAN)
  
  // Partial Results
  EnablePartialResultsStabilization?: boolean;     // true
  PartialResultsStability?: 'low' | 'medium' | 'high';
  
  // Channel Configuration
  EnableChannelIdentification?: boolean;           // ❌ NOT USED - mono audio
  NumberOfChannels?: number;                       // ❌ NOT USED - mono audio
  
  // Custom Vocabulary
  VocabularyName?: string;                         // Medical terms for Smart Dictation
  VocabularyFilterName?: string;                   // ❌ NOT USED
  
  // Content Redaction
  ContentRedaction?: ContentRedaction;             // ❌ NOT USED - PHI protection
  
  // Language Identification
  LanguageIdentificationSettings?: LanguageIdentificationSettings; // ❌ NOT USED
}
```

---

## 🎛️ Mode-Specific Parameter Seams

### Current Mode Configuration

**File:** `backend/src/types/index.ts`

```typescript
// Lines 34-40: TranscriptionMode enum
export enum TranscriptionMode {
  WORD_FOR_WORD = 'word_for_word',
  SMART_DICTATION = 'smart_dictation',
  AMBIENT = 'ambient'
}

// Lines 81-92: TranscriptionConfig interface
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

### Mode-Specific AWS Configuration Seams

#### 1. Word-for-Word Mode
```typescript
// Should be implemented in transcriptionService.ts
const wordForWordConfig: StartStreamTranscriptionCommandInput = {
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabels: false,  // ❌ NO speaker attribution needed
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',
  // NO VocabularyName - raw transcription only
};
```

#### 2. Smart Dictation Mode
```typescript
// Should be implemented in transcriptionService.ts
const smartDictationConfig: StartStreamTranscriptionCommandInput = {
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabels: true,    // ✅ Speaker attribution for medical context
  MaxSpeakerLabels: 2,        // PATIENT vs CLINICIAN
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',
  VocabularyName: 'medical_terms_fr',  // ✅ Custom medical vocabulary
};
```

#### 3. Ambient Mode
```typescript
// Should be implemented in transcriptionService.ts
const ambientConfig: StartStreamTranscriptionCommandInput = {
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabels: true,     // ✅ Required for diarization
  MaxSpeakerLabels: 2,         // PATIENT vs CLINICIAN
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'medium',  // ✅ Faster results for long sessions
  // NO VocabularyName - long-form capture
};
```

### Missing Mode-Specific Implementation

**Current Issue:** All modes use the same AWS configuration in `transcriptionService.ts`

```typescript
// Lines 47-60: Current implementation - NO mode differentiation
const cmdInput: StartStreamTranscriptionCommandInput = {
  LanguageCode: config.language_code || 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: config.media_sample_rate_hz || 16000,
  AudioStream: audioIterable,
  ShowSpeakerLabels: true,     // ❌ Always true - should be mode-specific
  MaxSpeakerLabels: 2,
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high', // ❌ Always 'high' - should be mode-specific
  ...(config.vocabulary_name && { VocabularyName: config.vocabulary_name }),
};
```

**Required Fix:**
```typescript
// Should be implemented in transcriptionService.ts
const getModeSpecificConfig = (mode: TranscriptionMode, baseConfig: TranscriptionConfig): StartStreamTranscriptionCommandInput => {
  const base = {
    LanguageCode: baseConfig.language_code || 'fr-CA',
    MediaEncoding: 'pcm',
    MediaSampleRateHertz: baseConfig.media_sample_rate_hz || 16000,
    AudioStream: audioIterable,
    EnablePartialResultsStabilization: true,
  };

  switch (mode) {
    case 'word_for_word':
      return {
        ...base,
        ShowSpeakerLabels: false,
        PartialResultsStability: 'high',
      };
    
    case 'smart_dictation':
      return {
        ...base,
        ShowSpeakerLabels: true,
        MaxSpeakerLabels: 2,
        PartialResultsStability: 'high',
        VocabularyName: 'medical_terms_fr',
      };
    
    case 'ambient':
      return {
        ...base,
        ShowSpeakerLabels: true,
        MaxSpeakerLabels: 2,
        PartialResultsStability: 'medium',
      };
    
    default:
      return base;
  }
};
```

---

## 🔍 IsPartial Handling Chain

### 1. AWS Transcribe Response Processing

**File:** `backend/src/services/transcriptionService.ts`

#### Lines 168-175: IsPartial Check
```typescript
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
```

### 2. WebSocket Message Transformation

**File:** `backend/src/index.ts`

#### Lines 483: IsPartial to isFinal Conversion
```typescript
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
}))
```

### 3. Frontend Processing

**File:** `frontend/src/hooks/useTranscription.ts`

#### Lines 50-60: Segment Creation
```typescript
// Enhanced segment tracking with stable IDs and speaker info
const seg = {
  id: msg.resultId || crypto.randomUUID(),
  text: msg.text,
  startTime: msg.startTime,
  endTime: msg.endTime,
  isFinal: !!msg.isFinal,        // 🔑 Uses isFinal from WebSocket
  speaker: msg.speaker,
  isProtected: false
};
```

#### Lines 70-80: Final Segment Processing
```typescript
if (seg.isFinal) {
  // 1) verbatim start/end/custom
  const v = detectVerbatimCmd(seg.text, currentLanguageCode as 'fr-CA'|'en-US');
  if (v) {
    // Handle verbatim commands
    return;
  }

  // 2) core commands
  const c = detectCoreCommand(seg.text, currentLanguageCode as 'fr-CA'|'en-US');
  if (c) {
    // Handle core commands
    return;
  }
}
```

### 4. Downstream Handlers for Final Segments

#### Voice Command Detection
```typescript
// Lines 70-120: Voice command processing for final segments only
if (seg.isFinal) {
  // Verbatim commands
  const v = detectVerbatimCmd(seg.text, currentLanguageCode);
  if (v) {
    addVoiceCommand({
      type: 'verbatim',
      command: seg.text,
      status: 'detected',
      details: `${v.kind}${v.key ? `: ${v.key}` : ''}`
    });
    return;
  }

  // Core commands
  const c = detectCoreCommand(seg.text, currentLanguageCode);
  if (c) {
    addVoiceCommand({
      type: 'core',
      command: seg.text,
      status: 'detected',
      details: `${c.intent}${c.arg ? `: ${c.arg}` : ''}`
    });
    return;
  }
}
```

#### Section Routing
```typescript
// Lines 65-70: Route final segments to CNESST sections
const routeFinalToSection = useCallback((seg: Segment) => {
  setBuffers(prev => {
    const arr = prev[activeSection] ?? [];
    return { ...prev, [activeSection]: [...arr, seg] };
  });
}, [activeSection]);
```

#### Template Integration (Smart Dictation)
```typescript
// Should be implemented for Smart Dictation mode
if (mode === 'smart_dictation' && seg.isFinal) {
  // Apply AI formatting to final segments
  const formatted = AIFormattingService.formatTemplateContent(seg.text, {
    section: activeSection.replace('section_', ''),
    language: currentLanguageCode === 'fr-CA' ? 'fr' : 'en',
    formattingLevel: 'standard'
  });
}
```

---

## 🎵 Audio Processing Pipeline

### Frontend Audio Producer

**File:** `frontend/src/hooks/useTranscription.ts`

#### Audio Context Creation
```typescript
// Lines 30-35: Audio context setup
const audioContext = new AudioContext({ 
  sampleRate: 16000  // Fixed sample rate for AWS Transcribe
});

const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    channelCount: 1,                    // Mono audio
    noiseSuppression: false,            // Disabled for medical accuracy
    echoCancellation: false,            // Disabled for medical accuracy
    autoGainControl: false,             // Disabled for medical accuracy
  },
});
```

#### ScriptProcessor Configuration
```typescript
// Lines 40-45: Audio processing setup
const source = audioContext.createMediaStreamSource(stream);
const proc = audioContext.createScriptProcessor(4096, 1, 1);  // 🔑 4096 samples buffer

// Buffer size calculation:
// 4096 samples ÷ 16000 Hz = 256ms chunks
// 256ms chunks sent to WebSocket
```

#### Float32 to Int16 Conversion
```typescript
// Lines 50-65: Audio processing pipeline
proc.onaudioprocess = (e) => {
  if (paused || ws.readyState !== WebSocket.OPEN) return;
  
  // Convert Float32 to Int16 PCM
  const ch = e.inputBuffer.getChannelData(0); // Float32 [-1..1]
  const pcm = new Int16Array(ch.length);      // 16-bit little-endian
  
  for (let i = 0; i < ch.length; i++) {
    const s = Math.max(-1, Math.min(1, ch[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;  // 🔑 Float32 → Int16 conversion
  }
  
  // Send binary audio data
  ws.send(pcm.buffer);  // 🔑 Binary transmission, not JSON
};
```

### Audio Chunk Specifications

| Parameter | Value | Calculation |
|-----------|-------|-------------|
| **Buffer Size** | 4096 samples | Fixed by ScriptProcessor |
| **Sample Rate** | 16000 Hz | Fixed for AWS Transcribe |
| **Chunk Duration** | 256ms | 4096 ÷ 16000 = 0.256s |
| **Audio Format** | Int16 PCM | 16-bit little-endian |
| **Channels** | 1 (Mono) | Single channel audio |
| **Bit Depth** | 16-bit | 2 bytes per sample |
| **Chunk Size** | 8192 bytes | 4096 samples × 2 bytes |

### Binary WebSocket Transmission Points

#### 1. Frontend Audio Producer
**File:** `frontend/src/hooks/useTranscription.ts`

```typescript
// Line 65: Primary binary transmission point
ws.send(pcm.buffer);  // 🔑 Raw Int16 PCM data
```

#### 2. WebSocket Binary Handler
**File:** `backend/src/index.ts`

```typescript
// Lines 490-495: Binary data reception
if (isBinary) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
  if (buf.length && pushAudio) {
    pushAudio(new Uint8Array(buf));  // 🔑 Push to AWS
  }
  return;
}
```

#### 3. AWS Audio Queue
**File:** `backend/src/services/transcriptionService.ts`

```typescript
// Lines 120-130: Audio queue management
return {
  pushAudio: (audioData: Uint8Array) => {
    if (!done && audioData && audioData.length > 0) {
      queue.push(audioData);  // 🔑 Queue for AWS streaming
      console.log(`🎵 Queued ${audioData.length} bytes for session: ${sessionId}`);
    }
  },
  endAudio: () => {
    done = true;
    console.log(`🎵 Audio stream ended for session: ${sessionId}`);
  }
};
```

#### 4. AWS Audio Stream
**File:** `backend/src/services/transcriptionService.ts`

```typescript
// Lines 35-45: Async iterable for AWS
const audioIterable = (async function* () {
  while (!done || queue.length) {
    if (queue.length) {
      const chunk = queue.shift()!;
      yield { AudioEvent: { AudioChunk: chunk } };  // 🔑 Yield to AWS
      continue;
    }
    await new Promise((r) => setTimeout(r, 10));
  }
})();
```

---

## 📊 Parameter Configuration Matrix

### All AWS Transcribe Parameters

| Parameter | Current Value | Mode-Specific Requirements | Implementation Status |
|-----------|---------------|---------------------------|----------------------|
| **LanguageCode** | `'fr-CA'` | All modes | ✅ Implemented |
| **IdentifyLanguage** | ❌ Not used | ❌ Not needed | ✅ Correctly omitted |
| **LanguageOptions** | ❌ Not used | ❌ Not needed | ✅ Correctly omitted |
| **PreferredLanguage** | ❌ Not used | ❌ Not needed | ✅ Correctly omitted |
| **MediaEncoding** | `'pcm'` | All modes | ✅ Implemented |
| **MediaSampleRateHertz** | `16000` | All modes | ✅ Implemented |
| **ShowSpeakerLabels** | `true` | ❌ Should be mode-specific | ⚠️ Needs mode differentiation |
| **MaxSpeakerLabels** | `2` | Smart Dictation + Ambient | ✅ Implemented |
| **EnablePartialResultsStabilization** | `true` | All modes | ✅ Implemented |
| **PartialResultsStability** | `'high'` | ❌ Should be mode-specific | ⚠️ Needs mode differentiation |
| **EnableChannelIdentification** | ❌ Not used | ❌ Mono audio | ✅ Correctly omitted |
| **NumberOfChannels** | ❌ Not used | ❌ Mono audio | ✅ Correctly omitted |
| **VocabularyName** | Conditional | Smart Dictation only | ⚠️ Needs mode differentiation |

### Mode-Specific Parameter Requirements

#### Word-for-Word Mode
```typescript
{
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabels: false,                    // ❌ Currently always true
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',
  // NO VocabularyName
}
```

#### Smart Dictation Mode
```typescript
{
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabels: true,                     // ✅ Currently true
  MaxSpeakerLabels: 2,
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',             // ✅ Currently high
  VocabularyName: 'medical_terms_fr',          // ❌ Currently conditional
}
```

#### Ambient Mode
```typescript
{
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabels: true,                     // ✅ Currently true
  MaxSpeakerLabels: 2,
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'medium',           // ❌ Currently always high
  // NO VocabularyName
}
```

---

## 🔧 Required Implementation Fixes

### 1. Mode-Specific AWS Configuration

**File:** `backend/src/services/transcriptionService.ts`

```typescript
// Add mode parameter to startStreamingTranscription
startStreamingTranscription(
  sessionId: string, 
  config: TranscriptionConfig,
  mode: TranscriptionMode,  // 🔑 Add mode parameter
  onTranscript: (result: TranscriptionResult) => void,
  onError: (error: Error) => void
): { pushAudio: (audioData: Uint8Array) => void; endAudio: () => void } {

  // Mode-specific configuration
  const modeConfig = this.getModeSpecificConfig(mode, config);
  
  const cmdInput: StartStreamTranscriptionCommandInput = {
    ...modeConfig,
    AudioStream: audioIterable,
  };
}

// Implement mode-specific configuration
private getModeSpecificConfig(mode: TranscriptionMode, config: TranscriptionConfig): Partial<StartStreamTranscriptionCommandInput> {
  const base = {
    LanguageCode: config.language_code || 'fr-CA',
    MediaEncoding: 'pcm' as const,
    MediaSampleRateHertz: config.media_sample_rate_hz || 16000,
    EnablePartialResultsStabilization: true,
  };

  switch (mode) {
    case 'word_for_word':
      return {
        ...base,
        ShowSpeakerLabels: false,
        PartialResultsStability: 'high' as const,
      };
    
    case 'smart_dictation':
      return {
        ...base,
        ShowSpeakerLabels: true,
        MaxSpeakerLabels: 2,
        PartialResultsStability: 'high' as const,
        VocabularyName: 'medical_terms_fr',
      };
    
    case 'ambient':
      return {
        ...base,
        ShowSpeakerLabels: true,
        MaxSpeakerLabels: 2,
        PartialResultsStability: 'medium' as const,
      };
    
    default:
      return base;
  }
}
```

### 2. WebSocket Mode Integration

**File:** `backend/src/index.ts`

```typescript
// Add mode to WebSocket start message
const { pushAudio: feeder, endAudio: ender } = transcriptionService.startStreamingTranscription(
  sessionId,
  { 
    language_code: msg.languageCode, 
    media_sample_rate_hz: msg.sampleRate ?? 16000, 
    show_speaker_labels: false 
  },
  msg.mode || 'smart_dictation',  // 🔑 Add mode parameter
  (res) => ws.send(JSON.stringify({ 
    type: 'transcription_result', 
    resultId: res.resultId,
    startTime: res.startTime ?? null,
    endTime: res.endTime ?? null,
    text: res.transcript, 
    isFinal: !res.is_partial,
    language_detected: res.language_detected,
    confidence_score: res.confidence_score,
    speaker: res.speaker
  })),
  (err) => ws.send(JSON.stringify({ type: 'transcription_error', error: String(err) }))
);
```

### 3. Frontend Mode Transmission

**File:** `frontend/src/hooks/useTranscription.ts`

```typescript
// Add mode to start message
const startMessage = {
  type: 'start_transcription',
  languageCode: 'fr-CA',
  sampleRate: 16000,
  mode: currentMode,  // 🔑 Add mode to start message
};

ws.send(JSON.stringify(startMessage));
```

---

## 📝 Summary

### Current Issues
1. **No Mode Differentiation**: All modes use identical AWS configuration
2. **Fixed Speaker Labels**: Always enabled regardless of mode
3. **Fixed Partial Results Stability**: Always 'high' regardless of mode
4. **Conditional Vocabulary**: Only applied when config.vocabulary_name exists

### Required Changes
1. **Add Mode Parameter**: Pass mode through entire chain
2. **Mode-Specific Config**: Implement getModeSpecificConfig method
3. **Parameter Differentiation**: 
   - Word-for-Word: No speaker labels, high stability
   - Smart Dictation: Speaker labels, medical vocabulary, high stability
   - Ambient: Speaker labels, medium stability, no vocabulary
4. **Audio Processing**: Already correctly implemented (256ms chunks, Int16 conversion)

### Implementation Priority
1. **High**: Mode-specific AWS configuration
2. **Medium**: WebSocket mode transmission
3. **Low**: Frontend mode integration

---

*Document Version: 1.0*  
*Last Updated: 2024-01-01*  
*Status: Technical Analysis Complete*
