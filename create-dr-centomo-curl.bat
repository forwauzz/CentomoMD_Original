@echo off
SETLOCAL

REM IMPORTANT: Set these environment variables before running this script
REM Get your values from: https://supabase.com/dashboard/project/[your-project]/settings/api
SET SUPABASE_URL=%SUPABASE_URL%
SET SERVICE_ROLE_KEY=%SUPABASE_SERVICE_ROLE_KEY%

IF "%SUPABASE_URL%"=="" (
    ECHO ERROR: SUPABASE_URL environment variable is not set.
    ECHO Please set it with: set SUPABASE_URL=https://your-project.supabase.co
    GOTO :EOF
)

IF "%SERVICE_ROLE_KEY%"=="" (
    ECHO ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is not set.
    ECHO Please set it with: set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
    ECHO Get it from: https://supabase.com/dashboard/project/[your-project]/settings/api
    GOTO :EOF
)

ECHO 🏥 Creating Dr. Centomo user account via curl...
ECHO 📧 Email: hugocentomo@gmail.com
ECHO 🔐 Password: CentomoMD2025!

REM Get password from environment variable or use default
SET DR_PASSWORD=%DR_CENTOMO_PASSWORD%
IF "%DR_PASSWORD%"=="" SET DR_PASSWORD=CentomoMD2025!

curl -X POST "%SUPABASE_URL%/auth/v1/admin/users" ^
-H "Content-Type: application/json" ^
-H "apikey: %SERVICE_ROLE_KEY%" ^
-H "Authorization: Bearer %SERVICE_ROLE_KEY%" ^
-d "{ \"email\": \"hugocentomo@gmail.com\", \"password\": \"%DR_PASSWORD%\", \"email_confirm\": true, \"user_metadata\": { \"full_name\": \"Dr. Hugo Centomo\", \"role\": \"doctor\", \"clinic\": \"Centomo Medical\" } }"

ECHO.
ECHO ✅ Attempted to create user. Please check your Supabase dashboard.
ECHO 📋 If this fails, use the manual method in create-dr-centomo-manual.md
ENDLOCAL