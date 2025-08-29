# AWS Transcribe Troubleshooting Artifacts

## Goal
Fix AWS Transcribe Standard streaming timing out with `BadRequestException: Your request timed out because no new audio was received for 15 seconds.`

## 1. Environment & Versions

**Node version:** `Node.js v22.17.0`

**AWS SDK version:** `@aws-sdk/client-transcribe-streaming@3.876.0`

**WebSocket version:** `ws@8.18.3`

**Runtime environment:**
- AWS_REGION: `ca-central-1`
- NODE_ENV: `development`
- S3_BUCKET_NAME: `centomomd-input-2025`

## 2. Frontend Code (Audio + WS)

### File: `frontend/src/hooks/useTranscription.ts`

```typescript
// AudioContext creation
const audioContext = new AudioContext({
  sampleRate: DEFAULT_AUDIO_CONFIG.sampleRate, // 16000
});

// Microphone access
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: DEFAULT_AUDIO_CONFIG.sampleRate, // 16000
    channelCount: DEFAULT_AUDIO_CONFIG.channelCount, // 1
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
});

// Float32 → Int16 conversion
const pcmData = convertToPCM(inputData);

// Send audio data
sendAudioData(pcmData); // Sends as JSON message with Array.from(new Uint8Array(audioData.buffer))

// Start transcription message
const startMessage: WebSocketMessage = {
  type: 'start_transcription',
  payload: {
    sessionId,
    config: {
      identify_language: true,
      language_options: ['en-US', 'fr-CA'],
      preferred_language: 'fr-CA',
      media_sample_rate_hz: 16000,
      media_encoding: 'pcm16',
      show_speaker_labels: true,
      max_speaker_labels: 2,
    },
  },
  sessionId,
};

// Handle transcription results
case 'transcription_result':
  const transcriptData = message.data;
  if (transcriptData.is_partial) {
    // Handle partial results
  } else {
    // Handle final results
  }
```

### File: `frontend/src/hooks/useWebSocket.ts`

```typescript
// WebSocket connection
const wsUrl = createWebSocketUrl('/ws/transcription'); // ws://localhost:3001/ws/transcription
const ws = new WebSocket(wsUrl);

// Send messages
ws.send(JSON.stringify(message)); // All messages sent as JSON
```

### File: `frontend/vite.config.ts`

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
    '/ws': {
      target: 'ws://localhost:3001',
      ws: true,
    },
  },
},
```

## 3. Backend WS Handler

### File: `backend/src/index.ts`

```typescript
// WebSocket server setup
const wss = new WebSocketServer({ server });

// Handle incoming messages
ws.on('message', async (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('WebSocket message received:', message.type);

    switch (message.type) {
      case 'start_transcription':
        await handleStartTranscription(ws, sessionId, message.payload);
        break;
      
      case 'stop_transcription':
        await handleStopTranscription(ws, sessionId);
        break;
      
      case 'audio_chunk':
        console.log('🎵 Received audio_chunk message for session:', sessionId);
        await handleAudioChunk(ws, sessionId, message.payload);
        break;
      
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
        break;
      
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  } catch (error) {
    console.error('Error processing WebSocket message:', error);
  }
});

// Handle transcription start
async function handleStartTranscription(ws: any, sessionId: string, config: any) {
  try {
    console.log('Starting AWS Transcribe for session:', sessionId);
    
    // Store session info
    activeSessions.set(sessionId, { 
      ws, 
      config,
      audioBuffer: [],
      isProcessing: false
    });

    // Configure AWS Transcribe settings
    const transcribeConfig: TranscriptionConfig = {
      language_code: config.preferred_language || 'fr-CA',
      identify_language: config.identify_language || true,
      language_options: config.language_options || ['fr-CA', 'en-US'],
      preferred_language: config.preferred_language || 'fr-CA',
      media_sample_rate_hz: config.media_sample_rate_hz || 16000,
      media_encoding: 'pcm16',
      show_speaker_labels: config.show_speaker_labels || true,
      max_speaker_labels: config.max_speaker_labels || 2,
    };

    // Start AWS Transcribe streaming (synchronous - returns immediately)
    const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
      sessionId,
      transcribeConfig,
      (result: TranscriptionResult) => {
        // Send transcription result to frontend
        ws.send(JSON.stringify({
          type: 'transcription_result',
          data: {
            transcript: result.transcript,
            is_partial: result.is_partial,
            confidence_score: result.confidence_score,
            language_detected: result.language_detected,
            speaker_labels: result.speaker_labels,
            timestamp: result.timestamp
          }
        }));
      },
      (error: Error) => {
        // Send error to frontend
        ws.send(JSON.stringify({
          type: 'error',
          payload: {
            error: 'TRANSCRIPTION_ERROR',
            message: error.message
          }
        }));
      }
    );

    // Store audio handlers in session
    const session = activeSessions.get(sessionId);
    if (session) {
      session.pushAudio = pushAudio;
      session.endAudio = endAudio;
    }
    
    // Send stream ready confirmation immediately
    ws.send(JSON.stringify({
      type: 'stream_ready',
      payload: { sessionId },
      timestamp: new Date()
    }));

    console.log('AWS Transcribe started for session:', sessionId);
  } catch (error) {
    console.error('Failed to start AWS Transcribe:', error);
  }
}

// Handle audio chunk
async function handleAudioChunk(ws: any, sessionId: string, audioData: any) {
  try {
    const session = activeSessions.get(sessionId);
    if (!session) {
      console.warn('No active session for audio chunk:', sessionId);
      return;
    }

    // Convert audio data to Uint8Array for AWS Transcribe
    const audioBuffer = new Uint8Array(audioData.audioData);
    
    console.log(`🎵 Converted audio buffer: ${audioBuffer.length} bytes`);
    
    // Backend (inside WS binary handler, before feeding AWS):
    const buf = Buffer.isBuffer(audioData.audioData) ? audioData.audioData : Buffer.from(audioData.audioData);
    console.log('chunk bytes:', buf.length);
    
    // Use the session's pushAudio function (available immediately)
    if (session.pushAudio) {
      session.pushAudio(audioBuffer);
    } else {
      console.warn('No pushAudio function available for session:', sessionId);
    }

  } catch (error) {
    console.error('Error handling audio chunk:', error);
  }
}
```

## 4. Transcribe Service/Module

### File: `backend/src/services/transcriptionService.ts`

```typescript
export class TranscriptionService {
  private client: TranscribeStreamingClient;
  private activeStreams: Map<string, TranscriptResultStream> = new Map();

  constructor() {
    this.client = new TranscribeStreamingClient({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.credentials.accessKeyId,
        secretAccessKey: awsConfig.credentials.secretAccessKey,
      }
    });
  }

  startStreamingTranscription(
    sessionId: string, 
    config: TranscriptionConfig,
    onTranscript: (result: TranscriptionResult) => void,
    onError: (error: Error) => void
  ): { pushAudio: (audioData: Uint8Array) => void; endAudio: () => void } {
    console.log(`Starting AWS Transcribe streaming for session: ${sessionId} with language: ${config.language_code}`);

    // Simple async queue for audio chunks (never yields undefined)
    const queue: Uint8Array[] = [];
    let done = false;

    const audioIterable = (async function* () {
      while (!done || queue.length) {
        if (queue.length) {
          const chunk = queue.shift()!;
          // Yield the union object the SDK expects:
          yield { AudioEvent: { AudioChunk: chunk } };
          continue;
        }
        await new Promise((r) => setTimeout(r, 10));
      }
    })();

    // Prepare AWS Transcribe configuration
    const transcribeConfig: StartStreamTranscriptionCommandInput = {
      LanguageCode: config.language_code || 'fr-CA',
      MediaEncoding: 'pcm',
      MediaSampleRateHertz: config.media_sample_rate_hz || 16000,
      AudioStream: audioIterable, // <-- correct property for JS v3
      ShowSpeakerLabels: config.show_speaker_labels || false,
      MaxSpeakerLabels: config.max_speaker_labels || 2,
      EnablePartialResultsStabilization: true,
      PartialResultsStability: 'high', // <-- lowercase, not 'HIGH'
    };

    // Create streaming command
    const command = new StartStreamTranscriptionCommand(transcribeConfig);
    
    // Start AWS handshake in background (don't await)
    this.client.send(command).then(async (response) => {
      try {
        if (!response.TranscriptResultStream) {
          throw new Error('Failed to create transcript result stream');
        }

        // Store the stream for this session
        this.activeStreams.set(sessionId, response.TranscriptResultStream);

        // Handle transcript events
        this.handleTranscriptEvents(sessionId, response.TranscriptResultStream, onTranscript, onError);

        console.log(`AWS Transcribe streaming started successfully for session: ${sessionId}`);
      } catch (error) {
        console.error(`Failed to start AWS Transcribe streaming for session ${sessionId}:`, error);
        this.handleTranscribeError(error, onError);
      }
    }).catch((error) => {
      console.error(`AWS Transcribe handshake failed for session ${sessionId}:`, error);
      this.handleTranscribeError(error, onError);
    });

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
  }

  private async handleTranscriptEvents(
    sessionId: string,
    stream: TranscriptResultStream,
    onTranscript: (result: TranscriptionResult) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      for await (const event of stream) {
        console.log('[AWS] transcript event received');
        if (event.TranscriptEvent) {
          const transcriptEvent = event.TranscriptEvent as TranscriptEvent;
          
          if (transcriptEvent.Transcript) {
            const results = transcriptEvent.Transcript.Results;
            
            if (results && results.length > 0) {
              for (const result of results) {
                if (result.Alternatives && result.Alternatives.length > 0) {
                  const alternative = result.Alternatives[0];
                  
                  const transcriptionResult: TranscriptionResult = {
                    transcript: alternative.Transcript || '',
                    is_partial: !result.IsPartial,
                    confidence_score: alternative.Confidence,
                    language_detected: result.LanguageIdentification?.[0]?.LanguageCode,
                    speaker_labels: result.ChannelId ? [{
                      speaker_label: `Speaker ${result.ChannelId}`,
                      start_time: result.StartTime || 0,
                      end_time: result.EndTime || 0
                    }] : undefined,
                    timestamp: new Date()
                  };

                  onTranscript(transcriptionResult);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error handling transcript events for session ${sessionId}:`, error);
      this.handleTranscribeError(error, onError);
    }
  }
}
```

## 5. Current Backend Logs

```
🔍 Loading environment from: C:\Users\alici\Desktop\DEV CENTOMO\scribe\backend\.env
🔍 Environment variables loaded:
  - NODE_ENV: development
  - AWS_REGION: ca-central-1
  - S3_BUCKET_NAME: "centomomd-input-2025"
  - S3_BUCKET_NAME length: 20
  - S3_BUCKET_NAME raw: "centomomd-input-2025"
  - ENCRYPTION_KEY: 32 chars
✅ Backend listening on http://localhost:3001
📋 Phase 2: Raw PCM16 streaming implemented
🚀 Phase 3: AWS Transcribe integration active
🌍 AWS Region: ca-central-1
🎤 Ready for real-time transcription
WebSocket connection established { sessionId: 'dev-session-id', userId: 'dev-user-id' }
WebSocket connection established { sessionId: 'dev-session-id', userId: 'dev-user-id' }
WebSocket connection established { sessionId: 'dev-session-id', userId: 'dev-user-id' }
WebSocket message received: ping
WebSocket message received: ping
WebSocket message received: ping
... (multiple ping messages)
```

## 6. Test Instructions

**To generate required logs:**

1. Start frontend: `cd frontend && npm run dev`
2. Open browser at `http://localhost:5173`
3. Click "Start Recording"
4. Speak for 5 seconds in French
5. Click "Stop Recording"
6. Capture both browser console and backend terminal logs

**Expected logs to capture:**
- Browser console: `framesSent 25`, `framesSent 50`, etc.
- Backend console: `chunk bytes: XXXX` lines
- Backend console: `[AWS] transcript event received` lines (or timeout error)

## 7. Key Issues to Address

1. **Handshake race condition** - Frontend sending audio before backend AWS stream is ready
2. **Audio format** - Ensure PCM16 format is correctly sent to AWS
3. **WebSocket binary handling** - Verify audio chunks are properly processed
4. **AWS SDK integration** - Confirm correct async iterable format for AudioStream

## 8. Acceptance Criteria

- ✅ Browser shows `framesSent` increasing steadily while speaking
- ✅ Backend logs show many `chunk bytes:` lines during 5 seconds
- ✅ No `BadRequestException: no new audio for 15s`
- ✅ At least one partial transcript within ~0.2–0.8s and a final per phrase
