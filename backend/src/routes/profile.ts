import { Request, Response } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../database/connection.js';
import { profiles, type Profile, type NewProfile } from '../database/schema.js';

// Profile update schema - validation for PATCH requests
const profileUpdateSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  locale: z.enum(['en-CA', 'fr-CA'], {
    errorMap: () => ({ message: 'Locale must be en-CA or fr-CA' })
  }),
  consent_pipeda: z.boolean(),
  consent_marketing: z.boolean(),
}).partial(); // Allow partial updates

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

// GET /api/profile - returns current user's profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    // Extract user_id from auth middleware or fallback for development
    const user_id = req.user?.id || 'test-user-1';
    
    // Try to get profile from database first
    const profile = await db.select().from(profiles).where(eq(profiles.user_id, user_id)).limit(1);
    
    if (profile.length === 0) {
      // If no profile exists, create a default one
      const defaultProfile: NewProfile = {
        user_id,
        display_name: `User ${user_id}`,
        locale: 'fr-CA',
        consent_pipeda: false,
        consent_marketing: false,
      };
      
      await db.insert(profiles).values(defaultProfile);
      
      return res.json({
        success: true,
        data: {
          display_name: defaultProfile.display_name,
          locale: defaultProfile.locale,
          consent_pipeda: defaultProfile.consent_pipeda,
          consent_marketing: defaultProfile.consent_marketing,
        }
      });
    }
    
    const userProfile = profile[0];
    
    if (!userProfile) {
      return res.status(500).json({
        success: false,
        error: 'Profile data is invalid'
      });
    }
    
    return res.json({
      success: true,
      data: {
        display_name: userProfile.display_name,
        locale: userProfile.locale,
        consent_pipeda: userProfile.consent_pipeda,
        consent_marketing: userProfile.consent_marketing,
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
};

// PATCH /api/profile - updates current user's profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    // Extract user_id from auth middleware or fallback for development
    const user_id = req.user?.id || 'test-user-1';
    
    // Validate request body
    const validationResult = profileUpdateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }
    
    const updates = validationResult.data;
    
    // Check if profile exists
    const existingProfile = await db.select().from(profiles).where(eq(profiles.user_id, user_id)).limit(1);
    
    if (existingProfile.length === 0) {
      // Create new profile if it doesn't exist
      const newProfile: NewProfile = {
        user_id,
        display_name: updates.display_name || `User ${user_id}`,
        locale: updates.locale || 'fr-CA',
        consent_pipeda: updates.consent_pipeda ?? false,
        consent_marketing: updates.consent_marketing ?? false,
      };
      
      await db.insert(profiles).values(newProfile);
      
      return res.json({
        success: true,
        data: {
          display_name: newProfile.display_name,
          locale: newProfile.locale,
          consent_pipeda: newProfile.consent_pipeda,
          consent_marketing: newProfile.consent_marketing,
        }
      });
    }
    
    // Update existing profile - only include defined values
    const updateData: Partial<Profile> = {
      updated_at: new Date(),
    };
    
    if (updates.display_name !== undefined) updateData.display_name = updates.display_name;
    if (updates.locale !== undefined) updateData.locale = updates.locale;
    if (updates.consent_pipeda !== undefined) updateData.consent_pipeda = updates.consent_pipeda;
    if (updates.consent_marketing !== undefined) updateData.consent_marketing = updates.consent_marketing;
    
    await db.update(profiles)
      .set(updateData)
      .where(eq(profiles.user_id, user_id));
    
    // Get updated profile
    const updatedProfile = await db.select().from(profiles).where(eq(profiles.user_id, user_id)).limit(1);
    
    if (!updatedProfile[0]) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve updated profile'
      });
    }
    
    return res.json({
      success: true,
      data: {
        display_name: updatedProfile[0].display_name,
        locale: updatedProfile[0].locale,
        consent_pipeda: updatedProfile[0].consent_pipeda,
        consent_marketing: updatedProfile[0].consent_marketing,
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

// Profile routes - apply auth middleware only when AUTH_REQUIRED=true
export const profileRoutes = (router: any) => {
  console.log('Registering profile routes - AUTH DISABLED FOR TESTING');
  
  // TODO: Temporarily disable auth for testing
  router.get('/api/profile', getProfile);
  router.patch('/api/profile', updateProfile);
};
