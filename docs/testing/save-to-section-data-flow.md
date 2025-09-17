# Testing Save to Section Data Flow

This document explains how to verify that text saved from the dictation interface appears correctly in the respective form sections.

## Overview

The data flow works as follows:
1. User dictates text in the transcription interface
2. User clicks "Save to Section" button
3. User selects section and text box from dropdown
4. Text is saved to the case store
5. Form sections automatically load and display the saved text

## Manual Testing Steps

### Test Section 7 (3 Text Boxes)

1. **Navigate to Dictation Page**
   - Go to the dictation interface
   - Enter some test text in the transcript area

2. **Save to Section 7 - Main Content**
   - Click "Save to Section" button
   - Select "Section 7" from the section dropdown
   - Select "Section 7 - Main Content" from the text box dropdown
   - Click "Save to Selected"
   - Verify success message appears

3. **Verify in Section 7 Form**
   - Navigate to Section 7 form
   - Check that the text appears in the "Main Content" text area
   - Check browser console for logs: `📥 Loading data for section_7: {...}`

4. **Repeat for Patient Verbatim**
   - Go back to dictation
   - Enter different text
   - Save to "Section 7 - Patient Verbatim"
   - Verify it appears in the "Patient Verbatim" text area

5. **Repeat for Radiologist Verbatim**
   - Go back to dictation
   - Enter different text
   - Save to "Section 7 - Radiologist Verbatim"
   - Verify it appears in the "Radiologist Verbatim" text area

### Test Section 8 (Single Large Text Box)

1. **Save to Section 8**
   - In dictation interface, enter test text
   - Click "Save to Section" button
   - Select "Section 8" from the section dropdown
   - Select "Section 8 - Content" from the text box dropdown
   - Click "Save to Selected"

2. **Verify in Section 8 Form**
   - Navigate to Section 8 form
   - Check that the text appears in the large text area
   - Check browser console for logs: `📥 Loading data for section_8: {...}`

### Test Other Sections

1. **Save to Other Section**
   - In dictation interface, enter test text
   - Click "Save to Section" button
   - Select any other section (e.g., "Section 9")
   - Select the text box option
   - Click "Save to Selected"

2. **Verify in Form**
   - Navigate to the selected section form
   - Check that the text appears in the "Observations and Notes" text area

## Console Logs to Watch For

When testing, you should see these console logs:

### When Saving from Dictation:
```
Saving to section: {
  sectionId: "section_7",
  textBoxId: "mainContent",
  transcriptLength: 123,
  sectionData: { ... }
}
✅ Transcript saved to section_7.mainContent
```

### When Loading in Form:
```
📥 Loading data for section_7: { mainContent: "...", ... }
```

### When Form Updates:
```
🔄 Updating form data for section_7: { mainContent: "...", ... }
```

## Expected Behavior

- ✅ Text saved from dictation appears immediately in the form
- ✅ Multiple saves to different text boxes work independently
- ✅ Form data persists when navigating between sections
- ✅ Auto-save continues to work for manual form edits
- ✅ Console logs show the data flow working correctly

## Troubleshooting

If text doesn't appear in forms:

1. **Check Console Logs**
   - Look for save confirmation logs
   - Look for form loading logs
   - Check for any error messages

2. **Verify Case Store**
   - Open browser dev tools
   - Check if data is being stored in the case store
   - Look for the section data in the store state

3. **Check Form State**
   - Verify the form is loading data from the case store
   - Check if the formData state is being updated

4. **Network Issues**
   - Ensure the save operation completes successfully
   - Check for any network errors in the console

## Data Structure

The case store stores data in this format:
```typescript
{
  sections: [
    {
      id: "section_7",
      data: {
        mainContent: "text from dictation",
        patientVerbatim: "patient text",
        radiologistVerbatim: "radiologist text",
        savedAt: "2024-01-01T00:00:00.000Z",
        mode: "smart_dictation",
        language: "en-US"
      },
      status: "in_progress",
      lastModified: "2024-01-01T00:00:00.000Z"
    }
  ]
}
```
