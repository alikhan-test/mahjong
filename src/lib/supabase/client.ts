import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let cachedClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createClient() {
  if (typeof window === 'undefined') {
    return createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  if (!cachedClient) {
    cachedClient = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return cachedClient;
}
