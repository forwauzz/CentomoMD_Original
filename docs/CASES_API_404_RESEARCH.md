# 🔍 Research: Cases API 404 Error

**Date:** 2025-01-21  
**Branch:** `hotfix/auth-issue`  
**Issue:** `GET /api/cases` returns 404 "Cannot GET /api/cases"  
**Context:** This occurred after fixing login/auth issues

---

## 📋 Error Details

**Error from Browser Console:**
```
Failed to load resource: the server responded with a status of 404 ()
caseStore.ts:919 ❌ Failed to fetch recent cases: Error: HTTP 404: <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /api/cases</pre>
</body>
</html>
```

**Key Observations:**
- ❌ Status: **404 Not Found** (not 401 Unauthorized)
- ❌ Response: Express default 404 HTML (not JSON error)
- ❌ This suggests the route handler doesn't exist at all

---

## 🔍 Code Analysis

### Backend Route Definition

**File:** `backend/src/routes/cases.ts`

**Route exists at line 96:**
```typescript
// GET /api/cases - Get recent cases with optional filters
router.get('/', async (req, res) => {
  // ... handler implementation
});
```

**Router is exported at line 553:**
```typescript
export default router;
```

### Route Mounting

**File:** `backend/src/index.ts` (lines 644-651)

**Route is mounted:**
```typescript
// Cases routes
try {
  const casesRouter = await import('./routes/cases.js');
  app.use('/api/cases', casesRouter.default);
  console.log('✅ /api/cases routes mounted');
} catch(e) {
  console.error('❌ mount /api/cases:', e);
}
```

**Key Points:**
- Uses dynamic `await import()` (async)
- Wrapped in try-catch
- If import fails, route won't be mounted (silent failure)

### Authentication Middleware

**File:** `backend/src/routes/cases.ts` (line 10)

**Auth middleware is applied:**
```typescript
router.use(authenticateUser);
```

**File:** `backend/src/middleware/auth.ts` (lines 27-74)

**Auth middleware behavior:**
- **Development:** Auto-bypasses auth, uses mock user
- **Production:** Requires valid JWT token
- **If no token:** Returns 401 (not 404)
- **If invalid token:** Returns 401 (not 404)

**Note:** Since we're getting 404, auth middleware isn't even being reached.

---

## 🎯 Root Cause Analysis

### Hypothesis 1: Route Not Mounted (Most Likely)

**Evidence:**
- 404 response (route doesn't exist)
- Express default 404 handler (not our custom error)
- No auth middleware triggered (would be 401 if route existed)

**Possible Causes:**
1. **Async import failed silently**
   - Error during `await import('./routes/cases.js')`
   - Caught by try-catch, logged but route not mounted
   - **Check:** Backend startup logs for "❌ mount /api/cases:"

2. **Syntax error in cases.ts**
   - TypeScript compiles but runtime error
   - Import fails, route not registered
   - **Check:** Backend logs for import errors

3. **Production build/deployment issue**
   - `cases.ts` not included in build
   - Different code version in production
   - **Check:** Compare production backend code with repo

### Hypothesis 2: Route Ordering Issue

**Evidence:**
- Other routes might be catching the request first
- Wildcard routes before `/api/cases`

**Possible Causes:**
1. **Route defined after catch-all route**
   - Express matches routes in order
   - If catch-all `app.get('*')` is before cases, it would catch everything
   - **Check:** Route order in `index.ts`

2. **Profile router conflict**
   - Profile router mounted before cases
   - If profile router has wildcard, it might catch cases
   - **Check:** Profile router path definitions

### Hypothesis 3: Production Backend Stale

**Evidence:**
- Code exists in repo but not in production
- Backend not restarted after deployment
- Old version of backend deployed

**Possible Causes:**
1. **Backend not redeployed**
   - Frontend deployed but backend not updated
   - Production backend on old code version
   - **Check:** Production backend version/commit

2. **Build artifact issue**
   - `cases.ts` not compiled to `cases.js`
   - Missing in production build
   - **Check:** Production build includes cases.js

### Hypothesis 4: Base URL Mismatch

**Evidence:**
- Frontend calling `https://api.alie.app/api/cases`
- Backend might be at different URL
- Or API proxy/load balancer not routing correctly

**Possible Causes:**
1. **API base URL incorrect**
   - Frontend env var points to wrong backend
   - Backend not accessible at that URL
   - **Check:** Verify `VITE_API_BASE_URL` in production

2. **Reverse proxy/Nginx routing**
   - `/api/cases` not proxied correctly
   - Different routing rules for cases vs other endpoints
   - **Check:** Nginx/proxy configuration on EC2

---

## 🔎 Investigation Checklist

### Step 1: Check Backend Startup Logs

**On EC2/Production backend, check logs for:**
```
✅ /api/cases routes mounted
```
**OR**
```
❌ mount /api/cases: [error message]
```

**If you see error:**
- Route import failed
- Likely syntax/runtime error in cases.ts
- Need to fix the error

**If you don't see either message:**
- Route mounting code not reached
- Different code version or deployment issue

### Step 2: Verify Route is Registered

**In production backend console/logs, look for route registration:**
```
🧭 Registered routes:
  GET /api/cases
  POST /api/cases
  GET /api/cases/:id
  ...
```

**If `/api/cases` NOT in list:**
- Route not mounted successfully
- Need to check import/startup errors

### Step 3: Check if Other Routes Work

**Test these endpoints:**
- `GET /api/profile` - Should work (user said login works)
- `GET /healthz` - Should work (health check)
- `GET /api/config` - Should work

**If profile works but cases doesn't:**
- Cases route specifically not mounted
- Import error specific to cases.ts

**If nothing works:**
- Backend not running or wrong URL

### Step 4: Compare Production vs Code

**Check if production backend matches codebase:**
- Compare production backend commit with current branch
- Verify cases.ts exists in production build
- Check if routes/cases.js exists in dist/

---

## 🔗 Related Files

### Backend Files
1. `backend/src/routes/cases.ts` - Route definitions
2. `backend/src/index.ts` - Route mounting (lines 644-651)
3. `backend/src/middleware/auth.ts` - Authentication middleware
4. `backend/src/config/development.ts` - Development mode check

### Frontend Files
1. `frontend/src/stores/caseStore.ts` - Calls `/api/cases` (line 916)
2. `frontend/src/components/dashboard/RecentCasesCard.tsx` - Uses getRecentCases
3. `frontend/src/components/layout/PrimarySidebar.tsx` - Also uses getRecentCases
4. `frontend/src/lib/api.ts` - API client (auto-adds auth headers now)

---

## 🔴 Critical Discovery: Route Path Pattern Mismatch

### Profile Router vs Cases Router

**Profile Router** (`backend/src/routes/profile.ts`):
```typescript
// Route definition includes full path
router.get('/api/profile', async (req, res) => {
```

**Mount in index.ts:**
```typescript
app.use(profileRouter);  // No base path!
```

**Cases Router** (`backend/src/routes/cases.ts`):
```typescript
// Route definition uses relative path
router.get('/', async (req, res) => {
```

**Mount in index.ts:**
```typescript
app.use('/api/cases', casesRouter.default);  // Base path provided!
```

**Analysis:**
- Profile routes work because route definition includes full path `/api/profile`
- Cases routes should work because mount provides base path `/api/cases` and route uses `/`
- This pattern is correct for cases router
- But if cases.ts import fails, route won't be mounted

---

## 💡 Potential Issues to Check

### Issue A: Async Import Failure

**Check backend startup logs:**
- Look for "❌ mount /api/cases:" error
- If present, route import failed
- Need to fix the error in cases.ts

**Solution:**
- Fix syntax/runtime error
- Ensure all imports in cases.ts are valid
- Verify database connection works

### Issue B: Route Ordering

**Check route order in index.ts:**
- Cases routes should be before any catch-all routes
- Profile routes might conflict if path overlaps

**Solution:**
- Reorder routes if needed
- Ensure `/api/cases` is specific enough

### Issue C: Production Backend Stale

**Check:**
- Production backend code version
- When was backend last deployed?
- Does production have cases.ts?

**Solution:**
- Redeploy backend with latest code
- Verify cases.ts is in production build

### Issue D: API Base URL Issue

**Check:**
- Is `VITE_API_BASE_URL=https://api.alie.app` correct?
- Is backend accessible at that URL?
- Does healthz endpoint work?

**Solution:**
- Verify backend URL
- Test direct curl to `/api/cases` endpoint
- Check API gateway/proxy configuration

---

## 🧪 Testing Steps

### Test 1: Direct API Call (from EC2)

**SSH into EC2 and test:**
```bash
# Test if route exists
curl -X GET "http://localhost:3001/api/cases" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected:
# - If route exists: JSON response (401 if no token, 200 if valid)
# - If route doesn't exist: 404 HTML response
```

### Test 2: Check Backend Routes

**In backend code or logs, verify:**
```typescript
// After all routes mounted, print registered routes
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(middleware.route.methods, middleware.route.path);
  }
});
```

**Look for:**
- `GET /api/cases` should be present
- If missing, route not mounted

### Test 3: Check Import Success

**In production backend startup, check for:**
```
✅ /api/cases routes mounted
```

**If you see:**
```
❌ mount /api/cases: [error]
```
Then the import failed - fix that error.

---

## 📊 Comparison: What Works vs What Doesn't

| Endpoint | Status | Auth Required | Notes |
|----------|--------|---------------|-------|
| `/api/profile` | ✅ Works | Yes | User confirmed working |
| `/api/cases` | ❌ 404 | Yes | Route not found |
| `/api/config` | ❓ Unknown | No | Should work |
| `/healthz` | ❓ Unknown | No | Should work |

**Pattern:**
- Profile works → Auth is working
- Cases 404 → Route doesn't exist
- This suggests cases route specifically not mounted

---

## 🎯 Most Likely Root Causes

### #1: Async Import Failed (90% likely)

**Why:**
- Dynamic import with try-catch can fail silently
- If cases.ts has runtime error, import fails
- Route not mounted, but error logged

**What to Check:**
- Backend startup logs for "❌ mount /api/cases:"
- Any errors related to cases.ts import

### #2: Production Backend Stale (80% likely)

**Why:**
- Frontend deployed but backend not
- Cases route might be in newer code version
- Production backend on old commit

**What to Check:**
- Compare production backend commit with repo
- Check if cases.ts exists in production

### #3: Build/Deployment Issue (60% likely)

**Why:**
- cases.ts not included in production build
- TypeScript compilation issue
- File not copied to production

**What to Check:**
- Verify cases.js exists in production dist/
- Check build process includes cases.ts

---

## 📝 Next Steps (Research Only)

1. **Check backend startup logs** for route mounting errors
2. **Verify production backend code version** matches repo
3. **Test other API endpoints** to see if issue is isolated
4. **Check API base URL** is correct
5. **Compare route mounting** with working routes (profile)

**DO NOT make code changes yet** - gather more information first.

---

## 🔗 Key Questions to Answer

1. **Does backend startup show "✅ /api/cases routes mounted"?**
   - If NO → Route not mounted, check error
   - If YES → Route mounted but not accessible (different issue)

2. **What version of backend code is in production?**
   - Compare with current repo
   - Is cases.ts in production build?

3. **Do other API endpoints work?**
   - `/api/profile` - User confirmed works
   - `/api/config` - Test this
   - If only cases fails → Route-specific issue

4. **Is backend accessible at `https://api.alie.app`?**
   - Can you curl `/healthz`?
   - Is the backend running?

5. **Are there any errors in backend logs?**
   - Import errors
   - Runtime errors
   - Database connection errors

---

## 🔴 **CRITICAL UPDATE: Production Logs Analysis**

**Date:** 2025-01-21 (from user logs)  
**Status:** Route IS matched, auth passes, but handler doesn't execute

### Production Runtime Logs:

```
🔐 API request: GET /api/cases with auth          ✅ Security middleware runs
🔐 [AUTH] Authenticated user: 62f20e8a-...        ✅ Auth middleware runs & passes
                                                  ❌ Route handler NOT executing
                                                  ❌ No "📖 [Cases] Fetching recent cases:" log
```

### Key Findings:

1. **Route IS matched** (security middleware logs)
   - Security middleware at `backend/src/server/security.ts:82` runs
   - Logs: `🔐 API request: GET /api/cases with auth`

2. **Authentication passes** (auth middleware logs)
   - Auth middleware at `backend/src/routes/cases.ts:10` runs
   - Logs: `🔐 [AUTH] Authenticated user: 62f20e8a-df95-4b07-b693-370c8c560e7`
   - Auth middleware calls `next()` (otherwise we'd see 401)

3. **Route handler NOT executing** (no handler logs)
   - Handler should log at `backend/src/routes/cases.ts:112`
   - Expected log: `📖 [Cases] Fetching recent cases: { userId: ..., limit: ..., ... }`
   - **This log is NOT present in production logs**

### Updated Root Cause Analysis:

**Hypothesis: Response Already Sent (NEW - 95% likely)**

**Evidence:**
- Auth middleware runs and passes (user authenticated)
- But route handler never executes (no handler logs)
- Browser shows 404 error (Express default handler)

**Possible Causes:**
1. **Auth middleware sending response after logging**
   - Middleware logs success but fails to call `next()` correctly
   - Or calls `next()` but something intercepts before handler

2. **Route handler async error before first log**
   - Handler starts executing but errors before line 112
   - Error caught by Express default error handler (sends 404)

3. **Route registration issue**
   - Route mounted but handler not actually registered
   - Express matches route but no handler attached

**What to Check:**
- Verify auth middleware calls `next()` properly (not returning early)
- Check if there's a try-catch or error handler swallowing errors
- Verify route handler is actually registered (not just mounted)

### Updated Investigation Checklist:

1. ✅ **Security middleware runs** (confirmed from logs)
2. ✅ **Auth middleware runs** (confirmed from logs)
3. ❌ **Route handler executes** (NOT confirmed - no handler logs)
4. ❓ **Check auth middleware implementation** - Does it call `next()` correctly?
5. ❓ **Check for error handlers** - Is something catching errors silently?
6. ❓ **Check route registration** - Is handler actually attached to route?

---

**Status:** Research phase - production logs reveal route matched but handler not executing  
**Next:** Investigate why auth passes but handler doesn't run

---

## 🔴 **CRITICAL UPDATE 2: Browser Test Confirms 404**

**Date:** 2025-01-21 (from browser test)  
**Test Result:** Direct API call returns 404 "Cannot GET /api/cases"

### Browser Test Results:

```javascript
const { data: { session } } = await window.supabase.auth.getSession();
const token = session?.access_token;
const response = await fetch('https://api.alie.app/api/cases?limit=5', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
// Status: 404
// Response: <!DOCTYPE html>...<pre>Cannot GET /api/cases</pre>
```

### Conflict with Previous Logs:

**Earlier Production Logs Showed:**
- ✅ Security middleware runs (`🔐 API request: GET /api/cases with auth`)
- ✅ Auth middleware runs (`🔐 [AUTH] Authenticated user: 62f20e8a-...`)

**Current Browser Test Shows:**
- ❌ 404 Not Found (route doesn't exist)

### Possible Explanations:

1. **Route not mounted in production** (Most Likely - 90%)
   - Async import failed during startup
   - Check production startup logs for route mounting errors
   - Route may have been mounted previously but failed during restart

2. **Route mounted but handler not registered** (60%)
   - Router mounted but GET handler not attached
   - Syntax error in handler prevents registration
   - Handler throws error synchronously before execution

3. **Timing/Deployment issue** (40%)
   - Earlier logs from different time when route was mounted
   - Backend restarted and route failed to mount
   - Production backend on different code version

### Action Required:

**Check Production Backend Startup Logs:**
1. Look for `✅ /api/cases routes mounted` (success)
2. Look for `❌ mount /api/cases: [error]` (failure with details)
3. If neither present → Route mounting code not reached or different code version

**Verify Route Mounting:**
- Check if other routes mount successfully (sessions, format, debug)
- Compare with cases route mounting pattern
- Verify cases.ts exists in production build

**Test Other Endpoints:**
- `GET /api/profile` - Should work (user confirmed)
- `GET /api/clinics` - Should work (logs showed it working)
- `POST /api/cases` - Test if POST works (may reveal if route is mounted but GET handler not registered)

---

**Status:** Research phase - 404 confirmed, need production startup logs  
**Next:** Check production backend startup logs for route mounting status

---

## ✅ **DEV ENVIRONMENT TESTING**

**Date:** 2025-01-21 (dev logs)  
**Status:** POST and GET by ID work in dev, but GET /api/cases (recent cases) not tested

### Dev Logs Show:

**✅ POST /api/cases - WORKS**
```
📝 [Cases] Creating new case: { userId: '...', clinicId: '...' }
✅ [Cases] Successfully created case: dc912e47-...
```

**✅ GET /api/cases/:id - WORKS**
```
📖 [Cases] Fetching case: dc912e47-...
✅ [Cases] Successfully fetched case: dc912e47-...
```

**❓ GET /api/cases (recent cases) - NOT TESTED**
- No logs for `GET /api/cases?limit=...`
- This is the endpoint failing in production
- Frontend calls: `apiFetch('/api/cases?limit=${limit}&days=${days}&sort=updated_at&order=desc')`

### Key Observation:

- **POST and GET by ID work** → Route is mounted in dev, handlers execute correctly
- **GET /api/cases (recent cases) missing** → Not tested in dev, but failing in production
- **Code structure correct** → Handler exists at line 96, should log `📖 [Cases] Fetching recent cases:`

### Next Steps:

1. **Test GET /api/cases in dev** to confirm it works there
2. **Check production startup logs** for route mounting status
3. **Compare dev vs prod** route mounting/registration

**Status:** Dev shows route works for POST and GET by ID  
**Next:** Check production backend startup logs for route mounting, or test GET /api/cases in dev

