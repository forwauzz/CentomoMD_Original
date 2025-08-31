import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { env } from './config/environment.js';
import { logger } from './utils/logger.js';

// TODO: Import JWKS verification utilities
// import { verifyJWTWithJWKS } from './utils/jwks.js';

// TODO: Define user context interface
export interface UserContext {
  user_id: string;
  clinic_id?: string;
  role: string;
  email: string;
  aud: string;
  exp: number;
  iat: number;
}

// TODO: Define auth middleware interface
export interface AuthMiddleware {
  (req: Request, res: Response, next: NextFunction): Promise<void>;
}

// TODO: JWT verification function using Supabase JWKS
export const verifySupabaseJWT = async (token: string): Promise<UserContext | null> => {
  try {
    // TODO: Implement JWKS verification
    // 1. Extract issuer from token header
    // 2. Fetch JWKS from https://<REF>.supabase.co/auth/v1/keys
    // 3. Verify token signature and claims
    // 4. Return UserContext or null
    
    // TODO: Remove this mock implementation
    const decoded = jwt.decode(token) as any;
    if (!decoded) return null;
    
    return {
      user_id: decoded.sub || 'mock-user-id',
      clinic_id: decoded.clinic_id,
      role: decoded.role || 'physician',
      email: decoded.email || 'mock@example.com',
      aud: decoded.aud || 'authenticated',
      exp: decoded.exp || 0,
      iat: decoded.iat || 0
    };
  } catch (error) {
    logger.error('JWT verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
};

// TODO: Export auth middleware for HTTP endpoints
export const authMiddleware: AuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // TODO: Verify token with Supabase JWKS
    const userContext = await verifySupabaseJWT(token);
    
    if (!userContext) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // TODO: Check token expiration
    if (userContext.exp < Date.now() / 1000) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // TODO: Attach user context to request
    (req as any).user = userContext;
    
    // TODO: Log successful authentication
    logger.info('User authenticated', { 
      userId: userContext.user_id, 
      endpoint: req.path,
      method: req.method 
    });

    next();
  } catch (error) {
    logger.error('Auth middleware error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path 
    });
    
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

// TODO: Optional auth middleware for endpoints that work with or without auth
export const optionalAuthMiddleware: AuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user context
      return next();
    }

    const token = authHeader.substring(7);
    const userContext = await verifySupabaseJWT(token);
    
    if (userContext && userContext.exp >= Date.now() / 1000) {
      (req as any).user = userContext;
    }

    next();
  } catch (error) {
    // Error in optional auth, continue without user context
    next();
  }
};

// TODO: Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(user.role)) {
      logger.warn('Insufficient permissions', {
        userId: user.user_id,
        userRole: user.role,
        requiredRoles: allowedRoles,
        endpoint: req.path
      });

      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// TODO: Clinic-based authorization middleware
export const requireClinicAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'User not authenticated',
      code: 'NOT_AUTHENTICATED'
    });
  }

  // TODO: Admin users can access all clinics
  if (user.role === 'admin') {
    return next();
  }

  const requestedClinicId = req.params.clinicId || req.body.clinic_id;
  
  if (requestedClinicId && user.clinic_id !== requestedClinicId) {
    logger.warn('Clinic access denied', {
      userId: user.user_id,
      userClinicId: user.clinic_id,
      requestedClinicId,
      endpoint: req.path
    });

    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Access denied to this clinic',
      code: 'CLINIC_ACCESS_DENIED'
    });
  }

  next();
};
