import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend directory
const envPath = path.resolve(__dirname, '../../.env');
console.log('🔍 Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Debug: Log loaded environment variables (without sensitive data)
console.log('🔍 Environment variables loaded:');
console.log('  - NODE_ENV:', process.env['NODE_ENV']);
console.log('  - AWS_REGION:', process.env['AWS_REGION']);
console.log('  - S3_BUCKET_NAME:', process.env['S3_BUCKET_NAME'] ? `"${process.env['S3_BUCKET_NAME']}"` : 'NOT SET');
console.log('  - S3_BUCKET_NAME length:', process.env['S3_BUCKET_NAME'] ? process.env['S3_BUCKET_NAME'].length : 0);
console.log('  - S3_BUCKET_NAME raw:', JSON.stringify(process.env['S3_BUCKET_NAME']));
console.log('  - ENCRYPTION_KEY:', process.env['ENCRYPTION_KEY'] ? `${process.env['ENCRYPTION_KEY'].length} chars` : 'NOT SET');

// PostgreSQL URL validation function
const isPgUrl = (u: string) => {
  try { 
    const p = new URL(u); 
    return /^(postgres|postgresql):$/.test(p.protocol); 
  } catch { 
    return false; 
  }
};

// Environment schema validation
export const envSchema = z.object({
  // Application Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // AWS Configuration
  AWS_REGION: z.string().default('ca-central-1'),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),

  // Supabase Configuration
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),

  // Feature Flags
  AUTH_REQUIRED: z.string().transform(val => val === 'true').default('false'),
  WS_REQUIRE_AUTH: z.string().transform(val => val === 'true').default('false'),

  // WebSocket Configuration
  WS_JWT_SECRET: z.string().optional(),
  PUBLIC_WS_URL: z.string().default('ws://localhost:3001'),
  USE_WSS: z.string().transform(val => val === 'true').default('false'),

  // Security Configuration
  JWT_SECRET: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(1),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  RATE_LIMIT_ENABLED: z.string().transform(val => val === 'true').default('true'),

  // S3 Configuration
  S3_BUCKET_NAME: z.string().min(1),
  S3_REGION: z.string().default('ca-central-1'),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Debug Configuration
  LOG_PAYLOADS: z.enum(['true', 'false']).default('false'),
  DIAG_MODE: z.enum(['true', 'false']).default('false'),

  // Database Configuration (with PostgreSQL URL validation)
  DATABASE_URL: z.string().refine(isPgUrl, { message: 'Database URL invalid (postgres/postgresql expected)' }),
  DATABASE_URL_DIRECT: z.string().refine(isPgUrl).optional(),

  // Optional Services
  SENTRY_DSN: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),

  // Compliance Configuration
  DATA_RETENTION_HOURS: z.string().transform(Number).default('24'),
  AUDIT_LOGGING_ENABLED: z.string().transform(val => val === 'true').default('true'),
  PHI_PROTECTION_ENABLED: z.string().transform(val => val === 'true').default('true'),

  // Legacy variables (to be removed)
  BCRYPT_ROUNDS: z.string().transform(Number).optional(),
});

// Validate and parse environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

// Export validated environment configuration
export const env = parseEnv();

// Environment configuration interface
export interface EnvironmentConfig {
  // Application
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  FRONTEND_URL: string;

  // AWS
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;

  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;

  // Auth Feature Flags
  AUTH_REQUIRED: boolean;
  WS_REQUIRE_AUTH: boolean;

  // WebSocket
  WS_JWT_SECRET?: string;
  PUBLIC_WS_URL: string;
  USE_WSS: boolean;

  // Security
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  CORS_ALLOWED_ORIGINS: string;
  RATE_LIMIT_ENABLED: boolean;

  // S3
  S3_BUCKET_NAME: string;
  S3_REGION: string;

  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';

  // Debug
  LOG_PAYLOADS: boolean;
  DIAG_MODE: boolean;

  // Database
  DATABASE_URL?: string;

  // Optional Services
  SENTRY_DSN?: string;
  REDIS_URL?: string;

  // Compliance
  DATA_RETENTION_HOURS: number;
  AUDIT_LOGGING_ENABLED: boolean;
  PHI_PROTECTION_ENABLED: boolean;
}

// Configuration validation helper
export const validateConfig = (): void => {
  const requiredFields = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'S3_BUCKET_NAME',
    'JWT_SECRET',
    'ENCRYPTION_KEY'
  ];

  // Add auth-specific validation when flags are enabled
  if (env.AUTH_REQUIRED) {
    if (!env.SUPABASE_JWT_SECRET) {
      console.error('❌ SUPABASE_JWT_SECRET is required when AUTH_REQUIRED=true');
      process.exit(1);
    }
  }

  if (env.WS_REQUIRE_AUTH) {
    if (!env.WS_JWT_SECRET) {
      console.error('❌ WS_JWT_SECRET is required when WS_REQUIRE_AUTH=true');
      process.exit(1);
    }
  }

  const missingFields = requiredFields.filter(field => !process.env[field as keyof NodeJS.ProcessEnv]);

  if (missingFields.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingFields.forEach(field => {
      console.error(`  - ${field}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  // Validate Canadian region compliance
  if (env.AWS_REGION !== 'ca-central-1') {
    console.warn('⚠️  Warning: AWS region is not set to ca-central-1. This may affect compliance requirements.');
  }

  if (env.S3_REGION !== 'ca-central-1') {
    console.warn('⚠️  Warning: S3 region is not set to ca-central-1. This may affect compliance requirements.');
  }

  console.log('✅ Environment configuration validated successfully');
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`🌍 AWS Region: ${env.AWS_REGION}`);
  console.log(`🔒 Compliance: ${env.PHI_PROTECTION_ENABLED ? 'Enabled' : 'Disabled'}`);
  console.log(`🔐 Auth Required: ${env.AUTH_REQUIRED ? 'Yes' : 'No'}`);
  console.log(`🔐 WS Auth Required: ${env.WS_REQUIRE_AUTH ? 'Yes' : 'No'}`);
};

// Development-specific configuration
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Compliance configuration
export const complianceConfig = {
  region: env.AWS_REGION,
  dataRetentionHours: env.DATA_RETENTION_HOURS,
  encryptionEnabled: true, // Always enabled for compliance
  auditLoggingEnabled: env.AUDIT_LOGGING_ENABLED,
  phiProtectionEnabled: env.PHI_PROTECTION_ENABLED,
  canadianDataResidency: env.AWS_REGION === 'ca-central-1' && env.S3_REGION === 'ca-central-1'
};

// AWS configuration
export const awsConfig = {
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  s3: {
    bucket: env.S3_BUCKET_NAME,
    region: env.S3_REGION,
  }
};

// Supabase configuration
export const supabaseConfig = {
  url: env.SUPABASE_URL,
  anonKey: env.SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: env.SUPABASE_JWT_SECRET,
};

// Auth configuration
export const authConfig = {
  required: env.AUTH_REQUIRED,
  wsRequireAuth: env.WS_REQUIRE_AUTH,
};

// WebSocket configuration
export const wsConfig = {
  jwtSecret: env.WS_JWT_SECRET,
  publicUrl: env.PUBLIC_WS_URL,
  useWss: env.USE_WSS,
};

// Security configuration
export const securityConfig = {
  jwtSecret: env.JWT_SECRET,
  encryptionKey: env.ENCRYPTION_KEY,
  corsOrigin: env.FRONTEND_URL,
  corsOrigins: env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
  rateLimitEnabled: env.RATE_LIMIT_ENABLED,
};

// Debug configuration
export const debugConfig = {
  logPayloads: env.LOG_PAYLOADS,
  diagMode: env.DIAG_MODE,
};

// Logging configuration
export const loggingConfig = {
  level: env.LOG_LEVEL,
  enableAuditLogging: env.AUDIT_LOGGING_ENABLED,
  enablePhiProtection: env.PHI_PROTECTION_ENABLED,
};

// Export typed configuration object for easy access
export const config = {
  // Server configuration
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  frontendUrl: env.FRONTEND_URL,
  
  // Supabase configuration
  supabase: supabaseConfig,
  
  // Feature flags
  auth: authConfig,
  
  // WebSocket configuration
  ws: wsConfig,
  
  // Security configuration
  security: securityConfig,
  
  // Debug configuration
  debug: debugConfig,
  
  // AWS configuration
  aws: awsConfig,
  
  // Compliance configuration
  compliance: complianceConfig,
  
  // Logging configuration
  logging: loggingConfig,
} as const;

export type Config = typeof config;
