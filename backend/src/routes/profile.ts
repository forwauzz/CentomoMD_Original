import { Router } from 'express';
import { getDb, getSql } from '../database/connection.js';
import { profiles } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { ensureProfileSynced } from '../utils/profileSync.js';
import { ensureProfileSync } from '../middleware/profileSync.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Enable authentication middleware
router.use(authenticateUser);

// Ensure profile sync on all profile routes
router.use(ensureProfileSync);

// Mock user function removed - using real authenticated user

// GET profile - improved to handle empty profiles gracefully
router.get('/api/profile', async (req, res) => {
  const sql = getSql();
  
  // Use real authenticated user (remove mock fallback)
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'No authenticated user found'
    });
  }

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

    // Ensure profile exists and is synced with auth data
    const profile = await ensureProfileSynced(userId, {
      email: user?.email,
      user_metadata: user?.user_metadata || {}
    });
    
    // Audit logging for successful access
    logger.info('Profile access successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      displayName: profile.display_name
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
  
  // Use real authenticated user
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'No authenticated user found'
    });
  }

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

    // Create new profile synced with auth data
    const profile = await ensureProfileSynced(userId, {
      email: user?.email,
      user_metadata: user?.user_metadata || {}
    });

    logger.info('Profile created successfully', {
      userId: userId,
      userEmail: user?.email,
      profileId: profile.user_id,
      displayName: profile.display_name
    });

    return res.status(201).json({
      ok: true,
      message: 'Profile created successfully',
      profile: profile
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

// PATCH profile - update existing profile
router.patch('/api/profile', async (req, res) => {
  const db = getDb();
  
  // Use real authenticated user
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'No authenticated user found'
    });
  }

  try {
    const userId = user?.user_id;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing user ID',
        message: 'User ID not found in authentication context'
      });
    }

    // Validate request body
    const { display_name, locale, consent_pipeda, consent_marketing, default_clinic_id } = req.body;

    // Server-side validation
    const validationErrors: string[] = [];
    
    if (display_name !== undefined) {
      if (typeof display_name !== 'string') {
        validationErrors.push('display_name must be a string');
      } else if (display_name.length > 255) {
        validationErrors.push('display_name must be 255 characters or less');
      } else if (display_name.trim().length === 0) {
        validationErrors.push('display_name cannot be empty');
      }
    }

    if (locale !== undefined) {
      if (!['en-CA', 'fr-CA'].includes(locale)) {
        validationErrors.push('locale must be either "en-CA" or "fr-CA"');
      }
    }

    if (consent_pipeda !== undefined && typeof consent_pipeda !== 'boolean') {
      validationErrors.push('consent_pipeda must be a boolean');
    }

    if (consent_marketing !== undefined && typeof consent_marketing !== 'boolean') {
      validationErrors.push('consent_marketing must be a boolean');
    }

    if (default_clinic_id !== undefined && default_clinic_id !== null) {
      if (typeof default_clinic_id !== 'string') {
        validationErrors.push('default_clinic_id must be a string or null');
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: validationErrors
      });
    }

    // Check if profile exists
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, userId))
      .limit(1);

    if (existingProfile.length === 0) {
      return res.status(404).json({ 
        error: 'Profile not found',
        message: 'User profile does not exist. Use POST /api/profile to create one.'
      });
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (display_name !== undefined) updateData.display_name = display_name.trim();
    if (locale !== undefined) updateData.locale = locale;
    if (consent_pipeda !== undefined) updateData.consent_pipeda = consent_pipeda;
    if (consent_marketing !== undefined) updateData.consent_marketing = consent_marketing;
    if (default_clinic_id !== undefined) updateData.default_clinic_id = default_clinic_id;

    // Update profile
    const updatedProfile = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.user_id, userId))
      .returning();

    // Audit logging
    const changedFields = Object.keys(updateData).filter(key => key !== 'updated_at');
    logger.info('Profile updated successfully', {
      userId: userId,
      userEmail: user?.email,
      changedFields: changedFields,
      endpoint: req.path,
      method: req.method
    });

    return res.json({
      success: true,
      data: updatedProfile[0],
      message: 'Profile updated successfully'
    });

  } catch (err: any) {
    logger.error('Profile update failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      error: err?.message,
      stack: err?.stack
    });

    console.error('[PATCH /api/profile] ERROR', {
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
      error: 'Failed to update profile',
      message: err?.message || 'Unknown error occurred'
    });
  }
});

export default router;
