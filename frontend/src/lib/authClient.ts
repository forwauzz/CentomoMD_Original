import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

// TODO: Define auth types
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  clinic_id?: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

// TODO: Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// TODO: Auth hook for session management
export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // TODO: Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ? mapSupabaseUser(session.user) : null,
          loading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        }));
      }
    };

    getInitialSession();

    // TODO: Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ? mapSupabaseUser(session.user) : null,
          loading: false,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // TODO: Auth methods
  const signInWithMagicLink = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign in failed',
        loading: false,
      }));
    }
  };

  const signInWithGoogle = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Google sign in failed',
        loading: false,
      }));
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign out failed',
        loading: false,
      }));
    }
  };

  return {
    ...state,
    signInWithMagicLink,
    signInWithGoogle,
    signOut,
  };
};

// TODO: Helper function to map Supabase user to our format
const mapSupabaseUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email || '',
  name: user.user_metadata?.name,
  role: user.user_metadata?.role,
  clinic_id: user.user_metadata?.clinic_id,
});
