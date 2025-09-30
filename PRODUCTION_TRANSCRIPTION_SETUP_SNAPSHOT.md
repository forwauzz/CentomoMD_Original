# Production Branch Transcription Setup Snapshot

## Repo
- **Branch name:** `azure-production`
- **Latest commit hash + message:** `782f11b docs: add WebSocket path fix documentation to EC2 implementation guide`
- **Main transcription-related files:**
  - `frontend/src/hooks/useTranscription.ts`
  - `frontend/src/hooks/useWebSocket.ts`
  - `frontend/src/lib/utils.ts`
  - `frontend/src/config.ts`
  - `backend/src/services/transcriptionService.ts`
  - `backend/src/config/env.ts`

## Transcription Config

### WebSocket URL Construction Logic
```typescript
// frontend/src/lib/utils.ts
export function createWebSocketUrl(path: string, wsToken?: string): string {
  const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
  const wsBaseUrl = baseUrl.replace(/\/ws$/, '');
  let url = `${wsBaseUrl}/ws${path}`;
  if (wsToken) {
    url += `?ws_token=${encodeURIComponent(wsToken)}`;
  }
  return url;
}

// frontend/src/hooks/useTranscription.ts
const base = (import.meta.env.VITE_WS_URL || '').replace(/\/+$/, '');
const ws = new WebSocket(`${base}/ws`);
```

### Audio Capture Defaults
```typescript
// frontend/src/hooks/useTranscription.ts
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 16000,        // Match AWS Transcribe 16kHz requirement
    channelCount: 1,          // Mono audio works better for diarization
    echoCancellation: false,   // Turn OFF - can interfere with speaker detection
    noiseSuppression: false,   // Turn OFF - can merge speakers
    autoGainControl: false,    // Turn OFF - can normalize different speaker volumes
  },
});
```

### PCM Conversion Method (Float32 → Int16)
```typescript
// frontend/src/lib/utils.ts
export function convertToPCM(audioData: Float32Array): Int16Array {
  const pcmData = new Int16Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
  }
  return pcmData;
}

// frontend/src/hooks/useTranscription.ts (real-time processing)
const ch = e.inputBuffer.getChannelData(0); // Float32 [-1..1]
const pcm = new Int16Array(ch.length);      // 16-bit little-endian
for (let i = 0; i < ch.length; i++) {
  const s = Math.max(-1, Math.min(1, ch[i]));
  pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
}
ws.send(pcm.buffer); // 🔑 send BINARY, not JSON
```

### AWS Transcribe Start Parameters
```typescript
// backend/src/services/transcriptionService.ts
const cmdInput: StartStreamTranscriptionCommandInput = {
  LanguageCode: (config.language_code || 'fr-CA') as any,
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: config.media_sample_rate_hz || 16000,
  AudioStream: audioIterable,
  ShowSpeakerLabel: config.show_speaker_labels || true,
  EnablePartialResultsStabilization: true,
  PartialResultsStability: (config.partial_results_stability || 'high') as any,
  ...(config.vocabulary_name && { VocabularyName: config.vocabulary_name }),
};
```

## Environment

### Frontend Environment Variables
```typescript
// frontend/src/config.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isProd ? 'https://api.alie.app' : 'http://localhost:3001');

export const WS_URL = import.meta.env.VITE_WS_URL || 
  (isProd ? 'wss://api.alie.app/ws' : 'ws://localhost:3001/ws');
```

### Backend Environment Variables
```typescript
// backend/src/config/env.ts
const hardcodedEnv: Environment = {
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  PORT: isProduction ? 8080 : 3001,
  HOST: isProduction ? '0.0.0.0' : 'localhost',
  FRONTEND_URL: isProduction 
    ? 'https://azure-production.d1deo9tihdnt50.amplifyapp.com'
    : 'http://localhost:5173',
  
  // AWS Configuration
  AWS_REGION: 'ca-central-1',
  AWS_ACCESS_KEY_ID: process.env['AWS_ACCESS_KEY_ID'] || '',
  AWS_SECRET_ACCESS_KEY: process.env['AWS_SECRET_ACCESS_KEY'] || '',
  S3_BUCKET_NAME: 'centomomd-input-2025',
  
  // WebSocket Configuration
  PUBLIC_WS_URL: isProduction 
    ? 'wss://api.alie.app/ws'
    : 'ws://localhost:3001',
  USE_WSS: isProduction,
  
  // CORS Configuration
  CORS_ALLOWED_ORIGINS: isProduction 
    ? 'https://azure-production.d1deo9tihdnt50.amplifyapp.com'
    : 'http://localhost:5173',
  
  // Feature Flags
  AUTH_REQUIRED: false,
  WS_REQUIRE_AUTH: false,
  RATE_LIMIT_ENABLED: false,
  
  // Performance Configuration
  PERFORMANCE_LOGGING_ENABLED: !isProduction,
  MEMORY_MONITORING_ENABLED: true,
  SPEAKER_CORRECTION_LOGGING: !isProduction,
  CONVERSATION_FLOW_LOGGING: !isProduction,
};
```

### Secret Environment Variables (Placeholders)
- `DATABASE_URL` - Supabase database connection
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_JWT_SECRET` - Supabase JWT secret
- `ENCRYPTION_KEY` - Data encryption key
- `JWT_SECRET` - JWT signing secret
- `WS_JWT_SECRET` - WebSocket JWT secret
- `OPENAI_API_KEY` - OpenAI API key for AI formatting

---

**Generated:** 2025-01-02  
**Branch:** azure-production  
**Commit:** 782f11b
