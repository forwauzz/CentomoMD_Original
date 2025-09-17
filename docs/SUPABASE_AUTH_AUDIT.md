## Supabase Authentication Audit

Last updated: 2025-09-17

### Summary

- **Frontend**: Uses Supabase JS v2 with email magic-link and Google OAuth. Callback handled at `/auth/callback` setting the session and preserving intended route.
- **Backend**: Verifies Bearer tokens via Supabase Admin client using `SUPABASE_SERVICE_ROLE_KEY`. Optional JWKS strategy exists but default is Supabase.
- **Database**: RLS policies use `auth.uid()`. A trigger auto-creates a row in `profiles` on new `auth.users` insertion.
- **New users**: Created automatically by Supabase on first successful email magic-link or Google SSO. Profile row is auto-provisioned by trigger.

---

### Frontend Integration

- Supabase client and auth helpers: `frontend/src/lib/authClient.ts`
  - Reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` from Vite env
  - Creates client with `persistSession: true`, `autoRefreshToken: true`
  - Exposes `useAuth()` with:
    - Email magic-link: `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: <SITE>/auth/callback } })`
    - Google SSO: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <SITE>/auth/callback, scopes: 'openid email profile', queryParams: { access_type: 'offline', prompt: 'consent' }, state } })`
- Callback handler: `frontend/src/pages/AuthCallback.tsx`
  - Parses hash for `access_token`/`refresh_token`, calls `supabase.auth.setSession(...)`
  - Falls back to `supabase.auth.getSession()` for magic-links
  - Attempts profile creation via `POST /api/profile` with `Authorization: Bearer <access_token>` (defensive; DB trigger also covers this)
  - Restores intended route captured pre-login
- UI widget: `frontend/src/components/AuthWidget.tsx` exposes magic-link and Google sign-in flows
- Env template: `frontend/env.template`
  - `VITE_SITE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - Notes to enable Google and to set redirect URLs

### Backend Integration

- Admin client: `backend/src/lib/supabaseClient.ts`
  - Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Token verification middlewares:
  - `backend/src/auth.ts`
    - `verifySupabaseJWT(token)` → `supabase.auth.getUser(token)`
    - Strategy toggle via `ENV.AUTH_VERIFY_STRATEGY` (`supabase` default, `jwks` optional)
    - `authMiddleware` attaches a minimal user context on success
  - `backend/src/middleware/authMiddleware.ts`
    - Similar flow, fetches profile from `profiles` and attaches richer `req.user`
    - Falls back to a dev user if Supabase is not configured
- WS token route: `backend/src/routes/auth.ts`
  - Verifies HTTP Bearer token using `SUPABASE_JWT_SECRET` (only for WS token minting)

### Database and RLS

- RLS policies reference `auth.uid()` across tables: see `backend/drizzle/rls_policies.sql`
- Profile auto-provisioning: `backend/drizzle/0002_profile_fixes.sql`
  - Function `public.handle_new_user()` and trigger `on_auth_user_created` on `auth.users`
  - Inserts into `profiles(user_id, display_name, locale)` with sensible defaults

### Supabase Dashboard Configuration Checklist

- **Project settings → API**
  - Note `Project URL` and `anon`/`service_role` keys
- **Authentication → URL Configuration**
  - Site URL: set to your real origin in prod; `http://localhost:5173` in dev
  - Redirect URLs: include
    - `http://localhost:5173/auth/callback`
    - `https://<prod-domain>/auth/callback`
- **Authentication → Providers → Google**
  - Enable provider
  - Set Client ID/Secret
  - Add the callback URL: `https://<domain>/auth/callback` and dev equivalent
- **Authentication → Email**
  - If using magic-links, ensure email confirmations/magic link settings are enabled as desired

### Environment Variables

- Frontend (`frontend/.env.local`):
  - `VITE_SITE_URL=http://localhost:5173`
  - `VITE_SUPABASE_URL=https://<project>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=<anon-key>`
- Backend (`.env`):
  - `SUPABASE_URL=https://<project>.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
  - `SUPABASE_JWT_SECRET=<jwt-secret>` (used for WS token logic)
  - `AUTH_REQUIRED=false` (toggle to true to enforce once ready)
  - `WS_REQUIRE_AUTH=false` (enable when WS auth is required)

### New User Creation Flow

- Email magic-link or Google SSO → Supabase creates user in `auth.users`
- Trigger `on_auth_user_created` → inserts row into `profiles`
- Frontend callback also attempts `POST /api/profile` (harmless if already exists; returns 409 or ok)

### Findings and Risks

- Email login is implemented as magic-link (no email+password path wired). If password-based login is required, add `signInWithPassword` flow and UI adjustments.
- `backend/src/middleware/authMiddleware.ts` contains stray references to an unimported `supabase` variable in a few spots; consolidate on the admin client and remove unused code to avoid runtime/TS issues.
- Dual middleware implementations (`auth.ts` and `middleware/authMiddleware.ts`) can diverge; consider consolidating to a single source of truth.
- Dev fallback bypasses auth if Supabase env is missing. Ensure this is disabled in production.
- WS token route verifies via `SUPABASE_JWT_SECRET`; confirm it matches the Supabase Auth secret in your project settings.

### Acceptance Tests

- Email magic-link
  - Set env, start frontend and backend
  - From login, enter email → receive link → land on `/auth/callback`
  - Session established, redirected to intended route
  - Confirm `profiles` row exists for new user
- Google SSO
  - Click Google → consent → back to `/auth/callback`
  - Session established, redirected
  - Confirm `profiles` row exists
- Backend token verification
  - Call a protected API with `Authorization: Bearer <access_token>` → 200
  - Omit/invalid token → 401

### Recommendations

- If password login is desired, add `signInWithPassword` and UI, and enable Email/Password in Supabase.
- Fix the stray `supabase` usages in `backend/src/middleware/authMiddleware.ts` and consolidate auth middleware.
- Remove dev fallback or guard it behind `NODE_ENV === 'development'`.
- Keep `Authorized Redirect URLs` in Supabase in sync with dev/prod.
- Ensure env loading (Vite vars) is verified; use the existing diagnostics in `authClient.ts` when misconfigured.

---

This audit confirms the current setup supports creating new users via Supabase and logging in via email magic-link and Google SSO, with profile auto-provisioning and RLS aligned to `auth.uid()`.

### Troubleshooting: Creating Users shows 500 in browser console

Observed console logs:
- 500 from `https://api.supabase.com/platform/auth/<project-ref>/users`
- 429 from Sentry (`*.ingest.us.sentry.io`)
- CSP rejections for Monaco sourcemap URLs (`cdnjs.cloudflare.com/.../monaco-editor/...js.map`)

What this means:
- The 500 is from the Supabase Platform Admin API (used by the Supabase Dashboard when you click “Create user”). It is not your app endpoint and not caused by your frontend code.
- The Sentry 429 and CSP sourcemap blocks are benign and unrelated to user creation.

Fix/diagnose steps:
- Supabase status and retries
  - Check Supabase Status. If healthy, retry creating a user in the Dashboard after a minute; transient 5xxs can occur.
  - Try a different browser/incognito to rule out extensions. The CSP sourcemap errors are harmless.
- Auth configuration
  - In Supabase → Authentication → Providers → Email: ensure signups are enabled or use the Dashboard “Invite” flow. If signups are disabled, programmatic signups may be blocked.
  - Check “Restricted email domains” and “Allow list” settings.
  - If you require email confirmations, confirm your email settings and that the Sender is valid for your project/region.
- Project limits/billing
  - Ensure the project is not suspended and within plan limits (auth emails, user count, etc.).
- Server-side Admin API test (bypasses Dashboard UI)
  - Run from a secure server environment using the service role key (never in the browser):
  ```bash
  node -e "import('node:process').then(async() => { const { createClient } = await import('@supabase/supabase-js'); const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); const { data, error } = await s.auth.admin.createUser({ email: 'new.user@example.com', email_confirm: true }); console.log({ data, error }); });"  \
  SUPABASE_URL=https://<project>.supabase.co  \
  SUPABASE_SERVICE_ROLE_KEY=<service-role>
  ```
  - Expected: `error: null` and a new user object. If this fails, check Supabase Project → Logs (filter Service: auth, Level: error) for details.
- App-side creation path
  - Our app creates users via magic-link or Google OAuth on the client. No Admin API is called from the browser. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set and that Supabase Auth has Google enabled with correct redirect URLs.

If Dashboard user creation continues to 500, capture the request ID from the Network tab and open a Supabase support ticket with the timestamp and project ref; include any relevant entries from Project Logs → Auth.

