import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { isDevelopmentMode, getDevelopmentUser } from '../config/development.js';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        user_metadata?: any;
        user_id?: string;
        name?: string;
        role?: string;
        [key: string]: any; // Allow additional properties
      };
    }
  }
}

// Create Supabase client only if environment variables are available
let supabase: ReturnType<typeof createClient> | null = null;
try {
  if (process.env['SUPABASE_URL'] && process.env['SUPABASE_ANON_KEY']) {
    supabase = createClient(
      process.env['SUPABASE_URL'],
      process.env['SUPABASE_ANON_KEY']
    );
  }
} catch (error) {
  console.warn('[AUTH] Supabase client initialization failed, will use dev mode fallback');
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  // 🚀 DEVELOPMENT MODE: Auto-bypass auth
  if (isDevelopmentMode()) {
    req.user = getDevelopmentUser();
    console.log('🔧 [DEV] Auth bypassed - using mock user:', req.user.id);
    return next();
  }

  // 🔐 PRODUCTION MODE: Real authentication
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      // If Supabase is not configured, allow access for development
      if (!supabase) {
        console.log('🔧 [DEV] Supabase not configured - allowing access without auth');
        req.user = getDevelopmentUser();
        return next();
      }
      
      return res.status(401).json({ 
        success: false, 
        error: 'No authentication token provided' 
      });
    }

    if (!supabase) {
      console.log('🔧 [DEV] Supabase not configured - allowing access without auth');
      req.user = getDevelopmentUser();
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    // Map Supabase user to our expected format
    req.user = {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata,
      user_id: user.id,
      name: user.user_metadata?.['full_name'] || user.email || '',
      role: user.user_metadata?.['role'] || 'user'
    };
    console.log('🔐 [AUTH] Authenticated user:', user.id);
    next();
    
  } catch (error) {
    console.error('❌ [AUTH] Authentication error:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

// Optional: Middleware for routes that can work with or without auth
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  // 🚀 DEVELOPMENT MODE: Auto-bypass auth
  if (isDevelopmentMode()) {
    req.user = getDevelopmentUser();
    console.log('🔧 [DEV] Optional auth bypassed - using mock user:', req.user.id);
    return next();
  }
  
  // 🔐 PRODUCTION MODE: Try to authenticate, but don't fail if no token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email || '',
          user_metadata: user.user_metadata,
          user_id: user.id,
          name: user.user_metadata?.['full_name'] || user.email || '',
          role: user.user_metadata?.['role'] || 'user'
        };
        console.log('🔐 [AUTH] Optional auth - authenticated user:', user.id);
      }
    } catch (error) {
      // Silently fail for optional auth - continue without user context
      console.log('🔓 [AUTH] Optional auth - no valid token, continuing without auth');
    }
  } else {
    // No token provided or Supabase not configured - continue without user context (this is OK for optional auth)
    if (!token) {
      console.log('🔓 [AUTH] Optional auth - no token provided, continuing without auth');
    } else if (!supabase) {
      console.log('🔓 [AUTH] Optional auth - Supabase not configured, continuing without auth');
    }
  }
  next();
};