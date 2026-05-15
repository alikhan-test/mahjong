import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Strip UTF-8 BOM (U+FEFF) that Windows sometimes prepends to env var values
const stripBOM = (s: string) => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);
const SUPABASE_URL = stripBOM(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
const SUPABASE_ANON_KEY = stripBOM(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '');

let cachedClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createClient() {
  if (typeof window === 'undefined') {
    return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  if (!cachedClient) {
    cachedClient = createSupabaseClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: false, // we exchange the code manually in /auth/callback
        },
      },
    );
  }
  return cachedClient;
}
