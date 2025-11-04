# Version Selection - Backward Compatibility Guarantees

## Overview

The template version selection feature is designed to be **100% backward compatible** with existing endpoints and functionality. This document outlines the safety mechanisms in place.

## Safety Mechanisms

### 1. Optional Parameter Design

**All version parameters are optional:**

```typescript
// ProcessingRequest interface
templateVersion?: string;  // Optional - undefined is safe

// Resolver functions
resolveSection7AiPaths(language: Language, version?: string)  // Optional
resolveSection7RdPaths(version?: string)  // Optional

// Service methods
formatSection7Content(..., templateVersion?: string)  // Optional
processInput(..., templateVersion?: string)  // Optional
```

**Impact:** Existing calls without `templateVersion` continue to work unchanged.

### 2. Feature Flag Gating

**Two-layer feature flag protection:**

#### Layer 1: `FEATURE_TEMPLATE_VERSION_SELECTION`
- **Purpose:** Controls whether versioning is used at all
- **When disabled (`false`):**
  - Services use **hardcoded filesystem paths** (original behavior)
  - Resolvers are **never called**
  - Zero impact on existing functionality

```typescript
// section7AI.ts
if (FLAGS.FEATURE_TEMPLATE_VERSION_SELECTION) {
  // Use resolver (new path)
  const resolved = await resolveSection7AiPaths(language, templateVersion);
} else {
  // Use hardcoded paths (original behavior)
  masterPromptPath = join(basePath, 'section7_master.md');
  // ...
}
```

#### Layer 2: `FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE`
- **Purpose:** Controls whether remote (Supabase) resolution is used
- **When disabled (`false`):**
  - Resolvers skip remote database queries
  - Fall back to local manifest or filesystem
  - No database dependencies

```typescript
// PromptBundleResolver.ts
if (FLAGS.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE) {
  // Try remote first
  // ... database queries ...
} else {
  // Skip remote, use local manifest
}

// Fallback to local manifest
const manifest = readManifest('section7');
// ... local resolution ...
```

**Impact:** When flags are disabled, behavior matches original implementation.

### 3. Fallback Chain

**When `templateVersion` is `undefined` or not provided:**

```
1. Check if version parameter provided
   ↓ (if no)
2. Get default version from database (if flag enabled)
   ↓ (if no default)
3. Try 'stable' alias → 'latest' alias
   ↓ (if no bundles in DB)
4. Use 'current' → local manifest
   ↓ (if no manifest)
5. Fall back to filesystem defaults (original paths)
```

**Key Points:**
- Each step is **safe** and handles `undefined` gracefully
- Final fallback is **identical** to original hardcoded paths
- No breaking changes possible

### 4. Existing Endpoint Behavior

**All existing calls work unchanged:**

#### `/api/format/mode2` (main dictation endpoint)
- **Current:** No `templateVersion` in request
- **After update:** `templateVersion` optional, defaults to bundle default
- **Behavior:** Identical when `templateVersion` not provided

#### `/api/analyze/ab-test`
- **Current:** No `templateVersion` for either template
- **After update:** `templateVersionA` and `templateVersionB` optional
- **Behavior:** Identical when versions not provided

#### `/api/benchmark`
- **Current:** No `templateVersion` in combinations
- **After update:** `templateVersion` optional per combination
- **Behavior:** Identical when versions not provided

#### ProcessingOrchestrator.processContent()
- **Current:** Called without `templateVersion`
- **After update:** `templateVersion` optional in interface
- **Behavior:** 
  - If `undefined` → uses default version resolution
  - If flag disabled → uses original hardcoded paths
  - **Identical behavior to before**

### 5. TypeScript Type Safety

**All parameters properly typed as optional:**

```typescript
// ✅ Safe - optional parameter
templateVersion?: string

// ✅ Safe - can be undefined
if (version) { ... }  // Checks for undefined
version || 'default'  // Handles undefined

// ✅ Safe - function accepts undefined
resolveSection7AiPaths(language, undefined)  // Works fine
```

**Impact:** TypeScript compiler ensures type safety at compile time.

### 6. Error Handling

**All resolver operations are wrapped in try-catch:**

```typescript
// Remote resolution
try {
  // ... database queries ...
} catch (error) {
  console.error(`[PROOF] Remote resolution failed, falling back to local:`, error);
  // Fall through to local manifest (no error thrown)
}

// Local manifest fallback
if (!manifest) {
  // Fall back to filesystem defaults (no error thrown)
  return { ...defaults, versionUsed: 'none', source: 'filesystem' };
}
```

**Impact:** Database failures don't break endpoints - graceful fallback.

## Testing Strategy

### Backward Compatibility Tests

1. **Test with flags disabled:**
   ```typescript
   // FEATURE_TEMPLATE_VERSION_SELECTION = false
   // Should use hardcoded paths (original behavior)
   ```

2. **Test with undefined templateVersion:**
   ```typescript
   // templateVersion = undefined
   // Should use default version resolution
   ```

3. **Test existing endpoints:**
   ```typescript
   // Call /api/format/mode2 without templateVersion
   // Should work identically to before
   ```

4. **Test fallback chain:**
   ```typescript
   // Simulate database failure
   // Should fall back to local manifest → filesystem
   ```

## Migration Path

### Phase 1: Add support (Current)
- ✅ Add optional `templateVersion` parameter
- ✅ Implement resolver with fallbacks
- ✅ Gate behind feature flags
- ✅ **No breaking changes**

### Phase 2: Enable gradually (Future)
- Enable `FEATURE_TEMPLATE_VERSION_SELECTION` per environment
- Enable `FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE` when ready
- Monitor for issues

### Phase 3: Full adoption (Future)
- All endpoints support version selection
- Default versions configured
- Rollback capability available

## Summary

✅ **100% backward compatible**
- Optional parameters
- Feature flag gating
- Graceful fallbacks
- Type-safe implementation
- Error handling

✅ **No breaking changes possible**
- Existing calls work unchanged
- New calls add optional functionality
- Flags can be disabled instantly

✅ **Safe to deploy**
- Can be deployed with flags disabled
- Can be enabled gradually
- Can be rolled back instantly

