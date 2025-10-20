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

const supabase = createClient(
  process.env['SUPABASE_URL']!,
  process.env['SUPABASE_ANON_KEY']!
);

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
      return res.status(401).json({ 
        success: false, 
        error: 'No authentication token provided' 
      });
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
  if (isDevelopmentMode()) {
    req.user = getDevelopmentUser();
  } else {
    // Try to authenticate, but don't fail if no token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
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
        }
      } catch (error) {
        // Silently fail for optional auth
      }
    }
  }
  next();
};