import { getDb } from '../database/connection.js';
import { profiles } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from './logger.js';

/**
 * Syncs profile data with authentication data to ensure consistency
 * This ensures the profile always reflects the current auth user data
 */
export async function syncProfileWithAuth(
  userId: string, 
  authUser: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
      role?: string;
    };
  }
): Promise<{ synced: boolean; profile: any }> {
  const db = getDb();
  
  try {
    // Get current profile
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, userId))
      .limit(1);

    // Determine the best display name from auth data
    const authDisplayName = 
      authUser.user_metadata?.full_name?.trim() ||
      authUser.user_metadata?.name?.trim() ||
      authUser.email?.split('@')[0] ||
      'User';

    // If no profile exists, create one
    if (existingProfile.length === 0) {
      const newProfile = await db
        .insert(profiles)
        .values({
          user_id: userId,
          email: authUser.email,
          display_name: authDisplayName,
          locale: 'fr-CA', // Default locale
          consent_pipeda: false,
          consent_marketing: false
        })
        .returning();

      logger.info('Profile created with auth sync', {
        userId,
        displayName: authDisplayName,
        email: authUser.email
      });

      return { synced: true, profile: newProfile[0] };
    }

    // Profile exists - check if display name or email needs updating
    const currentProfile = existingProfile[0];
    const needsDisplayNameUpdate = currentProfile.display_name !== authDisplayName;
    const needsEmailUpdate = currentProfile.email !== authUser.email;

    if (needsDisplayNameUpdate || needsEmailUpdate) {
      const updatedProfile = await db
        .update(profiles)
        .set({
          email: authUser.email,
          display_name: authDisplayName,
          updated_at: new Date()
        })
        .where(eq(profiles.user_id, userId))
        .returning();

      logger.info('Profile synced with auth data', {
        userId,
        oldDisplayName: currentProfile.display_name,
        newDisplayName: authDisplayName,
        email: authUser.email
      });

      return { synced: true, profile: updatedProfile[0] };
    }

    // No sync needed
    return { synced: false, profile: currentProfile };

  } catch (error) {
    logger.error('Profile sync failed', {
      userId,
      email: authUser.email,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Ensures profile exists and is synced with auth data
 * This should be called whenever we need to ensure profile consistency
 */
export async function ensureProfileSynced(
  userId: string,
  authUser: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
      role?: string;
    };
  }
): Promise<any> {
  try {
    const { profile } = await syncProfileWithAuth(userId, authUser);
    return profile;
  } catch (error) {
    logger.error('Failed to ensure profile sync', {
      userId,
      email: authUser.email,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
