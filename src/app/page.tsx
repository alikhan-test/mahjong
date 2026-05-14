'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import GameBoard from '@/components/GameBoard';
import GameControls from '@/components/GameControls';
import AuthButton from '@/components/AuthButton';
import GuestBanner from '@/components/GuestBanner';
import StatsModal from '@/components/StatsModal';
import ModeSelector from '@/components/ModeSelector';
import DailyChallenge from '@/components/DailyChallenge';

type View = 'select' | 'classic' | 'daily';

export default function Home() {
  const { newGame, status, theme } = useGameStore();
  const [statsOpen, setStatsOpen] = useState(false);
  const [view, setView] = useState<View>('select');
  const [verifiedPro, setVerifiedPro] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Handle Stripe post-payment redirect: verify payment server-side and persist Pro
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') !== '1') return;
    const sessionId = params.get('session_id');
    window.history.replaceState({}, '', window.location.pathname);
    if (!sessionId) { setVerifiedPro(true); return; }
    fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(r => { if (r.ok) setVerifiedPro(true); })
      .catch(() => {});
  }, []);

  // Start a fresh game when entering classic mode
  useEffect(() => {
    if (view === 'classic' && status === 'idle') newGame('turtle');
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  if (view === 'select') return <ModeSelector onSelect={(v) => setView(v as View)} />;
  if (view === 'daily')  return <DailyChallenge onBack={() => setView('select')} />;

  // ── Classic mode ──────────────────────────────────────────────────────────
  return (
    <>
      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} />

      <main className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50 to-teal-50 dark:from-stone-950 dark:via-emerald-950 dark:to-teal-950 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">

          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('select')}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Back to menu"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 tracking-tight">
                  🀄 MahJong
                </h1>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Match free tiles · Clear the board · Beat your best score
                </p>
              </div>
            </div>
            <AuthButton onStatsClick={() => setStatsOpen(true)} />
          </header>

          {/* Guest mode notice */}
          <GuestBanner />

          {/* Controls */}
          <GameControls verifiedPro={verifiedPro} />

          {/* Board */}
          <div className="flex justify-center">
            <GameBoard />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs text-stone-500 dark:text-stone-400">
            {[
              { color: '#dc2626', label: 'Characters' },
              { color: '#16a34a', label: 'Bamboo' },
              { color: '#2563eb', label: 'Circles' },
              { color: '#7c3aed', label: 'Winds' },
              { color: '#d97706', label: 'Dragons' },
              { color: '#be185d', label: 'Seasons' },
              { color: '#0891b2', label: 'Flowers' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>

        </div>
      </main>
    </>
  );
}
