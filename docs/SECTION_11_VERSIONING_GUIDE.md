# Section 11 Versioning Guide

## Current Versioning Behavior

### ⚠️ Important Limitation

**When you update version `1.0.0`, you overwrite the previous state of that version.**

- ✅ You CAN rollback to a different version (e.g., `1.0.0` → `1.0.1`)
- ❌ You CANNOT rollback to a previous state of the same version (e.g., earlier state of `1.0.0`)

### How Versioning Works

1. **Multiple Versions**: The system supports multiple versions (e.g., `1.0.0`, `1.0.1`, `1.1.0`)
2. **Version Storage**: Each version has its own artifacts in Supabase Storage
3. **Version Resolution**: The resolver can load specific versions by semver
4. **Default Version**: One version can be set as default

## Best Practices for Versioning

### ✅ Recommended: Create New Version for Changes

When you update a prompt file, create a new version to preserve history:

```bash
# Update the version in upload-section11-bundle.ts
const version = '1.0.1';  // Increment patch version for prompt updates
```

**Benefits:**
- ✅ Preserves previous version (`1.0.0`) in storage
- ✅ Can rollback to `1.0.0` if needed
- ✅ Clear version history
- ✅ Can compare versions

### ⚠️ Current Behavior: Overwrite Same Version

If you update `1.0.0`:
- ❌ Previous state of `1.0.0` is lost
- ❌ Cannot rollback to previous state
- ✅ Only the latest state of `1.0.0` is available

## How to Rollback to a Previous Version

### Option 1: Change Default Version

If you have multiple versions (e.g., `1.0.0` and `1.0.1`), you can:
1. Set a different version as default in the database
2. Or specify the version when calling the API: `templateVersion: '1.0.0'`

### Option 2: Re-upload Previous Version

If you have the previous files locally:
1. Restore the previous prompt file
2. Upload with the same version number (will overwrite)

## Current State

**Version `1.0.0`**: Contains the updated prompt (with clean headers)

**To preserve history for future updates:**
- Create version `1.0.1` for the next update
- Or use semantic versioning:
  - `1.0.1` = patch (prompt fixes)
  - `1.1.0` = minor (new features)
  - `2.0.0` = major (breaking changes)

## Example: Creating a New Version

```typescript
// In upload-section11-bundle.ts
const version = '1.0.1';  // New version for prompt update
const setAsDefault = true;  // Set as new default
```

This will:
1. Create version `1.0.1` in database
2. Upload all artifacts to `section11-rd/1.0.1/`
3. Set `1.0.1` as default
4. Preserve `1.0.0` in storage

## Version Resolution

The system resolves versions in this order:
1. Explicit version parameter (e.g., `templateVersion: '1.0.0'`)
2. Default version from database
3. Alias resolution (`stable`, `latest`)
4. Fallback to `current` (local manifest)

