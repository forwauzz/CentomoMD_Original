@echo off
SETLOCAL

REM IMPORTANT: Replace with your actual Supabase Project URL and Service Role Key
SET SUPABASE_URL=https://kbjulpxgjqzgbkshqsme.supabase.co
SET SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtianVscHhnanF6Z2Jrc2hxc21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzE0NzQ5MCwiZXhwIjoyMDUyNzIzNDkwfQ.8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q

IF "%SERVICE_ROLE_KEY%"=="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtianVscHhnanF6Z2Jrc2hxc21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzE0NzQ5MCwiZXhwIjoyMDUyNzIzNDkwfQ.8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q" (
    ECHO ERROR: Please update SERVICE_ROLE_KEY in this script with your actual Supabase Service Role Key.
    ECHO Get it from: https://supabase.com/dashboard/project/kbjulpxgjqzgbkshqsme/settings/api
    GOTO :EOF
)

ECHO 🏥 Creating Dr. Centomo user account via curl...
ECHO 📧 Email: hugocentomo@gmail.com
ECHO 🔐 Password: CentomoMD2025!

curl -X POST "%SUPABASE_URL%/auth/v1/admin/users" ^
-H "Content-Type: application/json" ^
-H "apikey: %SERVICE_ROLE_KEY%" ^
-H "Authorization: Bearer %SERVICE_ROLE_KEY%" ^
-d "{ \"email\": \"hugocentomo@gmail.com\", \"password\": \"CentomoMD2025!\", \"email_confirm\": true, \"user_metadata\": { \"full_name\": \"Dr. Hugo Centomo\", \"role\": \"doctor\", \"clinic\": \"Centomo Medical\" } }"

ECHO.
ECHO ✅ Attempted to create user. Please check your Supabase dashboard.
ECHO 📋 If this fails, use the manual method in create-dr-centomo-manual.md
ENDLOCAL