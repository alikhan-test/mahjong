import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env';
import type { Database } from './types';

let cachedClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createClient() {
  if (typeof window === 'undefined') {
    return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  if (!cachedClient) {
    cachedClient = createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
      },
    });
  }
  return cachedClient;
}
