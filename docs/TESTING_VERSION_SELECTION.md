# Testing Template Version Selection

## Overview

Testing template version selection can be done in multiple ways, depending on your needs:

1. **Integration Tests** (Recommended) - Test services directly, bypassing HTTP/auth
2. **HTTP Tests** - Test full HTTP endpoints (requires auth setup)
3. **Unit Tests** - Test individual functions

## Option 1: Integration Tests (Recommended)

**File:** `backend/test-version-selection-integration.js`

This approach tests the services directly without HTTP middleware:

```bash
# Build first
npm run build

# Run integration tests
node test-version-selection-integration.js
```

**Advantages:**
- ✅ Bypasses auth middleware
- ✅ Tests actual service logic
- ✅ Faster than HTTP tests
- ✅ No server required

**Tests:**
- ProcessingOrchestrator.processContent()
- PromptBundleResolver.resolveSection7AiPaths()
- Section7AIFormatter.formatSection7Content()

## Option 2: HTTP Tests (Requires Auth Setup)

**File:** `backend/test-version-selection-e2e.js`

This approach tests full HTTP endpoints:

```bash
# Ensure backend server is running
npm run dev

# In another terminal, run tests
node test-version-selection-e2e.js
```

**Requirements:**
- Backend server running
- Auth middleware configured correctly
- `NODE_ENV=development` and `AUTH_REQUIRED=false` for dev mode

**Troubleshooting:**
- If getting 401 errors, ensure:
  - `NODE_ENV=development` in `.env`
  - `AUTH_REQUIRED=false` in `.env`
  - Server restarted after changes
  - Routes use `optionalAuth` middleware

## Option 3: Manual Testing via Frontend

1. Start backend: `npm run dev`
2. Start frontend: `npm run dev` (in frontend directory)
3. Navigate to Transcript Analysis page
4. Select a template
5. Optionally select a version (if flag enabled)
6. Process transcript

## Auth Configuration

### Development Mode (Auth Bypass)

To enable dev mode auth bypass:

```env
NODE_ENV=development
AUTH_REQUIRED=false
```

This will:
- Auto-bypass auth in `authenticateUser` (if dev mode detected)
- Allow requests without tokens in `optionalAuth`
- Use mock user for development

### Production Mode (Auth Required)

For production testing:

```env
NODE_ENV=production
AUTH_REQUIRED=true
```

Then provide valid auth tokens in test requests.

## Feature Flags

### Template Version Selection

```env
FEATURE_TEMPLATE_VERSION_SELECTION=true
```

### Remote Storage

```env
FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE=true
```

**Note:** Requires Supabase configured and bundles uploaded.

## Test Checklist

- [ ] Build project: `npm run build`
- [ ] Run integration tests: `node test-version-selection-integration.js`
- [ ] Verify backward compatibility (flags disabled)
- [ ] Enable flags and test version selection
- [ ] Test with different versions (`current`, `latest`, `stable`, specific semver)
- [ ] Test all three endpoints:
  - `/api/format/mode2`
  - `/api/analyze/ab-test`
  - `/api/benchmark`

## Troubleshooting

### 401 Errors

**Problem:** Tests getting 401 "No authentication token provided"

**Solutions:**
1. Use integration tests (bypasses HTTP/auth)
2. Set `NODE_ENV=development` and `AUTH_REQUIRED=false`
3. Ensure `optionalAuth` middleware is applied to routes
4. Restart server after changes

### Flags Not Working

**Problem:** Version selection not working even with flags enabled

**Solutions:**
1. Verify flags in `.env`: `FEATURE_TEMPLATE_VERSION_SELECTION=true`
2. Restart server after changing flags
3. Check logs for `[PROOF]` messages showing resolver source
4. Verify manifest files exist if using local resolution

### Supabase Errors

**Problem:** Remote storage resolution failing

**Solutions:**
1. Check Supabase environment variables
2. Verify bundles are uploaded
3. Check database tables exist
4. Verify Storage bucket and policies

