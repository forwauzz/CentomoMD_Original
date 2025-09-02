import { Router } from 'express';
import { getDb, getSql } from '../database/connection.js';
import { profiles } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Apply auth middleware to all profile routes
router.use(authMiddleware);

// GET profile - improved to handle empty profiles gracefully
router.get('/api/profile', async (req, res) => {
  const db = getDb();
  const sql = getSql();
  const user = (req as any).user;

  try {
    // Audit logging for secure event tracking
    logger.info('Profile access requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Use authenticated user ID
    const userId = user?.user_id;

    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing user ID',
        message: 'User ID not found in authentication context'
      });
    }

    // Check if profiles table exists
    const exists = await sql`
      select 1 from information_schema.tables
      where table_schema='public' and table_name='profiles' limit 1
    `;
    
    if (exists.length === 0) {
      return res.status(500).json({ error: 'profiles table missing — run migrations' });
    }

    // Get profile data
    const profileRows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, userId))
      .limit(1);

    // If no profile exists, return basic user info with profile creation flag
    if (profileRows.length === 0) {
      return res.json({
        ok: true,
        profileExists: false,
        needsProfileCreation: true,
        user: {
          id: user?.user_id,
          email: user?.email,
          role: user?.role || 'physician'
        },
        message: 'Profile not found. Use POST /api/profile to create one.'
      });
    }

    // Profile exists, return full data
    const profile = profileRows[0];
    
    // Audit logging for successful access
    logger.info('Profile access successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      profilesFound: profileRows.length
    });

    return res.json({
      ok: true,
      profileExists: true,
      needsProfileCreation: false,
      profile: profile,
      user: {
        id: user?.user_id,
        email: user?.email,
        role: user?.role || 'physician'
      }
    });

  } catch (err: any) {
    // Audit logging for errors
    logger.error('Profile access failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: err?.message,
      stack: err?.stack
    });

    console.error('[GET /api/profile] ERROR', {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      detail: err?.detail,
      hint: err?.hint,
      routine: err?.routine,
      schema: err?.schema,
      table: err?.table,
      column: err?.column,
      stack: err?.stack,
    });
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST profile - create new profile for user
router.post('/api/profile', async (req, res) => {
  const db = getDb();
  const user = (req as any).user;

  try {
    const userId = user?.user_id;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing user ID',
        message: 'User ID not found in authentication context'
      });
    }

    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      return res.status(409).json({ 
        error: 'Profile already exists',
        message: 'User profile already exists'
      });
    }

    // Create new profile with default values
    const newProfile = await db
      .insert(profiles)
      .values({
        user_id: userId,
        display_name: user?.email?.split('@')[0] || 'User', // Use email prefix as display name
        locale: 'fr-CA', // Default to French Canadian
        consent_pipeda: false,
        consent_marketing: false
      })
      .returning();

    logger.info('Profile created successfully', {
      userId: userId,
      userEmail: user?.email,
      profileId: newProfile[0]?.user_id
    });

    return res.status(201).json({
      ok: true,
      message: 'Profile created successfully',
      profile: newProfile[0]
    });

  } catch (err: any) {
    logger.error('Profile creation failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      error: err?.message,
      stack: err?.stack
    });

    console.error('[POST /api/profile] ERROR', {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      detail: err?.detail,
      hint: err?.hint,
      routine: err?.routine,
      schema: err?.schema,
      table: err?.table,
      column: err?.column,
      stack: err?.stack,
    });
    
    return res.status(500).json({ 
      error: 'Failed to create profile',
      message: err?.message || 'Unknown error occurred'
    });
  }
});

export default router;
