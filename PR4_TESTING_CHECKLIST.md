# PR4 Testing Checklist

## 🧪 Pre-Testing Setup

### 1. Dependencies
- [ ] Install jose library: `npm install jose`
- [ ] Verify all imports work without errors
- [ ] Check TypeScript compilation: `npm run build`

### 2. Environment Variables
- [ ] Set `AUTH_REQUIRED=false` (default - no auth required)
- [ ] Set `SUPABASE_URL` (for JWKS verification)
- [ ] Set `WS_JWT_SECRET` (for WebSocket tokens)

## 🔍 Manual Testing

### Test 1: Default Behavior (AUTH_REQUIRED=false)
**Goal**: Verify app works exactly as before when auth is disabled

- [ ] Start server: `npm run dev`
- [ ] `GET /api/templates` returns 200 (open endpoint)
- [ ] `POST /api/templates/format` returns 200 without Bearer token
- [ ] `POST /api/templates` returns 200 without Bearer token
- [ ] `PUT /api/templates/:id` returns 200 without Bearer token
- [ ] `DELETE /api/templates/:id` returns 200 without Bearer token
- [ ] `GET /api/templates/export` returns 200 without Bearer token
- [ ] `POST /api/templates/import` returns 200 without Bearer token

### Test 2: Protected Behavior (AUTH_REQUIRED=true)
**Goal**: Verify auth middleware blocks unauthorized requests

- [ ] Set `AUTH_REQUIRED=true` in environment
- [ ] Restart server
- [ ] `GET /api/templates` returns 200 (still open - read-only)
- [ ] `POST /api/templates/format` without Bearer returns 401
- [ ] `POST /api/templates` without Bearer returns 401
- [ ] `PUT /api/templates/:id` without Bearer returns 401
- [ ] `DELETE /api/templates/:id` without Bearer returns 401
- [ ] `GET /api/templates/export` without Bearer returns 401
- [ ] `POST /api/templates/import` without Bearer returns 401

### Test 3: Invalid Token Handling
**Goal**: Verify proper error responses for invalid tokens

- [ ] `POST /api/templates/format` with `Authorization: Bearer invalid` returns 401
- [ ] `POST /api/templates/format` with `Authorization: Bearer expired-token` returns 401
- [ ] `POST /api/templates/format` with malformed header returns 401
- [ ] `POST /api/templates/format` with `Authorization: InvalidFormat` returns 401

### Test 4: Valid Token Flow
**Goal**: Verify auth works with valid tokens

- [ ] Login via frontend to get valid Supabase JWT token
- [ ] `POST /api/templates/format` with valid Bearer token returns 200
- [ ] Verify `request.user` is populated with user context
- [ ] Verify response contains formatted content
- [ ] Test all protected endpoints with valid token

### Test 5: Error Handling
**Goal**: Verify graceful handling of various error scenarios

- [ ] Test with network failure to JWKS endpoint
- [ ] Test with malformed JWT tokens
- [ ] Test with missing required claims in JWT
- [ ] Test with expired tokens
- [ ] Verify graceful error responses (500 for service errors)

### Test 6: Logging Verification
**Goal**: Verify proper logging of auth events

- [ ] Check logs for successful authentication
- [ ] Check logs for failed authentication attempts
- [ ] Check logs for missing/invalid tokens
- [ ] Verify no sensitive data in logs (tokens, passwords)

## 🛠️ Automated Testing

### Unit Tests
- [ ] Run `npm test` to execute auth middleware tests
- [ ] Verify all test cases pass
- [ ] Check test coverage for auth functions

### Integration Tests
- [ ] Test auth middleware with real Express app
- [ ] Test protected endpoints with various scenarios
- [ ] Test optional auth middleware

## 🔄 Rollback Testing

### Quick Rollback
- [ ] Set `AUTH_REQUIRED=false` and restart server
- [ ] Verify all endpoints work without auth
- [ ] Confirm no breaking changes

### Code Rollback
- [ ] Comment out auth middleware from specific routes
- [ ] Verify those routes work without auth
- [ ] Confirm other routes still protected

## 📊 Performance Testing

### JWKS Caching
- [ ] Verify JWKS is cached (check logs for "JWKS cache updated")
- [ ] Test multiple requests use cached JWKS
- [ ] Verify cache expiration works

### Response Times
- [ ] Measure auth middleware overhead
- [ ] Verify acceptable response times
- [ ] Test under load

## 🔒 Security Testing

### Token Validation
- [ ] Test with tokens from different issuers
- [ ] Test with tokens with wrong audience
- [ ] Test with tokens with missing claims
- [ ] Verify proper signature validation

### Error Information
- [ ] Verify error messages don't leak sensitive info
- [ ] Check logs don't contain full tokens
- [ ] Verify proper error codes

## ✅ Success Criteria

PR4 is considered successful when:

1. **Default Behavior**: App works exactly as before when `AUTH_REQUIRED=false`
2. **Protected Endpoints**: All high-risk endpoints require auth when `AUTH_REQUIRED=true`
3. **Error Handling**: Proper 401/403 responses for unauthorized access
4. **Valid Tokens**: Authenticated users can access protected endpoints
5. **Logging**: Comprehensive audit trail without sensitive data
6. **Rollback**: Easy to disable auth without code changes
7. **Performance**: Minimal overhead on response times

## 🚨 Known Issues

- [ ] Need to install `jose` library for JWKS verification
- [ ] Need valid Supabase environment for full testing
- [ ] Need real JWT tokens for complete validation

## 📝 Test Results

**Date**: _______________
**Tester**: _______________

**Overall Status**: ⏳ Not Tested / ✅ Passed / ❌ Failed

**Notes**:
- 
- 
- 
