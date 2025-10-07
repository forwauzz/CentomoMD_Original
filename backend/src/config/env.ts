// Centralized environment configuration
// This file provides type-safe access to all environment variables

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

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
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  
  // Security
  ENCRYPTION_KEY: string;
  JWT_SECRET: string;
  
  // Server Configuration
  PORT: number;
  HOST: string;
  FRONTEND_URL: string;
  
  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  
  // Feature Flags
  AUTH_REQUIRED: boolean;
  WS_REQUIRE_AUTH: boolean;
  RATE_LIMIT_ENABLED: boolean;
  
  // WebSocket Configuration
  WS_JWT_SECRET?: string;
  PUBLIC_WS_URL: string;
  USE_WSS: boolean;
  
  // CORS Configuration
  CORS_ALLOWED_ORIGINS: string;
  
  // Debug Configuration
  LOG_PAYLOADS: boolean;
  DIAG_MODE: boolean;
  
  // Authentication Strategy
  AUTH_VERIFY_STRATEGY: 'supabase' | 'jwks';
  
  // OpenAI Configuration
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  OPENAI_TEMPERATURE: number;
  OPENAI_MAX_TOKENS: number;
}

// Temporary hardcoded values to bypass PowerShell line-breaking issues
const hardcodedEnv: Environment = {
  NODE_ENV: 'development',
  PORT: 3001,
  HOST: 'localhost',
  FRONTEND_URL: 'http://localhost:5173',
  
  // Database
  DATABASE_URL: process.env['DATABASE_URL'] || '',
    
  // AWS Configuration
  AWS_REGION: 'ca-central-1',
  AWS_ACCESS_KEY_ID: process.env['AWS_ACCESS_KEY_ID'] || '',
  AWS_SECRET_ACCESS_KEY: process.env['AWS_SECRET_ACCESS_KEY'] || '',
  S3_BUCKET_NAME: 'centomomd-input-2025',
  
  // Supabase Configuration
  SUPABASE_URL: process.env['SUPABASE_URL'] || '',
  SUPABASE_ANON_KEY: process.env['SUPABASE_ANON_KEY'] || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY'] || '',
  SUPABASE_JWT_SECRET: process.env['SUPABASE_JWT_SECRET'] || '',
  
  // Security
  ENCRYPTION_KEY: process.env['ENCRYPTION_KEY'] || '',
  JWT_SECRET: process.env['JWT_SECRET'] || '',
  
  // Logging
  LOG_LEVEL: 'info',
  
  // Feature Flags
  AUTH_REQUIRED: true,
  WS_REQUIRE_AUTH: false,
  RATE_LIMIT_ENABLED: false,
  
  // WebSocket Configuration
  WS_JWT_SECRET: process.env['WS_JWT_SECRET'] || '',
  PUBLIC_WS_URL: 'ws://localhost:3001',
  USE_WSS: false,
  
  // CORS Configuration
  CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
  
  // Debug Configuration
  LOG_PAYLOADS: false,
  DIAG_MODE: false,
  
  // Authentication Strategy - Default to working Supabase approach
  AUTH_VERIFY_STRATEGY: 'supabase',
  
  // OpenAI Configuration
  OPENAI_API_KEY: process.env['OPENAI_API_KEY'] || '',
  OPENAI_MODEL: process.env['OPENAI_MODEL'] || 'gpt-4o-mini',
  OPENAI_TEMPERATURE: parseFloat(process.env['OPENAI_TEMPERATURE'] || '0.2'),
  OPENAI_MAX_TOKENS: parseInt(process.env['OPENAI_MAX_TOKENS'] || '4000'),
};

// Export the hardcoded environment
export const ENV: Environment = hardcodedEnv;

// Export config object for backward compatibility
export const config = {
  aws: {
    region: hardcodedEnv.AWS_REGION,
    credentials: {
      accessKeyId: hardcodedEnv.AWS_ACCESS_KEY_ID,
      secretAccessKey: hardcodedEnv.AWS_SECRET_ACCESS_KEY,
    }
  },
  supabase: {
    url: hardcodedEnv.SUPABASE_URL,
    anonKey: hardcodedEnv.SUPABASE_ANON_KEY,
    serviceRoleKey: hardcodedEnv.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: hardcodedEnv.SUPABASE_JWT_SECRET,
  },
  database: {
    url: hardcodedEnv.DATABASE_URL,
    ssl: true,
  },
  server: {
    port: hardcodedEnv.PORT,
    host: hardcodedEnv.HOST,
    cors: {
      origin: hardcodedEnv.FRONTEND_URL,
    }
  },
  auth: {
    required: hardcodedEnv.AUTH_REQUIRED,
    wsRequireAuth: hardcodedEnv.WS_REQUIRE_AUTH,
    wsJwtSecret: hardcodedEnv.WS_JWT_SECRET,
  },
  ws: {
    publicUrl: hardcodedEnv.PUBLIC_WS_URL,
    useWss: hardcodedEnv.USE_WSS,
  },
  security: {
    corsOrigins: [hardcodedEnv.FRONTEND_URL],
    rateLimitEnabled: hardcodedEnv.RATE_LIMIT_ENABLED,
  },
  debug: {
    logPayloads: hardcodedEnv.LOG_PAYLOADS,
    diagMode: hardcodedEnv.DIAG_MODE,
  },
  openai: {
    apiKey: hardcodedEnv.OPENAI_API_KEY,
    model: hardcodedEnv.OPENAI_MODEL,
    temperature: hardcodedEnv.OPENAI_TEMPERATURE,
    maxTokens: hardcodedEnv.OPENAI_MAX_TOKENS,
  }
};
