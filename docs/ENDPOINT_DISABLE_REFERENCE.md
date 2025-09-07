# Endpoint Disable Reference

## Quick Reference: Endpoints That Can Be Temporarily Disabled

### 🔒 Currently Protected Endpoints (Will Become Public with AUTH_REQUIRED=false)

#### Template Management (All Public in Minimal Auth)
- `GET /api/templates` - List templates
- `GET /api/templates/stats` - Template statistics  
- `GET /api/templates/:section` - Templates by section
- `GET /api/templates/:id/versions` - Template versions
- `GET /api/templates/analytics` - Template analytics
- `GET /api/templates/export` - Export templates

#### Template CRUD (All Public in Minimal Auth)
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/format` - AI formatting
- `POST /api/templates/search` - Advanced search
- `POST /api/templates/:id/usage` - Track usage

#### Template Bulk Operations (All Public in Minimal Auth)
- `POST /api/templates/bulk/status` - Bulk status updates
- `POST /api/templates/bulk/delete` - Bulk deletion
- `POST /api/templates/import` - Import templates

#### Formatting Services (All Public in Minimal Auth)
- `POST /api/format/mode1` - Mode 1 formatting
- `POST /api/format/mode2` - Mode 2 formatting

#### Profile Management (All Public in Minimal Auth)
- `GET /api/profile` - Get profile
- `POST /api/profile` - Create profile

#### WebSocket Auth (Disabled with WS_REQUIRE_AUTH=false)
- `POST /api/auth/ws-token` - WebSocket token exchange

### 🔓 Always Public Endpoints (No Changes Needed)
- `GET /health` - Health check
- `GET /api/config` - Server configuration
- `GET /api/db/ping` - Database ping

## Environment Variable Control

### Single Variable to Disable All Auth
```bash
AUTH_REQUIRED=false
```
**Effect**: All protected endpoints become public, no Bearer token required

### WebSocket Auth Control
```bash
WS_REQUIRE_AUTH=false
```
**Effect**: WebSocket connections don't require `ws_token` parameter

## Frontend Route Protection Status

### Currently Protected (Will Be Bypassed)
- `/templates` - Template management
- `/dictation` - Dictation/transcription

### Currently Unprotected (No Changes)
- `/dashboard` - Main dashboard
- `/case/new` - New case creation
- `/settings` - User settings
- `/profile` - User profile

### Always Public (No Changes)
- `/login` - Login page
- `/auth/callback` - OAuth callback
- `/unauthorized` - Unauthorized page
- `/select-clinic` - Clinic selection
- `/legacy` - Legacy interface

## Testing Impact

### What Will Work Without Auth
✅ Template CRUD operations
✅ AI formatting services
✅ Transcription pipeline
✅ WebSocket connections
✅ Database operations
✅ All frontend pages

### What Won't Be Available
❌ User-specific data isolation
❌ Audit logging with user context
❌ Role-based access control
❌ Profile management
❌ Secure WebSocket connections

## Quick Setup for Minimal Auth

1. **Set Environment Variables**:
   ```bash
   AUTH_REQUIRED=false
   WS_REQUIRE_AUTH=false
   ```

2. **Restart Backend**:
   ```bash
   npm run dev
   ```

3. **Test Endpoints**:
   ```bash
   # Should work without Bearer token
   curl -X GET http://localhost:3001/api/templates
   curl -X POST http://localhost:3001/api/templates/format \
     -H "Content-Type: application/json" \
     -d '{"content":"test","section":"7","language":"fr"}'
   ```

4. **Test Frontend**:
   - Navigate to any page without login
   - All functionality should work

## Re-enabling Auth

1. **Set Environment Variables**:
   ```bash
   AUTH_REQUIRED=true
   WS_REQUIRE_AUTH=true
   ```

2. **Restart Backend**

3. **Test Authentication**:
   - Verify protected endpoints require Bearer tokens
   - Test login flow
   - Verify WebSocket requires `ws_token`

## Summary

**Minimal Code Changes Required**: The current implementation already supports feature flags, so disabling auth requires only environment variable changes.

**All Template/Formatting Endpoints**: Will become public and accessible for testing without authentication.

**WebSocket Functionality**: Will work without authentication tokens for development and testing.

**Easy Reversal**: Simply change environment variables back to re-enable full authentication.
