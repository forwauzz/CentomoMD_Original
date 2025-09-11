import { createClient, type SupabaseClient, type User, type Session } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

/**
 * Vite exposes client-safe vars via import.meta.env when prefixed with VITE_.
 * We never throw at module load; we only validate on first use to avoid blank screens.
 */
function readSupabaseEnv() {
  const url = (import.meta as any)?.env?.VITE_SUPABASE_URL;
  const key = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY;

  const urlStr = String(url ?? '').trim();
  const keyStr = String(key ?? '').trim();

  return {
    ok: Boolean(urlStr) && Boolean(keyStr),
    url: urlStr,
    key: keyStr,
  };
}

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const { ok, url, key } = readSupabaseEnv();

  if (!ok) {
    // Dev-friendly breadcrumbs without leaking secrets
    // eslint-disable-next-line no-console
    console.error('Supabase env not configured', {
      hasUrl: Boolean(url),
      hasKey: Boolean(key),
      mode: (import.meta as any)?.env?.MODE,
      viteVars: (import.meta as any)?.env
        ? Object.keys((import.meta as any).env).filter((k) => k.startsWith('VITE_'))
        : [],
      origin: typeof window !== 'undefined' ? window.location.origin : 'no-window',
    });
    throw new Error('Supabase environment not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  }

  _client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

/**
 * Back-compat export so existing call sites like `supabase.from(...)` still work.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabase();
    // @ts-ignore - dynamic proxy
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

// Make Supabase client available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  console.log('🔧 Supabase client attached to window for debugging');
}

// Auth types
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

// Check if auth is configured
export const isAuthConfigured = () => {
  const { ok } = readSupabaseEnv();
  return ok;
};

// Helper functions for intended path preservation
const getSiteUrl = () => import.meta.env.VITE_SITE_URL || window.location.origin;

const INTENDED_KEY = 'auth_intended_path';
const saveIntendedPath = (path: string) => localStorage.setItem(INTENDED_KEY, path);
const getIntendedPath = () => localStorage.getItem(INTENDED_KEY);
const clearIntendedPath = () => localStorage.removeItem(INTENDED_KEY);

// OAuth state helpers
const encodeState = (obj: Record<string, any>) => btoa(encodeURIComponent(JSON.stringify(obj)));
const decodeState = (state: string) => {
  try { 
    return JSON.parse(decodeURIComponent(atob(state))); 
  } catch { 
    return {}; 
  }
};

// Export helpers for use in AuthCallback
export { getIntendedPath, clearIntendedPath, decodeState };

// Auth hook for session management
export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        console.log('🔍 Auth: Starting initial session check...');
        if (!isAuthConfigured()) {
          console.warn('⚠️ Auth: Supabase not configured');
          setState(prev => ({
            ...prev,
            loading: false,
          }));
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 Auth: Session check result:', { hasSession: !!session, hasError: !!error, sessionId: session?.user?.id });
        
        if (error) {
          console.error('❌ Supabase session error:', error);
          throw error;
        }
        
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ? mapSupabaseUser(session.user) : null,
          loading: false,
        }));
        
        console.log('✅ Auth: Initial session loaded successfully');
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        }));
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Session loading timeout - forcing loading to false');
      setState(prev => ({ ...prev, loading: false }));
    }, 5000); // 5 second timeout

    getInitialSession();

    if (isAuthConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setState(prev => ({
            ...prev,
            session,
            user: session?.user ? mapSupabaseUser(session.user) : null,
            loading: false,
          }));
        }
      );

      return () => {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    }

    return () => clearTimeout(timeoutId);
  }, []);

  const signInWithMagicLink = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      if (!isAuthConfigured()) {
        setState(prev => ({
          ...prev,
          error: 'Supabase not configured. Please set up VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
          loading: false,
        }));
        return;
      }

      // Capture current path before redirect
      const intended = window.location.pathname + window.location.search;
      saveIntendedPath(intended);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('❌ Supabase OTP error:', error);
        throw error;
      }
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('❌ Error in signInWithMagicLink:', error);
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
      if (!isAuthConfigured()) {
        setState(prev => ({
          ...prev,
          error: 'Supabase not configured. Please set up VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
          loading: false,
        }));
        return;
      }

      // Capture current path before redirect
      const intended = window.location.pathname + window.location.search;
      saveIntendedPath(intended);

      // Use state parameter for OAuth (preferred method)
      const state = encodeState({ intended });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getSiteUrl()}/auth/callback`,
          scopes: 'openid email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          state
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
      if (!isAuthConfigured()) {
        setState(prev => ({
          ...prev,
          loading: false,
        }));
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear local app state
      setState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });

      // Clear any stored auth data
      clearIntendedPath();
      sessionStorage.clear();

      // Navigate to login
      window.location.href = '/login';
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

// Helper function to map Supabase user to our format
const mapSupabaseUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email || '',
  name: user.user_metadata?.name,
  role: user.user_metadata?.role,
  clinic_id: user.user_metadata?.clinic_id,
});
