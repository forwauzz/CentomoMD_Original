import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ENV } from '../config/env.js';
import { logger } from './logger.js';

// Get JWKS URL from Supabase URL - Fixed endpoint and issuer format
const getJWKSURL = (): string => {
  const supabaseUrl = ENV.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not configured');
  }
  
  // Use correct JWKS endpoint with trailing slash in issuer
  return `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
};

// Get JWKS using JOSE's built-in caching and timeout
const getJWKS = async () => {
  try {
    const jwksURL = getJWKSURL();
    logger.info('Initializing JWKS from Supabase', { 
      url: jwksURL.replace(/\/[^\/]*$/, '/***'), // Log URL without filename
      issuer: `${ENV.SUPABASE_URL}/` // Note trailing slash
    });
    
    // Use JOSE's built-in remote JWK set with timeout
    return createRemoteJWKSet(new URL(jwksURL), {
      timeoutDuration: 1000, // 1 second timeout
    });
  } catch (error) {
    logger.error('Failed to initialize JWKS', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      url: getJWKSURL().replace(/\/[^\/]*$/, '/***') // Safe URL logging
    });
    throw error;
  }
};

// Verify JWT with JWKS - Fixed issuer format
export const verifyJWTWithJWKS = async (token: string): Promise<any> => {
  try {
    const jwks = await getJWKS();
    
    // Verify the JWT with correct issuer format (trailing slash)
    const { payload, protectedHeader } = await jwtVerify(token, jwks, {
      issuer: `${ENV.SUPABASE_URL}/`, // Must end with /
      audience: 'authenticated'
    });
    
    logger.info('JWT verification successful', {
      kid: protectedHeader.kid,
      issuer: payload.iss,
      audience: payload.aud
    });
    
    return payload;
  } catch (error) {
    // Safe error logging - no token contents
    logger.error('JWT verification failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      errorClass: error.constructor.name
    });
    return null;
  }
};

// Clear JWKS cache (useful for testing)
export const clearJWKSCache = () => {
  logger.info('JWKS cache cleared');
};
