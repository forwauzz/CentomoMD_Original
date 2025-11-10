-- Insert Section 11 R&D Pipeline template into template_combinations table
-- Run this script manually in Supabase SQL Editor

INSERT INTO template_combinations (
  id,
  name,
  name_fr,
  name_en,
  description,
  description_fr,
  description_en,
  type,
  compatible_sections,
  compatible_modes,
  language,
  complexity,
  tags,
  is_active,
  is_default,
  features,
  prompt,
  prompt_fr,
  config,
  usage_stats,
  created_at,
  updated_at
) VALUES (
  'section11-rd',
  'Section 11 - R&D Pipeline',
  'Section 11 - Pipeline R&D',
  'Section 11 - R&D Pipeline',
  'Generate Section 11 conclusion from structured JSON data (S1-S10). Multi-section synthesis with consolidation logic.',
  'Générer la conclusion Section 11 à partir de données JSON structurées (S1-S10). Synthèse multi-sections avec logique de consolidation.',
  'Generate Section 11 conclusion from structured JSON data (S1-S10). Multi-section synthesis with consolidation logic.',
  'ai-formatter',
  '["section_11"]'::jsonb,
  '["mode2", "mode3"]'::jsonb,
  'fr',
  'high',
  '["section-11", "rd-pipeline", "synthesis", "multi-section", "consolidation"]'::jsonb,
  true,
  true,
  '{
    "verbatimSupport": false,
    "voiceCommandsSupport": false,
    "aiFormatting": true,
    "postProcessing": false
  }'::jsonb,
  'Generate Section 11 conclusion from structured JSON data. Apply consolidation logic and synthesize data from Sections 1-10.',
  'Générer la conclusion Section 11 à partir de données JSON structurées. Appliquer la logique de consolidation et synthétiser les données des Sections 1-10.',
  '{
    "section": "11",
    "language": "fr"
  }'::jsonb,
  '{
    "count": 0,
    "successRate": 0
  }'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en,
  type = EXCLUDED.type,
  compatible_sections = EXCLUDED.compatible_sections,
  compatible_modes = EXCLUDED.compatible_modes,
  language = EXCLUDED.language,
  complexity = EXCLUDED.complexity,
  tags = EXCLUDED.tags,
  is_active = EXCLUDED.is_active,
  is_default = EXCLUDED.is_default,
  features = EXCLUDED.features,
  prompt = EXCLUDED.prompt,
  prompt_fr = EXCLUDED.prompt_fr,
  config = EXCLUDED.config,
  usage_stats = EXCLUDED.usage_stats,
  updated_at = now();

-- Verify insertion
SELECT 
  id,
  name,
  name_fr,
  type,
  compatible_sections,
  is_active,
  is_default,
  created_at
FROM template_combinations
WHERE id = 'section11-rd';

