'use client';

import { useEffect, useState } from 'react';
import { LogIn, LogOut, Trophy, Clock, CheckCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useGameStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { getDailyLeaderboard, DailyLeaderboardEntry } from '@/lib/supabase/database';

const LB_CACHE_TTL  = 30 * 60 * 1000;
const LB_STALE_TTL  = 60 * 60 * 1000;

interface LbCache { data: DailyLeaderboardEntry[]; ts: number }

function lbCacheGet(date: string, diff: string): { data: DailyLeaderboardEntry[]; stale: boolean } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`mj_lb_${date}_${diff}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as LbCache;
    const age = Date.now() - ts;
    if (age > LB_STALE_TTL) return null;
    return { data, stale: age > LB_CACHE_TTL };
  } catch { return null; }
}

function lbCacheSet(date: string, diff: string, data: DailyLeaderboardEntry[]) {
  try { localStorage.setItem(`mj_lb_${date}_${diff}`, JSON.stringify({ data, ts: Date.now() } satisfies LbCache)); } catch {}
}

type View = 'classic' | 'daily' | 'multiplayer';

interface Props {
  onSelect: (view: View) => void;
}

const MODES = [
  {
    id: 'multiplayer' as View,
    emoji: '⚔️',
    title: 'Multiplayer Battle',
    subtitle: 'Fight for global ranking',
    desc: 'Play against the world. Win to climb the cups — lose and fall. Real-time matchmaking, live opponents.',
    badge: 'Coming Soon',
    badgeColor: 'bg-stone-200 text-stone-500 dark:bg-stone-700 dark:text-stone-400',
    cardColor: 'border-stone-200 dark:border-stone-700 opacity-70',
    btnClass: 'bg-stone-300 dark:bg-stone-700 text-stone-500 dark:text-stone-400 cursor-not-allowed',
    available: false,
  },
  {
    id: 'daily' as View,
    emoji: '🗓️',
    title: 'Daily Challenge',
    subtitle: 'One board · All players · One shot',
    desc: 'Every day a new seeded board, identical for everyone. Race for the top score — you get one attempt, make it count.',
    badge: 'PLAY TODAY',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    cardColor: 'border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/30 dark:ring-emerald-600/30',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30',
    available: true,
  },
  {
    id: 'classic' as View,
    emoji: '🎮',
    title: 'Classic Mode',
    subtitle: 'Free play with difficulty levels',
    desc: 'Unlimited games across three layouts and three difficulties. Combos, hints, mods, undo — everything at your own pace.',
    badge: 'Free Play',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    cardColor: 'border-blue-300 dark:border-blue-700',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30',
    available: true,
  },
];

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function ModeSelector({ onSelect }: Props) {
  const { theme } = useGameStore();
  const supabase = createClient();

  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [avatarError, setAvatarError] = useState(false);
  const [leaderboard, setLeaderboard] = useState<DailyLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setAvatarError(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cached = lbCacheGet(today, 'medium');
    if (cached) {
      setLeaderboard(cached.data);
      setLeaderboardLoading(false);
      if (!cached.stale) return;
      getDailyLeaderboard(today, 'medium')
        .then(data => { setLeaderboard(data); lbCacheSet(today, 'medium', data); })
        .catch(() => {});
      return;
    }
    setLeaderboardLoading(true);
    getDailyLeaderboard(today, 'medium')
      .then(data => { setLeaderboard(data); lbCacheSet(today, 'medium', data); })
      .catch(() => setLeaderboard([]))
      .finally(() => setLeaderboardLoading(false));
  }, [today]);

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Player';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const loadingAuth = user === undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50 to-teal-50 dark:from-stone-950 dark:via-emerald-950 dark:to-teal-950 flex flex-col items-center px-4 py-8">

      {/* Top bar */}
      <div className="w-full max-w-4xl flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
            🀄 MahJong
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Choose your game mode</p>
        </div>

        {/* Profile / auth area */}
        <div className="flex items-center gap-2 pt-1">
          {loadingAuth && (
            <div className="h-9 w-24 rounded-xl bg-stone-200 dark:bg-stone-700 animate-pulse" />
          )}

          {!loadingAuth && !user && (
            <div className="flex flex-col items-end gap-1.5">
              <button
                onClick={signIn}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 text-stone-700 dark:text-stone-200 hover:ring-emerald-400 transition-all text-sm font-semibold shadow-sm"
              >
                <LogIn size={15} />
                Sign in
              </button>
              <span className="text-xs text-stone-400 dark:text-stone-500">Guest — no scores saved</span>
            </div>
          )}

          {!loadingAuth && user && (
            <div className="flex items-center gap-2.5">
              {avatarUrl && !avatarError ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-10 h-10 rounded-full ring-2 ring-emerald-400 object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg ring-2 ring-emerald-400">
                  {displayName[0].toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-stone-800 dark:text-stone-100 leading-tight">{displayName}</p>
              </div>
              <button
                onClick={signOut}
                title="Sign out"
                className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {MODES.map(mode => (
          <div
            key={mode.id}
            className={[
              'relative flex flex-col rounded-2xl border-2 bg-white dark:bg-stone-900 p-6 shadow-xl transition-all duration-200',
              mode.available ? 'hover:scale-[1.02] hover:shadow-2xl' : '',
              mode.cardColor,
            ].join(' ')}
          >
            <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-full mb-4 ${mode.badgeColor}`}>
              {mode.badge}
            </span>
            <div className="text-5xl mb-3">{mode.emoji}</div>
            <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mb-1">{mode.title}</h2>
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-3">{mode.subtitle}</p>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed flex-1 mb-6">{mode.desc}</p>
            <button
              onClick={() => mode.available && onSelect(mode.id)}
              disabled={!mode.available}
              className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${mode.btnClass}`}
            >
              {mode.available ? (mode.id === 'daily' ? 'Play Daily Challenge' : 'Play Classic') : 'Coming Soon'}
            </button>
          </div>
        ))}
      </div>

      {/* Daily leaderboard */}
      <div className="w-full max-w-4xl mt-10">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={16} className="text-yellow-500" />
          <h2 className="font-bold text-stone-700 dark:text-stone-300 text-sm uppercase tracking-wide">
            Today&apos;s Top Players
          </h2>
          <span className="text-xs text-stone-400 dark:text-stone-500 ml-auto">
            Daily Challenge · Medium · {today}
          </span>
        </div>

        {leaderboardLoading ? (
          <div className="rounded-2xl bg-white/80 dark:bg-stone-900/80 ring-1 ring-stone-200 dark:ring-stone-700 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 1 ? 'border-t border-stone-100 dark:border-stone-800' : ''}`}>
                <div className="w-6 h-4 rounded bg-stone-200 dark:bg-stone-700 animate-pulse" />
                <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse" />
                <div className="flex-1 h-4 rounded bg-stone-200 dark:bg-stone-700 animate-pulse" />
                <div className="w-12 h-4 rounded bg-stone-200 dark:bg-stone-700 animate-pulse" />
                <div className="w-16 h-4 rounded bg-stone-200 dark:bg-stone-700 animate-pulse" />
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="rounded-2xl bg-white/80 dark:bg-stone-900/80 ring-1 ring-stone-200 dark:ring-stone-700 px-4 py-8 text-center">
            <p className="text-stone-400 dark:text-stone-500 text-sm">No scores yet today — be the first! 🏆</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/80 dark:bg-stone-900/80 ring-1 ring-stone-200 dark:ring-stone-700 overflow-hidden">
            {leaderboard.map((entry, i) => {
              const isMe = user && entry.user_id === user.id;
              return (
                <div
                  key={entry.user_id}
                  className={[
                    'flex items-center gap-3 px-4 py-3 text-sm',
                    i > 0 ? 'border-t border-stone-100 dark:border-stone-800' : '',
                    isMe ? 'bg-emerald-50 dark:bg-emerald-900/20' : '',
                  ].join(' ')}
                >
                  <span className={`w-6 text-center font-bold ${
                    i === 0 ? 'text-yellow-500 text-base' :
                    i === 1 ? 'text-stone-400 text-base' :
                    i === 2 ? 'text-amber-600 text-base' :
                    'text-stone-400 text-xs'
                  }`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>

                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-stone-300 dark:bg-stone-600 flex items-center justify-center text-xs font-bold text-stone-700 dark:text-stone-200">
                      {(entry.username ?? '?')[0].toUpperCase()}
                    </div>
                  )}

                  <span className={`flex-1 font-semibold truncate ${isMe ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-800 dark:text-stone-100'}`}>
                    {entry.username ?? 'Anonymous'}
                    {isMe && <span className="ml-1 text-xs font-normal opacity-70">(you)</span>}
                  </span>

                  <span className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
                    <Clock size={11} />
                    {formatTime(entry.time_seconds)}
                  </span>

                  {entry.won && <CheckCircle size={14} className="text-emerald-500" />}

                  <span className={`font-bold w-16 text-right tabular-nums ${isMe ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-200'}`}>
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
