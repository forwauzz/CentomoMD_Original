# Template Bundle Upload Instructions

## Overview

This guide explains how to upload template bundles to Supabase Storage and Postgres for remote resolver support.

## Prerequisites

1. ✅ Postgres schema created (run `backend/sql/template_versioning_setup.sql`)
2. ✅ Storage bucket created (`template-artifacts` with RLS policies)
3. ✅ Supabase credentials configured in `.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Step 1: Upload Bundles

### Option A: Upload All Bundles (Recommended)

```bash
cd backend
npx tsx scripts/upload-template-bundle.ts all current --set-default
```

This will:
- Upload `section7-ai-formatter` bundle (AI formatter artifacts: FR + EN)
- Upload `section7-rd` bundle (R&D artifacts)
- Set `current` version as default for both bundles

### Option B: Upload Single Bundle

```bash
# Upload AI formatter bundle only
npx tsx scripts/upload-template-bundle.ts section7-ai-formatter current --set-default

# Upload R&D bundle only
npx tsx scripts/upload-template-bundle.ts section7-rd current --set-default
```

### Command Syntax

```bash
npx tsx scripts/upload-template-bundle.ts [bundle-name] [version] [options]
```

- `bundle-name`: `section7-ai-formatter` or `section7-rd` or `all`
- `version`: Version from manifest (e.g., `current`, `1.0.0`)
- `--set-default`: Set this version as the default for the bundle

## Step 2: Enable Remote Storage Feature Flag

After uploading, enable the remote resolver:

```bash
# In backend/.env
FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE=true
```

Then restart the backend server.

## Step 3: Test Remote Resolver

Run the end-to-end test:

```bash
cd backend
npx tsx scripts/test-remote-resolver.ts
```

This will:
- Check feature flag
- Verify bundles in Postgres
- Test Section 7 AI Formatter resolver (FR)
- Test Section 7 R&D resolver
- Verify all files are accessible

## What Gets Uploaded?

### Section 7 AI Formatter Bundle (`section7-ai-formatter`)

- **FR artifacts:**
  - `section7_master.md` → `master_prompt`
  - `section7_master.json` → `json_config`
  - `section7_golden_example.md` → `golden_example`

- **EN artifacts:**
  - `section7_master_en.md` → `master_prompt`
  - `section7_master_en.json` → `json_config`
  - `section7_golden_example_en.md` → `golden_example`

### Section 7 R&D Bundle (`section7-rd`)

- `master_prompt_section7.json` → `master_config`
- `system_section7_fr.xml` → `system_xml`
- `plan_section7_fr.xml` → `plan_xml`
- `golden_cases_section7.jsonl` → `golden_cases`

## Storage Structure

Artifacts are stored in Supabase Storage with this structure:

```
template-artifacts/
├── section7-ai-formatter/
│   └── current/
│       ├── section7_master.md
│       ├── section7_master.json
│       ├── section7_golden_example.md
│       ├── section7_master_en.md
│       ├── section7_master_en.json
│       └── section7_golden_example_en.md
└── section7-rd/
    └── current/
        ├── master_prompt_section7.json
        ├── system_section7_fr.xml
        ├── plan_section7_fr.xml
        └── golden_cases_section7.jsonl
```

## Verification

After upload, verify in Supabase:

### Postgres

```sql
-- Check bundles
SELECT * FROM template_bundles;

-- Check versions
SELECT b.name, v.semver, v.status
FROM template_bundles b
JOIN template_bundle_versions v ON b.id = v.template_bundle_id;

-- Check artifacts
SELECT b.name, v.semver, a.kind, a.storage_path, a.sha256
FROM template_bundles b
JOIN template_bundle_versions v ON b.id = v.template_bundle_id
JOIN template_bundle_artifacts a ON v.id = a.template_bundle_version_id
ORDER BY b.name, v.semver, a.kind;
```

### Storage

In Supabase Dashboard → Storage → `template-artifacts`:
- Verify files exist in `section7-ai-formatter/current/` and `section7-rd/current/`
- Check file sizes match local files

## Troubleshooting

### Error: "Manifest not found"
- Ensure `prompts/section7/manifest.json` exists
- Check script is run from `backend/` directory

### Error: "File not found"
- Verify artifact paths in manifest are correct
- Check files exist in `backend/prompts/`, `backend/configs/`, `backend/training/`

### Error: "Failed to upload"
- Verify Storage bucket exists and RLS policies are set
- Check `SUPABASE_SERVICE_ROLE_KEY` has upload permissions

### Error: "No bundles found"
- Run upload script first
- Check Postgres connection

### Resolver falls back to local
- Verify feature flag is enabled: `FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE=true`
- Check Postgres has bundle metadata
- Verify Storage has artifacts
- Check resolver logs for `[PROOF]` messages

## Next Steps

After successful upload and testing:
1. ✅ Bundles uploaded to Storage
2. ✅ Metadata in Postgres
3. ✅ Feature flag enabled
4. ✅ Resolver tested

The resolver will now:
- Try remote first (Postgres + Storage)
- Fallback to cache (24-hour TTL)
- Fallback to local manifest
- Fallback to filesystem paths

