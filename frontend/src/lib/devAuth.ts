/**
 * Development Authentication Bypass
 * This allows you to skip authentication during development
 */

export const isDevMode = () => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};

export const shouldBypassAuth = () => {
  // Check if we're in development mode and auth bypass is enabled
  return isDevMode() && import.meta.env.VITE_BYPASS_AUTH === 'true';
};

export const getDevUser = () => {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@centomo.com',
    name: 'Test Centomo User',
    role: 'doctor',
    clinic_id: '3267cef9-9a11-4e1a-a0c4-c1309538b952'
  };
};
