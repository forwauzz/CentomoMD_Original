import type { User } from '@supabase/supabase-js';

export type ProfileLike = { display_name?: string | null };

export function resolveDisplayName(
  profile: ProfileLike | null | undefined,
  authUser: User | null | undefined
) {
  const fromProfile = profile?.display_name?.trim();
  if (fromProfile) return fromProfile;

  const metaName =
    (authUser?.user_metadata?.full_name as string | undefined)?.trim() ||
    (authUser?.user_metadata?.name as string | undefined)?.trim();
  if (metaName) return metaName;

  const emailName = authUser?.email?.split('@')[0];
  if (emailName) return emailName;

  return 'Unknown User';
}
