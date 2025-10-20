export interface ReqUserProfile {
  display_name?: string;
  locale: string;
  consent_pipeda: boolean;
  consent_marketing: boolean;
  default_clinic_id?: string | null;
}

export interface ReqUser {
  id?: string;            // external auth id when present
  user_id: string;        // internal id (required)
  email: string;
  name: string;
  role: string;
  clinic_id?: string | undefined;
  profile?: ReqUserProfile;
  user_metadata?: any;    // Supabase user metadata
}
