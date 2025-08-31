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
    const response = await fetch('/api/config');
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
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  
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
  if (response.status === 401 && config.authRequired) {
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
