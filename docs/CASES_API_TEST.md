# Testing Cases API in Dev

## Test Results

### Route Structure
- ✅ `cases.ts` exists at `backend/src/routes/cases.ts`
- ✅ `cases` table exported in `backend/src/database/schema.ts` (line 108)
- ✅ Route exports default router (line 553)
- ✅ Router has GET `/` handler (line 96)
- ✅ Router has POST `/` handler (line 13)

### Import Pattern
- Route uses dynamic import: `await import('./routes/cases.js')`
- Mounted at: `app.use('/api/cases', casesRouter.default)`
- Same pattern as sessions, format, debug routes

### Frontend Calls
- GET: `/api/cases?limit=${limit}&days=${days}&sort=updated_at&order=desc`
- POST: `/api/cases` with body `{ clinic_id, patientInfo, draft }`
- Both return 404 in production

### Next Steps
1. Check production backend startup logs for route mounting
2. Verify cases.js exists in production dist folder
3. Test route import directly in dev environment
4. Compare with working routes (sessions, format)

