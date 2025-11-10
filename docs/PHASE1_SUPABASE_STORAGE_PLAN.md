# Phase 1: Supabase Storage Integration - Surgical Implementation Plan

**Status:** 📋 Planning  
**Dependencies:** Phase 0 (MVP) ✅ Complete  
**Estimated Time:** 4-6 hours  
**Risk Level:** Medium (requires Supabase setup)

---

## 🎯 Goal

Extend the manifest-based resolver to support Supabase Storage and Postgres as the source of truth for template artifacts, with a fallback chain that ensures zero downtime.

---

## 📋 Implementation Plan (Surgical Steps)

### Step 1: Postgres Schema Migration ⏳
**Goal:** Create tables for template versioning metadata

**Files to Create:**
- `backend/drizzle/migrations/XXXX_template_versioning.sql`
- `backend/src/db/schema/templateVersioning.ts` (if using Drizzle schema files)

**Tables:**
1. `templates` - Template registry
   - `id` (uuid, primary key)
   - `name` (text, e.g., 'section7-ai-formatter')
   - `default_version_id` (uuid, FK to template_versions)
   - `enabled` (boolean, default true)
   - `created_at`, `updated_at` (timestamps)

2. `template_versions` - Version metadata
   - `id` (uuid, primary key)
   - `template_id` (uuid, FK to templates)
   - `semver` (text, e.g., '1.0.0')
   - `status` (text, enum: 'draft'|'stable'|'deprecated')
   - `created_by` (uuid, FK to profiles)
   - `changelog` (text, nullable)
   - `created_at`, `updated_at` (timestamps)

3. `artifacts` - Artifact metadata
   - `id` (uuid, primary key)
   - `template_version_id` (uuid, FK to template_versions)
   - `kind` (text, e.g., 'master_prompt', 'json_config', 'golden_example')
   - `storage_path` (text, Supabase Storage path)
   - `sha256` (text, integrity hash)
   - `size_bytes` (integer)
   - `content_type` (text, e.g., 'text/markdown')
   - `locale` (text, 'fr'|'en'|null)
   - `created_at` (timestamp)

4. `prompts` (if needed separately, or merge with artifacts)
   - `template_version_id` (uuid, FK)
   - `role` (text, 'system'|'manager'|'user')
   - `locale` (text)
   - `storage_path` (text)
   - `sha256` (text)

**Acceptance Criteria:**
- ✅ Migration runs successfully
- ✅ Tables created with proper indexes
- ✅ RLS policies (if needed) configured
- ✅ Schema documented

---

### Step 2: Supabase Storage Bucket Setup ⏳
**Goal:** Create `template-artifacts` bucket with proper policies

**Files to Create:**
- `backend/scripts/setup-template-storage.ts` or SQL migration

**Actions:**
1. Create bucket `template-artifacts` (private)
2. Configure bucket policies:
   - Private access (authenticated users only)
   - Upload: service_role only
   - Download: authenticated users (for resolver)
3. Set bucket region to `ca-central-1` (compliance)
4. Configure lifecycle policies (if needed)

**Acceptance Criteria:**
- ✅ Bucket created successfully
- ✅ Policies configured correctly
- ✅ Region verified (ca-central-1)
- ✅ Test upload/download works

---

### Step 3: Extend PromptBundleResolver ⏳
**Goal:** Add remote source support to resolver

**Files to Modify:**
- `backend/src/services/artifacts/PromptBundleResolver.ts`

**Changes:**
1. Add `resolveSource` enum: `'local' | 'remote' | 'cache' | 'filesystem'`
2. Add Supabase client initialization (if not exists)
3. Add `resolveFromRemote()` method:
   - Query Postgres for template version metadata
   - Fetch artifact metadata (paths, hashes)
   - Download from Supabase Storage
   - Verify SHA256 integrity
   - Cache locally (optional)
4. Update `resolveSection7AiPaths()` to check remote first (if flag enabled)
5. Maintain fallback chain: Remote → Cache → Filesystem

**Acceptance Criteria:**
- ✅ Resolver checks Postgres for manifest
- ✅ Downloads artifacts from Storage
- ✅ Verifies SHA256 hashes
- ✅ Falls back to filesystem if remote fails
- ✅ `[PROOF]` logs show source (remote/local/cache/filesystem)

---

### Step 4: Add Local Cache Layer ⏳
**Goal:** Cache downloaded artifacts locally to reduce Storage calls

**Files to Create/Modify:**
- `backend/src/services/artifacts/ArtifactCache.ts` (new)
- `backend/src/services/artifacts/PromptBundleResolver.ts`

**Implementation:**
1. Create `ArtifactCache` class:
   - Cache directory: `backend/cache/template-artifacts/`
   - Key: `{templateId}/{version}/{artifactKind}_{locale}`
   - Store: file content + metadata (hash, timestamp)
2. Cache logic:
   - Check cache first (if exists and hash matches)
   - If miss: download from Storage, verify, cache
   - Cache expiration: 24 hours (or configurable)
3. Integrate with resolver:
   - Resolver checks cache before downloading
   - Cache invalidates on hash mismatch

**Acceptance Criteria:**
- ✅ Artifacts cached locally after first download
- ✅ Cache used on subsequent requests
- ✅ Cache invalidates on hash mismatch
- ✅ Cache respects expiration

---

### Step 5: Bundle Upload Script ⏳
**Goal:** Script to publish template bundles to Supabase

**Files to Create:**
- `backend/scripts/upload-template-bundle.ts`

**Functionality:**
1. Read local manifest (e.g., `prompts/section7/manifest.json`)
2. Collect all artifacts referenced in manifest
3. Compute SHA256 for each artifact
4. Upload to Supabase Storage:
   - Path: `section7/v1.0.0/section7_master.md`, etc.
5. Insert metadata into Postgres:
   - Create template record (if not exists)
   - Create template_version record
   - Create artifact records
6. Update `defaultVersion` in Postgres (if publishing as default)

**Usage:**
```bash
npm run upload-bundle -- --template section7 --version 1.0.0 --set-default
```

**Acceptance Criteria:**
- ✅ Uploads all artifacts to Storage
- ✅ Inserts metadata into Postgres
- ✅ SHA256 hashes computed and stored
- ✅ Bundle accessible via resolver

---

### Step 6: SHA256 Integrity Checking ⏳
**Goal:** Verify artifact integrity on download

**Files to Modify:**
- `backend/src/services/artifacts/PromptBundleResolver.ts`

**Implementation:**
1. On download from Storage:
   - Compute SHA256 of downloaded content
   - Compare with stored hash from Postgres
   - If mismatch: log error, fallback to filesystem
2. On cache hit:
   - Verify cached file hash matches stored hash
   - If mismatch: invalidate cache, re-download

**Acceptance Criteria:**
- ✅ SHA256 verified on every download
- ✅ Integrity failures logged
- ✅ Fallback to filesystem on hash mismatch

---

### Step 7: Feature Flag for Remote Storage ⏳
**Goal:** Control remote resolver via feature flag

**Files to Modify:**
- `backend/src/config/flags.ts`
- `env.example`

**Implementation:**
1. Add `FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE` flag (default: false)
2. Resolver checks flag:
   - If `false`: Use local manifest only (current behavior)
   - If `true`: Check Postgres → Storage → Cache → Filesystem
3. Document in `env.example`

**Acceptance Criteria:**
- ✅ Flag controls remote resolver activation
- ✅ Default is `false` (safe rollout)
- ✅ Backward compatibility maintained

---

### Step 8: End-to-End Testing ⏳
**Goal:** Validate complete flow

**Test Scenarios:**
1. Upload bundle v1.0.0 to Supabase
2. Resolver fetches from Storage (first time)
3. Verify artifacts loaded correctly
4. Resolver uses cache (second time)
5. Verify integrity checking
6. Test fallback to filesystem (if remote fails)
7. Test rollback (change defaultVersion in Postgres)

**Acceptance Criteria:**
- ✅ All test scenarios pass
- ✅ `[PROOF]` logs show correct source
- ✅ Integrity verified
- ✅ Fallback works correctly

---

## 🔄 Resolver Fallback Chain

```
1. Postgres Manifest (if FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE=true)
   ↓ (if not found or flag disabled)
2. Local Manifest (prompts/section7/manifest.json)
   ↓ (if not found)
3. Local Cache (backend/cache/template-artifacts/)
   ↓ (if cache miss or expired)
4. Supabase Storage Download (if remote enabled)
   ↓ (if download fails)
5. Filesystem Fallback (backend/prompts/...)
```

---

## 📊 Database Schema (Reference)

```sql
-- Templates registry
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  default_version_id UUID REFERENCES template_versions(id),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template versions
CREATE TABLE template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id),
  semver TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'stable', 'deprecated')),
  created_by UUID REFERENCES profiles(id),
  changelog TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, semver)
);

-- Artifacts metadata
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_version_id UUID NOT NULL REFERENCES template_versions(id),
  kind TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  locale TEXT CHECK (locale IN ('fr', 'en')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ✅ Quality Gates

- ✅ TypeScript compilation successful
- ✅ All database migrations run successfully
- ✅ Supabase bucket created and configured
- ✅ Resolver fallback chain works
- ✅ Integrity checking verified
- ✅ Feature flag controls activation
- ✅ Backward compatibility maintained
- ✅ No breaking changes to existing code

---

## 🚦 Risk Mitigation

1. **Supabase Storage Costs**: Monitor usage; artifacts are small text files
2. **Network Latency**: Local cache reduces Storage calls
3. **Storage Failures**: Fallback to filesystem ensures zero downtime
4. **Migration Complexity**: Start with read-only (no writes), then add upload
5. **Data Residency**: Ensure Storage bucket is in `ca-central-1`

---

## 📝 Next Steps After Phase 1

- **Phase 2**: Version aliases (`latest`, `stable`)
- **Phase 3**: Operator-selectable versions
- **Phase 4**: Canarying and A/B benchmarking

---

**Ready to start?** Begin with Step 1 (Postgres Schema Migration) and proceed surgically through each step.

