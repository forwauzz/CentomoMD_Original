-- ============================================================================
-- Supabase Storage Bucket Setup
-- Phase 1: Create 'template-artifacts' bucket with proper policies
-- ============================================================================
--
-- Instructions:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. This creates the Storage bucket and policies for template artifacts
-- 3. Bucket will be private (authenticated access only)
-- 4. Region: ca-central-1 (compliance requirement)
--
-- ============================================================================

-- 1) Create the Storage bucket (if using Supabase Storage API via SQL)
-- Note: In Supabase, buckets are typically created via Dashboard or Storage API
-- This SQL shows the policies; bucket creation may need to be done via Dashboard
--
-- To create bucket via Dashboard:
-- 1. Go to Storage > New bucket
-- 2. Name: template-artifacts
-- 3. Public: No (private bucket)
-- 4. File size limit: 50MB (artifacts are small text files)
-- 5. Allowed MIME types: text/markdown, application/json, application/xml, application/x-ndjson
--
-- Alternatively, use Supabase Storage API (Node.js):
-- const { data, error } = await supabase.storage.createBucket('template-artifacts', {
--   public: false,
--   fileSizeLimit: 52428800, // 50MB
--   allowedMimeTypes: ['text/markdown', 'application/json', 'application/xml', 'application/x-ndjson']
-- });

-- 2) Create RLS policies for bucket access
-- Note: These policies apply to the storage.objects table after bucket is created

-- Policy: Service role can upload artifacts (for bundle upload script)
CREATE POLICY "Service role can upload template artifacts"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (
  bucket_id = 'template-artifacts'
);

-- Policy: Authenticated users can read artifacts (for resolver)
CREATE POLICY "Authenticated users can read template artifacts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'template-artifacts'
);

-- Policy: Service role can read artifacts (for resolver and management)
CREATE POLICY "Service role can read template artifacts"
ON storage.objects FOR SELECT
TO service_role
USING (
  bucket_id = 'template-artifacts'
);

-- Policy: Service role can delete artifacts (for cleanup/management)
CREATE POLICY "Service role can delete template artifacts"
ON storage.objects FOR DELETE
TO service_role
USING (
  bucket_id = 'template-artifacts'
);

-- Policy: Service role can update artifacts (for management)
CREATE POLICY "Service role can update template artifacts"
ON storage.objects FOR UPDATE
TO service_role
USING (
  bucket_id = 'template-artifacts'
);

-- ============================================================================
-- Verification
-- ============================================================================

-- Check bucket exists (via Dashboard or Storage API)
-- SELECT * FROM storage.buckets WHERE name = 'template-artifacts';

-- Check policies exist
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================================================
-- Alternative: Create bucket via Supabase Dashboard (Recommended)
-- ============================================================================
--
-- 1. Open Supabase Dashboard
-- 2. Go to Storage > Buckets
-- 3. Click "New bucket"
-- 4. Configure:
--    - Name: template-artifacts
--    - Public: No (private bucket)
--    - File size limit: 50MB
--    - Allowed MIME types: text/markdown, application/json, application/xml, application/x-ndjson
-- 5. Click "Create bucket"
--
-- Then run the RLS policies above to configure access.
--
-- ============================================================================

