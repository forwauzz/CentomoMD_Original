# CentomoMD Auth v1 Implementation Plan
*Supabase Auth + WebSocket Gating*

## 1) Architecture Plan

### Route Matrix
**Frontend Routes** (`frontend/src/App.tsx`)
- **PUBLIC**: `/login` (new)
- **PROTECTED**: `/dashboard`, `/case/new`, `/templates`, `/dictation`, `/settings`, `/profile`
- **Redirect**: `/` → `/dashboard` (existing)

**Backend API Routes** (`backend/src/index.ts`)
- **PUBLIC**: `GET /health`
- **PROTECTED**: All `/api/templates*`, `/api/profile`, `/api/ws-token`

### Token Flows

**HTTP Flow**:
1. `@supabase/supabase-js` → `access_token` (SPA token)
2. `apiFetch()` → `Authorization: Bearer <access_token>`
3. `authMiddleware` → Supabase JWKS verify → `req.user`

**WebSocket Flow**:
1. FE calls `POST /api/ws-token` with `Authorization: Bearer <access_token>`
2. BE returns `{ ws_token: "jwt..." }` (TTL 60s, signed with `WS_JWT_SECRET`)
3. FE connects to `ws://localhost:3001/transcription?ws_token=<jwt>`
4. WS handshake verifies `ws_token` → attach `{ user_id, clinic_id, role }` to socket

### Environment Variables

| Variable | Where Used | Required | Default | Notes |
|----------|------------|----------|---------|-------|
| `SUPABASE_URL` | `authClient.ts`, `auth.ts` | Yes | - | Supabase project URL |
| `SUPABASE_ANON_KEY` | `authClient.ts` | Yes | - | Frontend client key |
| `SUPABASE_SERVICE_ROLE_KEY` | `auth.ts` | Yes | - | Backend service key |
| `SUPABASE_JWT_SECRET` | `auth.ts` | Yes | - | JWT verification secret |
| `JWT_SECRET` | `env.example:48` | No | - | Legacy, remove |
| `BCRYPT_ROUNDS` | `env.example:50` | No | - | Legacy, remove |
| `CORS_ALLOWED_ORIGINS` | `security.ts` | Yes | `http://localhost:5173` | Comma-separated list |
| `AUTH_REQUIRED` | `authMiddleware`, `ProtectedRoute` | No | `false` | Feature flag |
| `WS_REQUIRE_AUTH` | `ws/handshake.ts` | No | `false` | Feature flag |
| `WS_JWT_SECRET` | `wsToken.ts`, `handshake.ts` | Yes | - | 32+ char secret |
| `PUBLIC_WS_URL` | `utils.ts` | No | `ws://localhost:3001` | WS base URL |
| `USE_WSS` | `utils.ts` | No | `false` | Force WSS in production |
| `LOG_PAYLOADS` | `auth.ts`, `handshake.ts` | No | `false` | Debug flag |
| `DIAG_MODE` | Various | No | `false` | Development mode |
| `AWS_REGION` | `env.example:15` | Yes | `ca-central-1` | Existing |

### Risk Callouts
- **Replace mock auth**: `backend/src/middleware/authMiddleware.ts:43-52` - Remove dev bypass
- **WS block update**: `backend/src/index.ts:430-606` - Add handshake verification
- **Remove legacy vars**: `env.example:48,50` - Clean up unused JWT_SECRET, BCRYPT_ROUNDS
- **Security middleware**: Apply helmet, rate-limit to `/api` routes

## 2) File Map & Stubs

### Frontend Files

**`frontend/src/lib/authClient.ts`**
```typescript
// TODO: Create Supabase client with persistSession: true, autoRefreshToken: true
// TODO: Export useAuth hook for session management
// TODO: Handle auth state changes
```

**`frontend/src/lib/api.ts`**
```typescript
// TODO: Create apiFetch function that injects Authorization: Bearer <access_token>
// TODO: Handle 401 responses with auth redirect
// TODO: Add request/response interceptors
```

**`frontend/src/components/AuthWidget.tsx`**
```typescript
// TODO: Magic link + Google OAuth buttons
// TODO: Show user email and logout button when authenticated
// TODO: Loading and error states
// TODO: Handle auth callbacks
```

**`frontend/src/components/ProtectedRoute.tsx`**
```typescript
// TODO: Check AUTH_REQUIRED flag
// TODO: Redirect to /login if no session
// TODO: Show loading state during auth check
```

**`frontend/src/pages/LoginPage.tsx`**
```typescript
// TODO: Render AuthWidget component
// TODO: Handle redirect after successful login
```

**Update `frontend/src/hooks/useWebSocket.ts`**
```typescript
// TODO: Call POST /api/ws-token before WS connection
// TODO: Add ws_token to query string
// TODO: Handle 401 responses from ws-token endpoint
```

**Update `frontend/src/lib/utils.ts`**
```typescript
// TODO: Modify createWebSocketUrl to accept ws_token parameter
// TODO: Use PUBLIC_WS_URL and USE_WSS environment variables
```

**Update `frontend/src/App.tsx`**
```typescript
// TODO: Add /login route
// TODO: Wrap protected routes with ProtectedRoute component
// TODO: Import new components
```

### Backend Files

**`backend/src/server/security.ts`**
```typescript
// TODO: Configure helmet middleware
// TODO: Configure CORS with allowlist from CORS_ALLOWED_ORIGINS
// TODO: Configure rate limiting on /api routes
// TODO: Export security middleware stack
```

**`backend/src/auth.ts`**
```typescript
// TODO: Supabase JWKS verification
// TODO: Verify issuer matches https://<REF>.supabase.co/
// TODO: Extract user_id, clinic_id, role from JWT
// TODO: Handle verification errors
```

**`backend/src/routes/wsToken.ts`**
```typescript
// TODO: POST /api/ws-token endpoint
// TODO: Verify Bearer access_token
// TODO: Generate 60s ws_token with user_id, clinic_id, role
// TODO: Sign with WS_JWT_SECRET, aud: "ws"
```

**`backend/src/ws/handshake.ts`**
```typescript
// TODO: Verify ws_token on WS connection
// TODO: Check audience "ws" and expiration
// TODO: Attach user data to socket
// TODO: Close with 4401/4403/4429 as needed
```

**`backend/src/routes/profile.ts`**
```typescript
// TODO: GET /api/profile - return user profile data
// TODO: PATCH /api/profile - update profile fields
// TODO: Validation for display_name, locale, consent flags
// TODO: Handle 400/401/403 responses
```

**Update `backend/src/index.ts`**
```typescript
// TODO: Import and apply security middleware
// TODO: Mount new routes (/api/ws-token, /api/profile)
// TODO: Apply authMiddleware to protected routes
// TODO: Update WS handshake to use handshake.ts
```

**Update `backend/src/middleware/authMiddleware.ts`**
```typescript
// TODO: Remove mock auth bypass (lines 43-52)
// TODO: Use real Supabase verification from auth.ts
// TODO: Handle AUTH_REQUIRED flag
```

## 3) DB & RLS Outline

### New Tables
```sql
-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  locale TEXT CHECK (locale IN ('en-CA', 'fr-CA')) DEFAULT 'fr-CA',
  consent_pipeda BOOLEAN DEFAULT false,
  consent_marketing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memberships table (if multi-clinic needed)
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('doctor', 'admin', 'assistant')) DEFAULT 'doctor',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, clinic_id)
);
```

### RLS Policies
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Memberships: users can view their own memberships
CREATE POLICY "Users can view own memberships" ON memberships
  FOR SELECT USING (auth.uid() = user_id);

-- Sessions: users can access sessions where they have clinic membership
CREATE POLICY "Users can access clinic sessions" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships 
      WHERE user_id = auth.uid() 
      AND clinic_id = sessions.clinic_id 
      AND active = true
    )
  );

-- Similar policies for transcripts, templates, audit_logs
-- Deny by default for all other operations
```

## 4) Validation & Contracts

### API Contracts
```typescript
// GET /api/profile
Response: {
  display_name: string | null,
  locale: 'en-CA' | 'fr-CA',
  consent_pipeda: boolean,
  consent_marketing: boolean
}

// PATCH /api/profile
Request: Partial<{
  display_name: string,
  locale: 'en-CA' | 'fr-CA',
  consent_pipeda: boolean,
  consent_marketing: boolean
}>
Response: Same as GET

// POST /api/ws-token
Request: {} (uses Authorization header)
Response: {
  ws_token: string // JWT with 60s TTL
}
```

### Error Codes
- `400`: Validation errors (invalid locale, missing required fields)
- `401`: No token or invalid token
- `403`: Forbidden (no clinic membership, inactive user)
- `4401`: WS authentication required
- `4403`: WS forbidden (no clinic access)
- `4429`: WS invalid token

## 5) Acceptance Tests

### Feature Flag Tests
- **Flags OFF**: App behavior unchanged
- **AUTH_REQUIRED=ON**: Protected API routes return 401 without Bearer token
- **WS_REQUIRE_AUTH=ON**: WS rejects connections without valid ws_token

### Security Tests
- No tokens or query strings in logs
- Helmet headers present
- Rate limiting active on `/api` routes
- CORS allowlist enforced
- JWT tokens properly validated

### Functional Tests
- Profile PATCH persists and reflects on reload
- WS connections work with valid ws_token
- Auth state persists across page reloads
- Logout clears session and redirects to login

## 6) PR Plan

### PR1: Env & Security Baseline
**Files**:
- `env.example` - Add new environment variables
- `backend/src/config/environment.ts` - Add new env var validation
- `backend/src/server/security.ts` - Create security middleware
- `backend/src/index.ts` - Apply security middleware

### PR2: Backend Auth
**Files**:
- `backend/src/auth.ts` - Supabase JWKS verification
- `backend/src/routes/wsToken.ts` - WS token endpoint
- `backend/src/ws/handshake.ts` - WS authentication
- `backend/src/middleware/authMiddleware.ts` - Remove mock auth
- `backend/src/index.ts` - Apply auth middleware to protected routes

### PR3: Frontend Auth
**Files**:
- `frontend/src/lib/authClient.ts` - Supabase client
- `frontend/src/lib/api.ts` - API client with auth
- `frontend/src/components/AuthWidget.tsx` - Auth UI
- `frontend/src/components/ProtectedRoute.tsx` - Route protection
- `frontend/src/pages/LoginPage.tsx` - Login page
- `frontend/src/hooks/useWebSocket.ts` - WS auth flow
- `frontend/src/lib/utils.ts` - WS URL builder
- `frontend/src/App.tsx` - Add routes and protection

### PR4: Profile/Settings + DB
**Files**:
- `backend/src/routes/profile.ts` - Profile API
- Database migration files
- RLS policy SQL files
- Update existing components to use profile data

## 7) Blockers/Unknowns

### File Location Verification
- **WS block location**: Verify current range in `backend/src/index.ts` (audit showed 430-606)
- **Route paths**: Confirm exact API paths in `backend/src/index.ts` match audit
- **Environment config**: Check if `backend/src/config/environment.ts` needs updates for new vars

### Integration Points
- **Supabase project setup**: Need actual Supabase project URL and keys
- **Database migration**: Need to run Drizzle migrations for new tables
- **RLS policies**: Need to apply policies in Supabase dashboard
- **CORS origins**: Need to confirm allowed origins for production

### Testing Dependencies
- **Feature flags**: Need to test with both ON/OFF states
- **WS testing**: Need to verify WebSocket authentication flow
- **Token validation**: Need to test JWT verification with real Supabase tokens
