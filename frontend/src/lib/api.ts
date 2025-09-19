/**
 * API utility functions for consistent backend communication
 */

export const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * Constructs a full API URL from a path
 * @param path - API path (with or without leading slash)
 * @returns Full API URL
 */
export function apiUrl(path: string): string {
  if (!API_BASE) {
    console.error('Missing VITE_API_BASE_URL environment variable');
    throw new Error('API_BASE_URL not configured');
  }
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

/**
 * Defensive JSON parsing with error handling
 * @param response - Fetch response object
 * @returns Parsed JSON or throws descriptive error
 */
export async function parseJsonResponse(response: Response): Promise<any> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText.slice(0, 200)}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Expected JSON response but got ${contentType}. Response: ${text.slice(0, 200)}`);
  }

  try {
    return await response.json();
  } catch (error) {
    const text = await response.text();
    throw new Error(`Failed to parse JSON response: ${error}. Response: ${text.slice(0, 200)}`);
  }
}

/**
 * Standard API fetch wrapper with error handling
 * @param path - API path
 * @param options - Fetch options
 * @returns Parsed JSON response
 */
export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = apiUrl(path);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  return parseJsonResponse(response);
}

/**
 * Get authentication token from localStorage
 * @returns Token string or null if not available
 */
function getAuthToken(): string | null {
  try {
    const token = localStorage.getItem('access_token');
    return token && token !== 'null' && token !== 'undefined' ? token : null;
  } catch {
    return null;
  }
}

/**
 * Format transcript using Mode 2 API with proper Content-Type and conditional auth
 * @param params - Formatting parameters
 * @returns Formatted result
 */
export async function formatWithMode2(params: {
  transcript: string;
  section: string;                 // e.g. "8"
  templateKey?: string;            // e.g. "section8-ai-formatter"
  templateCombo?: string;          // e.g. "universal-cleanup"
  language?: string;               // e.g. "en-US"
}): Promise<any> {
  const { transcript, section, templateKey, templateCombo, language } = params;

  const token = getAuthToken();
  const url = apiUrl('/api/format/mode2');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({
      transcript,           // REQUIRED: lowercase key, string
      section,
      case_id: templateKey,
      templateCombo,
      language,
    }),
  });

  return parseJsonResponse(response);
}