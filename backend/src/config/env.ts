import 'dotenv/config';

const isProd = (process.env['NODE_ENV'] ?? 'development') === 'production';
const parseList = (v?: string) => (v ?? '').split(',').map(s => s.trim()).filter(Boolean);

const PUBLIC_WS_URL = process.env['PUBLIC_WS_URL']
  ?? (isProd ? 'wss://api.alie.app/ws' : 'ws://localhost:3001/ws');

const USE_WSS = PUBLIC_WS_URL.startsWith('wss://');
const PHI_FREE = (process.env['COMPLIANCE_PHI_FREE_LOGGING'] ?? 'false') === 'true';

export const ENV = {
  // Core server
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  HOST: process.env['HOST'] ?? '0.0.0.0',
  PORT: Number(process.env['PORT'] ?? 3001),
  AWS_REGION: process.env['AWS_REGION'] ?? 'ca-central-1',

  // WebSocket
  WS_PATH: process.env['WS_PATH'] ?? '/ws',
  PUBLIC_WS_URL,
  USE_WSS,

  // CORS single source of truth
  CORS_ALLOWED_ORIGINS: parseList(
    process.env['CORS_ALLOWED_ORIGINS']
      ?? (isProd
          ? 'https://azure-production.d1deo9tihdnt50.amplifyapp.com'
          : 'http://localhost:5173')
  ),

  // API hygiene
  RATE_LIMIT_ENABLED: (process.env['RATE_LIMIT_ENABLED'] ?? 'false') === 'true',
  RATE_LIMIT_WINDOW_MS: Number(process.env['RATE_LIMIT_WINDOW_MS'] ?? 15*60*1000),
  RATE_LIMIT_MAX_REQUESTS: Number(process.env['RATE_LIMIT_MAX_REQUESTS'] ?? 100),

  // === Legacy compatibility (referenced elsewhere) ===
  DATABASE_URL: process.env['DATABASE_URL'] ?? '',
  SUPABASE_URL: process.env['SUPABASE_URL'] ?? '',
  SUPABASE_JWT_SECRET: process.env['SUPABASE_JWT_SECRET'] ?? '',

  AUTH_VERIFY_STRATEGY: (process.env['AUTH_VERIFY_STRATEGY'] ?? 'supabase') as 'supabase'|'jwks',
  JWKS_URL: process.env['JWKS_URL'] ?? '',

  AUTH_REQUIRED: (process.env['AUTH_REQUIRED'] ?? 'false') === 'true',
  WS_REQUIRE_AUTH: (process.env['WS_REQUIRE_AUTH'] ?? 'false') === 'true',
  WS_JWT_SECRET: process.env['WS_JWT_SECRET'] ?? '',
  JWT_SECRET: process.env['JWT_SECRET'] ?? '',

  SPEAKER_CORRECTION_LOGGING: PHI_FREE ? false : !isProd,
  CONVERSATION_FLOW_LOGGING: PHI_FREE ? false : !isProd,
} as const;

// Safe, non-secret startup log
export function logNonSecretEnv() {
  console.log('[ENV]', {
    NODE_ENV: ENV.NODE_ENV,
    HOST: ENV.HOST,
    PORT: ENV.PORT,
    WS_PATH: ENV.WS_PATH,
    PUBLIC_WS_URL: ENV.PUBLIC_WS_URL,
    CORS_ALLOWED_ORIGINS: ENV.CORS_ALLOWED_ORIGINS,
    RATE_LIMIT_ENABLED: ENV.RATE_LIMIT_ENABLED,
    AUTH_REQUIRED: ENV.AUTH_REQUIRED,
    WS_REQUIRE_AUTH: ENV.WS_REQUIRE_AUTH,
  });
}

// Legacy compatibility exports for existing code
export const config = {
  aws: {
    region: ENV.AWS_REGION,
    credentials: {
      accessKeyId: process.env['AWS_ACCESS_KEY_ID'] || '',
      secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] || '',
    }
  },
  server: {
    port: ENV.PORT,
    host: ENV.HOST,
  },
  security: {
    corsOrigins: ENV.CORS_ALLOWED_ORIGINS,
    rateLimitEnabled: ENV.RATE_LIMIT_ENABLED,
  },
  auth: {
    required: ENV.AUTH_REQUIRED,
    wsRequireAuth: ENV.WS_REQUIRE_AUTH,
    wsJwtSecret: ENV.WS_JWT_SECRET,
  },
  ws: {
    publicUrl: ENV.PUBLIC_WS_URL,
    useWss: ENV.USE_WSS,
  },
  features: {
    universalCleanupEnabled: true,
    universalCleanupShadow: true,
  }
};