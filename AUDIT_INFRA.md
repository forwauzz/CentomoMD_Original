# CentomoMD Infrastructure Audit Report

**Generated**: 2025-01-27  
**Scope**: Complete infrastructure audit using codebase as ground truth  
**Environment**: Production (EC2 + Nginx + Cloudflare + Amplify + AWS Transcribe)

## Executive Summary

This audit reveals a **hybrid deployment architecture** with significant **configuration drift** between documented and actual implementation. The system runs on **AWS EC2 with Nginx reverse proxy**, **AWS Amplify frontend hosting**, and **Cloudflare edge protection**, but several critical configurations differ from documentation.

### Key Findings
- ✅ **WebSocket infrastructure**: Properly configured with Nginx path mapping
- ⚠️ **Sample rate mismatch**: Frontend requests 16kHz, backend defaults to 48kHz
- ⚠️ **Environment configuration**: Multiple env systems with potential conflicts
- ❌ **Nginx config**: Not in repository (deployment risk)
- ✅ **Security**: Proper CORS, HTTPS, and authentication flows

---

## 1. High-Level Architecture

### Frontend Hosting (AWS Amplify)
**Location**: `frontend/src/config.ts:4-14`
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (isProd ? 'https://api.alie.app' : 'http://localhost:3001');

export const WS_URL = import.meta.env.VITE_WS_URL ||
  (isProd ? 'wss://api.alie.app/ws' : 'ws://localhost:3001/ws');
```

**Production Domain**: `https://azure-production.d1deo9tihdnt50.amplifyapp.com`  
**Environment Variables**: Configured in Amplify Console (not in repo)  
**Build Process**: Vite with proxy configuration for development

### Edge/Proxy (Cloudflare)
**DNS Configuration**: `api.alie.app` → EC2 instance  
**Proxy Mode**: Orange cloud enabled (Full Strict SSL)  
**WebSocket Support**: ✅ Confirmed working via Cloudflare  
**TLS Termination**: Cloudflare → Nginx (Let's Encrypt)

### Reverse Proxy (Nginx on EC2)
**⚠️ CRITICAL**: Nginx configuration **NOT in repository**  
**Documented Location**: `/etc/nginx/sites-available/api.alie.app`  
**Key Routes**:
- `/api/*` → `http://127.0.0.1:3001`
- `/ws` → `http://127.0.0.1:3001/ws/transcription` (path mapping)
- `/healthz` → Backend health check

**Headers**: Proper WebSocket upgrade headers configured  
**SSL**: Let's Encrypt certificates via certbot

### Backend (Node.js/Express)
**Location**: `backend/src/index.ts:87-2485`
```typescript
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: wsPath });
server.listen(SERVER_PORT, '0.0.0.0', () => {
  console.log(`API listening on ${SERVER_PORT}`);
  console.log(`WebSocket path: ${wsPath}`);
});
```

**Port**: 3001 (production), 3001 (development)  
**Host**: `0.0.0.0` (production), `localhost` (development)  
**WebSocket Path**: `/ws` (configurable via `WS_PATH` env var)  
**Health Check**: `GET /healthz`

### Transcription Services (AWS Transcribe)
**Location**: `backend/src/services/transcriptionService.ts:1-387`
```typescript
const cmdInput: StartStreamTranscriptionCommandInput = {
  LanguageCode: (config.language_code || 'fr-CA') as any,
  MediaSampleRateHertz: sampleRate,
  MediaEncoding: 'pcm',
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',
  ShowSpeakerLabels: enableLabels
};
```

**Region**: `ca-central-1` (Montreal)  
**Sample Rate**: **CONFIGURATION DRIFT** - see Audio Pipeline section  
**Encoding**: PCM  
**Languages**: `fr-CA`, `en-US`  
**Speaker Labels**: Mode-dependent (ambient mode only)

### Storage (S3)
**Bucket**: `centomomd-input-2025` (hardcoded in config)  
**Region**: `ca-central-1`  
**Lifecycle**: 1-day retention (compliance)  
**Encryption**: AES-256  
**Access**: IAM role-based

### Database/Auth (Supabase)
**Location**: `backend/src/config/env.ts:104-107`
```typescript
SUPABASE_URL: process.env['SUPABASE_URL'] || '',
SUPABASE_ANON_KEY: process.env['SUPABASE_ANON_KEY'] || '',
SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY'] || '',
SUPABASE_JWT_SECRET: process.env['SUPABASE_JWT_SECRET'] || '',
```

**Frontend Config**: `frontend/src/lib/authClient.ts:10-28`  
**Auth Flow**: Email OTP + Google OAuth  
**Redirect URLs**: Configured for both prod and dev environments

---

## 2. Network & Security

### TLS Termination Points
- **Cloudflare**: Edge TLS termination (Full Strict mode)
- **Nginx**: Origin TLS with Let's Encrypt certificates
- **Backend**: HTTP only (behind Nginx)

### CORS Configuration
**Backend**: `backend/src/config/env.ts:130-132`
```typescript
CORS_ALLOWED_ORIGINS: isProduction 
  ? 'https://azure-production.d1deo9tihdnt50.amplifyapp.com'
  : 'http://localhost:5173',
```

**Frontend**: Vite proxy configuration for development

### WebSocket Upgrade Path
**End-to-End Flow**:
1. Browser: `wss://api.alie.app/ws`
2. Cloudflare: Proxy to EC2
3. Nginx: `/ws` → `/ws/transcription` (path mapping)
4. Node.js: WebSocketServer on `/ws/transcription`

**Headers**: Proper `Upgrade`, `Connection`, `Host` forwarding

### Security Headers
- **CSP**: Not explicitly configured in codebase
- **Rate Limiting**: Disabled (`RATE_LIMIT_ENABLED: false`)
- **Authentication**: Supabase-based, optional (`AUTH_REQUIRED: false`)

---

## 3. Environments & Branching

### Active Environments
- **Production**: `azure-production` branch → AWS EC2 + Amplify
- **Development**: `develop` branch → Local development
- **Staging**: Not explicitly configured

### Branch → Deploy Mapping
- **Frontend**: `azure-production` → AWS Amplify (automatic)
- **Backend**: `azure-production` → AWS EC2 (manual deployment)
- **CI/CD**: GitHub Actions for Azure App Service (unused in current setup)

### Configuration Drift
**Sample Rate Mismatch**:
- Frontend requests: 16kHz (`frontend/src/hooks/useTranscription.ts:1965`)
- Backend default: 48kHz (`backend/src/config/env.ts:158`)
- AWS Transcribe: Uses backend configuration

---

## 4. Runtime Configuration

### Environment Variables (Backend)
**Location**: `backend/src/config/env.ts:86-160`

| Variable | Production Value | Development Value | Usage |
|----------|------------------|-------------------|-------|
| `PORT` | 8080 | 3001 | Server port |
| `HOST` | `0.0.0.0` | `localhost` | Server host |
| `FRONTEND_URL` | `https://azure-production.d1deo9tihdnt50.amplifyapp.com` | `http://localhost:5173` | CORS origin |
| `AWS_REGION` | `ca-central-1` | `ca-central-1` | AWS services |
| `S3_BUCKET_NAME` | `centomomd-input-2025` | `centomomd-input-2025` | Storage |
| `USE_48K_AUDIO` | `true` | `true` | Audio sample rate |
| `ENABLE_SPEAKER_LABELS` | `true` | `true` | Diarization |
| `WS_PATH` | `/ws` | `/ws` | WebSocket path |
| `PUBLIC_WS_URL` | `wss://api.alie.app/ws` | `ws://localhost:3001/ws` | WebSocket URL |

### Environment Variables (Frontend)
**Location**: `frontend/src/config.ts:4-14`

| Variable | Production Value | Development Value | Usage |
|----------|------------------|-------------------|-------|
| `VITE_API_BASE_URL` | `https://api.alie.app` | `http://localhost:3001` | API endpoint |
| `VITE_WS_URL` | `wss://api.alie.app/ws` | `ws://localhost:3001/ws` | WebSocket URL |
| `VITE_SUPABASE_URL` | Supabase URL | Supabase URL | Auth service |
| `VITE_SUPABASE_ANON_KEY` | Supabase key | Supabase key | Auth service |
| `VITE_SITE_URL` | `https://azure-production.d1deo9tihdnt50.amplifyapp.com` | `http://localhost:5173` | Auth redirects |

---

## 5. Audio Pipeline (Ground Truth)

### Browser Capture Settings
**Location**: `frontend/src/hooks/useTranscription.ts:1963-1971`
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 16000,        // Match AWS Transcribe 16kHz requirement
    channelCount: 1,          // Mono audio works better for diarization
    echoCancellation: false,  // Turn OFF - can interfere with speaker detection
    noiseSuppression: false,  // Turn OFF - can merge speakers
    autoGainControl: false,   // Turn OFF - can normalize different speaker volumes
  },
});
```

**⚠️ CRITICAL MISMATCH**: Frontend requests 16kHz, but backend defaults to 48kHz

### Client Processing
**Audio Context**: `new AudioContext({ sampleRate: 16000 })`  
**Processing**: ScriptProcessor with 4096 buffer size  
**Format**: Float32Array → Int16Array (PCM16)  
**Send Cadence**: Real-time streaming via WebSocket

### Server WebSocket Handler
**Location**: `backend/src/index.ts:2244-2434`
```typescript
const wss = new WebSocketServer({ server, path: wsPath });
wss.on('connection', (ws, req) => {
  ws.on('message', async (data, isBinary) => {
    // Handle binary audio data
    if (isBinary) {
      // Forward to AWS Transcribe
    }
  });
});
```

**Binary Handling**: Direct pass-through to AWS Transcribe  
**Authentication**: Optional JWT token validation  
**Session Management**: Map-based session tracking

### AWS Transcribe Parameters
**Location**: `backend/src/services/transcriptionService.ts:63-74`
```typescript
const cmdInput: StartStreamTranscriptionCommandInput = {
  LanguageCode: (config.language_code || 'fr-CA') as any,
  MediaSampleRateHertz: sampleRate,  // 48kHz by default
  MediaEncoding: 'pcm',
  EnablePartialResultsStabilization: true,
  PartialResultsStability: 'high',
  ShowSpeakerLabels: enableLabels    // Mode-dependent
};
```

**Sample Rate**: **48kHz** (backend default, not 16kHz as frontend requests)  
**Encoding**: PCM  
**Stabilization**: High stability for better accuracy  
**Speaker Labels**: Enabled for ambient mode only

### Mode-Specific Configuration
**Location**: `backend/src/index.ts:2200-2241`
- **Word-for-Word**: No speaker labels, high stability
- **Smart Dictation**: No speaker labels, high stability  
- **Ambient**: Speaker labels enabled, high stability

---

## 6. Nginx Configuration Reality

**⚠️ CRITICAL**: Nginx configuration is **NOT in repository**

**Documented Configuration** (from `docs/EC2_BACKEND_IMPLEMENTATION_GUIDE.md:318-330`):
```nginx
location /ws {
    proxy_pass http://127.0.0.1:3001/ws/transcription;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 3600;
    proxy_send_timeout 3600;
}
```

**Key Features**:
- WebSocket path mapping: `/ws` → `/ws/transcription`
- Proper upgrade headers
- Extended timeouts for long sessions
- Real IP forwarding

**⚠️ DEPLOYMENT RISK**: Configuration exists only on server, not version controlled

---

## 7. Cloudflare Reality

**DNS Records**: `api.alie.app` → EC2 instance IP  
**Proxy Mode**: Orange cloud (Full Strict SSL)  
**WebSocket Support**: ✅ Confirmed working  
**SSL/TLS**: Full Strict mode validates origin certificates

**Benefits**:
- DDoS protection
- Global edge network
- SSL termination
- WebSocket proxying

---

## 8. Amplify Reality

**Build Settings**: Vite-based build process  
**Environment Variables**: Set in Amplify Console (not in repo)  
**Domain**: `azure-production.d1deo9tihdnt50.amplifyapp.com`  
**Deployment**: Automatic on `azure-production` branch push

**Required Environment Variables**:
- `VITE_SITE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`
- `VITE_WS_URL`

---

## 9. Gaps, Risks, Recommendations

### P0 (Critical) Issues

1. **Sample Rate Mismatch**
   - **Problem**: Frontend requests 16kHz, backend uses 48kHz
   - **Impact**: Potential audio quality issues, AWS Transcribe inefficiency
   - **Fix**: Align frontend and backend sample rates
   - **Files**: `frontend/src/hooks/useTranscription.ts:1965`, `backend/src/config/env.ts:158`

2. **Nginx Configuration Not Version Controlled**
   - **Problem**: Critical infrastructure config exists only on server
   - **Impact**: Deployment risk, configuration drift, disaster recovery issues
   - **Fix**: Add Nginx config to repository with deployment automation
   - **Files**: Create `infra/nginx/api.alie.app.conf`

3. **Environment Configuration Complexity**
   - **Problem**: Multiple env systems (env.ts, env.js, hardcoded values)
   - **Impact**: Configuration confusion, deployment errors
   - **Fix**: Consolidate to single environment system
   - **Files**: `backend/src/config/env.ts`, `backend/src/env.ts`

### P1 (High) Issues

4. **Rate Limiting Disabled**
   - **Problem**: `RATE_LIMIT_ENABLED: false` in production
   - **Impact**: Potential abuse, resource exhaustion
   - **Fix**: Enable rate limiting with appropriate limits
   - **Files**: `backend/src/config/env.ts:119`

5. **Authentication Optional**
   - **Problem**: `AUTH_REQUIRED: false` in production
   - **Impact**: Unauthorized access to transcription services
   - **Fix**: Enable authentication for production
   - **Files**: `backend/src/config/env.ts:117`

6. **Missing Health Check Endpoints**
   - **Problem**: No comprehensive health checks for monitoring
   - **Impact**: Difficult to monitor system health
   - **Fix**: Implement comprehensive health checks
   - **Files**: `backend/src/index.ts` (add health endpoints)

### P2 (Medium) Issues

7. **CSP Headers Missing**
   - **Problem**: No Content Security Policy headers
   - **Impact**: XSS vulnerability potential
   - **Fix**: Implement CSP headers in Nginx
   - **Files**: Nginx configuration

8. **Logging Configuration**
   - **Problem**: Basic logging, no structured logging
   - **Impact**: Difficult debugging and monitoring
   - **Fix**: Implement structured logging with correlation IDs
   - **Files**: `backend/src/index.ts`

9. **Error Handling**
   - **Problem**: Basic error handling, no global error handlers
   - **Impact**: Poor error reporting and debugging
   - **Fix**: Implement comprehensive error handling
   - **Files**: `backend/src/index.ts`

---

## 10. Validation Steps

### Server Validation Commands
```bash
# Check Nginx configuration
sudo nginx -T

# Verify WebSocket upgrade
curl -i -N --http1.1 \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  https://api.alie.app/ws

# Check backend health
curl https://api.alie.app/healthz

# Verify SSL certificates
openssl s_client -connect api.alie.app:443 -servername api.alie.app
```

### Frontend Validation
```bash
# Check environment variables
console.log(import.meta.env)

# Test WebSocket connection
const ws = new WebSocket('wss://api.alie.app/ws');
ws.onopen = () => console.log('Connected');
ws.onerror = (e) => console.error('Error:', e);
```

### Audio Pipeline Validation
```bash
# Check audio settings in browser console
navigator.mediaDevices.getUserMedia({audio: true})
  .then(stream => {
    const track = stream.getAudioTracks()[0];
    console.log(track.getSettings());
  });
```

---

## 11. Infrastructure Diagram

See `diagrams/infra.mmd` for complete Mermaid diagram.

---

## 12. Conclusion

The CentomoMD infrastructure is **functionally operational** but has **significant configuration management issues**. The core services (WebSocket, transcription, authentication) work correctly, but the system lacks proper configuration management and has critical sample rate mismatches.

**Immediate Actions Required**:
1. Fix sample rate mismatch (P0)
2. Version control Nginx configuration (P0)
3. Consolidate environment configuration (P0)
4. Enable rate limiting and authentication (P1)

**System Status**: ⚠️ **OPERATIONAL WITH RISKS**
