export interface ClinicalEntities {
  injury_location?: string;
  injury_type?: string;
  onset?: string;
  pain_severity?: string;              // "8/10"
  functional_limitations?: string[];   // []
  previous_injuries?: string[];        // []
  treatment_to_date?: string[];        // []
  imaging_done?: string[];             // []
  return_to_work?: string;             // text paragraph
  language?: 'fr' | 'en';
  confidence?: number;                 // 0..1 (optional)
  issues?: string[];                   // warnings from validation
}

export interface CleanedInput {
  cleaned_text: string;
  clinical_entities: ClinicalEntities;
  meta: {
    processing_ms: number;
    source: 'ambient' | 'smart_dictation';
    language: 'fr' | 'en';
    used_cache?: boolean;
  };
}

export interface UniversalCleanupResponse {
  formatted: string;
  clinical_entities: ClinicalEntities;
  issues: string[];
  confidence_score: number;
}
