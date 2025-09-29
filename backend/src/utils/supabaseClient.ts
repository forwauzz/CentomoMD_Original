import { createClient } from '@supabase/supabase-js';

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (_client) return _client;
  
  const supabaseUrl = process.env['SUPABASE_URL']!;
  const supabaseAnonKey = process.env['SUPABASE_ANON_KEY']!;
  
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  return _client;
}

// Export a cached instance for convenience
export const supabase = getSupabaseClient();
