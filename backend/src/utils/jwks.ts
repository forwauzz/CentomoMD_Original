import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ENV } from '../config/env.js';
import { logger } from './logger.js';

// Cache for JWKS to avoid fetching on every request
let jwksCache: any = null;
let jwksCacheExpiry = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Get JWKS URL from Supabase URL
const getJWKSURL = (): string => {
  const supabaseUrl = ENV.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not configured');
  }
  
  // Extract the reference from the URL
  const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!urlMatch) {
    throw new Error('Invalid Supabase URL format');
  }
  
  const ref = urlMatch[1];
  return `https://${ref}.supabase.co/auth/v1/keys`;
};

// Get or create JWKS cache
const getJWKS = async () => {
  const now = Date.now();
  
  // Return cached JWKS if still valid
  if (jwksCache && now < jwksCacheExpiry) {
    return jwksCache;
  }
  
  try {
    const jwksURL = getJWKSURL();
    logger.info('Fetching JWKS from Supabase', { url: jwksURL });
    
    // Create remote JWK set
    jwksCache = createRemoteJWKSet(new URL(jwksURL));
    jwksCacheExpiry = now + CACHE_DURATION;
    
    logger.info('JWKS cache updated successfully');
    return jwksCache;
  } catch (error) {
    logger.error('Failed to fetch JWKS', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      url: getJWKSURL()
    });
    throw error;
  }
};

// Verify JWT with JWKS
export const verifyJWTWithJWKS = async (token: string): Promise<any> => {
  try {
    const jwks = await getJWKS();
    
    // Verify the JWT
    const { payload } = await jwtVerify(token, jwks, {
              issuer: ENV.SUPABASE_URL,
      audience: 'authenticated'
    });
    
    return payload;
  } catch (error) {
    logger.error('JWT verification failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return null;
  }
};

// Clear JWKS cache (useful for testing)
export const clearJWKSCache = () => {
  jwksCache = null;
  jwksCacheExpiry = 0;
  logger.info('JWKS cache cleared');
};
