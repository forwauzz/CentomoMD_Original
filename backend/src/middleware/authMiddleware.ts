import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger, complianceLogger } from '@/utils/logger.js';

// Initialize Supabase client conditionally
let supabase: any = null;

const getSupabaseClient = () => {
  if (!supabase) {
    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Supabase credentials not configured, using mock authentication');
      return null;
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
};

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        clinic_id?: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const supabaseClient = getSupabaseClient();
    
    // If Supabase is not configured, allow access for development
    if (!supabaseClient) {
      logger.info('Mock authentication for development');
      req.user = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        name: 'Development User',
        role: 'doctor',
        clinic_id: 'dev-clinic-id'
      };
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid JWT token', {
        error: error?.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .select('id, email, name, role, clinic_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logger.error('User profile not found', {
        userId: user.id,
        error: profileError?.message
      });

      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Check if user is active
    if (profile.role === 'inactive') {
      logger.warn('Inactive user attempted access', {
        userId: user.id,
        email: profile.email,
        ip: req.ip
      });

      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'User account is inactive',
        code: 'INACTIVE_USER'
      });
    }

    // Attach user to request
    req.user = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      clinic_id: profile.clinic_id
    };

    // Log successful authentication
    complianceLogger.logAuth(profile.id, 'api_access', true, {
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();

  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
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

    return next();
  };
};

// Clinic-based authorization middleware
export const requireClinicAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'User not authenticated',
      code: 'NOT_AUTHENTICATED'
    });
  }

  // Admin users can access all clinics
  if (req.user.role === 'admin') {
    return next();
  }

  const requestedClinicId = req.params['clinicId'] || req.body.clinic_id;
  
  if (requestedClinicId && req.user.clinic_id !== requestedClinicId) {
    logger.warn('Clinic access denied', {
      userId: req.user.id,
      userClinicId: req.user.clinic_id,
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

  return next();
};

// Session ownership verification middleware
export const requireSessionOwnership = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'User not authenticated',
      code: 'NOT_AUTHENTICATED'
    });
  }

  const sessionId = req.params['sessionId'] || req.params['id'];
  
  if (!sessionId) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Session ID is required',
      code: 'MISSING_SESSION_ID'
    });
  }

  try {
    // Check if user owns the session or is admin
    const { data: session, error } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }

    if (req.user.role !== 'admin' && session.user_id !== req.user.id) {
      logger.warn('Session access denied', {
        userId: req.user.id,
        sessionId,
        sessionOwnerId: session.user_id,
        endpoint: req.path,
        method: req.method
      });

      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Access denied to this session',
        code: 'SESSION_ACCESS_DENIED'
      });
    }

    return next();

  } catch (error) {
    logger.error('Session ownership verification error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user.id,
      sessionId
    });

    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify session ownership',
      code: 'OWNERSHIP_VERIFICATION_ERROR'
    });
  }
};

// Optional authentication middleware (for public endpoints)
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user context
      return next();
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Invalid token, continue without user context
      return next();
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, email, name, role, clinic_id')
      .eq('id', user.id)
      .single();

    if (profile) {
      req.user = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        clinic_id: profile.clinic_id
      };
    }

    next();

  } catch (error) {
    // Error in optional auth, continue without user context
    next();
  }
};
