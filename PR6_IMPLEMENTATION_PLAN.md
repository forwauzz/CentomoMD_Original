# PR6 — Profile API + Wire UI (No DB Schema Changes Yet)

## Goal
Land APIs and FE wiring against in-memory or existing users table fields first; migrate later.

## Changes Made

### 1. `backend/src/routes/profile.ts` - NEW
**Purpose**: Profile API endpoints with temporary in-memory storage

**Key Features**:
- ✅ GET `/api/profile` returns profile data from temporary store
- ✅ PATCH `/api/profile` validates and persists changes
- ✅ Conditional auth middleware (only when `AUTH_REQUIRED=true`)
- ✅ Zod validation for profile updates
- ✅ Temporary in-memory storage with test data
- ✅ Error handling and proper HTTP status codes

**TODOs**:
- [ ] Replace temporary storage with actual database in PR7
- [ ] Extract user_id from auth middleware properly
- [ ] Add audit logging for profile changes
- [ ] Add rate limiting for profile updates
- [ ] Add profile data encryption for sensitive fields
- [ ] Add profile picture upload support
- [ ] Add profile export functionality

### 2. `frontend/src/pages/ProfilePage.tsx` - ENHANCED
**Purpose**: Profile management UI with API integration

**Key Features**:
- ✅ GET/PATCH API integration with error handling
- ✅ Toast notifications for success/error states
- ✅ Inline validation errors
- ✅ Form state management with change tracking
- ✅ Loading states and proper UX
- ✅ Privacy settings (PIPEDA, marketing consent)
- ✅ Language/locale selection

**TODOs**:
- [ ] Add profile picture upload
- [ ] Add password change functionality
- [ ] Add two-factor authentication setup
- [ ] Add account deletion functionality
- [ ] Add profile data export
- [ ] Add notification preferences
- [ ] Add accessibility improvements
- [ ] Add keyboard navigation support

## Manual Test Checklist

### ✅ Smoke Test 1: AUTH_REQUIRED=false (Default)
- [ ] Start backend with `AUTH_REQUIRED=false`
- [ ] Start frontend
- [ ] Navigate to `/profile` - should load normally
- [ ] Check that profile data loads from temporary store
- [ ] Verify display name shows "Dr. John Smith" (test data)
- [ ] Verify language shows "English (Canada)"

### ✅ Smoke Test 2: Profile Update Flow
- [ ] Change display name to "Dr. Jane Doe"
- [ ] Change language to "Français (Canada)"
- [ ] Toggle PIPEDA consent to true
- [ ] Toggle marketing consent to true
- [ ] Click "Save Changes"
- [ ] Verify success toast appears
- [ ] Reload page - verify changes persist

### ✅ Smoke Test 3: Validation Testing
- [ ] Try to save empty display name - should show error
- [ ] Try to save display name > 100 chars - should show error
- [ ] Verify validation errors appear inline
- [ ] Fix errors and save - should work

### ✅ Smoke Test 4: AUTH_REQUIRED=true (Protected)
- [ ] Set `AUTH_REQUIRED=true` in backend environment
- [ ] Restart backend
- [ ] Navigate to `/profile` when logged out - should redirect to `/login`
- [ ] Login and navigate to `/profile` - should load with user context
- [ ] Test profile updates with authenticated user

### ✅ Smoke Test 5: Error Handling
- [ ] Disconnect network temporarily
- [ ] Try to load profile - should show error toast
- [ ] Try to save profile - should show error toast
- [ ] Reconnect network and retry - should work

### ✅ Smoke Test 6: API Endpoint Testing
- [ ] Test GET `/api/profile` directly with curl/Postman
- [ ] Verify returns proper JSON structure
- [ ] Test PATCH `/api/profile` with valid data
- [ ] Test PATCH `/api/profile` with invalid data
- [ ] Verify proper HTTP status codes

### ✅ Smoke Test 7: No Changes Detection
- [ ] Load profile page
- [ ] Don't make any changes
- [ ] Click "Save Changes"
- [ ] Should show "No changes to save" toast

## Rollback Plan
1. Comment out profile routes in backend `index.ts`
2. Set `AUTH_REQUIRED=false` in backend environment
3. Frontend will show fallback data or error states
4. No database changes to revert

## Next Steps (PR7)
- Database migrations and RLS implementation
- Replace temporary storage with actual database
- Add proper user_id extraction from auth middleware
- Add audit logging for profile changes

## File Structure
```
backend/src/routes/profile.ts          # Profile API endpoints
frontend/src/pages/ProfilePage.tsx     # Profile management UI
```

## API Endpoints
- `GET /api/profile` - Get current user's profile
- `PATCH /api/profile` - Update current user's profile

## Data Types
```typescript
interface ProfileData {
  display_name: string;
  locale: 'en-CA' | 'fr-CA';
  consent_pipeda: boolean;
  consent_marketing: boolean;
}

interface ProfileUpdate {
  display_name?: string;
  locale?: 'en-CA' | 'fr-CA';
  consent_pipeda?: boolean;
  consent_marketing?: boolean;
}
```
