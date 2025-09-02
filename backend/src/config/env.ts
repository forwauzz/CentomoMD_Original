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
}

// Temporary hardcoded values to bypass PowerShell line-breaking issues
const hardcodedEnv: Environment = {
  NODE_ENV: 'development',
  PORT: 3001,
  HOST: 'localhost',
  FRONTEND_URL: 'http://localhost:5173',
  
  // Database
  DATABASE_URL: 'YOUR_DATABASE_URL',
  
  // AWS Configuration
  AWS_REGION: 'ca-central-1',
  AWS_ACCESS_KEY_ID: 'YOUR_AWS_ACCESS_KEY_ID',
  AWS_SECRET_ACCESS_KEY: 'YOUR_AWS_SECRET_ACCESS_KEY',
  S3_BUCKET_NAME: 'centomomd-input-2025',
  
  // Supabase Configuration
  SUPABASE_URL: 'https://kbjulpxgjqzgbkshqsme.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtianVscHhnanF6Z2Jrc2hxc21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTU5NTIsImV4cCI6MjA3MjIzMTk1Mn0.i_pCn212EtcQUXge7NvRszUZUcMeHIlqg3IQRB4mr_c',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtianVscHhnanF6Z2Jrc2hxc21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjY1NTk1MiwiZXhwIjoyMDcyMjMxOTUyfQ.BrKW-xerMTnL4Tl7kr5k5jHzMFOFHcTOB8RBUvCG5-4',
  SUPABASE_JWT_SECRET: 'TcyFylYcIgH9SnB5H4YKznCIH726QlQvGF97bLPq3/oBBq4+sqvrqsX7vNCAJbIKEOkgfWq0e3UpopXGs5VhFg==',
  
  // Security
  ENCRYPTION_KEY: 'de5583b949fd7da2b867e5656b618f0c',
  JWT_SECRET: '6b6653a61b612ac9b2822521b597f7d2460f223ac68fa3f6182910de73678f90bba6610b038d506c7c6f56f2e0f33407c92fd68de57762e79a588bdc44f98130',
  
  // Logging
  LOG_LEVEL: 'info',
  
  // Feature Flags
  AUTH_REQUIRED: false,
  WS_REQUIRE_AUTH: false,
  RATE_LIMIT_ENABLED: false,
  
  // WebSocket Configuration
  WS_JWT_SECRET: 'your_ws_jwt_secret_here_make_it_long_and_random_32_chars_min',
  PUBLIC_WS_URL: 'ws://localhost:3001',
  USE_WSS: false,
  
  // CORS Configuration
  CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
  
  // Debug Configuration
  LOG_PAYLOADS: false,
  DIAG_MODE: false,
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
  }
};
