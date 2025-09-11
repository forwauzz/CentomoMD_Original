import { Request, Response, NextFunction } from 'express';
import { logger } from './utils/logger.js';
import { getSupabaseClient } from './lib/supabaseClient.js';
import { ENV } from './config/env.js';

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

// Define auth middleware interface
export interface AuthMiddleware {
  (req: Request, res: Response, next: NextFunction): Promise<void | Response>;
}

// JWT verification function using Supabase client
export const verifySupabaseJWT = async (token: string): Promise<UserContext | null> => {
  try {
    // Get Supabase client
    const supabase = getSupabaseClient();
    
    // Verify token using Supabase client
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      logger.warn('Supabase token verification failed', { 
        error: error?.message || 'No user data returned',
        hasUser: !!user
      });
      return null;
    }
    
    // Extract user information from Supabase user
    const userContext: UserContext = {
      user_id: user.id,
      clinic_id: user.user_metadata?.['clinic_id'] as string,
      role: user.user_metadata?.['role'] as string || 'physician',
      email: user.email || '',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600, // Default expiry
      iat: Math.floor(Date.now() / 1000)
    };
    
    // Validate required fields
    if (!userContext.user_id || !userContext.email) {
      logger.warn('User data missing required fields', { 
        hasUserId: !!userContext.user_id, 
        hasEmail: !!userContext.email 
      });
      return null;
    }
    
    logger.info('Token verification successful', {
      userId: userContext.user_id,
      userEmail: userContext.email,
      userRole: userContext.role
    });
    
    return userContext;
  } catch (error) {
    logger.error('JWT verification failed', { 
      error: error instanceof Error ? error.message : 'Unknown error'
      // Removed token logging for security
    });
    return null;
  }
};

// Unified verification function with strategy toggle
export const verifyAccessToken = async (token: string): Promise<UserContext | null> => {
  const strategy = ENV.AUTH_VERIFY_STRATEGY || 'supabase';
  
  try {
    if (strategy === 'jwks') {
      const { verifyJWTWithJWKS } = await import('./utils/jwks.js');
      const payload = await verifyJWTWithJWKS(token);
      if (!payload) return null;
      
      // Convert JWKS payload to UserContext
      return {
        user_id: payload.sub,
        clinic_id: payload.clinic_id,
        role: payload.role || 'physician',
        email: payload.email || '',
        aud: payload.aud,
        exp: payload.exp,
        iat: payload.iat
      };
    } else {
      // Default to Supabase strategy
      return await verifySupabaseJWT(token);
    }
  } catch (error) {
    logger.error('Token verification failed', {
      strategy,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
};

// Export auth middleware for HTTP endpoints
export const authMiddleware: AuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header', {
        endpoint: req.path,
        method: req.method,
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader?.substring(0, 7)
      });
      
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Use unified verification function
    const userContext = await verifyAccessToken(token);
    
    if (!userContext) {
      logger.warn('Invalid or expired token', {
        endpoint: req.path,
        method: req.method,
        tokenLength: token.length
      });
      
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check token expiration
    if (userContext.exp < Date.now() / 1000) {
      logger.warn('Token has expired', {
        endpoint: req.path,
        method: req.method,
        userId: userContext.user_id,
        tokenExp: new Date(userContext.exp * 1000).toISOString(),
        currentTime: new Date().toISOString()
      });
      
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Attach user context to request
    (req as any).user = userContext;
    
    // Log successful authentication
    logger.info('User authenticated', { 
      userId: userContext.user_id,
      userEmail: userContext.email,
      userRole: userContext.role,
      endpoint: req.path,
      method: req.method 
    });

    return next();
  } catch (error) {
    logger.error('Auth middleware error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      method: req.method
    });
    
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

// Optional auth middleware for endpoints that work with or without auth
export const optionalAuthMiddleware: AuthMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
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
      logger.debug('Optional auth: User context attached', {
        userId: userContext.user_id,
        endpoint: req.path,
        method: req.method
      });
    } else if (userContext) {
      logger.debug('Optional auth: Token expired, no user context attached', {
        endpoint: req.path,
        method: req.method
      });
    }

    next();
  } catch (error) {
    // Error in optional auth, continue without user context
    logger.debug('Optional auth: Error occurred, continuing without user context', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      method: req.method
    });
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      logger.warn('Role check failed: User not authenticated', {
        endpoint: req.path,
        method: req.method,
        requiredRoles: allowedRoles
      });
      
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(user.role)) {
      logger.warn('Insufficient permissions', {
        userId: user.user_id,
        userEmail: user.email,
        userRole: user.role,
        requiredRoles: allowedRoles,
        endpoint: req.path,
        method: req.method
      });

      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    logger.debug('Role check passed', {
      userId: user.user_id,
      userRole: user.role,
      requiredRoles: allowedRoles,
      endpoint: req.path,
      method: req.method
    });

    return next();
  };
};

// Clinic-based authorization middleware
export const requireClinicAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    logger.warn('Clinic access check failed: User not authenticated', {
      endpoint: req.path,
      method: req.method
    });
    
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'User not authenticated',
      code: 'NOT_AUTHENTICATED'
    });
  }

  // Admin users can access all clinics
  if (user.role === 'admin') {
    logger.debug('Clinic access granted: Admin user', {
      userId: user.user_id,
      userRole: user.role,
      endpoint: req.path,
      method: req.method
    });
    return next();
  }

  const requestedClinicId = req.params['clinicId'] || req.body.clinic_id;
  
  if (requestedClinicId && user.clinic_id !== requestedClinicId) {
    logger.warn('Clinic access denied', {
      userId: user.user_id,
      userEmail: user.email,
      userClinicId: user.clinic_id,
      requestedClinicId,
      endpoint: req.path,
      method: req.method
    });

    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Access denied to this clinic',
      code: 'CLINIC_ACCESS_DENIED'
    });
  }

  logger.debug('Clinic access granted', {
    userId: user.user_id,
    userClinicId: user.clinic_id,
    requestedClinicId,
    endpoint: req.path,
    method: req.method
  });

  next();
};
