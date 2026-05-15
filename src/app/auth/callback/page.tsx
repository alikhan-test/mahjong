'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Diagnose env vars for non-ISO-8859-1 characters (causes fetch header TypeError)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
    const badUrlChars = [...supabaseUrl].filter(c => c.charCodeAt(0) > 127);
    const badKeyChars = [...supabaseKey].filter(c => c.charCodeAt(0) > 127);
    console.log('[auth/callback] SUPABASE_URL:', supabaseUrl, '| bad chars:', badUrlChars);
    console.log('[auth/callback] ANON_KEY length:', supabaseKey.length, '| bad chars:', badKeyChars, '| first charCode:', supabaseKey.charCodeAt(0), '| last charCode:', supabaseKey.charCodeAt(supabaseKey.length - 1));

    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');
    const errorDesc = params.get('error_description');

    console.log('[auth/callback] params:', Object.fromEntries(params.entries()));
    console.log('[auth/callback] code present:', !!code);

    if (errorParam) {
      console.error('[auth/callback] OAuth error from provider:', errorParam, errorDesc);
      setError(`${errorParam}: ${errorDesc ?? ''}`);
      return;
    }

    if (!code) {
      console.warn('[auth/callback] No code in URL, redirecting home');
      router.replace('/');
      return;
    }

    console.log('[auth/callback] Calling exchangeCodeForSession...');
    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (error) {
        console.error('[auth/callback] exchangeCodeForSession failed:', error.status, error.message, error);
        setError(error.message);
      } else {
        console.log('[auth/callback] Session obtained, user:', data.user?.id, data.user?.email);
        router.replace('/');
      }
    });
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="max-w-md w-full mx-4 p-6 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-bold text-lg mb-2">Auth error</p>
          <p className="text-stone-600 dark:text-stone-400 text-sm font-mono break-all">{error}</p>
          <button
            onClick={() => router.replace('/')}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-emerald-50 to-teal-50 dark:from-stone-950 dark:via-emerald-950 dark:to-teal-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-500 dark:text-stone-400 text-sm">Signing in…</p>
      </div>
    </div>
  );
}
