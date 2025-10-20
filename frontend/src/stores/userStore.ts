import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export interface UserProfile {
  user_id: string;
  email?: string;
  display_name: string;
  locale: 'en-CA' | 'fr-CA';
  consent_pipeda: boolean;
  consent_marketing: boolean;
  default_clinic_id?: string;
}

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  refreshProfile: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      loading: false,
      error: null,
      initialized: false,
      
      // Actions
      setProfile: (profile) => set({ profile, error: null }),
      
      updateProfile: (updates) => {
        const currentProfile = get().profile;
        if (currentProfile) {
          set({ 
            profile: { ...currentProfile, ...updates },
            error: null 
          });
        }
      },
      
      refreshProfile: async () => {
        if (get().loading) return;
        set({ loading: true, error: null });
        try {
          const res = await apiFetch<{ ok: boolean; profile: UserProfile }>('/api/profile');
          set({ profile: res.profile, loading: false, initialized: true });
        } catch (e: any) {
          set({ 
            error: e?.message || 'Failed to load profile', 
            loading: false, 
            initialized: true 
          });
        }
      },
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      clearProfile: () => set({ profile: null, error: null, initialized: false }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);

// Lazy init hook to ensure profile is loaded
export function useEnsureProfileLoaded() {
  const initialized = useUserStore((s) => s.initialized);
  const refreshProfile = useUserStore((s) => s.refreshProfile);
  
  useEffect(() => {
    if (!initialized) {
      refreshProfile();
    }
  }, [initialized, refreshProfile]);
}
