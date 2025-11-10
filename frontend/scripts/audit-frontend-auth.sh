#!/usr/bin/env bash
set -euo pipefail

echo "=====  Vite env at build-time (grep references) ====="
grep -R --line-number -E "VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY|VITE_API_BASE_URL" src || true

echo
echo "=====  Supabase client init (createClient) ====="
grep -R --line-number "createClient" src || true
grep -R --line-number "persistSession" src || true
grep -R --line-number "detectSessionInUrl" src || true

echo
echo "===== 🔐 Where we attach Authorization header ====="
grep -R --line-number "Authorization: `Bearer" src || true
grep -R --line-number "Authorization', `Bearer" src || true

echo
echo "=====  ProtectedRoute/AuthProvider wiring ====="
grep -R --line-number "auth.getSession" src || true
grep -R --line-number "onAuthStateChange" src || true
