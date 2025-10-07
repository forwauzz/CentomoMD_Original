# Profile Section Audit

## Executive Summary

- ✅ **Profile page exists** with complete form UI (display name, language, consents)
- ✅ **Backend API endpoints** for GET/POST profile operations with proper auth middleware
- ✅ **Database schema** defined with profiles table and multi-clinic support structure
- ✅ **User display name** properly sourced from profile → auth user → fallback
- ✅ **Language preference** stored in UI store with i18n integration
- ❌ **PATCH endpoint missing** - Profile updates fail (frontend calls non-existent endpoint)
- ❌ **No RLS policies** on profiles table - security vulnerability
- ❌ **No password reset** functionality implemented
- ❌ **Profile auto-creation** on signup not working (missing trigger)
- ❌ **Language persistence** - stored in localStorage only, not synced with DB profile

## Current Architecture

### **Frontend**
- **ProfilePage.tsx** (`frontend/src/pages/ProfilePage.tsx`): Complete form with display name, language, PIPEDA/marketing consents
- **AppHeader.tsx** (`frontend/src/components/layout/AppHeader.tsx`): Top-right user display with proper fallback chain
- **userStore.ts** (`frontend/src/stores/userStore.ts`): Zustand store for profile state with persistence
- **uiStore.ts** (`frontend/src/stores/uiStore.ts`): Language preference in localStorage
- **i18n.ts** (`frontend/src/lib/i18n.ts`): Translation system with French/English support

### **Backend/API**
- **profile.ts** (`backend/src/routes/profile.ts`): GET/POST endpoints with auth middleware
- **authMiddleware.ts** (`backend/src/middleware/authMiddleware.ts`): JWT verification and user context
- **schema.ts** (`backend/src/database/schema.ts`): Drizzle schema with profiles, clinics, memberships tables

### **Database**
- **profiles table**: user_id (PK), display_name, locale, consent_pipeda, consent_marketing, timestamps
- **clinics table**: id, name, address, phone, email, timestamps  
- **memberships table**: user_id, clinic_id, role, active, timestamps
- **No RLS policies** on profiles table (security gap)

## Data Model Details

### **profiles**
```sql
user_id uuid PRIMARY KEY (references auth.users(id))
display_name varchar(255) NULLABLE
locale text NOT NULL DEFAULT 'fr-CA' (enum: 'en-CA', 'fr-CA')
consent_pipeda boolean NOT NULL DEFAULT false
consent_marketing boolean NOT NULL DEFAULT false
created_at timestamp NOT NULL DEFAULT now()
updated_at timestamp NOT NULL DEFAULT now()
```

### **clinics**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
name varchar(255) NOT NULL
address text NULLABLE
phone varchar(20) NULLABLE
email varchar(255) NULLABLE
created_at timestamp NOT NULL DEFAULT now()
updated_at timestamp NOT NULL DEFAULT now()
```

### **clinic_memberships**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id uuid NOT NULL (references auth.users(id))
clinic_id uuid NOT NULL (references clinics(id))
role text NOT NULL DEFAULT 'physician' (enum: owner, admin, physician, staff, it_support)
active boolean NOT NULL DEFAULT true
created_at timestamp NOT NULL DEFAULT now()
updated_at timestamp NOT NULL DEFAULT now()
UNIQUE(user_id, clinic_id)
```

### **Auth ↔ Profile linkage**
- Uses `auth.uid()` to map Supabase auth user to profile.user_id
- Profile creation attempted in AuthCallback.tsx via POST /api/profile
- Backend authMiddleware queries 'users' table instead of 'profiles' table (inconsistency)

## UI/UX Behavior

### **Top-right display name source**
```typescript
// frontend/src/components/layout/AppHeader.tsx:69-77
const getDisplayName = () => {
  if (profile?.display_name) {
    return profile.display_name;
  }
  if (user?.name) {
    return user.name;
  }
  return 'Unknown User';
};
```

### **Profile form population**
```typescript
// frontend/src/pages/ProfilePage.tsx:32-35
const response = await apiFetch<{ success: boolean; data: ProfileData }>('/api/profile');
return response.data;
```

### **Profile save attempt**
```typescript
// frontend/src/pages/ProfilePage.tsx:37-46
const response = await apiFetch<{ success: boolean; data: ProfileData }>('/api/profile', {
  method: 'PATCH',  // ❌ ENDPOINT DOES NOT EXIST
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updates),
});
```

### **Language preference storage**
- **UI Store**: `frontend/src/stores/uiStore.ts:35` - stored in localStorage as 'fr'/'en'
- **Profile DB**: `backend/src/database/schema.ts:19` - stored as 'en-CA'/'fr-CA'
- **Conversion**: `frontend/src/pages/ProfilePage.tsx:92-96` - converts between formats
- **NOT SYNCED**: Language changes in Profile don't persist to DB

### **Password reset**
**NOT FOUND** - No password reset functionality implemented anywhere in codebase

## Gaps & Risks (explicit)

1. **PATCH endpoint missing**: Frontend calls `PATCH /api/profile` but backend only has GET/POST
2. **No RLS policies**: profiles table has no Row Level Security policies - any authenticated user can read/write any profile
3. **No profile auto-creation trigger**: New users get 404 when trying to access profile
4. **Language storage mismatch**: UI store uses 'fr'/'en', DB uses 'en-CA'/'fr-CA', not synchronized
5. **Auth middleware inconsistency**: Queries 'users' table instead of 'profiles' table
6. **No password reset flow**: Users cannot reset passwords (only OTP/Google SSO available)
7. **Missing profile validation**: No server-side validation for profile updates
8. **No audit logging**: Profile changes not logged for compliance

## Minimal Fix Plan (file-by-file)

### **Frontend**
- **ProfilePage.tsx**: Fix API call to use POST instead of PATCH for updates
- **ProfilePage.tsx**: Sync language changes between UI store and profile DB
- **AppHeader.tsx**: Add password reset button (if password auth enabled)
- **userStore.ts**: Add profile refresh after updates

### **Backend**
- **profile.ts**: Add PATCH endpoint for profile updates with validation
- **profile.ts**: Add server-side validation for profile fields
- **authMiddleware.ts**: Fix to query profiles table instead of users table
- **profile.ts**: Add audit logging for profile changes

### **Database**
```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "users_can_read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_profile" ON profiles  
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, display_name, locale)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 'fr-CA');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Multi-Clinic / Tenancy (no big refactor)

### **Current readiness**
- ✅ **clinics table** exists with proper structure
- ✅ **memberships table** exists with role-based access
- ✅ **sessions table** has clinic_id column
- ✅ **RLS policies** on artifacts use clinic-based scoping

### **Profile page additions (optional, staged)**
```typescript
// Add to ProfilePage.tsx
interface ProfileData {
  display_name: string;
  locale: 'en-CA' | 'fr-CA';
  consent_pipeda: boolean;
  consent_marketing: boolean;
  default_clinic_id?: string;  // NEW
  clinic_memberships?: Array<{  // NEW
    clinic_id: string;
    clinic_name: string;
    role: string;
    is_default: boolean;
  }>;
}
```

### **Guardrails**
- Keep current single-tenant UX working
- Default clinic selection collapsed by default
- Show roles per clinic (read-only initially)

## API Contracts (proposed)

### **GET /api/profile**
```json
{
  "success": true,
  "data": {
    "display_name": "Dr. Smith",
    "locale": "en-CA", 
    "consent_pipeda": true,
    "consent_marketing": false,
    "default_clinic_id": "uuid",
    "clinic_memberships": [
      {
        "clinic_id": "uuid",
        "clinic_name": "Main Clinic",
        "role": "physician",
        "is_default": true
      }
    ]
  }
}
```

### **PATCH /api/profile**
```json
{
  "display_name": "Dr. Smith",
  "locale": "en-CA",
  "consent_pipeda": true,
  "consent_marketing": false,
  "default_clinic_id": "uuid"
}
```

### **POST /api/auth/reset-password** (if applicable)
```json
{
  "email": "user@example.com"
}
```

## Test Plan (manual)

1. **Fresh user (OTP + Google)** → profile auto-creation → update display name → top-right updates
2. **Change language** → persists to DB → app reload applies language from DB
3. **Toggle PIPEDA/marketing** → persists → reflected in subsequent loads
4. **Reset password** (if enabled) → receive email → set new password → login works
5. **Multi-clinic**: set default clinic → reflected in UI and future forms (read-only if not implemented)

## Evidence (Code Snippets)

### **Profile Page Form**
```typescript
// frontend/src/pages/ProfilePage.tsx:295-308
<div className="space-y-2">
  <Label htmlFor="display_name">{t('displayName')}</Label>
  <Input
    id="display_name"
    value={formData.display_name}
    onChange={(e) => handleFieldChange('display_name', e.target.value)}
    placeholder={t('displayNamePlaceholder')}
    className={errors.display_name ? 'border-red-500' : ''}
  />
  {errors.display_name && (
    <p className="text-sm text-red-500">{errors.display_name}</p>
  )}
</div>
```

### **Backend Profile GET**
```typescript
// backend/src/routes/profile.ts:52-56
const profileRows = await db
  .select()
  .from(profiles)
  .where(eq(profiles.user_id, userId))
  .limit(1);
```

### **Missing PATCH Endpoint**
**NOT FOUND** - No PATCH endpoint in backend/src/routes/profile.ts

### **Language Store**
```typescript
// frontend/src/stores/uiStore.ts:35
language: 'fr', // Default to French for Quebec clinics
```

### **Database Schema**
```typescript
// backend/src/database/schema.ts:16-24
export const profiles = pgTable('profiles', {
  user_id: uuid('user_id').primaryKey(), // References auth.users(id) in Supabase
  display_name: varchar('display_name', { length: 255 }),
  locale: text('locale', { enum: ['en-CA', 'fr-CA'] }).notNull().default('fr-CA'),
  consent_pipeda: boolean('consent_pipeda').notNull().default(false),
  consent_marketing: boolean('consent_marketing').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

### **Auth Middleware Inconsistency**
```typescript
// backend/src/middleware/authMiddleware.ts:72-76
const { data: profile, error: profileError } = await supabaseClient
  .from('users')  // ❌ Should be 'profiles'
  .select('id, email, name, role, clinic_id')
  .eq('id', user.id)
  .single();
```

### **Multi-Clinic Schema**
```typescript
// backend/src/database/schema.ts:27-37
export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(), // References auth.users(id) in Supabase
  clinic_id: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'admin', 'physician', 'staff', 'it_support'] }).notNull().default('physician'),
  active: boolean('active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userClinicUnique: unique().on(table.user_id, table.clinic_id),
}));
```
