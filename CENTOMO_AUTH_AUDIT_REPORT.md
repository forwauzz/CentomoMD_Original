# CentomoMD Auth Audit Report
*Pre-Supabase Auth Implementation*

## A) Runtime & Boundaries

### Frontend Framework & State Management
- **Framework**: React 18.2.0 with TypeScript (`frontend/package.json:18`)
- **Router**: React Router DOM 6.20.1 (`frontend/package.json:20`)
- **State Management**: Zustand 4.4.7 (`frontend/package.json:25`)
- **Environment Variables**: Vite handles env vars, no explicit env file reading found in frontend

### Backend Entrypoints
- **Express Server**: `backend/src/index.ts:1-606` - Main entrypoint with all API routes
- **WebSocket Server**: `backend/src/index.ts:430-606` - WS server created on same HTTP server
- **WS Handshake**: `backend/src/index.ts:435-606` - Connection handling with session management

### Current Auth Implementation
- **bcrypt**: Referenced in env.example but not used in code (`env.example:50`)
- **express-session**: Not found in codebase
- **Custom JWT**: JWT_SECRET configured but not implemented (`env.example:48`, `backend/src/config/environment.ts:45`)
- **Supabase Client**: Already imported but using mock auth (`backend/src/middleware/authMiddleware.ts:1-336`)

## B) Routes & Guards

### Frontend Routes (All PUBLIC - No Guards Found)
- `/` → `/dashboard` (`frontend/src/App.tsx:18`)
- `/dashboard` → DashboardPage (`frontend/src/App.tsx:21`)
- `/case/new` → NewCasePage (`frontend/src/App.tsx:24`)
- `/templates` → TemplateManagement (`frontend/src/App.tsx:27`)
- `/dictation` → DictationPage (`frontend/src/App.tsx:30`)
- `/settings` → SettingsPage (`frontend/src/App.tsx:33`)
- `/profile` → ProfilePage (`frontend/src/App.tsx:36`)

### Backend API Routes (All PUBLIC - No Auth Middleware Applied)
- `GET /health` (`backend/src/index.ts:25`)
- `GET /api/templates` (`backend/src/index.ts:28`)
- `GET /api/templates/stats` (`backend/src/index.ts:45`)
- `POST /api/templates/format` (`backend/src/index.ts:55`)
- `POST /api/templates` (`backend/src/index.ts:85`)
- `PUT /api/templates/:id` (`backend/src/index.ts:125`)
- `DELETE /api/templates/:id` (`backend/src/index.ts:165`)
- `GET /api/templates/:id/versions` (`backend/src/index.ts:185`)
- `GET /api/templates/analytics` (`backend/src/index.ts:195`)
- `GET /api/templates/:section` (`backend/src/index.ts:205`)
- `POST /api/templates/:id/usage` (`backend/src/index.ts:235`)
- `POST /api/templates/search` (`backend/src/index.ts:255`)
- `GET /api/templates/export` (`backend/src/index.ts:275`)
- `POST /api/templates/import` (`backend/src/index.ts:285`)
- `POST /api/templates/bulk/status` (`backend/src/index.ts:305`)
- `POST /api/templates/bulk/delete` (`backend/src/index.ts:325`)

### Route Guards/HOCs
- **None found** - No authentication guards or HOCs implemented

## C) Dictation Pipeline

### WebSocket Client Connection
- **Connection**: `frontend/src/hooks/useWebSocket.ts:1-165`
- **URL Creation**: `frontend/src/lib/utils.ts:50-55` - Creates WS URL with backend port 3001
- **No Token Appending**: WebSocket URL does not include authentication tokens

### WebSocket Server Message Handling
- **Server**: `backend/src/index.ts:430-606`
- **Message Processing**: `backend/src/index.ts:440-520` - Handles start_transcription, audio chunks, voice commands
- **No Auth Check**: WebSocket connections are not authenticated

### Query String Logging
- **Unknown** - No explicit logging of WebSocket query strings found

## D) Settings/Profile

### Settings Component
- **File**: `frontend/src/pages/SettingsPage.tsx:1-372`
- **Props/State**: Local state for settings object with timezone, compliance flags, dictation defaults
- **API Calls**: None implemented - all TODO comments (`frontend/src/pages/SettingsPage.tsx:65, 85, 105`)

### Profile Component
- **File**: `frontend/src/pages/ProfilePage.tsx:1-391`
- **Props/State**: Local state for profile data and password form
- **API Calls**: None implemented - all TODO comments (`frontend/src/pages/ProfilePage.tsx:65, 95`)

### Expected API Endpoints (Not Implemented)
- **Settings**: No endpoints found
- **Profile**: No endpoints found
- **Types**: No specific types defined for settings/profile API calls

### Drizzle Models
- **Users Table**: `backend/src/database/schema.ts:5-13` - id, email, name, role, clinic_id, timestamps
- **No Settings/Profile Tables**: Only users table exists, no separate settings or profile tables

## E) Data Layer

### Drizzle Schemas Present
- **users**: id, email, name, role, clinic_id, timestamps (`backend/src/database/schema.ts:5-13`)
- **sessions**: id, user_id, patient_id, consent_verified, status, mode, current_section, timestamps (`backend/src/database/schema.ts:15-26`)
- **transcripts**: id, session_id, section, content, is_final, confidence_score, language_detected, timestamps (`backend/src/database/schema.ts:28-38`)
- **templates**: id, section, name, description, content, language, version, is_active, voice_commands, timestamps (`backend/src/database/schema.ts:40-52`)
- **audit_logs**: id, user_id, session_id, action, resource_type, resource_id, metadata, ip_address, user_agent, timestamp (`backend/src/database/schema.ts:54-65`)
- **clinics**: id, name, address, phone, email, timestamps (`backend/src/database/schema.ts:67-75`)
- **voice_command_mappings**: id, template_id, trigger, action, parameters, is_active, timestamps (`backend/src/database/schema.ts:77-86`)
- **export_history**: id, session_id, user_id, format, fidelity, sections, file_path, file_size_bytes, created_at (`backend/src/database/schema.ts:88-98`)

### RLS Policies
- **None found** - No RLS policies in repo or SQL files
- **Mentioned in docs**: README.md references RLS but no actual policies (`README.md:29, 260`)

## F) Env & Flags

### Environment Variables Referenced
- **SUPABASE_URL**: `env.example:36`, `backend/src/config/environment.ts:36`
- **SUPABASE_ANON_KEY**: `env.example:37`, `backend/src/config/environment.ts:37`
- **SUPABASE_SERVICE_ROLE_KEY**: `env.example:38`, `backend/src/config/environment.ts:38`
- **SUPABASE_JWT_SECRET**: `env.example:39`
- **JWT_SECRET**: `env.example:48`, `backend/src/config/environment.ts:45`
- **BCRYPT_ROUNDS**: `env.example:50`
- **CORS_ALLOWED_ORIGINS**: `env.example:53`
- **AUTH_REQUIRED**: Not found
- **WS_REQUIRE_AUTH**: Not found
- **USE_WSS**: Not found

### Local Storage Usage
- **localStorage utilities**: `frontend/src/lib/utils.ts:270-295` - setLocalStorage, getLocalStorage, removeLocalStorage
- **Usage**: Language preference persistence mentioned in docs (`DASHBOARD_IMPLEMENTATION_PLAN.md:149`)
- **IndexedDB**: Not found

## G) Red Flags & Drift

### Auth Conflicts
- **bcrypt reference**: `env.example:50` - Would conflict with Supabase Auth
- **JWT_SECRET**: `env.example:48` - Would conflict with Supabase JWT handling
- **Mock auth**: `backend/src/middleware/authMiddleware.ts:43-52` - Development bypass that would break with real auth

### Security Middleware
- **Helmet**: Installed but not used (`backend/package.json:29`)
- **Rate Limiting**: Installed but not used (`backend/package.json:28`)
- **CORS**: Configured but basic setup (`backend/src/index.ts:13-18`)

### Breaking Changes if Auth Enabled
- **All API routes**: Would break without auth tokens (`backend/src/index.ts:25-345`)
- **WebSocket connections**: Would break without auth (`backend/src/index.ts:430-606`)
- **Frontend routes**: Would break without auth guards
- **Settings/Profile**: Would break without user context

### Missing Security
- **No auth middleware applied**: All routes are public
- **No route guards**: Frontend has no authentication checks
- **No session management**: WebSocket sessions are not tied to users
- **No RLS policies**: Database has no row-level security

---

**Summary**: The application is currently in a pre-auth state with mock authentication. All routes are public, no security middleware is applied, and the codebase is prepared for Supabase integration but not yet secured. Implementing Supabase Auth will require significant changes to protect all endpoints and add proper authentication flow.
