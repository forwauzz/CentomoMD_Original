/**
 * Environment variable validation using Zod
 * 
 * This module validates all required environment variables at startup,
 * preventing silent misconfigurations that could cause runtime failures.
 */

import { z } from 'zod';

// Define the environment schema with validation rules
const envSchema = z.object({
  // Supabase Configuration
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(20, 'SUPABASE_ANON_KEY must be at least 20 characters'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY must be at least 20 characters'),
  SUPABASE_JWT_SECRET: z.string().min(10, 'SUPABASE_JWT_SECRET must be at least 10 characters'),
  
  // Database Configuration
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // Server Configuration
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').transform(Number).optional().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // AWS Configuration (optional for some features)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  
  // CORS Configuration
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  
  // Authentication Configuration
  AUTH_REQUIRED: z.string().transform(val => val === 'true').default('false'),
  
  // Rate Limiting
  RATE_LIMIT_ENABLED: z.string().transform(val => val === 'true').default('true'),
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default(100),
});

// Parse and validate environment variables
export const env = envSchema.parse(process.env);

// Export individual validated variables for convenience
export const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET,
  DATABASE_URL,
  PORT,
  NODE_ENV,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  CORS_ALLOWED_ORIGINS,
  AUTH_REQUIRED,
  RATE_LIMIT_ENABLED,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
} = env;

// Helper function to check if we're in development mode
export const isDevelopment = NODE_ENV === 'development';
export const isProduction = NODE_ENV === 'production';
export const isTest = NODE_ENV === 'test';

// Helper function to get CORS origins as array
export const getCorsOrigins = (): string[] => {
  return CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
};

// Log environment validation success (without sensitive data)
console.log('✅ Environment validation successful');
console.log(`   NODE_ENV: ${NODE_ENV}`);
console.log(`   PORT: ${PORT}`);
console.log(`   SUPABASE_URL: ${SUPABASE_URL.replace(/\/[^\/]*$/, '/***')}`);
console.log(`   DATABASE_URL: ${DATABASE_URL.replace(/\/\/[^@]*@/, '//***:***@')}`);
console.log(`   CORS_ORIGINS: ${getCorsOrigins().length} configured`);
console.log(`   AUTH_REQUIRED: ${AUTH_REQUIRED}`);
console.log(`   RATE_LIMIT_ENABLED: ${RATE_LIMIT_ENABLED}`);
