# Public Users Table Migration Audit & Plan

**Date:** January 10, 2025  
**Branch:** `fix/supabase-duplicate-user`  
**Auditor:** AI Assistant  
**Scope:** Complete audit of `public.users` table usage and migration plan to `auth.users` + `public.profiles`

---

## Executive Summary

The `public.users` table is **legacy and largely unused** in the current codebase. The system has already migrated to using `auth.users` (Supabase Auth) + `public.profiles` (profile extensions) as the primary user data source. However, there are **critical foreign key dependencies** that prevent immediate removal.

### Key Findings
- ✅ **Frontend**: No direct usage of `public.users` table
- ✅ **API Endpoints**: No direct queries to `public.users` table  
- ❌ **Database Schema**: 3 tables have foreign key references to `public.users`
- ⚠️ **Migration Status**: Partially complete but foreign keys block removal

---

## 1. Current Usage Analysis

### ✅ **No Direct Usage Found**

#### **Frontend (0 references)**
- No direct queries to `public.users` table
- All user data comes from `auth.users` via Supabase Auth
- Profile data comes from `public.profiles` via API calls
- User display logic uses `resolveDisplayName()` with profile + auth data

#### **Backend API (0 direct references)**
- **Profile API**: Uses `public.profiles` table only
- **Auth Middleware**: Uses `public.profiles` table only  
- **No endpoints**: Directly query `public.users` table
- **Mock User**: Development fallback uses hardcoded values

#### **Authentication Flow**
- **Supabase Auth**: Primary authentication via `auth.users`
- **Profile Extension**: User data extended via `public.profiles`
- **No Dependencies**: Authentication doesn't rely on `public.users`

### ❌ **Critical Foreign Key Dependencies**

#### **Tables with Foreign Keys to `public.users`:**
```sql
-- 1. sessions table
sessions.user_id → users.id (CASCADE DELETE)

-- 2. audit_logs table  
audit_logs.user_id → users.id (CASCADE DELETE)

-- 3. export_history table
export_history.user_id → users.id (CASCADE DELETE)
```

#### **Migration Blockers:**
- **Sessions**: 0 records (safe to migrate)
- **Audit Logs**: Unknown count (needs investigation)
- **Export History**: Unknown count (needs investigation)

---

## 2. Data Consistency Analysis

### **Current State:**
- **`public.users`**: 1 record (`dev@cent` - development user)
- **`auth.users`**: 7 real users with proper authentication
- **`public.profiles`**: 7 records linked to `auth.users` via `user_id`

### **Data Mapping:**
```sql
-- Current relationship
auth.users.id = public.profiles.user_id
public.users.id = sessions.user_id (legacy)
public.users.id = audit_logs.user_id (legacy)  
public.users.id = export_history.user_id (legacy)
```

### **Target Relationship:**
```sql
-- Target relationship (after migration)
auth.users.id = public.profiles.user_id
auth.users.id = sessions.user_id (migrated)
auth.users.id = audit_logs.user_id (migrated)
auth.users.id = export_history.user_id (migrated)
```

---

## 3. Migration Plan

### **Phase 1: Data Investigation (1 day)**

#### **Step 1.1: Audit Foreign Key Data**
```sql
-- Check if foreign key tables have data
SELECT COUNT(*) FROM sessions WHERE user_id IS NOT NULL;
SELECT COUNT(*) FROM audit_logs WHERE user_id IS NOT NULL;  
SELECT COUNT(*) FROM export_history WHERE user_id IS NOT NULL;

-- Check for orphaned records
SELECT COUNT(*) FROM sessions s 
LEFT JOIN public.users u ON s.user_id = u.id 
WHERE u.id IS NULL;

SELECT COUNT(*) FROM audit_logs a
LEFT JOIN public.users u ON a.user_id = u.id
WHERE u.id IS NULL;

SELECT COUNT(*) FROM export_history e
LEFT JOIN public.users u ON e.user_id = u.id  
WHERE u.id IS NULL;
```

#### **Step 1.2: Identify Data Mapping**
```sql
-- Map public.users to auth.users (if any exist)
SELECT 
  pu.id as public_user_id,
  pu.email as public_email,
  au.id as auth_user_id,
  au.email as auth_email
FROM public.users pu
LEFT JOIN auth.users au ON pu.email = au.email;
```

### **Phase 2: Foreign Key Migration (2-3 days)**

#### **Step 2.1: Update Sessions Table**
```sql
-- Add new foreign key to auth.users (if sessions have data)
ALTER TABLE sessions 
ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Migrate data (if needed)
UPDATE sessions s
SET auth_user_id = au.id
FROM auth.users au
WHERE s.user_id = au.id;

-- Drop old foreign key and column
ALTER TABLE sessions DROP CONSTRAINT sessions_user_id_users_id_fk;
ALTER TABLE sessions DROP COLUMN user_id;
ALTER TABLE sessions RENAME COLUMN auth_user_id TO user_id;
```

#### **Step 2.2: Update Audit Logs Table**
```sql
-- Add new foreign key to auth.users
ALTER TABLE audit_logs
ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Migrate data (if needed)
UPDATE audit_logs a
SET auth_user_id = au.id  
FROM auth.users au
WHERE a.user_id = au.id;

-- Drop old foreign key and column
ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_user_id_users_id_fk;
ALTER TABLE audit_logs DROP COLUMN user_id;
ALTER TABLE audit_logs RENAME COLUMN auth_user_id TO user_id;
```

#### **Step 2.3: Update Export History Table**
```sql
-- Add new foreign key to auth.users
ALTER TABLE export_history
ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Migrate data (if needed)
UPDATE export_history e
SET auth_user_id = au.id
FROM auth.users au  
WHERE e.user_id = au.id;

-- Drop old foreign key and column
ALTER TABLE export_history DROP CONSTRAINT export_history_user_id_users_id_fk;
ALTER TABLE export_history DROP COLUMN user_id;
ALTER TABLE export_history RENAME COLUMN auth_user_id TO user_id;
```

### **Phase 3: Schema Cleanup (1 day)**

#### **Step 3.1: Update Drizzle Schema**
```typescript
// backend/src/database/schema.ts
// Remove users table definition
// Update foreign key references in sessions, audit_logs, export_history
// Update relations to reference auth.users instead of users
```

#### **Step 3.2: Remove Users Table**
```sql
-- Drop the public.users table
DROP TABLE public.users CASCADE;
```

#### **Step 3.3: Update RLS Policies**
```sql
-- Update any RLS policies that reference public.users
-- Ensure all policies use auth.users or public.profiles
```

### **Phase 4: Code Updates (1 day)**

#### **Step 4.1: Update Type Definitions**
```typescript
// Remove User, NewUser types from schema.ts
// Update any code that references users table
// Ensure all user data comes from auth.users + profiles
```

#### **Step 4.2: Update Relations**
```typescript
// Update Drizzle relations to use auth.users
// Remove usersRelations export
// Update any code that uses users relations
```

---

## 4. Risk Assessment

### 🟢 **Low Risk**
- **Frontend**: No changes needed (already uses auth + profiles)
- **API Endpoints**: No changes needed (already uses profiles)
- **Authentication**: No changes needed (already uses auth.users)

### 🟡 **Medium Risk**  
- **Foreign Key Migration**: Data loss if migration fails
- **Schema Updates**: Breaking changes to Drizzle schema
- **RLS Policies**: Security policies may need updates

### 🔴 **High Risk**
- **Data Loss**: If foreign key tables have important data
- **Downtime**: Migration requires database schema changes
- **Rollback**: Difficult to rollback once users table is dropped

---

## 5. Rollback Plan

### **If Migration Fails:**
1. **Restore Foreign Keys**: Re-add foreign key constraints to `public.users`
2. **Restore Data**: Restore any migrated data from backups
3. **Revert Schema**: Restore original Drizzle schema
4. **Test System**: Ensure system works with original setup

### **Rollback Commands:**
```sql
-- Restore foreign keys (if needed)
ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_users_id_fk 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_users_id_fk
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE export_history ADD CONSTRAINT export_history_user_id_users_id_fk  
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

---

## 6. Testing Strategy

### **Pre-Migration Tests:**
- [ ] Verify no direct usage of `public.users` in codebase
- [ ] Test all authentication flows work correctly
- [ ] Test profile management works correctly
- [ ] Verify foreign key data integrity

### **Post-Migration Tests:**
- [ ] Test authentication flows
- [ ] Test profile management
- [ ] Test session creation/management
- [ ] Test audit logging
- [ ] Test export functionality
- [ ] Verify RLS policies work correctly

### **Integration Tests:**
- [ ] End-to-end user registration flow
- [ ] End-to-end profile management
- [ ] End-to-end session management
- [ ] Multi-user scenarios

---

## 7. Timeline & Effort

### **Total Effort: 5-6 days**

| Phase | Duration | Effort | Risk |
|-------|----------|--------|------|
| **Phase 1**: Data Investigation | 1 day | Low | Low |
| **Phase 2**: Foreign Key Migration | 2-3 days | Medium | Medium |
| **Phase 3**: Schema Cleanup | 1 day | Low | Low |
| **Phase 4**: Code Updates | 1 day | Low | Low |

### **Dependencies:**
- Database backup before migration
- Staging environment for testing
- Rollback plan ready
- Team coordination for deployment

---

## 8. Recommendations

### **Immediate Actions:**
1. **Run data investigation queries** to understand foreign key data
2. **Create database backup** before any changes
3. **Test migration on staging** environment first
4. **Prepare rollback plan** and test it

### **Long-term Benefits:**
- **Simplified Architecture**: Single source of truth for user data
- **Better Security**: Leverage Supabase Auth features
- **Easier Maintenance**: Fewer tables to manage
- **Consistent Data**: No sync issues between tables

### **Alternative Approach:**
If foreign key tables have significant data, consider:
1. **Gradual Migration**: Migrate foreign keys one at a time
2. **Data Archival**: Archive old data before migration
3. **Hybrid Approach**: Keep `public.users` for legacy data, use `auth.users` for new data

---

## 9. Conclusion

The `public.users` table is **ready for removal** from a code perspective, but **foreign key dependencies** require careful migration. The migration is **low risk** if foreign key tables are empty, but **medium risk** if they contain important data.

**Recommendation**: Proceed with migration after data investigation confirms foreign key tables are safe to migrate.

---

*This audit was conducted on the `fix/supabase-duplicate-user` branch and represents the current state of the database implementation.*
