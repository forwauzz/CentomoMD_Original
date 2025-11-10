# Bundle Upload UI Implementation Plan

## Overview
Add a UI-based bundle upload feature to the Template Combinations page, allowing users to upload template bundles without running CLI scripts.

## Implementation Steps

### 1. Backend API (✅ Completed)
- ✅ `POST /api/templates/bundles/upload` - Upload bundle with artifacts
- ✅ `GET /api/templates/bundles` - List all bundles
- ✅ `GET /api/templates/bundles/:bundleName` - Get bundle details
- ✅ `DELETE /api/templates/bundles/:bundleName/:version` - Delete version

### 2. Frontend Components

#### A. Bundle Upload Tab
Add a new tab "Bundle Management" to TemplateCombinationManagement page:
- Upload form with:
  - Bundle name selector (section7-ai-formatter, section7-rd, section8-ai-formatter)
  - Version input (e.g., "current", "1.0.0")
  - Set as default checkbox
  - File upload area (drag & drop or file picker)
  - Progress indicator
  - Success/error messages

#### B. Bundle List View
- Display all uploaded bundles
- Show versions per bundle
- Artifact count per version
- Actions: View details, Delete version

## Features
1. **File Upload**: Drag & drop or file picker
2. **Progress Tracking**: Real-time upload progress
3. **Validation**: Client-side validation before upload
4. **Error Handling**: Clear error messages
5. **Success Feedback**: Confirmation with bundle details

## Next Steps
1. Add Bundle Management tab to TemplateCombinationManagement
2. Create BundleUpload component
3. Create BundleList component
4. Add API integration
5. Add error handling and validation

