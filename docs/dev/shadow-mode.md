# Shadow Mode - Universal Cleanup Comparison

Shadow Mode is a development-only feature that runs both the legacy and universal cleanup paths in parallel to compare their outputs and ensure the new implementation produces equivalent results.

## Overview

When enabled, Shadow Mode will:
- Run both legacy and universal cleanup paths on the same input
- Compare the formatted outputs using checksums
- Compare clinical entities extraction results
- Log detailed comparison results to the console
- Include comparison data in API responses (development only)

## Enabling Shadow Mode

### Environment Variable

Set the following environment variable to enable shadow mode:

```bash
UNIVERSAL_CLEANUP_SHADOW=true
```

### Important Notes

- **Development Only**: Shadow mode only runs when `NODE_ENV=development`
- **Performance Impact**: Running both paths doubles processing time
- **Default OFF**: Shadow mode is disabled by default in production
- **Logging**: Results are logged to console for analysis

## Configuration

Add to your `.env` file:

```env
# Universal Cleanup Feature Flag
UNIVERSAL_CLEANUP_ENABLED=false

# Shadow Mode (dev-only) - compares legacy vs universal cleanup outputs
UNIVERSAL_CLEANUP_SHADOW=true
```

## What Gets Compared

### 1. Formatted Text
- **Checksum Comparison**: SHA-256 checksums of both formatted outputs
- **Match Status**: Whether the formatted text is identical

### 2. Clinical Entities
- **Key Comparison**: Lists of clinical entity keys from both paths
- **Missing Keys**: Keys present in legacy but not in universal
- **Extra Keys**: Keys present in universal but not in legacy
- **Match Status**: Whether clinical entities are equivalent

### 3. Performance Metrics
- **Processing Time**: Total time for both paths to complete
- **Timestamp**: When the comparison was performed

## Console Output

When shadow mode is active, you'll see detailed comparison logs:

```
🔍 SHADOW MODE COMPARISON:
==================================================
⏱️  Processing Time: 1250ms
📝 Formatted Text Checksums:
   Legacy:    a1b2c3d4e5f6g7h8
   Universal: a1b2c3d4e5f6g7h8
   Match:     ✅

🏥 Clinical Entities:
   Legacy Keys:    [injury_location, pain_severity, language]
   Universal Keys: [injury_location, pain_severity, language]
   Match:          ✅
==================================================
```

## API Response

In development mode, the API response includes shadow comparison data:

```json
{
  "formatted": "Formatted transcript text...",
  "issues": [],
  "sources_used": ["universal-cleanup"],
  "confidence_score": 0.95,
  "clinical_entities": { ... },
  "success": true,
  "shadowComparison": {
    "legacyFormatted": "Legacy formatted text...",
    "universalFormatted": "Universal formatted text...",
    "legacyChecksum": "a1b2c3d4e5f6g7h8",
    "universalChecksum": "a1b2c3d4e5f6g7h8",
    "checksumMatch": true,
    "legacyClinicalEntities": { ... },
    "universalClinicalEntities": { ... },
    "clinicalEntitiesMatch": true,
    "missingKeys": [],
    "extraKeys": [],
    "processingTimeMs": 1250,
    "timestamp": "2025-01-17T12:26:00.000Z"
  }
}
```

## Troubleshooting

### No Shadow Comparison in Response
- Ensure `NODE_ENV=development`
- Verify `UNIVERSAL_CLEANUP_SHADOW=true`
- Check console logs for shadow mode activation

### Checksum Mismatches
- Review formatted text differences
- Check for whitespace or formatting variations
- Verify template processing consistency

### Clinical Entities Mismatches
- Compare key structures between legacy and universal
- Check for missing or extra entity fields
- Verify language detection consistency

## Disabling Shadow Mode

To disable shadow mode:

```bash
UNIVERSAL_CLEANUP_SHADOW=false
```

Or remove the environment variable entirely (defaults to false).

## Implementation Details

Shadow mode is implemented in:
- `backend/src/services/shadow/ShadowComparison.ts` - Comparison logic
- `backend/src/services/shadow/ShadowModeHook.ts` - Integration hook
- `backend/src/index.ts` - API endpoint integration
- `backend/src/config/env.ts` - Configuration

The shadow mode runs both paths independently to ensure accurate comparison without interference.
