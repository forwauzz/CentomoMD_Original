# PR4 — Backend HTTP Auth Middleware (Scoped)

## Goal
Apply auth to a tiny surface first, then expand. Protect only the riskiest endpoints initially.

## Changes Made

### 1. `backend/src/auth.ts` - NEW FILE
**Purpose**: Centralized auth middleware with JWT verification

**Key Components**:
- `UserContext` interface for typed user data
- `verifySupabaseJWT()` function for token verification
- `authMiddleware` for HTTP endpoint protection
- `optionalAuthMiddleware` for endpoints that work with/without auth
- `requireRole()` and `requireClinicAccess()` for authorization

**TODOs**:
- [ ] Implement proper JWKS verification (remove mock)
- [ ] Add proper error handling for network failures
- [ ] Add token refresh logic
- [ ] Add rate limiting for auth attempts
- [ ] Add audit logging for auth events

### 2. `backend/src/index.ts` - MODIFIED
**Purpose**: Apply auth middleware to high-risk endpoints

**Changes**:
- Import `authMiddleware` from `./auth.js`
- Apply conditional auth to `/api/templates/format` endpoint
- Leave list endpoints open temporarily

**TODOs**:
- [ ] Add auth to `/api/templates/export` endpoint
- [ ] Add auth to `/api/templates/import` endpoint  
- [ ] Add auth to other high-risk endpoints
- [ ] Remove dev bypass in `authMiddleware.ts`

## Manual Test Checklist

### ✅ Smoke Test 1: AUTH_REQUIRED=false (Default)
- [ ] Start server with `AUTH_REQUIRED=false`
- [ ] `GET /api/templates` returns 200 (open endpoint)
- [ ] `POST /api/templates/format` returns 200 without Bearer token
- [ ] App behavior unchanged from current state

### ✅ Smoke Test 2: AUTH_REQUIRED=true (Protected)
- [ ] Set `AUTH_REQUIRED=true` in environment
- [ ] Restart server
- [ ] `GET /api/templates` returns 200 (still open)
- [ ] `POST /api/templates/format` without Bearer returns 401
- [ ] `POST /api/templates/format` with valid Bearer returns 200

### ✅ Smoke Test 3: Invalid Token Handling
- [ ] `POST /api/templates/format` with `Authorization: Bearer invalid` returns 401
- [ ] `POST /api/templates/format` with `Authorization: Bearer expired-token` returns 401
- [ ] `POST /api/templates/format` with malformed header returns 401

### ✅ Smoke Test 4: Valid Token Flow
- [ ] Login via frontend to get valid token
- [ ] `POST /api/templates/format` with valid Bearer token
- [ ] Verify request.user is populated with user context
- [ ] Verify response contains formatted content

### ✅ Smoke Test 5: Error Handling
- [ ] Test with network failure to JWKS endpoint
- [ ] Test with malformed JWT tokens
- [ ] Test with missing required claims
- [ ] Verify graceful error responses

## Rollback Plan
1. Set `AUTH_REQUIRED='false'` in environment
2. Or temporarily remove middleware from specific routes
3. No database changes to revert

## Next Steps (PR5)
- Frontend route guards
- Expand protected endpoints
- Add role-based access control
