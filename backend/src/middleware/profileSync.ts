import { Request, Response, NextFunction } from 'express';
import { ensureProfileSynced } from '../utils/profileSync.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to ensure profile is synced with auth data
 * This should be used on routes that require profile data
 */
export const ensureProfileSync = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (!user?.user_id) {
      return next(); // No user, skip sync
    }

    // Ensure profile is synced with current auth data
    await ensureProfileSynced(user.user_id, {
      email: user.email,
      user_metadata: user.user_metadata || {}
    });

    logger.debug('Profile sync middleware completed', {
      userId: user.user_id,
      email: user.email
    });

    next();
  } catch (error) {
    logger.error('Profile sync middleware failed', {
      userId: (req as any).user?.user_id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Don't fail the request, just log the error
    next();
  }
};

/**
 * Optional profile sync middleware for routes that can work without profile
 */
export const optionalProfileSync = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (user?.user_id) {
      await ensureProfileSynced(user.user_id, {
        email: user.email,
        user_metadata: user.user_metadata || {}
      });
    }

    next();
  } catch (error) {
    // Silently fail for optional sync
    logger.debug('Optional profile sync failed', {
      userId: (req as any).user?.user_id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next();
  }
};
