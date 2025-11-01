import { supabase } from './authClient.js';

// Environment-driven base URL selection
const devFallback =
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? 'http://localhost:3001'
    : '';

const BASE = (import.meta.env.VITE_API_BASE_URL || devFallback).replace(/\/+$/, '');

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// API error types
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

// Config cache
let configCache: { authRequired: boolean; wsRequireAuth: boolean } | null = null;

// Get config from server
const getConfig = async () => {
  if (configCache) return configCache;
  
  try {
    const response = await api('/api/config');
    configCache = await response.json();
    return configCache;
  } catch (error) {
    console.warn('Failed to fetch config, using defaults:', error);
    return { authRequired: false, wsRequireAuth: false };
  }
};

// Core API function with environment-driven base URL
export async function api(path: string, init: RequestInit = {}) {
  // Prepare headers with auth token if available
  const headers = new Headers(init.headers);
  
  // Auto-add auth token from Supabase session if available
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
  } catch (error) {
    // Supabase not configured or session unavailable, continue without token
    // (This is expected in some environments)
  }
  
  const url = `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, { 
    credentials: 'include', 
    ...init,
    headers 
  });
  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch {}
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res;
}

// JSON API helper
export async function apiJSON<T = unknown>(path: string, init: RequestInit = {}) {
  const res = await api(path, init);
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json')
    ? (await res.json() as T)
    : (await res.text() as unknown as T);
}

// API fetch function with auth (legacy compatibility)
export const apiFetch = async <T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const config = await getConfig();
  
  // Get access token if available
  let accessToken: string | undefined;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    accessToken = session?.access_token;
  } catch (error) {
    // Handle case when Supabase is not configured
    console.warn('Supabase not configured, proceeding without auth token');
  }
  
  // Prepare headers
  const headers = new Headers(init.headers);
  
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  // Make request using the new api function
  const response = await api(path, {
    ...init,
    headers,
  });
  
  // Handle 401 responses
  if (response.status === 401 && config?.authRequired) {
    // Redirect to login if auth is required
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
