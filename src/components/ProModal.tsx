'use client';

import { useState } from 'react';
import { X, Zap, Lock, Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const PRO_PERKS = [
  '🎨 All 8 tile skin themes',
  '🏆 Global leaderboard ranking',
  '📊 Full stats & match history',
  '⚡ Mods: Bomb, Ice, Fire, Shuffle tiles',
];

export default function ProModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleUpgrade() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: window.location.origin }),
      });

      if (res.status === 401) {
        setError('Please sign in first to upgrade.');
        return;
      }
      if (!res.ok) {
        setError('Something went wrong. Please try again.');
        return;
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden">

        {/* Gradient header */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 px-6 pt-8 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Zap size={22} className="text-yellow-300 fill-yellow-300" />
            <span className="text-2xl font-black text-white tracking-tight">MahJong Pro</span>
          </div>
          <p className="text-purple-200 text-sm">Unlock all themes &amp; features</p>

          <div className="mt-4 inline-flex items-end gap-1">
            <span className="text-5xl font-black text-white">$3</span>
            <span className="text-purple-200 text-sm mb-2">/ forever</span>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Perks */}
        <div className="px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
            Everything included:
          </p>
          <ul className="space-y-2.5 mb-6">
            {PRO_PERKS.map(perk => (
              <li key={perk} className="flex items-center gap-3 text-sm text-stone-700 dark:text-stone-200">
                <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-xs text-violet-600 dark:text-violet-300 font-bold flex-shrink-0">✓</span>
                {perk}
              </li>
            ))}
          </ul>

          {error && (
            <p className="mb-3 text-xs text-red-500 dark:text-red-400 text-center">{error}</p>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-violet-500/30 transition-all hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Redirecting…</>
              : <><Zap size={16} className="fill-yellow-300 text-yellow-300" /> Upgrade to Pro — $3</>
            }
          </button>

          <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-3">
            Powered by Stripe · Secure payment · No subscription
          </p>
        </div>

        {/* Lock icon watermark */}
        <div className="absolute bottom-4 right-5 opacity-5 pointer-events-none">
          <Lock size={64} />
        </div>
      </div>
    </div>
  );
}
