# CentomoMD AWS Pipeline - Complete Developer Handover Guide

## 🎯 **Project Overview**

CentomoMD is a medical documentation platform that provides real-time audio transcription using AWS Transcribe. The system is designed for Canadian healthcare compliance (HIPAA, PIPEDA, Quebec Law 25) with data residency in the `ca-central-1` region.

**Key Features:**
- Real-time audio transcription with WebSocket streaming
- Three transcription modes: Word-for-Word, Smart Dictation, Ambient
- Speaker diarization (PATIENT vs CLINICIAN)
- Medical vocabulary support
- CNESST form integration
- Voice commands for transcription control

---

## 🏗️ **Infrastructure Architecture**

### **AWS Services Used**
- **AWS Transcribe**: Real-time streaming transcription
- **S3**: Temporary storage (24-hour auto-deletion)
- **CloudWatch**: Logging and monitoring
- **CloudTrail**: API call auditing
- **IAM**: Access control and permissions

### **Region & Compliance**
- **Primary Region**: `ca-central-1` (Montreal, Canada)
- **Compliance**: HIPAA, PIPEDA, Quebec Law 25
- **Data Residency**: All data must stay in Canada
- **Encryption**: AES-256 at rest, TLS 1.2+ in transit

### **Infrastructure Files**
```
aws/
├── cloudformation-template.yaml    # Main infrastructure template
├── iam-policy.json                 # IAM permissions
├── s3-bucket-policy.json          # S3 security policy
├── deploy.sh                      # Deployment script
└── README.md                      # Infrastructure documentation
```

---

## 🎤 **Audio Capture Pipeline**

### **Frontend Audio Processing** (`frontend/src/hooks/useTranscription.ts`)

#### **Audio Context Setup**
```typescript
// Fixed 16kHz sample rate for AWS Transcribe compatibility
const audioContext = new AudioContext({ 
  sampleRate: 16000
});
```

#### **Microphone Configuration**
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 16000,        // AWS Transcribe requirement
    channelCount: 1,          // Mono audio for better diarization
    echoCancellation: false,  // Disabled for medical accuracy
    noiseSuppression: false,  // Disabled for medical accuracy
    autoGainControl: false,   // Disabled for medical accuracy
  },
});
```

#### **Audio Processing Pipeline**
```typescript
// Convert Float32 to Int16 PCM16
const ch = e.inputBuffer.getChannelData(0); // Float32 [-1..1]
const pcm = new Int16Array(ch.length);      // 16-bit little-endian

for (let i = 0; i < ch.length; i++) {
  const s = Math.max(-1, Math.min(1, ch[i]));
  pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
}

// CRITICAL: Send binary audio data (NOT JSON)
ws.send(pcm.buffer);
```

**Key Points:**
- Audio is captured at 16kHz mono
- Float32 audio is converted to Int16 PCM16
- Binary data is sent directly (no JSON wrapping)
- Audio processing features are disabled for medical accuracy

---

## 🔌 **WebSocket Communication Protocol**

### **Connection Flow** (`backend/src/index.ts`)

#### **1. Initial Handshake**
```typescript
// Frontend sends JSON start message
ws.send(JSON.stringify({ 
  type: 'start_transcription',
  languageCode: 'fr-CA',  // Single language per session
  sampleRate: 16000,
  sessionId: 'unique-session-id'
}));

// Backend responds with stream_ready
ws.send(JSON.stringify({ type: 'stream_ready' }));
```

#### **2. Binary Audio Streaming**
```typescript
ws.on('message', async (data, isBinary) => {
  if (!started) {
    // First message: JSON start_transcription
    const msg = JSON.parse(data.toString());
    if (msg?.type !== 'start_transcription') {
      ws.close(1008, 'Invalid start message');
      return;
    }
    
    // Initialize AWS stream and get feeder functions
    const { pushAudio: feeder, endAudio: ender } = 
      transcriptionService.startStreamingTranscription(/* config */);
    
    pushAudio = feeder;
    endAudio = ender;
    
    // Tell client to start mic
    ws.send(JSON.stringify({ type: 'stream_ready' }));
    return;
  }

  // Subsequent messages: Binary audio data
  if (isBinary) {
    const buf = Buffer.from(data as ArrayBuffer);
    if (pushAudio && buf.length > 0) {
      pushAudio(new Uint8Array(buf));  // Push to AWS
    }
    return;
  }

  // Handle JSON control messages
  try {
    const msg = JSON.parse(data.toString());
    if (msg?.type === 'stop_transcription') {
      endAudio?.();
    }
  } catch {}
});
```

**Key Points:**
- First message must be JSON `start_transcription`
- All subsequent messages are binary audio data
- WebSocket must be configured with `binaryType: 'arraybuffer'`
- Session management tracks active connections

---

## ☁️ **AWS Transcribe Integration**

### **Service Configuration** (`backend/src/services/transcriptionService.ts`)

#### **AWS Client Setup**
```typescript
export class TranscriptionService {
  private client: TranscribeStreamingClient;
  private activeStreams: Map<string, TranscriptResultStream> = new Map();

  constructor() {
    this.client = new TranscribeStreamingClient({
      region: 'ca-central-1',  // Montreal region for compliance
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
  }
}
```

#### **Streaming Configuration**
```typescript
const cmdInput: StartStreamTranscriptionCommandInput = {
  LanguageCode: config.language_code || 'fr-CA',   // Single language per session
  MediaEncoding: 'pcm',                            // AWS expects 'pcm', not 'pcm16'
  MediaSampleRateHertz: config.media_sample_rate_hz || 16000,
  AudioStream: audioIterable,                      // Async iterable for streaming
  ShowSpeakerLabels: true,                         // Enable speaker attribution
  MaxSpeakerLabels: 2,                             // PATIENT vs CLINICIAN
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',                 // lowercase, not 'HIGH'
  // Optional: Custom vocabulary for medical terms
  ...(config.vocabulary_name && { VocabularyName: config.vocabulary_name }),
};
```

#### **Audio Streaming with Async Iterable**
```typescript
// Audio queue for streaming
const queue: Uint8Array[] = [];
let done = false;

// Async iterable for continuous audio streaming
const audioIterable = (async function* () {
  while (!done || queue.length) {
    if (queue.length) {
      const chunk = queue.shift()!;
      // Yield the union object the SDK expects
      yield { AudioEvent: { AudioChunk: chunk } };
      continue;
    }
    await new Promise((r) => setTimeout(r, 10));
  }
})();

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

#### **Partial Result Handling**
```typescript
// CRITICAL: Proper partial flag logic
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

**Key Points:**
- Use `MediaEncoding: 'pcm'` (not 'pcm16')
- `PartialResultsStability` must be lowercase
- `is_partial: r.IsPartial === true` (not inverted)
- Async iterable provides continuous streaming
- Feeder functions return immediately for low latency

---

## 🎛️ **Transcription Modes**

### **Mode Types**
```typescript
export enum TranscriptionMode {
  WORD_FOR_WORD = 'word_for_word',
  SMART_DICTATION = 'smart_dictation',
  AMBIENT = 'ambient'
}
```

### **Mode Configurations**

| Mode | Description | AWS Configuration | Output Format |
|------|-------------|-------------------|---------------|
| **Word-for-Word** | Raw live speech-to-text | Basic transcription | Plain paragraph |
| **Smart Dictation** | AI-assisted, medical structured | Medical vocabulary + formatting | Section 7–11 templates |
| **Ambient** | Long-form capture, diarized | Speaker labels + extended capture | Streaming + merge |

#### **Word-for-Word Mode**
```typescript
const wordForWordConfig: StartStreamTranscriptionCommandInput = {
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabels: false,  // No speaker attribution needed
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',
};
```

#### **Smart Dictation Mode**
```typescript
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
```

#### **Ambient Mode**
```typescript
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

## 🎙️ **Voice Commands System**

### **Core Commands** (`frontend/src/voice/commands-core.ts`)
```typescript
export type CommandIntent =
  | 'section.switch' | 'paragraph.break' | 'stream.pause' | 'stream.resume'
  | 'buffer.clear' | 'doc.save' | 'doc.export' | 'undo' | 'format.medical'
  | 'format.cnesst' | 'validation' | 'custom.vocabulary' | 'template.load';

// French commands
const FR = {
  paragraph: ['nouveau paragraphe','paragraphe'],
  pause:     ['pause','pause transcription'],
  resume:    ['reprendre','reprendre transcription','continuer'],
  clear:     ['effacer','vider'],
  save:      ['sauvegarder','enregistrer'],
  export:    ['export','exporter'],
  undo:      ['annuler','retour'],
  section:   /^section\s+(\d{1,2})$/
};

// English commands
const EN = {
  paragraph: ['new paragraph','paragraph'],
  pause:     ['pause','pause transcription'],
  resume:    ['resume','resume transcription','continue'],
  clear:     ['clear','erase'],
  save:      ['save'],
  export:    ['export'],
  undo:      ['undo','go back'],
  section:   /^section\s+(\d{1,2})$/
};
```

### **Verbatim Commands** (`frontend/src/voice/verbatim-commands.ts`)
```typescript
// Text protection commands for Word-for-Word mode
export function detectVerbatimCmd(text: string, lang:'fr-CA'|'en-US'): 
  {kind:'open'|'close'|'customOpen'|'customClose'; key?:string} | null {
  
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
  
  // Command detection logic...
}
```

### **Voice Command Processing**
```typescript
// In useTranscription.ts
if (seg.isFinal) {
  // 1) Check for verbatim commands
  const v = detectVerbatimCmd(seg.text, currentLanguageCode);
  if (v) {
    // Handle verbatim mode toggle
    if (v.kind==='open') verbatim.current.isOpen = true;
    if (v.kind==='close') verbatim.current.isOpen = false;
    return; // Don't add to transcript
  }

  // 2) Check for core commands
  const c = detectCoreCommand(seg.text, currentLanguageCode);
  if (c) {
    // Execute command based on intent
    switch (c.intent) {
      case 'paragraph.break': /* Add paragraph break */; break;
      case 'stream.pause': pauseMic(); break;
      case 'stream.resume': resumeMic(); break;
      case 'buffer.clear': clearLiveBuffer(); break;
      case 'section.switch': setActiveSection(`section_${c.arg}`); break;
    }
    return; // Don't add to transcript
  }
}
```

---

## 🔐 **Security & Compliance**

### **Environment Configuration** (`backend/src/config/env.ts`)
```typescript
export const ENV = {
  // Core server
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  HOST: process.env['HOST'] ?? '0.0.0.0',
  PORT: Number(process.env['PORT'] ?? 3001),
  AWS_REGION: process.env['AWS_REGION'] ?? 'ca-central-1',

  // WebSocket
  WS_PATH: process.env['WS_PATH'] ?? '/ws',
  PUBLIC_WS_URL: process.env['PUBLIC_WS_URL'] ?? 
    (isProd ? 'wss://api.alie.app/ws' : 'ws://localhost:3001/ws'),

  // CORS configuration
  CORS_ALLOWED_ORIGINS: parseList(
    process.env['CORS_ALLOWED_ORIGINS'] ??
    (isProd ? 'https://azure-production.d1deo9tihdnt50.amplifyapp.com' 
            : 'http://localhost:5173')
  ),

  // Security
  AUTH_REQUIRED: (process.env['AUTH_REQUIRED'] ?? 'false') === 'true',
  WS_REQUIRE_AUTH: (process.env['WS_REQUIRE_AUTH'] ?? 'false') === 'true',
  RATE_LIMIT_ENABLED: (process.env['RATE_LIMIT_ENABLED'] ?? 'false') === 'true',
};
```

### **IAM Permissions** (`aws/iam-policy.json`)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartStreamTranscription",
        "transcribe:StopStreamTranscription"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "ca-central-1"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::centomomd-transcription-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:ca-central-1:*:*"
    }
  ]
}
```

### **S3 Bucket Policy** (`aws/s3-bucket-policy.json`)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureConnections",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::centomomd-transcription-*",
        "arn:aws:s3:::centomomd-transcription-*/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

---

## 📊 **Monitoring & Logging**

### **CloudWatch Integration**
```typescript
// Performance logging
console.log(`🎵 Queued ${audioData.length} bytes for session: ${sessionId}`);
console.log(`📝 Transcription result: ${result.transcript} (confidence: ${result.confidence_score})`);
console.log(`🔗 WebSocket reconnection attempt ${attempt} of ${maxAttempts}`);
```

### **Error Handling**
```typescript
// AWS Transcribe error handling
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
  }

  console.error('Transcription error:', errorMessage);
  onError(new Error(errorMessage));
}
```

### **Auto-Reconnect Logic**
```typescript
const reconnectWithBackoff = async (attempt: number = 1) => {
  const maxAttempts = 3;
  const baseDelay = 2000;
  
  if (attempt > maxAttempts) {
    updateState({ error: 'Failed to reconnect after 3 attempts' });
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

## 🚀 **Deployment & Environment Setup**

### **Environment Variables**
```bash
# AWS Configuration
AWS_REGION=ca-central-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# WebSocket Configuration
PUBLIC_WS_URL=wss://api.alie.app/ws
CORS_ALLOWED_ORIGINS=https://azure-production.d1deo9tihdnt50.amplifyapp.com

# Transcription Settings
TRANSCRIPTION_MAX_DURATION_SECONDS=3600
TRANSCRIPTION_AUTO_RECONNECT=true
TRANSCRIPTION_MAX_RECONNECT_ATTEMPTS=3
TRANSCRIPTION_RECONNECT_DELAY_MS=2000

# Voice Commands
VOICE_COMMANDS_ENABLED=true
VOICE_COMMANDS_CONFIDENCE_THRESHOLD=0.8

# Security
AUTH_REQUIRED=false
WS_REQUIRE_AUTH=false
RATE_LIMIT_ENABLED=false
```

### **Infrastructure Deployment**
```bash
# Navigate to AWS directory
cd aws

# Make deployment script executable
chmod +x deploy.sh

# Deploy to different environments
./deploy.sh development
./deploy.sh staging
./deploy.sh production
```

### **Local Development Setup**
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🎯 **Key Technical Insights**

### **Critical Success Factors**
1. **Binary Audio Transmission**: Sends raw PCM data directly to AWS (not JSON)
2. **16kHz Sample Rate**: Fixed sample rate for AWS Transcribe compatibility
3. **Mono Audio**: Single channel reduces bandwidth and improves diarization
4. **Async Iterable**: Continuous audio streaming without buffering delays
5. **Partial Result Handling**: Fixed logic - `r.IsPartial === true` means partial

### **Common Pitfalls to Avoid**
1. **JSON Audio Wrapping**: Never wrap audio data in JSON - send binary directly
2. **Wrong Media Encoding**: Use `'pcm'` not `'pcm16'` for AWS Transcribe
3. **Inverted Partial Flags**: `r.IsPartial === true` means partial (not final)
4. **Case Sensitivity**: `PartialResultsStability` must be lowercase
5. **Audio Processing**: Disable echo cancellation, noise suppression for medical accuracy

### **Performance Optimizations**
- **ScriptProcessor**: 4096 samples (good balance of latency vs performance)
- **Direct Streaming**: No buffering or queuing delays
- **Immediate Processing**: Audio pushed to AWS as received
- **Binary Data**: No JSON parsing overhead for audio

---

## 🛠️ **Development Workflow**

### **Testing Audio Pipeline**
1. **Check WebSocket Connection**:
   ```typescript
   // Frontend console should show:
   "WebSocket connected, sending start message"
   "Stream ready, starting audio capture"
   ```

2. **Verify Binary Data Transmission**:
   ```typescript
   // Backend console should show:
   "chunk bytes: [number]"  // Audio frame sizes
   "🎵 Queued [number] bytes for session: [sessionId]"
   ```

3. **Confirm AWS Integration**:
   ```typescript
   // Backend console should show:
   "AWS Transcribe streaming started successfully for session: [sessionId]"
   ```

4. **Test Transcription Results**:
   ```typescript
   // Frontend should receive:
   {
     type: 'transcription_result',
     text: 'transcribed text here',
     isFinal: false,  // or true for final results
     language_detected: 'fr-CA',
     confidence_score: 0.95,
     speaker: 'PATIENT' // or 'CLINICIAN'
   }
   ```

### **Debugging Common Issues**

**Issue: "No TranscriptResultStream"**
- **Cause**: AWS Transcribe stream initialization failed
- **Solution**: Check AWS credentials, region, and network connectivity

**Issue: Audio Not Being Sent**
- **Cause**: Frontend not converting to PCM16 or WebSocket not open
- **Solution**: Verify audio processing pipeline and WebSocket state

**Issue: Partial Results Not Working**
- **Cause**: Incorrect `is_partial` flag logic
- **Solution**: Ensure `is_partial: r.IsPartial === true`

**Issue: Language Detection Errors**
- **Cause**: Complex language configuration
- **Solution**: Use single `LanguageCode` parameter only

---

## 📋 **File Structure Reference**

### **Backend Files**
```
backend/src/
├── index.ts                          # Main server and WebSocket handler
├── services/
│   └── transcriptionService.ts       # AWS Transcribe integration
├── config/
│   └── env.ts                        # Environment configuration
├── types/
│   └── index.ts                      # TypeScript definitions
├── voice/
│   ├── commands-core.ts              # Core voice commands
│   └── verbatim-commands.ts          # Verbatim mode commands
└── ws/
    └── auth.ts                       # WebSocket authentication
```

### **Frontend Files**
```
frontend/src/
├── hooks/
│   └── useTranscription.ts           # Main transcription hook
├── voice/
│   ├── commands-core.ts              # Voice command detection
│   └── verbatim-commands.ts          # Verbatim commands
├── components/
│   └── transcription/                # UI components
└── config/
    └── flags.ts                      # Feature flags
```

### **Infrastructure Files**
```
aws/
├── cloudformation-template.yaml      # Main infrastructure
├── iam-policy.json                   # IAM permissions
├── s3-bucket-policy.json            # S3 security
├── deploy.sh                        # Deployment script
└── README.md                        # Infrastructure docs
```

---

## 🔄 **Maintenance & Updates**

### **Regular Tasks**
- **Log Rotation**: Automatic via CloudWatch
- **Backup Verification**: Monthly compliance checks
- **Security Updates**: AWS managed updates
- **Cost Monitoring**: Monthly cost reviews

### **Compliance Checks**
- **Quarterly**: HIPAA compliance audit
- **Monthly**: PIPEDA compliance review
- **Weekly**: Security log review
- **Daily**: Automated health checks

### **Infrastructure Updates**
1. Modify the CloudFormation template
2. Test in development environment
3. Deploy to staging for validation
4. Deploy to production with rollback plan

---

## 📞 **Support & Resources**

### **AWS Documentation**
- [AWS Transcribe Streaming Documentation](https://docs.aws.amazon.com/transcribe/latest/dg/streaming.html)
- [WebSocket Binary Data Handling](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Web Audio API ScriptProcessor](https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode)

### **Compliance Resources**
- [HIPAA on AWS](https://aws.amazon.com/compliance/hipaa/)
- [PIPEDA Compliance Guide](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)
- [Quebec Law 25](https://www.quebec.ca/en/government/policies-orientations/cybersecurity-digital/act-modernizing-legislative-provisions-respect-protection-personal-information)

---

## 🎯 **Quick Start Checklist**

### **For New Developers**
- [ ] Read this handover guide completely
- [ ] Set up AWS credentials for ca-central-1 region
- [ ] Clone repository and install dependencies
- [ ] Configure environment variables
- [ ] Test local development setup
- [ ] Review AWS infrastructure documentation
- [ ] Understand compliance requirements
- [ ] Test audio pipeline end-to-end

### **For Production Deployment**
- [ ] Verify AWS credentials and permissions
- [ ] Deploy infrastructure using CloudFormation
- [ ] Configure environment variables
- [ ] Test WebSocket connectivity
- [ ] Verify audio transcription pipeline
- [ ] Test voice commands
- [ ] Monitor CloudWatch logs
- [ ] Perform compliance validation

---

*Document Version: 1.0*  
*Last Updated: 2025-01-03*  
*Status: Production Ready*

