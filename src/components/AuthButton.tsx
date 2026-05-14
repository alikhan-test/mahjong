'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { LogIn, LogOut, BarChart2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  onStatsClick: () => void;
}

export default function AuthButton({ onStatsClick }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession()
      .then(({ data }) => setUser(data.session?.user ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setAvatarError(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }

  if (loading) {
    return <div className="h-9 w-24 rounded-xl bg-stone-200 dark:bg-stone-700 animate-pulse" />;
  }

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 text-stone-700 dark:text-stone-200 hover:ring-emerald-400 transition-all text-sm font-semibold shadow-sm"
      >
        <LogIn size={15} />
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user.user_metadata?.avatar_url && !avatarError ? (
        <img
          src={user.user_metadata.avatar_url}
          alt="avatar"
          className="w-8 h-8 rounded-full ring-2 ring-emerald-400 object-cover"
          onError={() => setAvatarError(true)}
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-emerald-400">
          {(user.user_metadata?.full_name ?? user.email ?? '?')[0].toUpperCase()}
        </div>
      )}

      <span className="text-sm font-semibold text-stone-700 dark:text-stone-200 hidden sm:block max-w-28 truncate">
        {user.user_metadata?.full_name?.split(' ')[0] ?? 'Player'}
      </span>

      <button
        onClick={onStatsClick}
        title="My Statistics"
        className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
      >
        <BarChart2 size={16} />
      </button>

      <button
        onClick={signOut}
        title="Sign out"
        className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
