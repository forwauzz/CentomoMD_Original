// Centralized environment configuration
// This file provides type-safe access to all environment variables

export interface Environment {
  // Node environment
  NODE_ENV: 'development' | 'production' | 'test';
  
  // Database
  DATABASE_URL: string;
  
  // AWS Configuration
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  S3_BUCKET_NAME: string;
  
  // Supabase Configuration
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Security
  ENCRYPTION_KEY: string;
  JWT_SECRET: string;
  
  // Server Configuration
  PORT: number;
  HOST: string;
  
  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  
  // Feature Flags
  AUTH_REQUIRED: boolean;
  WS_REQUIRE_AUTH: boolean;
  RATE_LIMIT_ENABLED: boolean;
}

// Environment variable validation and defaults
function getEnvVar(key: keyof Environment, required: boolean = true): string {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

function getEnvVarAsNumber(key: keyof Environment, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Invalid number for environment variable: ${key}`);
  }
  return num;
}

function getEnvVarAsBoolean(key: keyof Environment, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

// Centralized environment object
export const ENV: Environment = {
  // Node environment
  NODE_ENV: (process.env['NODE_ENV'] as Environment['NODE_ENV']) || 'development',
  
  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  
  // AWS Configuration
  AWS_REGION: getEnvVar('AWS_REGION', false) || 'ca-central-1',
  AWS_ACCESS_KEY_ID: getEnvVar('AWS_ACCESS_KEY_ID', false),
  AWS_SECRET_ACCESS_KEY: getEnvVar('AWS_SECRET_ACCESS_KEY', false),
  S3_BUCKET_NAME: getEnvVar('S3_BUCKET_NAME', false) || 'centomomd-input-2025',
  
  // Supabase Configuration
  SUPABASE_URL: getEnvVar('SUPABASE_URL', false),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', false),
  
  // Security
  ENCRYPTION_KEY: getEnvVar('ENCRYPTION_KEY'),
  JWT_SECRET: getEnvVar('JWT_SECRET', false) || 'your-secret-key',
  
  // Server Configuration
  PORT: getEnvVarAsNumber('PORT', 3001),
  HOST: getEnvVar('HOST', false) || 'localhost',
  
  // Logging
  LOG_LEVEL: (process.env['LOG_LEVEL'] as Environment['LOG_LEVEL']) || 'info',
  
  // Feature Flags
  AUTH_REQUIRED: getEnvVarAsBoolean('AUTH_REQUIRED', false),
  WS_REQUIRE_AUTH: getEnvVarAsBoolean('WS_REQUIRE_AUTH', false),
  RATE_LIMIT_ENABLED: getEnvVarAsBoolean('RATE_LIMIT_ENABLED', false),
};

// Validation function
export function validateEnvironment(): void {
  const requiredVars: (keyof Environment)[] = ['DATABASE_URL', 'ENCRYPTION_KEY'];
  
  for (const key of requiredVars) {
    if (!ENV[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  console.log('✅ Environment validation passed');
}

// Export for backward compatibility
export default ENV;
