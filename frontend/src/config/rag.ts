/**
 * RAG API Configuration
 * Handles environment variable for RAG API base URL
 */

// Get RAG API base URL from environment variable
// Lazy evaluation to avoid errors when feature is disabled
export const getRagApiBase = (): string => {
  const baseUrl = import.meta.env.VITE_RAG_API;
  
  if (!baseUrl) {
    throw new Error(
      'VITE_RAG_API environment variable is not set. ' +
      'Please set VITE_RAG_API in your .env file (e.g., VITE_RAG_API=http://127.0.0.1:8000)'
    );
  }
  
  // In development, use the Vite proxy to avoid CORS issues
  // The proxy is configured in vite.config.ts to forward /rag-api to the RAG server
  if (import.meta.env.DEV) {
    // Use relative path to proxy in development
    return '/rag-api';
  }
  
  // In production, use the full URL from environment variable
  // Remove trailing slashes
  return baseUrl.replace(/\/+$/, '');
};

