## ✅ Pre-Merge Checklist

- [ ] Environment variables correct in Vercel (`VITE_API_BASE_URL`, `VITE_ENABLE_AUTH`)
- [ ] CORS configured: prod domain in `ALLOWED_ORIGINS`
- [ ] API requests send `Content-Type: application/json`
- [ ] No `Authorization: Bearer null`
- [ ] `/health` endpoint returns 200 + JSON
- [ ] Core endpoints (word-for-word, smart, ambient) return valid JSON
- [ ] Dev-only features/flags disabled in prod
- [ ] Frontend builds (`pnpm build`)
- [ ] Backend starts without errors (`pnpm start`)

---

### 📌 Notes for this PR
(Describe what was fixed/added, and any special migration or env changes.)