# CentomoMD Auth V1 Reference Guide

## TL;DR: Current Defaults
- **AUTH_VERIFY_STRATEGY**: `supabase` (working)
- **WS param**: `ws_token` (standardized)
- **Issuer**: `https://<project-id>.supabase.co/` (with trailing slash)
- **JWKS URL**: `https://<project-id>.supabase.co/auth/v1/.well-known/jwks.json`

## 🚨 Runbook: Common Errors & Fixes

### JWKS 401 Error
**Error**: `Failed to fetch JWKS: JWKS fetch failed with status: 401`
**Root Cause**: Using wrong endpoint `/auth/v1/keys` instead of `/auth/v1/.well-known/jwks.json`
**Fix**: Update `backend/src/utils/jwks.ts:18-26` to use correct endpoint
**Test**: `curl -i "https://<project-id>.supabase.co/auth/v1/.well-known/jwks.json"`

### Issuer Mismatch Error
**Error**: `JWT verification failed: Invalid issuer`
**Root Cause**: Missing trailing slash in issuer (should be `https://<project-id>.supabase.co/`)
**Fix**: Update `backend/src/utils/jwks.ts:75-78` to use `${ENV.SUPABASE_URL}/`
**Test**: Check JWT payload `iss` field matches expected format

### WS Token Parameter Mismatch
**Error**: WebSocket connection fails with auth error
**Root Cause**: Frontend uses `?token=` but backend expects `?ws_token=`
**Fix**: Standardize on `ws_token` parameter in both frontend and backend
**Test**: `wscat -c "ws://localhost:3001/ws/transcription?ws_token=<valid>"`

## 🔧 Decisions: JWKS vs Supabase-JS

### Why Supabase-JS (Current Default)
- ✅ **No circular dependency** - Supabase handles JWT verification internally
- ✅ **Built-in caching** - Automatic key rotation and caching
- ✅ **Error handling** - Comprehensive error messages and retry logic
- ✅ **Rate limiting** - Built-in protection against abuse

### Why JWKS (Alternative)
- ✅ **Full control** - Custom verification logic and policies
- ✅ **Performance** - Local caching and verification
- ✅ **Offline capability** - Can work without Supabase API calls
- ❌ **Complexity** - Manual key management and rotation
- ❌ **401 issues** - Endpoint requires authentication

### Rollback Switches
- **To JWKS**: Set `AUTH_VERIFY_STRATEGY=jwks`
- **To Supabase**: Set `AUTH_VERIFY_STRATEGY=supabase` (default)
- **WS Param**: Change `ws_token` back to `token` if needed

## 🌍 Environment Variable Map

| Variable | Default | PR | Purpose | Used By |
|----------|---------|----|---------|---------|
| `AUTH_VERIFY_STRATEGY` | `supabase` | PR3.1 | Choose verification method | `backend/src/auth.ts` |
| `SUPABASE_URL` | Required | PR0 | Supabase project URL | All auth modules |
| `SUPABASE_ANON_KEY` | Required | PR0 | Frontend client key | Frontend + backend |
| `SUPABASE_SERVICE_ROLE_KEY` | Required | PR0 | Admin operations | Backend admin |
| `WS_REQUIRE_AUTH` | `false` | PR3.2 | Enable WS authentication | WS handshake |
| `WS_JWT_SECRET` | Required | PR3.2 | Sign WS tokens | WS token generation |

### PR Flip Points
- **PR0**: Basic Supabase configuration
- **PR3.1**: Verification strategy toggle
- **PR3.2**: WebSocket authentication
- **PR4**: HTTP endpoint protection
- **PR7**: Database RLS policies

## 🔌 WebSocket Flow

### 1. Token Exchange
```
POST /api/ws-token
Authorization: Bearer <supabase_access_token>
→ Returns: { ws_token: "jwt...", expiresIn: 60 }
```

### 2. WebSocket Connection
```
ws://localhost:3001/ws/transcription?ws_token=<jwt>
→ Backend verifies ws_token with WS_JWT_SECRET
→ Attaches user context to socket
```

### 3. Handshake Rules
- **Valid ws_token**: Connection established, user context attached
- **Missing ws_token**: Close with code 1008 "Authentication required"
- **Invalid ws_token**: Close with code 1008 "Invalid token"
- **Expired ws_token**: Close with code 1008 "Token expired"

## 📁 File Locations

### Core Authentication
- **Main Auth Logic**: `backend/src/auth.ts`
- **JWKS Utilities**: `backend/src/utils/jwks.ts`
- **Environment Config**: `backend/src/config/env.ts`

### WebSocket
- **WS Client Hook**: `frontend/src/hooks/useWebSocket.ts`
- **WS Server**: `backend/src/index.ts:1047-1080`
- **WS Utils**: `frontend/src/lib/utils.ts`

### Frontend
- **API Client**: `frontend/src/lib/api.ts`
- **Auth Client**: `frontend/src/lib/authClient.ts`

## 🧪 Testing Commands

### JWKS Endpoint Test
```bash
# Should return 200 OK
curl -i "https://kbjulpxgbkshqsme.supabase.co/auth/v1/.well-known/jwks.json"
```

### JOSE Library Test
```bash
node -e "
const { createRemoteJWKSet } = require('jose');
const url = process.env.SUPABASE_URL + '/auth/v1/.well-known/jwks.json';
console.log('Testing JOSE with URL:', url);
const jwks = createRemoteJWKSet(new URL(url));
console.log('JWKS created:', !!jwks);
"
```

### WS Token Exchange Test
```bash
# 401 without Bearer
curl -X POST http://localhost:3001/api/ws-token

# 200 with valid Bearer
curl -X POST http://localhost:3001/api/ws-token \
  -H "Authorization: Bearer <valid_token>"
```

### WebSocket Connection Test
```bash
# Success with valid ws_token
wscat -c "ws://localhost:3001/ws/transcription?ws_token=<valid>"

# 4401 with invalid token
wscat -c "ws://localhost:3001/ws/transcription?ws_token=invalid"
```

### Security Verification
```bash
# Check no tokens in logs
grep -r "Bearer" backend/logs/ || echo "✅ No tokens in logs"

# Check no full URLs with ws_token in logs
grep -r "ws_token=" backend/logs/ || echo "✅ No ws_token URLs in logs"
```

## 🚀 Quick Fixes

### Fix JWKS 401 (Immediate)
1. Update `backend/src/utils/jwks.ts:18-26`:
   ```typescript
   return `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
   ```

2. Update `backend/src/utils/jwks.ts:75-78`:
   ```typescript
   issuer: `${ENV.SUPABASE_URL}/`, // Note trailing slash
   ```

### Fix WS Parameter Mismatch
1. Frontend: `frontend/src/hooks/useWebSocket.ts:30-40`:
   ```typescript
   wsUrl += `?ws_token=${encodeURIComponent(tokenResponse.wsToken)}`;
   ```

2. Backend: `backend/src/index.ts:1075`:
   ```typescript
   const wsToken = url.searchParams.get('ws_token');
   ```

### Add Strategy Toggle
1. `backend/src/config/env.ts`: Add `AUTH_VERIFY_STRATEGY`
2. `backend/src/auth.ts`: Add `verifyAccessToken()` function

## 📚 Related Documentation
- **Implementation Plan**: `CENTOMO_AUTH_V1_PLAN.md`
- **PR Stubs**: `PR0-PR3_FILE_STUBS.md`
- **Issues Guide**: `AUTHENTICATION_ISSUES_BRAINSTORMING.md`
- **Audit Report**: `CENTOMO_AUTH_AUDIT_REPORT.md`

---

*This reference guide should be updated whenever authentication changes are made. Last updated: 2025-01-02*
