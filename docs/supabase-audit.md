# Supabase Architecture Audit Report

**Date:** 2025-01-18  
**Auditor:** Surgical Code Auditor  
**Scope:** Client/Server Supabase usage analysis  
**Branch:** `chore/supabase-audit`

## Executive Summary

This audit examines how our application uses Supabase across client and server components, identifying potential risks that could cause user creation failures or policy mismatches. The analysis covers client initialization, authentication flows, data access patterns, and environment configuration.

## 1. Supabase Client Initialization Points

### Frontend Client (`frontend/src/lib/authClient.ts`)
```typescript
// Lines 44-50
_client = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```
- **Environment Variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Client Type:** Anonymous (client-side)
- **Configuration:** ✅ Properly configured for client-side usage

### Backend Client (`backend/src/lib/supabaseClient.ts`)
```typescript
// Lines 8-15
const url = process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];

_client = createClient(url, key);
```
- **Environment Variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Client Type:** Service Role (server-side)
- **Configuration:** ✅ Properly configured for server-side admin operations

### User Creation Script (`create-dr-centomo-user.js`)
```typescript
// Lines 49-55
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```
- **Environment Variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Client Type:** Service Role (script)
- **Configuration:** ✅ Properly configured for admin operations

### Risk Assessment
- ✅ **No service role usage in browser** - All service role clients are server-side only
- ✅ **Proper environment variable separation** - Client uses `VITE_` prefixed vars
- ⚠️ **Missing client validation** - Frontend client creation could fail silently

## 2. Endpoint Hygiene

### Direct Supabase Studio API Calls
**Result:** ✅ **No direct Studio API calls found**

- No instances of `api.supabase.com` or `platform/pg-meta` endpoints
- No raw `fetch` calls to Supabase Studio endpoints
- All Supabase interactions go through the official client library

### Risk Assessment
- ✅ **Clean endpoint usage** - All calls use official Supabase client
- ✅ **No bypassing of client library** - No direct HTTP calls to Supabase APIs

## 3. Authentication Flows

### Email/Password Authentication
```typescript
// frontend/src/lib/authClient.ts:208-212
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${getSiteUrl()}/auth/callback`,
  },
});
```
- **Provider:** Email OTP
- **Email Normalization:** ❌ **Missing** - No normalization applied
- **Redirect URL:** Uses `VITE_SITE_URL` with fallback to `window.location.origin`

### OAuth Authentication
```typescript
// frontend/src/lib/authClient.ts:249-256
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${getSiteUrl()}/auth/callback`,
    scopes: 'openid email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  },
});
```
- **Provider:** Google OAuth
- **Email Normalization:** ❌ **Missing** - No normalization applied
- **Redirect URL:** Uses `VITE_SITE_URL` with fallback to `window.location.origin`

### Admin User Creation
```typescript
// create-dr-centomo-user.js:64-68
const { data, error } = await supabase.auth.admin.createUser({
  email: 'hugocentomo@gmail.com',
  password: 'CentomoMD2025!',
  email_confirm: true
});
```
- **Provider:** Admin API
- **Email Normalization:** ❌ **Missing** - No normalization applied
- **Email Confirmation:** ✅ Automatically confirmed

### Risk Assessment
- ❌ **Email normalization missing** - Gmail dots and plus signs not handled
- ✅ **Proper redirect URL handling** - Uses environment-aware site URL
- ⚠️ **Potential duplicate accounts** - Same email with different formats could create multiple accounts

## 4. Email Normalization

### Current State
**Result:** ❌ **No email normalization found**

- No helper functions for stripping Gmail dots or plus tags
- No normalization in `signUp`, `signInWithOtp`, or `admin.createUser` calls
- No normalization in OAuth flows

### Where Normalization Should Be Applied
1. **Frontend auth flows** (`frontend/src/lib/authClient.ts`)
   - `signInWithOtp` function
   - `signInWithOAuth` callback handling
2. **Backend admin operations** (`create-dr-centomo-user.js`)
   - `admin.createUser` calls
3. **Profile creation** (`backend/src/routes/profile.ts`)
   - User profile creation after auth

### Risk Assessment
- ❌ **High risk of duplicate accounts** - `user@gmail.com` vs `user+tag@gmail.com` vs `u.s.e.r@gmail.com`
- ❌ **Inconsistent user identification** - Same person could have multiple accounts
- ❌ **Data fragmentation** - User data split across multiple accounts

## 5. Data Access Layering

### Public Schema Tables
```typescript
// backend/src/database/schema.ts
export const users = pgTable('users', { ... });           // App users table
export const profiles = pgTable('profiles', { ... });     // Extends auth.users
export const memberships = pgTable('memberships', { ... }); // User-clinic relationships
export const sessions = pgTable('sessions', { ... });     // Transcription sessions
export const artifacts = pgTable('artifacts', { ... });   // Mode 3 pipeline outputs
```

### Auth Schema References
```typescript
// profiles table references auth.users
user_id: uuid('user_id').primaryKey(), // References auth.users(id) in Supabase

// memberships table references auth.users  
user_id: uuid('user_id').notNull(), // References auth.users(id) in Supabase
```

### Data Access Patterns
```typescript
// backend/src/routes/profile.ts:62-65
const profileRows = await db
  .select()
  .from(profiles)
  .where(eq(profiles.user_id, userId))
```

### Risk Assessment
- ✅ **Proper separation** - App tables in `public` schema, auth in `auth` schema
- ✅ **Correct foreign key references** - `profiles.user_id` references `auth.users.id`
- ⚠️ **Potential RLS conflicts** - Client-side queries might be blocked by RLS policies

## 6. RLS-Sensitive Queries

### Client-Side Queries (High Risk)
**Result:** ❌ **No client-side database queries found**

- All database operations are server-side only
- Frontend uses API endpoints, not direct database access
- No `supabase.from()` calls in frontend code

### Server-Side Queries (Low Risk)
```typescript
// backend/src/routes/profile.ts:62-65
const profileRows = await db
  .select()
  .from(profiles)
  .where(eq(profiles.user_id, userId))
```

### Risk Assessment
- ✅ **No client-side RLS risks** - All queries are server-side with service role
- ✅ **Proper authentication context** - Server-side queries use authenticated user context
- ✅ **No RLS bypassing** - Service role client has admin privileges

## 7. Environment Configuration

### Environment Variables Found
```bash
# Backend (.env)
SUPABASE_URL=https://kbjulpxgjqzgbkshqsme.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_JWT_SECRET=your_jwt_secret

# Frontend (VITE_ prefixed)
VITE_SUPABASE_URL=https://kbjulpxgjqzgbkshqsme.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_SITE_URL=https://centomo-md-original-kskp.vercel.app
```

### Configuration Usage
- **Client-side:** Uses `VITE_` prefixed variables
- **Server-side:** Uses standard environment variables
- **Site URL:** Properly configured for redirects

### Risk Assessment
- ✅ **Proper environment separation** - Client and server use different variable sets
- ✅ **Site URL configured** - Redirects work correctly
- ⚠️ **Missing validation** - No validation of environment variable format

## 8. Findings Summary

### Critical Issues
- ❌ **Email normalization missing** - High risk of duplicate accounts
- ❌ **No email validation** - Invalid emails could cause auth failures

### Moderate Issues  
- ⚠️ **Missing client validation** - Frontend client creation could fail silently
- ⚠️ **No environment validation** - Invalid env vars could cause runtime errors

### Low Risk Issues
- ⚠️ **Hardcoded user creation** - Script uses hardcoded email/password
- ⚠️ **Missing error handling** - Some auth flows lack comprehensive error handling

### Positive Findings
- ✅ **No service role in browser** - All admin operations are server-side
- ✅ **No direct Studio API calls** - All interactions use official client
- ✅ **Proper data separation** - App tables separate from auth tables
- ✅ **No client-side RLS risks** - All database queries are server-side
- ✅ **Proper environment separation** - Client/server use different env vars

## Recommendations

### High Priority
1. **Implement email normalization** - Add helper function to normalize emails before auth operations
2. **Add email validation** - Validate email format before sending to Supabase
3. **Add client validation** - Validate Supabase client creation in frontend

### Medium Priority
4. **Add environment validation** - Validate environment variables on startup
5. **Improve error handling** - Add comprehensive error handling for auth flows
6. **Add logging** - Add structured logging for auth operations

### Low Priority
7. **Make user creation configurable** - Allow email/password to be passed as parameters
8. **Add health checks** - Add Supabase connectivity health checks

## Smoke Test Script

A diagnostic script has been created at `scripts/supabase-smoke-app.ts` that:
- Tests Supabase client configuration
- Validates environment variables
- Tests basic admin operations
- Optionally tests sign-up flow (with `--try-signup` flag)

**Usage:**
```bash
npm run supabase:smoke:app
npm run supabase:smoke:app -- --try-signup
```

This script provides non-destructive testing of Supabase connectivity and basic operations without affecting production data.
