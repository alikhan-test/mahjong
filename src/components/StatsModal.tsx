'use client';

import { useEffect, useState } from 'react';
import { X, Trophy, Clock, Gamepad2, TrendingUp } from 'lucide-react';
import { getUserStats, UserStats } from '@/lib/supabase/database';

interface Props {
  open: boolean;
  onClose: () => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

const LAYOUT_LABELS: Record<string, string> = {
  turtle: '🐢 Turtle',
  dragon: '🐉 Dragon',
  cross:  '✚ Cross',
};

export default function StatsModal({ open, onClose }: Props) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getUserStats().then(s => {
      setStats(s);
      setLoading(false);
    });
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl ring-1 ring-stone-200 dark:ring-stone-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">My Statistics</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && !stats && (
            <p className="text-center text-stone-500 dark:text-stone-400 py-8">No games played yet.</p>
          )}

          {!loading && stats && (
            <>
              {/* Overview cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Gamepad2 size={16} />, label: 'Games', value: stats.total_games, color: 'text-blue-600 dark:text-blue-400' },
                  { icon: <Trophy size={16} />, label: 'Wins', value: stats.total_wins, color: 'text-emerald-600 dark:text-emerald-400' },
                  { icon: <TrendingUp size={16} />, label: 'Win rate', value: `${stats.win_rate}%`, color: 'text-orange-600 dark:text-orange-400' },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 text-center">
                    <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
                    <p className="text-xl font-bold text-stone-800 dark:text-stone-100">{value}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* Best scores per layout */}
              <div>
                <h3 className="text-sm font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">
                  Best Scores
                </h3>
                <div className="flex flex-col gap-2">
                  {(['turtle', 'dragon', 'cross'] as const).map(layout => {
                    const best = stats.best_scores[layout];
                    return (
                      <div key={layout} className="flex items-center justify-between bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-2.5">
                        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                          {LAYOUT_LABELS[layout]}
                        </span>
                        {best ? (
                          <div className="flex items-center gap-3 text-right">
                            <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                              <Clock size={12} /> {formatTime(best.time_seconds)}
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {best.score.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400">Not played</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent games */}
              {stats.recent_games.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">
                    Recent Games
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {stats.recent_games.map((g, i) => (
                      <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-800">
                        <div className="flex items-center gap-2">
                          <span>{g.won ? '✅' : '❌'}</span>
                          <span className="text-stone-600 dark:text-stone-400">{LAYOUT_LABELS[g.layout]}</span>
                        </div>
                        <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
                          <span className="text-xs">{formatTime(g.time_seconds)}</span>
                          <span className="font-semibold text-stone-700 dark:text-stone-200">{g.score.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
