# PR5 — Route Guards (Incremental)

## Goal
Start protecting frontend routes incrementally. Wrap only `/dictation` and `/templates` first, then expand after verification.

## Changes Made

### 1. `frontend/src/components/ProtectedRoute.tsx` - ENHANCED
**Purpose**: Enhanced route protection with role-based and clinic-based access

**Key Enhancements**:
- Added `requiredRoles` prop for role-based access control
- Added `requiredClinicAccess` prop for clinic-based access
- Improved loading state UX with better styling
- Enhanced error handling for config fetching
- Added support for unauthorized and clinic selection redirects

**TODOs**:
- [ ] Create `/unauthorized` page component
- [ ] Create `/select-clinic` page component
- [ ] Add role-based route protection examples
- [ ] Add clinic access validation
- [ ] Add better error messages for different failure scenarios
- [ ] Add retry logic for config fetching
- [ ] Add loading state timeouts

### 2. `frontend/src/App.tsx` - MODIFIED
**Purpose**: Apply route protection incrementally

**Changes**:
- Import `ProtectedRoute` component
- Wrap `/dictation` route with `ProtectedRoute`
- Wrap `/templates` route with `ProtectedRoute`
- Leave other routes unprotected for now
- Added TODO comments for future protection

**TODOs**:
- [ ] Wrap `/dashboard` route after verification
- [ ] Wrap `/settings` route after verification
- [ ] Wrap `/profile` route after verification
- [ ] Add role-based protection to specific routes
- [ ] Add clinic-based protection where needed

## Manual Test Checklist

### ✅ Smoke Test 1: AUTH_REQUIRED=false (Default)
- [ ] Start backend with `AUTH_REQUIRED=false`
- [ ] Start frontend
- [ ] Navigate to `/dictation` - should load normally
- [ ] Navigate to `/templates` - should load normally
- [ ] Navigate to `/dashboard` - should load normally (unprotected)
- [ ] Navigate to `/settings` - should load normally (unprotected)

### ✅ Smoke Test 2: AUTH_REQUIRED=true (Protected Routes)
- [ ] Set `AUTH_REQUIRED=true` in backend environment
- [ ] Restart backend
- [ ] Navigate to `/dictation` when logged out - should redirect to `/login`
- [ ] Navigate to `/templates` when logged out - should redirect to `/login`
- [ ] Navigate to `/dashboard` when logged out - should load normally (unprotected)
- [ ] Navigate to `/settings` when logged out - should load normally (unprotected)

### ✅ Smoke Test 3: Authenticated User Flow
- [ ] Login via frontend
- [ ] Navigate to `/dictation` - should load with user context
- [ ] Navigate to `/templates` - should load with user context
- [ ] Verify WebSocket connection works (if WS_REQUIRE_AUTH=true)
- [ ] Test template formatting with authenticated user

### ✅ Smoke Test 4: Return URL Functionality
- [ ] Try to access `/dictation` when logged out
- [ ] Should redirect to `/login` with return URL
- [ ] Login successfully
- [ ] Should redirect back to `/dictation`
- [ ] Verify user context is available

### ✅ Smoke Test 5: Config Fetching Error Handling
- [ ] Disconnect network temporarily
- [ ] Try to access protected route
- [ ] Should show loading state then fallback to defaults
- [ ] Reconnect network and refresh
- [ ] Should fetch config and apply protection

### ✅ Smoke Test 6: Role-Based Access (Future)
- [ ] Test with user having insufficient role
- [ ] Should redirect to unauthorized page
- [ ] Test with admin user
- [ ] Should allow access to all routes

### ✅ Smoke Test 7: Clinic Access (Future)
- [ ] Test with user without clinic assignment
- [ ] Should redirect to clinic selection
- [ ] Test with user having clinic assignment
- [ ] Should allow access to clinic-specific routes

## Rollback Plan
1. Remove `ProtectedRoute` wrapper from routes in `App.tsx`
2. Or set `AUTH_REQUIRED='false'` in backend
3. No database changes to revert

## Next Steps (PR6)
- Profile API implementation
- Expand protected routes
- Add role-based access control
- Add clinic-based access control
