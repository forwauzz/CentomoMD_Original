#!/bin/bash
echo "=====  Amplify ENV Variables (Frontend Build) ====="
printenv | grep -E "VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY|VITE_API_BASE_URL|NODE_ENV"

echo
echo "=====   Supabase Client Initialization (check persistSession etc.) ====="
grep -R "createClient" src | head -n 20

echo
echo "=====  Auth-related Imports ====="
grep -R "supabase.auth" src | head -n 20

echo
echo "=====  Build Environment (Vite or React) ====="
grep -R "import.meta.env" src | head -n 20

echo
echo "=====  ProtectedRoute or AuthProvider setup ====="
grep -R "supabase.auth.getSession" src | head -n 20
grep -R "supabase.auth.onAuthStateChange" src | head -n 20

echo
echo "=====  API helper (where Authorization header is attached) ====="
grep -R "Authorization" src | head -n 20

echo
echo "=====   Deployment Origin Check ====="
echo "Frontend URL:" $VITE_SITE_URL
