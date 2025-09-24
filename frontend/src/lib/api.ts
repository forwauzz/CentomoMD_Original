import { supabase } from './authClient.js';

// TODO: API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// TODO: API error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// TODO: Config cache
let configCache: { authRequired: boolean; wsRequireAuth: boolean } | null = null;

// TODO: Get config from server
const getConfig = async () => {
  if (configCache) return configCache;
  
  try {
    const response = await fetch('/api/config', {
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error('Failed to fetch config');
    
    configCache = await response.json();
    return configCache;
  } catch (error) {
    console.warn('Failed to fetch config, using defaults:', error);
    return { authRequired: false, wsRequireAuth: false };
  }
};

// TODO: API fetch function with auth
export const apiFetch = async <T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const config = await getConfig();
  
  // TODO: Get access token if available
  let accessToken: string | undefined;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    accessToken = session?.access_token;
  } catch (error) {
    // TODO: Handle case when Supabase is not configured
    console.warn('Supabase not configured, proceeding without auth token');
  }
  
  // TODO: Prepare headers
  const headers = new Headers(init.headers);
  
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  // TODO: Make request
  const response = await fetch(path, {
    ...init,
    headers,
  });
  
  // TODO: Handle 401 responses
  if (response.status === 401 && config?.authRequired) {
    // TODO: Redirect to login if auth is required
    window.location.href = '/login';
    throw new ApiError('Authentication required', 401);
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData.code
    );
  }
  
  return response.json();
};

// Clinic types
export interface Clinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicsResponse {
  success: boolean;
  clinics: Clinic[];
  error?: string;
}

// Clinic API functions
export const fetchClinics = async (): Promise<Clinic[]> => {
  try {
    const response = await apiFetch<ClinicsResponse>('/api/db/clinics', {
      // Add timeout for clinic fetching
      signal: AbortSignal.timeout(10000)
    });
    if (response.success) {
      return response.clinics;
    } else {
      throw new Error(response.error || 'Failed to fetch clinics');
    }
  } catch (error) {
    console.error('Error fetching clinics:', error);
    // Return empty array instead of throwing to prevent component crashes
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Clinic fetch timed out, returning empty array');
      return [];
    }
    throw error;
  }
};