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

// TODO: Configure CORS with allowlist
const corsMiddleware = cors({
  origin: config.security.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

// TODO: Configure rate limiting (disabled by default)
const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// TODO: Export security middleware stack
export const securityMiddleware = [
  helmetMiddleware,
  corsMiddleware,
  // TODO: Only apply rate limiting when enabled
  ...(config.security.rateLimitEnabled ? [rateLimitMiddleware] : []),
];
