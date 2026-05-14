'use client';

import { useEffect, useState } from 'react';
import { LogIn } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export default function GuestBanner() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (user === undefined || user !== null) return null;

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5 flex items-center justify-between gap-3">
      <p className="text-sm text-amber-700 dark:text-amber-300">
        🎭 Playing as Guest — scores won&apos;t be saved or shown on leaderboards.
      </p>
      <button
        onClick={signIn}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow transition-all shrink-0"
      >
        <LogIn size={13} />
        Sign in
      </button>
    </div>
  );
}
