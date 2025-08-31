# PR4-PR5 File Stubs Summary

## Overview
This document contains the exact file stubs for PR4 (Backend HTTP Auth Middleware) and PR5 (Route Guards) with TODOs, types, and manual test checklists. No heavy implementation yet - just the structure and types.

## PR4 — Backend HTTP Auth Middleware (Scoped)

### Files Created/Modified

#### 1. `backend/src/auth.ts` - NEW FILE
```typescript
// Key interfaces and types
export interface UserContext {
  user_id: string;
  clinic_id?: string;
  role: string;
  email: string;
  aud: string;
  exp: number;
  iat: number;
}

export interface AuthMiddleware {
  (req: Request, res: Response, next: NextFunction): Promise<void>;
}

// Main functions
export const verifySupabaseJWT = async (token: string): Promise<UserContext | null>
export const authMiddleware: AuthMiddleware
export const optionalAuthMiddleware: AuthMiddleware
export const requireRole = (allowedRoles: string[])
export const requireClinicAccess = req: Request, res: Response, next: NextFunction
```

**TODOs**:
- [ ] Implement proper JWKS verification (remove mock)
- [ ] Add proper error handling for network failures
- [ ] Add token refresh logic
- [ ] Add rate limiting for auth attempts
- [ ] Add audit logging for auth events
- [ ] Add proper TypeScript types for request.user
- [ ] Add JWT token validation utilities
- [ ] Add clinic access validation logic

#### 2. `backend/src/index.ts` - MODIFIED
```typescript
// Added import
import { authMiddleware } from './auth.js';

// Modified endpoint with conditional auth
app.post('/api/templates/format', 
  env.AUTH_REQUIRED ? authMiddleware : (req, res, next) => next(),
  (req, res) => { /* existing logic */ }
);
```

**TODOs**:
- [ ] Add auth to `/api/templates/export` endpoint
- [ ] Add auth to `/api/templates/import` endpoint
- [ ] Add auth to other high-risk endpoints
- [ ] Remove dev bypass in `authMiddleware.ts`
- [ ] Add proper error handling for auth failures
- [ ] Add logging for auth decisions

### PR4 Manual Test Checklist

#### ✅ Smoke Test 1: AUTH_REQUIRED=false (Default)
- [ ] Start server with `AUTH_REQUIRED=false`
- [ ] `GET /api/templates` returns 200 (open endpoint)
- [ ] `POST /api/templates/format` returns 200 without Bearer token
- [ ] App behavior unchanged from current state

#### ✅ Smoke Test 2: AUTH_REQUIRED=true (Protected)
- [ ] Set `AUTH_REQUIRED=true` in environment
- [ ] Restart server
- [ ] `GET /api/templates` returns 200 (still open)
- [ ] `POST /api/templates/format` without Bearer returns 401
- [ ] `POST /api/templates/format` with valid Bearer returns 200

#### ✅ Smoke Test 3: Invalid Token Handling
- [ ] `POST /api/templates/format` with `Authorization: Bearer invalid` returns 401
- [ ] `POST /api/templates/format` with `Authorization: Bearer expired-token` returns 401
- [ ] `POST /api/templates/format` with malformed header returns 401

#### ✅ Smoke Test 4: Valid Token Flow
- [ ] Login via frontend to get valid token
- [ ] `POST /api/templates/format` with valid Bearer token
- [ ] Verify request.user is populated with user context
- [ ] Verify response contains formatted content

#### ✅ Smoke Test 5: Error Handling
- [ ] Test with network failure to JWKS endpoint
- [ ] Test with malformed JWT tokens
- [ ] Test with missing required claims
- [ ] Verify graceful error responses

---

## PR5 — Route Guards (Incremental)

### Files Created/Modified

#### 1. `frontend/src/components/ProtectedRoute.tsx` - ENHANCED
```typescript
// Enhanced interface
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredClinicAccess?: boolean;
}

// Enhanced component with role and clinic access
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles,
  requiredClinicAccess 
}) => {
  // Enhanced logic with role-based and clinic-based access
}
```

**TODOs**:
- [ ] Create `/unauthorized` page component
- [ ] Create `/select-clinic` page component
- [ ] Add role-based route protection examples
- [ ] Add clinic access validation
- [ ] Add better error messages for different failure scenarios
- [ ] Add retry logic for config fetching
- [ ] Add loading state timeouts
- [ ] Add proper TypeScript types for user roles
- [ ] Add clinic selection flow

#### 2. `frontend/src/App.tsx` - MODIFIED
```typescript
// Added import
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Protected routes
<Route path="/templates" element={
  <ProtectedRoute>
    <TemplateManagement />
  </ProtectedRoute>
} />

<Route path="/dictation" element={
  <ProtectedRoute>
    <DictationPage />
  </ProtectedRoute>
} />
```

**TODOs**:
- [ ] Wrap `/dashboard` route after verification
- [ ] Wrap `/settings` route after verification
- [ ] Wrap `/profile` route after verification
- [ ] Add role-based protection to specific routes
- [ ] Add clinic-based protection where needed
- [ ] Add proper error boundaries
- [ ] Add loading states for route transitions

### PR5 Manual Test Checklist

#### ✅ Smoke Test 1: AUTH_REQUIRED=false (Default)
- [ ] Start backend with `AUTH_REQUIRED=false`
- [ ] Start frontend
- [ ] Navigate to `/dictation` - should load normally
- [ ] Navigate to `/templates` - should load normally
- [ ] Navigate to `/dashboard` - should load normally (unprotected)
- [ ] Navigate to `/settings` - should load normally (unprotected)

#### ✅ Smoke Test 2: AUTH_REQUIRED=true (Protected Routes)
- [ ] Set `AUTH_REQUIRED=true` in backend environment
- [ ] Restart backend
- [ ] Navigate to `/dictation` when logged out - should redirect to `/login`
- [ ] Navigate to `/templates` when logged out - should redirect to `/login`
- [ ] Navigate to `/dashboard` when logged out - should load normally (unprotected)
- [ ] Navigate to `/settings` when logged out - should load normally (unprotected)

#### ✅ Smoke Test 3: Authenticated User Flow
- [ ] Login via frontend
- [ ] Navigate to `/dictation` - should load with user context
- [ ] Navigate to `/templates` - should load with user context
- [ ] Verify WebSocket connection works (if WS_REQUIRE_AUTH=true)
- [ ] Test template formatting with authenticated user

#### ✅ Smoke Test 4: Return URL Functionality
- [ ] Try to access `/dictation` when logged out
- [ ] Should redirect to `/login` with return URL
- [ ] Login successfully
- [ ] Should redirect back to `/dictation`
- [ ] Verify user context is available

#### ✅ Smoke Test 5: Config Fetching Error Handling
- [ ] Disconnect network temporarily
- [ ] Try to access protected route
- [ ] Should show loading state then fallback to defaults
- [ ] Reconnect network and refresh
- [ ] Should fetch config and apply protection

#### ✅ Smoke Test 6: Role-Based Access (Future)
- [ ] Test with user having insufficient role
- [ ] Should redirect to unauthorized page
- [ ] Test with admin user
- [ ] Should allow access to all routes

#### ✅ Smoke Test 7: Clinic Access (Future)
- [ ] Test with user without clinic assignment
- [ ] Should redirect to clinic selection
- [ ] Test with user having clinic assignment
- [ ] Should allow access to clinic-specific routes

---

## Implementation Notes

### Safety Features
- All flags default to `false` for safe rollout
- No behavior changes until flags are flipped
- Easy rollback by setting flags back to `false`
- Incremental protection to minimize risk

### Type Safety
- All interfaces properly typed
- Request.user properly extended
- Config types match backend response
- Role and clinic access properly typed

### Error Handling
- Graceful fallbacks for config fetching
- Proper error responses for auth failures
- Loading states for better UX
- Network failure handling

### Testing Strategy
- Manual smoke tests for each scenario
- Backend and frontend tested independently
- Integration tests for full flow
- Error condition testing

## Next Steps
1. Implement JWKS verification in `auth.ts`
2. Create unauthorized and clinic selection pages
3. Add role-based access control
4. Expand protected routes incrementally
5. Add comprehensive error handling
6. Add audit logging for auth events
