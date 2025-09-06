# Authentication Configuration Audit

## Overview
This document provides a comprehensive overview of the current authentication and security configuration in the CentomoMD application, including which endpoints and pages require authentication.

## Current Authentication Architecture

### Backend Authentication
- **Primary Auth System**: Supabase JWT-based authentication
- **Middleware**: `authMiddleware` from `backend/src/auth.ts`
- **Token Verification**: JWT verification with Supabase JWKS
- **Feature Flags**: `AUTH_REQUIRED` and `WS_REQUIRE_AUTH` environment variables

### Frontend Authentication
- **Route Protection**: `ProtectedRoute` component in `frontend/src/components/ProtectedRoute.tsx`
- **Auth Client**: Supabase client integration
- **Config-Driven**: Routes check server config before applying protection

## Protected Backend Endpoints

### 🔒 FULLY PROTECTED (Require Auth)
All template-related endpoints in `backend/src/index.ts`:

#### Template Management
- `GET /api/templates` - List all templates
- `GET /api/templates/stats` - Template statistics
- `GET /api/templates/:section` - Templates by section (7, 8, 11)
- `GET /api/templates/:id/versions` - Template versions
- `GET /api/templates/analytics` - Template analytics
- `GET /api/templates/export` - Export templates

#### Template CRUD Operations
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/format` - AI formatting service
- `POST /api/templates/search` - Advanced search
- `POST /api/templates/:id/usage` - Track template usage

#### Template Bulk Operations
- `POST /api/templates/bulk/status` - Bulk status updates
- `POST /api/templates/bulk/delete` - Bulk deletion
- `POST /api/templates/import` - Import templates

#### Formatting Services
- `POST /api/format/mode1` - Mode 1 formatting
- `POST /api/format/mode2` - Mode 2 formatting (Smart Dictation)

#### Profile Management
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Create user profile

#### WebSocket Authentication
- `POST /api/auth/ws-token` - Get WebSocket token (when `WS_REQUIRE_AUTH=true`)

### 🔓 PUBLIC ENDPOINTS (No Auth Required)
- `GET /health` - Health check
- `GET /api/config` - Server configuration flags
- `GET /api/db/ping` - Database connectivity test

## Protected Frontend Routes

### 🔒 FULLY PROTECTED (Wrapped with ProtectedRoute)
- `/templates` - Template management page
- `/dictation` - Dictation/transcription page

### 🔓 CURRENTLY UNPROTECTED (TODO: Add Protection)
- `/dashboard` - Main dashboard
- `/case/new` - New case creation
- `/settings` - User settings
- `/profile` - User profile management

### 🔓 AUTH UTILITY ROUTES (Public)
- `/login` - Login page
- `/auth/callback` - OAuth callback
- `/unauthorized` - Unauthorized access page
- `/select-clinic` - Clinic selection
- `/legacy` - Legacy app interface

## WebSocket Authentication

### Current Configuration
- **Feature Flag**: `WS_REQUIRE_AUTH` environment variable
- **Token Exchange**: `POST /api/auth/ws-token` endpoint
- **Token Type**: Short-lived JWT (60 seconds)
- **Connection**: `ws://localhost:3001/transcription?ws_token=<jwt>`

### Authentication Flow
1. Frontend calls `/api/auth/ws-token` with Bearer token
2. Backend returns `ws_token` with 60s expiration
3. Frontend connects to WebSocket with `ws_token` parameter
4. WebSocket server verifies token and attaches user context

## Environment Variables

### Required for Full Auth
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# WebSocket Configuration
WS_JWT_SECRET=your_ws_jwt_secret
PUBLIC_WS_URL=ws://localhost:3001
USE_WSS=false

# Feature Flags
AUTH_REQUIRED=true
WS_REQUIRE_AUTH=true

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Minimal Auth Configuration
```bash
# Disable authentication
AUTH_REQUIRED=false
WS_REQUIRE_AUTH=false

# Keep Supabase config for future use
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

## Security Features

### Audit Logging
- All protected endpoints log authentication events
- User context (ID, email, role) tracked in logs
- Failed authentication attempts logged
- Template operations audited

### Role-Based Access Control
- `requireRole()` middleware for role-based authorization
- `requireClinicAccess()` middleware for clinic-based access
- User roles: `doctor`, `physician`, `admin`, `inactive`

### Token Security
- JWT tokens with expiration
- Short-lived WebSocket tokens (60s)
- Bearer token authentication
- Token validation with Supabase JWKS

## Recommendations for Minimal Auth Branch

### 1. Environment Configuration
Set these environment variables to disable auth:
```bash
AUTH_REQUIRED=false
WS_REQUIRE_AUTH=false
```

### 2. Backend Changes
- All template endpoints will become public (authMiddleware will be bypassed)
- Profile endpoints will become public
- WebSocket connections will not require authentication
- Formatting services will be accessible without auth

### 3. Frontend Changes
- ProtectedRoute components will allow access regardless of auth state
- All pages will be accessible without login
- Auth-related UI elements can be hidden or disabled

### 4. Testing Considerations
- Template CRUD operations can be tested without user context
- Formatting services can be validated without authentication
- WebSocket transcription can be tested without auth flow
- Database operations will work without user profiles

### 5. Re-enabling Auth Later
When ready to restore authentication:
1. Set `AUTH_REQUIRED=true` and `WS_REQUIRE_AUTH=true`
2. Ensure Supabase configuration is complete
3. Test authentication flow end-to-end
4. Verify all protected endpoints work with valid tokens
5. Test WebSocket authentication flow

## Files to Monitor for Auth Changes

### Backend
- `backend/src/auth.ts` - Main auth middleware
- `backend/src/index.ts` - Protected endpoints
- `backend/src/routes/profile.ts` - Profile routes
- `backend/src/routes/auth.ts` - WebSocket token exchange
- `backend/src/config/env.ts` - Environment configuration

### Frontend
- `frontend/src/components/ProtectedRoute.tsx` - Route protection
- `frontend/src/App.tsx` - Route definitions
- `frontend/src/lib/authClient.ts` - Auth client configuration

### Configuration
- `.env` - Environment variables
- `env.example` - Environment template

## Security Notes

⚠️ **Important**: When running with minimal auth:
- All template data will be publicly accessible
- No user context will be available for audit logging
- WebSocket connections will be unauthenticated
- Profile management will be disabled

✅ **Safe for Development**: The minimal auth configuration is safe for development and testing workflows, but should not be used in production environments.
