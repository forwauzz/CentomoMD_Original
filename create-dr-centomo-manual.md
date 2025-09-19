# Manual Dr. Centomo User Creation

Since the Admin API is giving database errors, here are alternative methods to create the Dr. Centomo user:

## Method 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/kbjulpxgjqzgbkshqsme
   - Navigate to **Authentication** → **Users**

2. **Create New User:**
   - Click **"Add user"** or **"Invite user"**
   - Email: `hugocentomo@gmail.com`
   - Password: `CentomoMD2025!`
   - Auto-confirm email: ✅ **Yes**
   - User metadata (optional):
     ```json
     {
       "full_name": "Dr. Hugo Centomo",
       "role": "doctor",
       "clinic": "Centomo Medical"
     }
     ```

3. **Save the user** - they should be able to login immediately

## Method 2: Direct curl Command

Run this in your terminal (replace with your actual values):

```bash
curl -X POST "https://kbjulpxgjqzgbkshqsme.supabase.co/auth/v1/admin/users" \
-H "Content-Type: application/json" \
-H "apikey: YOUR_SERVICE_ROLE_KEY" \
-H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
-d '{
  "email": "hugocentomo@gmail.com",
  "password": "CentomoMD2025!",
  "email_confirm": true,
  "user_metadata": {
    "full_name": "Dr. Hugo Centomo",
    "role": "doctor",
    "clinic": "Centomo Medical"
  }
}'
```

## Method 3: Test with Existing User

If you want to test the production login immediately, you can:
1. Use one of the existing 3 users
2. Or create a test user with a different email (like `test@centomo.com`)

## Troubleshooting the Admin API Error

The "Database error creating new user" might be due to:
- **Supabase project limits** (free tier has user limits)
- **Database connection issues** 
- **Service role key permissions**
- **Project configuration issues**

The dashboard method should work regardless of these API issues.

## Next Steps

1. Create the user using Method 1 (Dashboard)
2. Test login at: https://centomo-md-original-kskp.vercel.app/login
3. Verify the user can access the dashboard

---

**User Details:**
- Email: `hugocentomo@gmail.com`
- Password: `CentomoMD2025!`
- Role: Doctor
- Clinic: Centomo Medical
