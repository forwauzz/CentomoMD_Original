import { Request, Response } from 'express';
import { z } from 'zod';

// TODO: Profile types - will be replaced with DB schema in PR7
export interface Profile {
  user_id: string;
  display_name: string;
  locale: 'en-CA' | 'fr-CA';
  consent_pipeda: boolean;
  consent_marketing: boolean;
  created_at: Date;
  updated_at: Date;
}

// TODO: Profile update schema - validation for PATCH requests
const profileUpdateSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  locale: z.enum(['en-CA', 'fr-CA'], {
    errorMap: () => ({ message: 'Locale must be en-CA or fr-CA' })
  }),
  consent_pipeda: z.boolean(),
  consent_marketing: z.boolean(),
}).partial(); // Allow partial updates

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

// TODO: Temporary in-memory store - replace with DB in PR7
const tempProfiles = new Map<string, Profile>();

// TODO: Initialize with some test data for development
const initializeTempProfiles = () => {
  tempProfiles.set('test-user-1', {
    user_id: 'test-user-1',
    display_name: 'Dr. John Smith',
    locale: 'en-CA',
    consent_pipeda: true,
    consent_marketing: false,
    created_at: new Date(),
    updated_at: new Date(),
  });
  
  tempProfiles.set('test-user-2', {
    user_id: 'test-user-2',
    display_name: 'Dr. Marie Dubois',
    locale: 'fr-CA',
    consent_pipeda: true,
    consent_marketing: true,
    created_at: new Date(),
    updated_at: new Date(),
  });
};

// Initialize temp data
initializeTempProfiles();

// TODO: GET /api/profile - returns current user's profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    // TODO: Extract user_id from auth middleware
    const user_id = req.user?.id || 'test-user-1'; // Fallback for development
    
    const profile = tempProfiles.get(user_id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        display_name: profile.display_name,
        locale: profile.locale,
        consent_pipeda: profile.consent_pipeda,
        consent_marketing: profile.consent_marketing,
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

// TODO: PATCH /api/profile - updates current user's profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    // TODO: Extract user_id from auth middleware
    const user_id = req.user?.id || 'test-user-1'; // Fallback for development
    
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
    const existingProfile = tempProfiles.get(user_id);
    
    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // TODO: Update profile - replace with DB update in PR7
    const updatedProfile: Profile = {
      ...existingProfile,
      ...updates,
      display_name: updates.display_name ?? existingProfile.display_name,
      locale: updates.locale ?? existingProfile.locale,
      consent_pipeda: updates.consent_pipeda ?? existingProfile.consent_pipeda,
      consent_marketing: updates.consent_marketing ?? existingProfile.consent_marketing,
      updated_at: new Date(),
    };
    
    tempProfiles.set(user_id, updatedProfile);
    
    res.json({
      success: true,
      data: {
        display_name: updatedProfile.display_name,
        locale: updatedProfile.locale,
        consent_pipeda: updatedProfile.consent_pipeda,
        consent_marketing: updatedProfile.consent_marketing,
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

// TODO: Profile routes - apply auth middleware only when AUTH_REQUIRED=true
export const profileRoutes = (router: any) => {
  console.log('Registering profile routes - AUTH DISABLED FOR TESTING');
  
  // TODO: Temporarily disable auth for testing
  router.get('/api/profile', getProfile);
  router.patch('/api/profile', updateProfile);
};
