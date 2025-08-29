import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  // Application Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // AWS Configuration
  AWS_REGION: z.string().default('ca-central-1'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),

  // Supabase Configuration
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // S3 Configuration
  S3_BUCKET_NAME: z.string().min(1, 'S3_BUCKET_NAME is required'),
  S3_REGION: z.string().default('ca-central-1'),

  // Security Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().length(32, 'ENCRYPTION_KEY must be exactly 32 characters'),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Database Configuration (optional)
  DATABASE_URL: z.string().url().optional(),

  // Optional Services
  SENTRY_DSN: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),

  // Compliance Configuration
  DATA_RETENTION_HOURS: z.string().transform(Number).default('24'),
  AUDIT_LOGGING_ENABLED: z.string().transform(val => val === 'true').default('true'),
  PHI_PROTECTION_ENABLED: z.string().transform(val => val === 'true').default('true'),
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

  // S3
  S3_BUCKET_NAME: string;
  S3_REGION: string;

  // Security
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;

  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';

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

  const missingFields = requiredFields.filter(field => !process.env[field]);

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
};

// Security configuration
export const securityConfig = {
  jwtSecret: env.JWT_SECRET,
  encryptionKey: env.ENCRYPTION_KEY,
  corsOrigin: env.FRONTEND_URL,
};

// Logging configuration
export const loggingConfig = {
  level: env.LOG_LEVEL,
  enableAuditLogging: env.AUDIT_LOGGING_ENABLED,
  enablePhiProtection: env.PHI_PROTECTION_ENABLED,
};
