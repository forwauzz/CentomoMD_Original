# Step 2: Create Supabase Storage Bucket

## Instructions

### Option A: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project
   - Navigate to **Storage** in the left sidebar

2. **Create New Bucket**
   - Click **"New bucket"** or **"+ Create bucket"**
   - Configure the bucket:
     - **Name**: `template-artifacts`
     - **Public**: **No** (private bucket - authenticated access only)
     - **File size limit**: `50MB` (or `52428800` bytes)
     - **Allowed MIME types**: 
       - `text/markdown`
       - `application/json`
       - `application/xml`
       - `application/x-ndjson`
   - Click **"Create bucket"**

3. **Run RLS Policies**
   - After bucket is created, run the SQL from `backend/sql/create_storage_bucket.sql` in your Supabase SQL Editor
   - This creates the policies for authenticated and service role access

### Option B: Via TypeScript Script

1. **Ensure Environment Variables**
   ```bash
   # In backend/.env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Run the Script**
   ```bash
   cd backend
   npx tsx scripts/setup-storage-bucket.ts
   ```

3. **Run RLS Policies**
   - After bucket is created, run the SQL from `backend/sql/create_storage_bucket.sql` in your Supabase SQL Editor

---

## Verification

After creating the bucket and running policies, verify:

```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE name = 'template-artifacts';

-- Check policies exist
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%template artifacts%';
```

Expected results:
- Bucket `template-artifacts` exists
- 5 policies created (upload, read authenticated, read service, delete, update)

---

## Next Steps

After bucket is created and policies are set:
- ✅ Step 1: Postgres schema ✅ Complete
- ✅ Step 2: Storage bucket ⏳ In Progress
- ⏳ Step 3: Extend PromptBundleResolver
- ⏳ Step 4: Add fallback chain
- ⏳ Step 5: Bundle upload script

