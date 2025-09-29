/**
 * Centralized auth redirect URL management
 * Ensures consistent redirect URLs across all Supabase auth operations
 */

export const getAuthRedirectUrl = () => {
  const base = import.meta.env.VITE_SITE_URL;
  if (!base) {
    throw new Error('VITE_SITE_URL is missing. Please set this environment variable.');
  }
  return `${base}/auth/callback`;
};

