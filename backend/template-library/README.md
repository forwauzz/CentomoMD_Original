# Template Library System

## Overview

The Template Library system provides dynamic template selection and content injection for CNESST medical reports. It extracts templates from .docx files and makes them available through a dropdown interface in the dictation module.

## Structure

```
template-library/
├── json/                    # JSON template files
│   ├── section7/           # Section 7 templates (Historical narrative)
│   ├── section8/           # Section 8 templates (Clinical examination)
│   └── section11/          # Section 11 templates (Summary & conclusions)
├── parse/                  # Template extraction tools
│   └── docx_to_template_json.py
├── ui/                     # UI components
│   └── TemplateDropdown.tsx
├── index.ts               # Template library service
└── README.md              # This file
```

## Template Format

Each template follows this JSON structure:

```json
{
  "section": "8",
  "title": "Section 8 - Examen clinique - Genou",
  "content": "8. Questionnaire subjectif et état actuel...",
  "tags": ["examen_clinique", "genou"],
  "source_file": "204_MI-4-5.docx",
  "language": "fr",
  "category": "examen_clinique",
  "complexity": "medium"
}
```

### Fields

- **section**: CNESST section number ("7", "8", "11")
- **title**: Human-readable template title
- **content**: Template content with placeholders
- **tags**: Array of categorization tags
- **source_file**: Original .docx file for traceability
- **language**: Template language ("fr" or "en")
- **category**: Template category (e.g., "examen_clinique", "resume_conclusion")
- **complexity**: Complexity level ("low", "medium", "high")

## Usage

### Backend Service

```typescript
import { templateLibrary } from './template-library/index';

// Get templates for a specific section
const section8Templates = templateLibrary.getTemplatesBySection("8");

// Get templates with filters
const filteredTemplates = templateLibrary.getTemplates("8", "fr");

// Search templates
const searchResults = templateLibrary.searchTemplates("8", "genou");

// Get template statistics
const stats = templateLibrary.getTemplateStats();
```

### Frontend Component

```typescript
import { TemplateDropdown } from '@/components/transcription/TemplateDropdown';

<TemplateDropdown
  currentSection="8"
  currentLanguage="fr"
  onTemplateSelect={(template) => {
    // Handle template selection
    injectTemplateContent(template.content);
  }}
  selectedTemplate={selectedTemplate}
/>
```

## Template Extraction

### Running the Extractor

1. Place .docx files in the `temp_docs/combined/` directory
2. Run the extraction script:

```bash
cd backend/template-library/parse
python docx_to_template_json.py
```

### Extraction Process

The extractor:
1. Reads all .docx files from the source directory
2. Extracts text content from each file
3. Identifies Section 8 and 11 content using pattern matching
4. Splits content into logical subsections
5. Generates JSON templates with metadata
6. Saves templates to the appropriate section directories

### Supported Patterns

#### Section 7 Patterns
- "7. Historique de faits et évolution"
- "Section 7"
- "7 - Historique de faits"

#### Section 8 Patterns
- "8. Examen clinique"
- "Section 8"
- "8 - Examen clinique"

#### Section 11 Patterns
- "11. Résumé et conclusion"
- "Section 11"
- "11 - Résumé et conclusion"

## Integration with Dictation UI

The TemplateDropdown component integrates with the TranscriptionInterface to provide:

- **Dynamic template loading** based on current section
- **Search and filtering** by title, content, and tags
- **Template preview** with content snippets
- **Content injection** into the dictation field
- **CNESST formatting compliance** validation

## API Endpoints (Future)

```typescript
// Template Management
GET /api/templates - List all templates
GET /api/templates/:section - Get templates by section
GET /api/templates/:section/:id - Get specific template
POST /api/templates - Create new template
PUT /api/templates/:id - Update template
DELETE /api/templates/:id - Delete template

// Template Selection
GET /api/templates/active?section=8&language=fr - Get active templates
POST /api/templates/:id/select - Select template for dictation
```

## Development

### Adding New Templates

1. Add .docx files to `temp_docs/combined/`
2. Run the extraction script
3. Review generated JSON files
4. Manually edit if needed for better formatting

### Customizing Extraction

Modify `docx_to_template_json.py` to:
- Add new section patterns
- Customize template splitting logic
- Enhance tag extraction
- Modify content formatting

### Template Validation

Templates are validated for:
- Required fields presence
- CNESST formatting compliance
- Language consistency
- Content quality

## Statistics

Current template counts:
- **Section 7**: 22 templates (extracted from .docx files)
- **Section 8**: 22 templates (extracted from .docx files)
- **Section 11**: 22 templates (extracted from .docx files)

## Future Enhancements

- [x] Section 7 template extraction ✅
- [ ] Template versioning system
- [ ] User-specific template management
- [ ] Template sharing and collaboration
- [ ] Advanced search and filtering
- [ ] Template performance analytics
- [ ] AI-powered template suggestions
- [ ] Template quality scoring

## Troubleshooting

### Common Issues

1. **No templates found**: Check file paths and .docx file format
2. **Extraction errors**: Verify python-docx installation
3. **JSON parsing errors**: Check file encoding and content
4. **UI not loading**: Verify component imports and dependencies

### Debug Mode

Enable debug logging in the extraction script:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Contributing

1. Follow the existing template format
2. Test template extraction with sample files
3. Validate CNESST compliance
4. Update documentation for new features
5. Add appropriate error handling

---

*Template Library System v1.0*  
*Last Updated: 2024-01-01*
