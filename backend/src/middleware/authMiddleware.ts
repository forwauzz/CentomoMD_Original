import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '@/lib/supabaseClient.js';
import { logger, complianceLogger } from '@/utils/logger.js';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
        email: string;
        name: string;
        role: string;
        clinic_id?: string;
        profile?: {
          display_name?: string;
          locale: string;
          consent_pipeda: boolean;
          consent_marketing: boolean;
          default_clinic_id?: string;
        };
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
    let supabaseClient;
    try {
      supabaseClient = getSupabaseClient();
    } catch (error) {
      // If Supabase is not configured, allow access for development
      logger.info('Mock authentication for development - Supabase not configured');
      req.user = {
        user_id: 'dev-user-id',
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
      .from('profiles')
      .select('user_id, display_name, locale, consent_pipeda, consent_marketing, default_clinic_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      logger.error('User profile not found', {
        userId: user.id,
        error: profileError?.message
      });

      // For development mode, create a mock profile
      const mockProfile = {
        user_id: user.id,
        display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
        locale: 'fr-CA',
        consent_pipeda: false,
        consent_marketing: false,
        default_clinic_id: null
      };

      // Attach user to request with mock profile data
      req.user = {
        user_id: user.id,
        email: user.email || '',
        name: mockProfile.display_name,
        role: 'physician',
        clinic_id: mockProfile.default_clinic_id,
        profile: mockProfile
      };

      // Log successful authentication with mock profile
      complianceLogger.logAuth(user.id, 'api_access', true, {
        endpoint: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return next();
    }

    // Attach user to request with profile data
    req.user = {
      user_id: profile.user_id,
      email: user.email,
      name: profile.display_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
      role: 'physician', // Default role, can be enhanced later with role management
      clinic_id: profile.default_clinic_id,
      profile: {
        display_name: profile.display_name,
        locale: profile.locale,
        consent_pipeda: profile.consent_pipeda,
        consent_marketing: profile.consent_marketing,
        default_clinic_id: profile.default_clinic_id
      }
    };

    // Log successful authentication
    complianceLogger.logAuth(profile.user_id, 'api_access', true, {
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
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_id, display_name, locale, consent_pipeda, consent_marketing, default_clinic_id')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      req.user = {
        user_id: profile.user_id,
        email: user.email,
        name: profile.display_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
        role: 'physician',
        clinic_id: profile.default_clinic_id,
        profile: {
          display_name: profile.display_name,
          locale: profile.locale,
          consent_pipeda: profile.consent_pipeda,
          consent_marketing: profile.consent_marketing,
          default_clinic_id: profile.default_clinic_id
        }
      };
    }

    next();

  } catch (error) {
    // Error in optional auth, continue without user context
    next();
  }
};
