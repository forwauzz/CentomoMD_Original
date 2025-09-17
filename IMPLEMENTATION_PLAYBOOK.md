# AWS Transcribe Real-Time Streaming Implementation Playbook

## Overview

This playbook documents the complete implementation of real-time audio transcription using AWS Transcribe with WebSocket streaming. The solution addresses the critical issue where frontend audio streaming was incompatible with AWS Transcribe's requirements.

## Problem Statement

**The Core Issue**: Frontend was sending JSON-wrapped audio data (`{ type: 'audio_chunk', payload: { audioData: [...] } }`), but AWS Transcribe requires continuous binary PCM16 audio frames for streaming transcription.

**Why It Failed**: 
- AWS Transcribe expects raw binary audio data, not JSON messages
- The backend was parsing every message as JSON, never treating incoming data as binary audio
- Audio data was being wrapped in unnecessary JSON structure, adding overhead and incompatibility

## Solution Architecture

```
Frontend (Browser) → WebSocket → Backend → AWS Transcribe
     ↓                    ↓         ↓           ↓
  Binary PCM16      Binary Data  Binary     Streaming
  Audio Frames      Detection    Forwarding  Transcription
```

## Implementation Steps

### Step 1: Frontend Audio Capture & Binary Streaming

#### 1.1 Replace JSON Audio Sending with Binary PCM16

**Before (Incorrect)**:
```typescript
// ❌ WRONG: Sending JSON-wrapped audio
const message: WebSocketMessage = {
  type: 'audio_chunk',
  payload: {
    audioData: Array.from(new Uint8Array(audioData.buffer)),
    timestamp: Date.now(),
    sampleRate: 16000,
    channelCount: 1,
    encoding: 'pcm16',
  },
  sessionId,
};
sendMessage(message);
```

**After (Correct)**:
```typescript
// ✅ CORRECT: Sending raw binary PCM16 frames
const ch = e.inputBuffer.getChannelData(0); // Float32 [-1..1]
const pcm = new Int16Array(ch.length);      // 16-bit little-endian
for (let i = 0; i < ch.length; i++) {
  const s = Math.max(-1, Math.min(1, ch[i]));
  pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
}
ws.send(pcm.buffer);                        // 🔑 send BINARY, not JSON
```

#### 1.2 Implement Direct WebSocket Connection

```typescript
// ✅ Direct WebSocket connection (no proxy through /api)
const ws = new WebSocket('ws://localhost:3001/ws/transcription');
ws.binaryType = 'arraybuffer';  // 🔑 Critical for binary data handling

ws.onopen = () => {
  ws.send(JSON.stringify({ 
    type: 'start_transcription', 
    languageCode, 
    sampleRate: 16000,
    sessionId 
  }));
};
```

#### 1.3 Audio Processing Pipeline

```typescript
// ✅ Start audio capture only after backend acknowledgment
ws.onmessage = async (ev) => {
  try {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'stream_ready') {
      // Only start mic after backend is ready
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          noiseSuppression: false,    // 🔑 Disable for cleaner audio
          echoCancellation: false,    // 🔑 Disable for cleaner audio
          autoGainControl: false,     // 🔑 Disable for cleaner audio
        },
      });
      
      const source = audioContext.createMediaStreamSource(stream);
      const proc = audioContext.createScriptProcessor(4096, 1, 1);
      
      source.connect(proc);
      proc.connect(audioContext.destination);

      proc.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        // Convert Float32 to Int16 PCM and send binary
        const ch = e.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(ch.length);
        for (let i = 0; i < ch.length; i++) {
          const s = Math.max(-1, Math.min(1, ch[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        ws.send(pcm.buffer);  // 🔑 Binary data, not JSON
      };
    }
  } catch (error) {
    // ignore non-JSON messages (binary data)
  }
};
```

### Step 2: Backend WebSocket Binary Detection

#### 2.1 Implement Binary vs JSON Message Handling

```typescript
// ✅ Detect binary data vs JSON control messages
ws.on('message', async (data, isBinary) => {
  if (!started) {
    // First message must be JSON start_transcription
    try {
      const msg = JSON.parse(data.toString());
      if (msg?.type !== 'start_transcription' || !['fr-CA','en-US'].includes(msg.languageCode)) {
        ws.send(JSON.stringify({ type: 'transcription_error', error: 'Invalid languageCode' }));
        return ws.close();
      }
      started = true;
      
      // Start AWS stream and get feeder functions
      const { pushAudio: feeder, endAudio: ender } =
        transcriptionService.startStreamingTranscription(/* config */);
      
      pushAudio = feeder;
      endAudio = ender;
      
      // Tell client to start mic now
      ws.send(JSON.stringify({ type: 'stream_ready' }));
    } catch {
      ws.send(JSON.stringify({ type: 'transcription_error', error: 'Expected start_transcription JSON' }));
      return ws.close();
    }
    return;
  }

  // After start: binary = audio; JSON = control
  if (isBinary) {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
    if (buf.length && pushAudio) {
      pushAudio(new Uint8Array(buf));  // 🔑 Push binary audio to AWS
    }
    return;
  }

  // Handle JSON control messages
  try {
    const msg = JSON.parse(data.toString());
    if (msg?.type === 'stop_transcription') endAudio?.();
  } catch {}
});
```

### Step 3: AWS Transcribe Service Integration

#### 3.1 Simplified Configuration

**Before (Complex)**:
```typescript
// ❌ WRONG: Complex language identification
const transcribeConfig: StartStreamTranscriptionCommandInput = {
  LanguageCode: config.language_code,
  IdentifyLanguage: true,                    // ❌ Not needed for single language
  LanguageOptions: ['en-US', 'fr-CA'],      // ❌ Not needed for single language
  PreferredLanguage: 'fr-CA',               // ❌ Not needed for single language
  MediaEncoding: 'pcm16',                   // ❌ Should be 'pcm'
  // ... other complex options
};
```

**After (Simplified)**:
```typescript
// ✅ CORRECT: Single language configuration
const cmdInput: StartStreamTranscriptionCommandInput = {
  LanguageCode: config.language_code || 'fr-CA',   // single language per session
  MediaEncoding: 'pcm',                            // 🔑 AWS expects 'pcm', not 'pcm16'
  MediaSampleRateHertz: config.media_sample_rate_hz || 16000,
  AudioStream: audioIterable,
  ShowSpeakerLabels: config.show_speaker_labels || false,
  MaxSpeakerLabels: config.max_speaker_labels || 2,
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',
};
```

#### 3.2 Audio Streaming with Async Iterable

```typescript
// ✅ Async iterable for continuous audio streaming
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

// Return feeder functions immediately
return {
  pushAudio: (audioData: Uint8Array) => {
    if (!done && audioData && audioData.length > 0) {
      queue.push(audioData);
    }
  },
  endAudio: () => { done = true; },
};
```

#### 3.3 Fixed Partial Result Handling

**Before (Incorrect)**:
```typescript
// ❌ WRONG: Inverted partial flag
const transcriptionResult: TranscriptionResult = {
  transcript: alternative.Transcript || '',
  is_partial: !result.IsPartial,  // ❌ Inverted logic
  // ... other fields
};
```

**After (Correct)**:
```typescript
// ✅ CORRECT: Proper partial flag handling
onTranscript({
  transcript: alt.Transcript,
  is_partial: r.IsPartial === true,        // 🔑 true means partial
  confidence_score: alt.Confidence,
  timestamp: new Date(),
});
```

### Step 4: Type Definitions & Configuration

#### 4.1 Simplified TranscriptionConfig

```typescript
// ✅ Simplified configuration interface
export interface TranscriptionConfig {
  language_code?: string;                    // Single language per session
  identify_language?: boolean;               // Optional (not used)
  language_options?: string[];               // Optional (not used)
  preferred_language?: string;               // Optional (not used)
  media_sample_rate_hz: number;             // Required
  media_encoding?: 'pcm' | 'pcm16' | 'ogg-opus' | 'flac';  // Optional, defaults to 'pcm'
  show_speaker_labels?: boolean;
  max_speaker_labels?: number;
}
```

#### 4.2 Frontend Message Format

**Start Transcription**:
```typescript
// ✅ Simplified start message
{ 
  type: 'start_transcription', 
  languageCode: 'fr-CA',        // Single language
  sampleRate: 16000             // Sample rate only
}
```

**No More Complex Config**:
```typescript
// ❌ REMOVED: These confusing flags
// identify_language: true,
// language_options: ['en-US', 'fr-CA'],
// preferred_language: 'fr-CA',
// media_encoding: 'pcm16',
```

## Complete Implementation Checklist

### Frontend Changes ✅
- [ ] Replace `useWebSocket` hook with direct WebSocket connection
- [ ] Set `ws.binaryType = 'arraybuffer'`
- [ ] Convert Float32 audio to Int16 PCM16
- [ ] Send raw binary frames with `ws.send(pcm.buffer)`
- [ ] Wait for `stream_ready` before starting audio capture
- [ ] Disable audio processing features (noise suppression, echo cancellation)
- [ ] Remove JSON `audio_chunk` message sending

### Backend Changes ✅
- [ ] Implement binary data detection with `isBinary` parameter
- [ ] Handle first message as JSON `start_transcription`
- [ ] Treat subsequent binary data as audio frames
- [ ] Push binary audio directly to AWS Transcribe
- [ ] Send `stream_ready` after AWS stream initialization
- [ ] Maintain session management and cleanup

### AWS Service Changes ✅
- [ ] Use single `LanguageCode` instead of language identification
- [ ] Set `MediaEncoding: 'pcm'` (not 'pcm16')
- [ ] Fix partial result flag logic
- [ ] Implement async iterable for audio streaming
- [ ] Return feeder functions immediately

### Type Updates ✅
- [ ] Make language identification fields optional
- [ ] Simplify `TranscriptionConfig` interface
- [ ] Update message handling types

## Testing & Verification

### 1. Check WebSocket Connection
```typescript
// Frontend console should show:
"WebSocket connected, sending start message"
"Stream ready, starting audio capture"
```

### 2. Verify Binary Data Transmission
```typescript
// Backend console should show:
"chunk bytes: [number]"  // Audio frame sizes
"🎵 Queued [number] bytes for session: [sessionId]"
```

### 3. Confirm AWS Integration
```typescript
// Backend console should show:
"AWS Transcribe streaming started successfully for session: [sessionId]"
```

### 4. Test Transcription Results
```typescript
// Frontend should receive:
{
  type: 'transcription_result',
  text: 'transcribed text here',
  isFinal: false,  // or true for final results
  language_detected: 'fr-CA',
  confidence_score: 0.95
}
```

## Common Issues & Solutions

### Issue: "No TranscriptResultStream"
**Cause**: AWS Transcribe stream initialization failed
**Solution**: Check AWS credentials, region, and network connectivity

### Issue: Audio Not Being Sent
**Cause**: Frontend not converting to PCM16 or WebSocket not open
**Solution**: Verify audio processing pipeline and WebSocket state

### Issue: Partial Results Not Working
**Cause**: Incorrect `is_partial` flag logic
**Solution**: Ensure `is_partial: r.IsPartial === true`

### Issue: Language Detection Errors
**Cause**: Complex language configuration
**Solution**: Use single `LanguageCode` parameter only

## Performance Considerations

### Audio Buffer Sizes
- **ScriptProcessor**: 4096 samples (good balance of latency vs performance)
- **Sample Rate**: 16000 Hz (optimal for speech recognition)
- **Channels**: Mono (1 channel, reduces bandwidth)

### WebSocket Optimization
- **Binary Data**: No JSON parsing overhead for audio
- **Direct Streaming**: No buffering or queuing delays
- **Immediate Processing**: Audio pushed to AWS as received

## Security & Best Practices

### WebSocket Security
- Validate language codes on connection
- Implement session management
- Clean up resources on disconnect

### AWS Security
- Use IAM roles with minimal permissions
- Secure credential storage
- Monitor usage and costs

### Audio Privacy
- No audio storage on backend
- Direct streaming to AWS only
- Implement proper consent mechanisms

## Next Steps & Enhancements

### Potential Improvements
1. **Error Recovery**: Implement automatic reconnection
2. **Audio Quality**: Add audio preprocessing and filtering
3. **Multi-language**: Support language switching mid-session
4. **Real-time Feedback**: Add audio level indicators
5. **Offline Support**: Implement local transcription fallback

### Monitoring & Analytics
1. **Performance Metrics**: Track latency and throughput
2. **Error Tracking**: Monitor transcription accuracy
3. **Usage Analytics**: Track session duration and language usage

## Conclusion

This implementation successfully resolves the core incompatibility between frontend audio streaming and AWS Transcribe requirements. By implementing binary PCM16 streaming with proper WebSocket handling, we achieve:

- **Real-time transcription** with minimal latency
- **Efficient audio processing** without JSON overhead
- **Reliable AWS integration** with proper error handling
- **Scalable architecture** for multiple concurrent sessions

The key insight is that AWS Transcribe expects raw binary audio data, not wrapped JSON messages. By detecting binary data on the backend and pushing it directly to AWS, we maintain the streaming architecture while ensuring compatibility.

## Resources & References

- [AWS Transcribe Streaming Documentation](https://docs.aws.amazon.com/transcribe/latest/dg/streaming.html)
- [WebSocket Binary Data Handling](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Web Audio API ScriptProcessor](https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode)
- [PCM Audio Format Specification](https://en.wikipedia.org/wiki/Pulse-code_modulation)
