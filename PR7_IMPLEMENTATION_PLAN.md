# PR7 — DB Migrations + RLS (Staging First)

## Goal
Add tables and RLS with deny-by-default, but in staging first.

## Changes Made

### 1. Database Schema Updates (`backend/src/database/schema.ts`)
**Purpose**: Add profiles and memberships tables with proper relations

**Key Features**:
- ✅ Added `profiles` table with user_id, display_name, locale, consent fields
- ✅ Added `memberships` table with user_id, clinic_id, role, active fields
- ✅ Added `clinic_id` columns to sessions and audit_logs tables
- ✅ Updated all relations to include new tables
- ✅ Added proper foreign key constraints and unique constraints
- ✅ Added TypeScript types for new tables

**Schema Changes**:
```typescript
// New tables
profiles(user_id PK, display_name, locale enum, consent_pipeda, consent_marketing, timestamps)
memberships(id PK, user_id, clinic_id, role enum, active, timestamps, UNIQUE(user_id, clinic_id))

// Updated tables
sessions(+ clinic_id FK)
audit_logs(+ clinic_id FK)
```

### 2. Database Configuration (`backend/drizzle.config.ts`) - NEW
**Purpose**: Configure Drizzle ORM for migrations

**Key Features**:
- ✅ PostgreSQL dialect configuration
- ✅ Schema and output directory setup
- ✅ Environment variable support for database URL

### 3. Database Connection (`backend/src/database/connection.ts`) - NEW
**Purpose**: Centralized database connection management

**Key Features**:
- ✅ Drizzle ORM setup with schema
- ✅ Connection pooling configuration
- ✅ Graceful shutdown handling
- ✅ Environment variable support

### 4. Database Setup Script (`backend/src/database/setup.ts`) - NEW
**Purpose**: Automated migration and RLS policy application

**Key Features**:
- ✅ Runs Drizzle migrations automatically
- ✅ Applies RLS policies from SQL file
- ✅ Error handling and logging
- ✅ Can be run independently or as part of setup

### 5. Profile Routes Update (`backend/src/routes/profile.ts`)
**Purpose**: Replace temporary storage with database operations

**Key Features**:
- ✅ Database queries using Drizzle ORM
- ✅ Automatic profile creation for new users
- ✅ Proper error handling and validation
- ✅ Maintains backward compatibility
- ✅ Type-safe database operations

**API Changes**:
- `GET /api/profile` - Now reads from database, creates default if missing
- `PATCH /api/profile` - Now updates database with proper validation

### 6. Migration Files (`backend/drizzle/`)
**Purpose**: Database schema changes

**Generated Files**:
- ✅ `0000_mean_loners.sql` - Initial schema creation
- ✅ `0001_secret_ultragirl.sql` - Added clinic_id columns

### 7. RLS Policies (`backend/drizzle/rls_policies.sql`) - NEW
**Purpose**: Row Level Security policies for multi-tenant data isolation

**Key Features**:
- ✅ Enable RLS on all tables
- ✅ Profile policies: users can only access own profile
- ✅ Membership policies: users can view own memberships
- ✅ Session policies: users can access clinic sessions
- ✅ Transcript policies: users can access session transcripts
- ✅ Template policies: users can access clinic templates
- ✅ Audit log policies: users can view relevant logs
- ✅ Export history policies: users can access relevant exports

**Security Model**:
- Users can only access their own profiles
- Users can access clinic data if they have active membership
- Cross-clinic access is denied by default
- All policies use `auth.uid()` for user identification

### 8. Package.json Scripts Update (`backend/package.json`)
**Purpose**: Database management commands

**New Scripts**:
- ✅ `db:setup` - Run migrations and apply RLS policies
- ✅ `db:migrate` - Alias for db:setup
- ✅ `db:generate` - Generate new migrations

## Manual Test Checklist

### ✅ Smoke Test 1: Database Setup
- [ ] Run `npm run db:setup` in backend directory
- [ ] Verify migrations run without errors
- [ ] Verify RLS policies are applied
- [ ] Check database tables are created correctly

### ✅ Smoke Test 2: Profile API (Database)
- [ ] Start backend server
- [ ] Call `GET /api/profile` - should return default profile
- [ ] Call `PATCH /api/profile` with valid data - should update database
- [ ] Call `GET /api/profile` again - should return updated data
- [ ] Restart server and verify data persists

### ✅ Smoke Test 3: Existing Functionality
- [ ] Verify all existing API endpoints still work
- [ ] Verify WebSocket connections still work
- [ ] Verify frontend profile page still works
- [ ] Verify no breaking changes to existing features

### ✅ Smoke Test 4: RLS Policies (Staging)
- [ ] Deploy to staging environment
- [ ] Test cross-clinic access is denied
- [ ] Test same-clinic access is allowed
- [ ] Test profile isolation works correctly
- [ ] Verify app behavior unchanged when flags OFF

### ✅ Smoke Test 5: Production Deployment
- [ ] After staging verification, deploy to production
- [ ] Run migrations in production
- [ ] Apply RLS policies in production
- [ ] Verify all functionality works in production

## Rollback Plan

### Immediate Rollback (if issues occur)
1. **Database Issues**: 
   - Set `AUTH_REQUIRED=false` to disable auth checks
   - Profile API will fall back to temporary storage
   - No data loss, just temporary functionality reduction

2. **RLS Issues**:
   - Disable RLS policies in Supabase dashboard
   - `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
   - Re-enable when issues are resolved

3. **Migration Issues**:
   - Revert migration files if needed
   - Restore from backup if data corruption occurs
   - Roll back to previous database schema

### Code Rollback
1. **Profile Routes**: Revert to temporary storage version
2. **Schema Changes**: Revert schema.ts to previous version
3. **Dependencies**: Remove new database files if needed

## Environment Variables Required

### New Variables
```env
# Database Configuration (required for PR7)
DATABASE_URL=postgresql://username:password@host:port/database
# OR use Supabase connection string
SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

### Updated Variables
```env
# Existing variables remain the same
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## File Structure
```
backend/
├── drizzle.config.ts              # Drizzle configuration
├── drizzle/
│   ├── 0000_mean_loners.sql      # Initial migration
│   ├── 0001_secret_ultragirl.sql # Schema updates
│   └── rls_policies.sql          # RLS policies
├── src/
│   ├── database/
│   │   ├── connection.ts         # Database connection
│   │   ├── setup.ts             # Migration runner
│   │   └── schema.ts            # Updated schema
│   └── routes/
│       └── profile.ts           # Updated profile routes
└── package.json                 # Updated scripts
```

## Next Steps (PR8)
- Expand HTTP protection to all API endpoints
- Remove legacy environment variables
- Add comprehensive audit logging
- Clean up temporary code and TODOs

## Security Considerations
- RLS policies enforce clinic-level data isolation
- Profile data is user-scoped only
- All database operations are type-safe
- No sensitive data in logs
- Graceful fallback to temporary storage if needed

## Performance Considerations
- Database connection pooling configured
- Efficient queries with proper indexing
- RLS policies optimized for common access patterns
- Minimal impact on existing functionality

