# 🔍 Complete Audit: API Fetch Implementation - Dev vs Prod

**Date:** 2025-01-21  
**Branch:** `hotfix/auth-issue`  
**Purpose:** Identify discrepancies in API fetch implementation between dev and prod environments

---

## 📋 Executive Summary

Multiple critical discrepancies were found in API fetch implementation that prevent full login in production:

1. **Token Storage** - Using localStorage instead of Supabase session (CRITICAL)
2. **Authorization Header Handling** - Mixed approaches, some bypass auth helper
3. **Inconsistent API Base URL Configuration** - 3 different fallback strategies
4. **API Function Doesn't Auto-Add Auth** - Core `api()` function missing auth headers

**Production Environment Verified:**
- ✅ Frontend: `https://azure-production.d1deo9tihdnt50.amplifyapp.com`
- ✅ Backend API: `https://api.alie.app`
- ✅ Supabase: Configured with correct redirect URLs
- ✅ CORS: Backend allows Amplify frontend URL
- ✅ Environment Variables: All set correctly in Amplify

---

## 🔴 Critical Issues

### 1. **Inconsistent API Base URL Fallbacks**

#### Issue
Three different files define different fallback strategies for `VITE_API_BASE_URL`:

**File: `frontend/src/lib/api.ts`**
```typescript
const devFallback = 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? 'http://localhost:3001'
    : '';

const BASE = (import.meta.env.VITE_API_BASE_URL || devFallback).replace(/\/+$/, '');
```
**Problem:** In production, if `VITE_API_BASE_URL` is not set, `BASE` becomes empty string, causing relative URLs (`/api/...`)

**File: `frontend/src/lib/constants.ts`**
```typescript
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  // ...
};
```
**Problem:** Always falls back to localhost, even in production

**File: `frontend/src/config.ts`**
```typescript
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (isProd
    ? 'https://api.alie.app'
    : 'http://localhost:3001');
```
**Problem:** Hardcoded production URL may not match actual backend deployment

#### Impact
- **Dev:** Works because Vite proxy handles `/api` requests
- **Prod:** If `VITE_API_BASE_URL` is missing, requests fail or go to wrong endpoint

---

### 2. **Authorization Header Handling Inconsistencies**

#### Issue
Mixed approaches for adding Authorization headers:

**Proper Implementation: `frontend/src/lib/api.ts`**
```typescript
export const apiFetch = async <T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  // Get access token from Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  accessToken = session?.access_token;
  
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  const response = await api(path, { ...init, headers });
  // ...
};
```
✅ **Correct:** Gets token from Supabase session

**Manual Implementation: `frontend/src/pages/AuthCallback.tsx`**
```typescript
const response = await api('/api/profile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  }
});
```
⚠️ **Acceptable:** Manually passes token (but should use helper)

**Wrong Implementation: `frontend/src/components/transcription/TranscriptionInterface.tsx`**
```typescript
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  },
  credentials: 'include',
});
```
❌ **Critical:** Uses `localStorage.getItem('access_token')` instead of Supabase session

#### Impact
- **Dev:** May work if token was manually stored in localStorage
- **Prod:** Token likely not in localStorage, causing 401 errors
- **Security:** Tokens should not be in localStorage (use Supabase's session management)

---

### 3. **Base API Function Doesn't Add Auth**

#### Issue
The core `api()` function in `frontend/src/lib/api.ts` does NOT automatically add Authorization headers:

```typescript
export async function api(path: string, init: RequestInit = {}) {
  const url = `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, { credentials: 'include', ...init });
  // No auth header added here!
  return res;
}
```

Only `apiFetch()` adds auth headers, but many places use `api()` directly.

#### Impact
- Any direct calls to `api()` without manual headers = no auth
- Forces manual header management everywhere

---

### 4. **Missing Environment Variable Validation**

#### Issue
`VITE_SITE_URL` is required for auth redirects but may not be set in production:

**File: `frontend/src/lib/redirect.ts`**
```typescript
export const getAuthRedirectUrl = () => {
  const base = import.meta.env.VITE_SITE_URL;
  if (!base) {
    throw new Error('VITE_SITE_URL is missing. Please set this environment variable.');
  }
  return `${base}/auth/callback`;
};
```

**But:** This error only throws at runtime when auth is attempted, not at build time.

#### Impact
- **Dev:** Works with `http://localhost:5173`
- **Prod:** If `VITE_SITE_URL` is missing, auth redirects fail silently or break

---

### 5. **CORS Configuration Hardcoded**

#### Issue
Backend CORS configuration has hardcoded production origins:

**File: `backend/src/config/env.ts`**
```typescript
CORS_ALLOWED_ORIGINS: parseList(
  process.env['CORS_ALLOWED_ORIGINS']
    ?? (isProd
        ? 'https://azure-production.d1deo9tihdnt50.amplifyapp.com,https://www.centomomd.com'
        : 'http://localhost:5173')
),
```

**Problems:**
1. If frontend deploys to different URL, CORS fails
2. Environment variable may not match actual deployment
3. No validation that frontend origin matches backend expectation

#### Impact
- **Dev:** Localhost works fine
- **Prod:** If frontend URL doesn't match, all API requests blocked by CORS

---

## 📊 Comparison Table: Dev vs Prod

| Feature | Development | Production | Issue |
|---------|-------------|------------|-------|
| **API Base URL** | `http://localhost:3001` (proxy) or env | `''` or `'https://api.alie.app'` (inconsistent) | ❌ 3 different fallbacks |
| **Auth Headers** | Sometimes via `apiFetch()`, sometimes manual | Same inconsistent | ⚠️ No standard approach |
| **Token Source** | Supabase session (correct) | localStorage (wrong in some places) | ❌ Mixed implementations |
| **CORS Origin** | `http://localhost:5173` | Hardcoded in backend | ⚠️ May not match deployment |
| **Redirect URL** | `http://localhost:5173/auth/callback` | From `VITE_SITE_URL` | ⚠️ May be missing |
| **Error Detection** | Runtime only | Runtime only | ⚠️ No build-time validation |

---

## 🔧 Root Causes for Production Login Failure

### 1. **Token Not Available in localStorage (PRIMARY ISSUE)** 🔴
**Location:** `frontend/src/components/transcription/TranscriptionInterface.tsx:630`
- Code tries to get token from `localStorage.getItem('access_token')`
- Supabase stores tokens in session storage managed by Supabase client, NOT localStorage
- **Result:** `Authorization: Bearer null` → 401 Unauthorized on all transcription API calls

### 2. **API Function Doesn't Auto-Add Auth Headers**
**Location:** `frontend/src/lib/api.ts:48-56`
- Core `api()` function doesn't automatically add Authorization headers
- Only `apiFetch()` adds them, but many places bypass it
- **Result:** Some API calls sent without auth tokens

### 3. **Direct Fetch Calls Bypass Auth Helper**
**Location:** `frontend/src/components/transcription/TranscriptionInterface.tsx:625-639`
- Uses raw `fetch()` instead of `api()` or `apiFetch()` helpers
- Manually tries to get token from wrong storage location
- **Result:** Authentication failures

### 4. **Inconsistent API Base URL Configuration**
- Production has `VITE_API_BASE_URL=https://api.alie.app` ✅ (set correctly)
- But code has 3 different fallback strategies that could cause confusion
- **Result:** Potential for bugs if env var not set (though it is set)

### ✅ **Verified Working:**
- **CORS:** Backend allows `https://azure-production.d1deo9tihdnt50.amplifyapp.com` ✅
- **Supabase Redirect URLs:** Correctly configured ✅
- **Environment Variables:** All set correctly in Amplify ✅

---

## ✅ Recommended Fixes

### Priority 1: Critical (Blocks Production) 🔴

1. **Fix Token Storage in TranscriptionInterface (IMMEDIATE FIX)**
   **File:** `frontend/src/components/transcription/TranscriptionInterface.tsx:625-639`
   
   **Current (WRONG):**
   ```typescript
   const response = await fetch(endpoint, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-correlation-id': correlationId,
       'Authorization': `Bearer ${localStorage.getItem('access_token')}` // ❌ WRONG
     },
   });
   ```
   
   **Fix Option A - Use Supabase Session:**
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   const response = await fetch(endpoint, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-correlation-id': correlationId,
       'Authorization': `Bearer ${session?.access_token}` // ✅ CORRECT
     },
   });
   ```
   
   **Fix Option B - Use apiFetch() Helper (BEST):**
   ```typescript
   import { apiFetch } from '@/lib/api';
   
   const result = await apiFetch('/format/word-for-word-ai', {
     method: 'POST',
     headers: {
       'x-correlation-id': correlationId,
     },
     body: JSON.stringify({ transcript, language, inputLanguage, outputLanguage })
   });
   ```

2. **Make `api()` Function Auto-Add Auth Headers**
   **File:** `frontend/src/lib/api.ts:48-56`
   
   **Current:**
   ```typescript
   export async function api(path: string, init: RequestInit = {}) {
     const url = `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
     const res = await fetch(url, { credentials: 'include', ...init });
     // ❌ No auth headers added!
     return res;
   }
   ```
   
   **Fixed:**
   ```typescript
   export async function api(path: string, init: RequestInit = {}) {
     const headers = new Headers(init.headers);
     
     // Auto-add auth token if available
     try {
       const { data: { session } } = await supabase.auth.getSession();
       if (session?.access_token) {
         headers.set('Authorization', `Bearer ${session.access_token}`);
       }
     } catch (error) {
       // Auth not configured, continue without token
       console.warn('Auth not configured, proceeding without token');
     }
     
     const url = `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
     const res = await fetch(url, { 
       credentials: 'include', 
       ...init,
       headers 
     });
     return res;
   }
   ```

### Priority 2: Important (Prevents Issues)

4. **Add Environment Variable Validation**
   - Validate at build time (Vite plugin)
   - Show clear errors if required vars missing
   - Document all required vars in `.env.example`

5. **CORS Configuration**
   - Move CORS origins to environment variable
   - Validate frontend origin matches backend expectation
   - Add CORS debugging endpoint

6. **Consolidate API Configuration**
   - Remove duplicate API config files
   - Single source of truth for `API_BASE_URL`
   - Export from one file only

---

## 📝 Implementation Plan

### Step 1: Fix Immediate Production Blockers
- [ ] Replace `localStorage.getItem('access_token')` with Supabase session
- [ ] Ensure `VITE_API_BASE_URL` is set in production environment
- [ ] Verify `VITE_SITE_URL` is set correctly

### Step 2: Standardize API Client
- [ ] Make `api()` function auto-add auth headers
- [ ] Deprecate direct `fetch()` calls in favor of `api()` or `apiFetch()`
- [ ] Remove duplicate API config files

### Step 3: Add Validation
- [ ] Add build-time env var validation
- [ ] Add runtime health check for API connectivity
- [ ] Add CORS origin validation

### Step 4: Documentation
- [ ] Document all required environment variables
- [ ] Add deployment checklist
- [ ] Add troubleshooting guide

---

## 🔍 Files Requiring Changes

### High Priority
1. `frontend/src/components/transcription/TranscriptionInterface.tsx` - Line 630
2. `frontend/src/lib/api.ts` - Core API function
3. `backend/src/config/env.ts` - CORS configuration

### Medium Priority
4. `frontend/src/lib/constants.ts` - Remove duplicate config
5. `frontend/src/config.ts` - Consolidate with api.ts
6. `frontend/vite.config.ts` - Add env validation plugin

### Low Priority (Documentation)
7. `frontend/env.template` - Add all required vars
8. `docs/DEPLOYMENT.md` - Add environment setup guide

---

## 🧪 Testing Checklist

After fixes, test in production:

- [ ] Login with Google OAuth → Should redirect correctly
- [ ] Login with Magic Link → Should redirect correctly
- [ ] Profile API calls → Should work with auth headers
- [ ] Transcription API calls → Should use correct token
- [ ] CORS → Should allow requests from production frontend
- [ ] API Base URL → Should point to correct backend
- [ ] Token refresh → Should work automatically

---

## 📚 Related Files

- `frontend/src/lib/api.ts` - API client implementation
- `frontend/src/lib/authClient.ts` - Supabase client & auth
- `frontend/src/lib/redirect.ts` - Auth redirect URL management
- `frontend/src/pages/AuthCallback.tsx` - OAuth callback handler
- `backend/src/config/env.ts` - Backend environment configuration
- `backend/src/middleware/auth.ts` - Backend auth middleware

---

**Status:** 🔴 Critical - Production login blocked  
**Next Steps:** Implement Priority 1 fixes immediately

