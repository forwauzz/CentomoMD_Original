# Final User Architecture Flowchart

## 🎯 **Target Architecture After Migration**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE AUTH LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   auth.users    │    │ auth.sessions   │    │ auth.identities │            │
│  │                 │    │                 │    │                 │            │
│  │ • id (UUID)     │    │ • user_id →     │    │ • user_id →     │            │
│  │ • email         │    │   auth.users.id │    │   auth.users.id │            │
│  │ • phone         │    │ • access_token  │    │ • provider      │            │
│  │ • password_hash │    │ • refresh_token │    │ • identity_data │            │
│  │ • user_metadata │    │ • expires_at    │    │                 │            │
│  │ • created_at    │    │                 │    │                 │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│           │                                                                     │
│           │ 1:1 relationship                                                    │
│           ▼                                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ auth.users.id = profiles.user_id
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION DATA LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐                                                           │
│  │ public.profiles │                                                           │
│  │                 │                                                           │
│  │ • user_id (PK)  │ ←─── References auth.users.id                            │
│  │ • display_name  │                                                           │
│  │ • locale        │                                                           │
│  │ • consent_*     │                                                           │
│  │ • default_clinic│                                                           │
│  │ • created_at    │                                                           │
│  │ • updated_at    │                                                           │
│  └─────────────────┘                                                           │
│           │                                                                     │
│           │ 1:Many relationships                                                │
│           ▼                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │ public.sessions │    │ public.cases    │    │ public.feedback │            │
│  │                 │    │                 │    │                 │            │
│  │ • user_id →     │    │ • user_id →     │    │ • user_id →     │            │
│  │   auth.users.id │    │   auth.users.id │    │   auth.users.id │            │
│  │ • clinic_id     │    │ • case_uid      │    │ • feedback_id   │            │
│  │ • patient_id    │    │ • patient_data  │    │ • content       │            │
│  │ • status        │    │ • draft_json    │    │ • rating        │            │
│  │ • mode          │    │ • created_at    │    │ • created_at    │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                                   │
│  │ public.audit_   │    │ public.export_  │                                   │
│  │ logs            │    │ history         │                                   │
│  │                 │    │                 │                                   │
│  │ • user_id →     │    │ • user_id →     │                                   │
│  │   auth.users.id │    │   auth.users.id │                                   │
│  │ • action        │    │ • session_id    │                                   │
│  │ • resource_type │    │ • format        │                                   │
│  │ • metadata      │    │ • file_path     │                                   │
│  │ • timestamp     │    │ • created_at    │                                   │
│  └─────────────────┘    └─────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Multi-tenant relationships
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        MULTI-TENANT LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                                   │
│  │ public.clinics  │    │ public.memberships│                                 │
│  │                 │    │                 │                                   │
│  │ • id (UUID)     │    │ • user_id →     │                                   │
│  │ • name          │    │   auth.users.id │                                   │
│  │ • address       │    │ • clinic_id →   │                                   │
│  │ • phone         │    │   clinics.id    │                                   │
│  │ • email         │    │ • role          │                                   │
│  │ • created_at    │    │ • active        │                                   │
│  └─────────────────┘    └─────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 **Data Flow After Migration**

### **1. User Authentication Flow**
```
User Login → Supabase Auth → auth.users → JWT Token
                ↓
        Frontend receives JWT
                ↓
        API calls with JWT → authMiddleware → auth.users.id
                ↓
        Profile lookup → public.profiles (where user_id = auth.users.id)
                ↓
        Display name resolution → resolveDisplayName(profile, authUser)
```

### **2. User Data Access Pattern**
```
Frontend Request → API Endpoint → authMiddleware
                                        ↓
                                Extract user_id from JWT
                                        ↓
                                Query public.profiles
                                        ↓
                                Return profile data
```

### **3. Session/Case Creation Flow**
```
User creates session/case → API validates JWT → Extract auth.users.id
                                        ↓
                                Create record with user_id = auth.users.id
                                        ↓
                                All foreign keys point to auth.users.id
```

## 🎯 **Key Benefits of Final Architecture**

### **✅ Single Source of Truth**
- **Authentication**: `auth.users` (managed by Supabase)
- **Profile Data**: `public.profiles` (application-managed)
- **All References**: Point to `auth.users.id`

### **✅ Clean Data Flow**
- **No Duplication**: No more `public.users` table
- **No Sync Issues**: No need to sync between tables
- **Consistent References**: All foreign keys point to same source

### **✅ Development Benefits**
- **Simpler Queries**: Join `auth.users` + `public.profiles`
- **Clear Ownership**: Each table has clear purpose
- **Easy Debugging**: Single user ID throughout system

### **✅ Security Benefits**
- **RLS Ready**: Can add Row Level Security policies
- **JWT Integration**: `auth.uid()` works seamlessly
- **Audit Trail**: All actions tied to `auth.users.id`

## 🚀 **Migration Impact**

### **Before Migration:**
```
❌ public.users (legacy)
❌ auth.users (auth only)
❌ public.profiles (extensions)
❌ Mixed foreign key references
❌ Sync complexity
❌ "Giles" display issue
```

### **After Migration:**
```
✅ auth.users (single source of truth)
✅ public.profiles (extensions)
✅ All foreign keys point to auth.users.id
✅ No sync needed
✅ Clean display name resolution
✅ Supabase best practices
```

## 🔧 **Implementation Steps**

1. **Clean up orphaned records** (8 development cases)
2. **Add FK constraint** (profiles → auth.users)
3. **Migrate foreign keys** (5 tables → auth.users)
4. **Remove legacy table** (drop public.users)
5. **Update application code** (use auth.users + profiles)
6. **Test display name resolution** (fix "Giles" issue)

**Result**: Clean, maintainable, Supabase-aligned architecture with no legacy baggage.
