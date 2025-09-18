import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

// TODO: Configure helmet middleware with security headers
const helmetMiddleware = helmet({
  // TODO: Configure content security policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  // TODO: Enable other security headers
  hsts: true,
  noSniff: true,
  xssFilter: true,
});

// Configure CORS with allowlist
const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const allowedOrigins = config.security.corsOrigins;
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // Handle wildcard patterns like https://*.vercel.app
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
});

// TODO: Configure rate limiting (disabled by default)
const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security logging middleware
const securityLoggingMiddleware = (req: any, res: any, next: any) => {
  // Log security-relevant events without sensitive data
  if (req.method === 'OPTIONS') {
    console.log(`🔒 CORS preflight request from: ${req.get('Origin') || 'unknown'}`);
  }
  
  // Log authentication attempts (without tokens)
  if (req.path.includes('/auth/') || req.path.includes('/api/')) {
    const hasAuth = req.headers.authorization ? 'with auth' : 'without auth';
    console.log(`🔐 API request: ${req.method} ${req.path} ${hasAuth}`);
  }
  
  next();
};

// Export security middleware stack
export const securityMiddleware = [
  helmetMiddleware,
  corsMiddleware,
  securityLoggingMiddleware,
  // TODO: Only apply rate limiting when enabled
  ...(config.security.rateLimitEnabled ? [rateLimitMiddleware] : []),
];
