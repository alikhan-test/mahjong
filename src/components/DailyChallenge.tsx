'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Trophy, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { createDailyGame, injectSpecialTiles } from '@/lib/mahjong/engine';
import { saveDailyResult, getMyDailyResult, getDailyLeaderboard, DailyLeaderboardEntry } from '@/lib/supabase/database';
import { createClient } from '@/lib/supabase/client';
import GameBoard from './GameBoard';
import GameControls from './GameControls';
import GuestBanner from './GuestBanner';

const DAILY_DIFFICULTY = 'medium' as const;
const DAILY_LAYOUT     = 'turtle' as const;

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

type Phase = 'mods-select' | 'loading' | 'playing' | 'saving' | 'done' | 'already-played';

interface Props { onBack: () => void }

export default function DailyChallenge({ onBack }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [phase, setPhase]           = useState<Phase>('mods-select');
  const [withMods, setWithMods]     = useState(false);
  const [myResult, setMyResult]     = useState<{ score: number; time_seconds: number; won: boolean } | null>(null);
  const [leaderboard, setLeaderboard] = useState<DailyLeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const savedRef = useRef(false);

  const { status, startGame } = useGameStore();

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
  }, []);

  const fetchLeaderboard = async () => {
    const data = await getDailyLeaderboard(today, DAILY_DIFFICULTY);
    setLeaderboard(data);
  };

  const handleStart = async (mods: boolean) => {
    setWithMods(mods);
    setPhase('loading');

    const existing = await getMyDailyResult(today, DAILY_DIFFICULTY);
    if (existing) {
      setMyResult(existing);
      await fetchLeaderboard();
      setPhase('already-played');
      return;
    }

    let tiles = createDailyGame(today, DAILY_DIFFICULTY, DAILY_LAYOUT);
    if (mods) tiles = injectSpecialTiles(tiles);

    // Tell the store about mods state so shuffle/etc. behaves correctly
    useGameStore.setState({ modsEnabled: mods });
    startGame(tiles, DAILY_DIFFICULTY, DAILY_LAYOUT);
    savedRef.current = false;
    setPhase('playing');
  };

  // Detect game end → save + leaderboard
  useEffect(() => {
    if (phase !== 'playing') return;
    if (status !== 'won' && status !== 'lost') return;
    if (savedRef.current) return;
    savedRef.current = true;
    setPhase('saving');

    const { stats: s, status: st } = useGameStore.getState();
    saveDailyResult(today, DAILY_DIFFICULTY, s.score, s.time, st === 'won')
      .then(fetchLeaderboard)
      .catch(fetchLeaderboard)
      .finally(() => setPhase('done'));
  }, [status, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Leaderboard table ──────────────────────────────────────────────────────
  const myRank = leaderboard.findIndex(e => e.user_id === currentUserId) + 1;

  const Leaderboard = () => (
    <div className="w-full max-w-md">
      <h3 className="flex items-center gap-2 text-sm font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-3">
        <Trophy size={14} /> Today&apos;s Leaderboard
        <span className="ml-auto font-normal text-stone-400 capitalize">{DAILY_DIFFICULTY} · Turtle</span>
      </h3>
      {leaderboard.length === 0 ? (
        <p className="text-center text-stone-400 text-sm py-6">No scores yet — be the first!</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {leaderboard.map((entry, i) => {
            const isMe = entry.user_id === currentUserId;
            return (
              <div key={entry.user_id} className={['flex items-center gap-3 px-3 py-2 rounded-xl text-sm', isMe ? 'bg-emerald-50 dark:bg-emerald-900/40 ring-1 ring-emerald-400/50' : 'bg-stone-50 dark:bg-stone-800'].join(' ')}>
                <span className={`w-6 text-center font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-stone-400' : i === 2 ? 'text-amber-600' : 'text-stone-400 text-xs'}`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                {entry.avatar_url
                  ? <img src={entry.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                  : <div className="w-6 h-6 rounded-full bg-stone-300 dark:bg-stone-600 flex items-center justify-center text-xs font-bold">{(entry.username ?? '?')[0]?.toUpperCase()}</div>
                }
                <span className={`flex-1 font-medium truncate ${isMe ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-700 dark:text-stone-300'}`}>
                  {entry.username ?? 'Anonymous'}{isMe ? ' (you)' : ''}
                </span>
                {entry.won ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-400" />}
                <span className="flex items-center gap-1 text-xs text-stone-400"><Clock size={11} />{formatTime(entry.time_seconds)}</span>
                <span className={`font-bold w-16 text-right ${isMe ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-200'}`}>
                  {entry.score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Mods selection ─────────────────────────────────────────────────────────
  if (phase === 'mods-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50 to-teal-50 dark:from-stone-950 dark:via-emerald-950 dark:to-teal-950 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <button onClick={onBack} className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 mb-8 text-sm font-medium transition-colors">
            <ArrowLeft size={16} /> Back to menu
          </button>

          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🗓️</div>
            <h1 className="text-3xl font-black text-stone-800 dark:text-stone-100">Daily Challenge</h1>
            <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">{formatDate(today)}</p>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-stone-400 dark:text-stone-500">
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full font-semibold">Medium</span>
              <span>·</span>
              <span>Turtle layout</span>
              <span>·</span>
              <span>3 min · 2× score</span>
              <span>·</span>
              <span>One attempt</span>
            </div>
          </div>

          <p className="text-center text-sm font-semibold text-stone-600 dark:text-stone-400 mb-4">
            Choose your game mode:
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleStart(false)}
              className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-left flex items-center justify-between shadow-lg transition-all hover:scale-[1.01]"
            >
              <div>
                <div className="text-lg">🎮 Standard</div>
                <div className="text-xs opacity-80">Classic tiles only</div>
              </div>
              <span className="text-2xl">→</span>
            </button>

            <button
              onClick={() => handleStart(true)}
              className="w-full py-4 px-5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-left flex items-center justify-between shadow-lg transition-all hover:scale-[1.01]"
            >
              <div>
                <div className="text-lg">✨ With Special Tiles</div>
                <div className="text-xs opacity-80">🔀 Shuffle · 💣 Bomb · 🧊 Ice · 🔥 Fire</div>
              </div>
              <span className="text-2xl">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-emerald-50 to-teal-50 dark:from-stone-950 dark:via-emerald-950 dark:to-teal-950">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Already played ─────────────────────────────────────────────────────────
  if (phase === 'already-played' && myResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50 to-teal-50 dark:from-stone-950 dark:via-emerald-950 dark:to-teal-950 flex flex-col items-center px-4 py-12 gap-6">
        <div className="w-full max-w-md">
          <button onClick={onBack} className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 mb-6 text-sm font-medium transition-colors">
            <ArrowLeft size={16} /> Back to menu
          </button>
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl p-6 mb-6 text-center">
            <div className="text-4xl mb-2">{myResult.won ? '🎉' : '😔'}</div>
            <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mb-1">
              {myResult.won ? 'Already completed!' : 'Already attempted!'}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">You already played today&apos;s challenge</p>
            <div className="flex justify-center gap-8">
              <div><p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{myResult.score.toLocaleString()}</p><p className="text-xs text-stone-400">Score</p></div>
              <div><p className="text-2xl font-black text-stone-700 dark:text-stone-300">{formatTime(myResult.time_seconds)}</p><p className="text-xs text-stone-400">Time</p></div>
              {myRank > 0 && <div><p className="text-2xl font-black text-amber-500">#{myRank}</p><p className="text-xs text-stone-400">Rank</p></div>}
            </div>
          </div>
          <Leaderboard />
          <button onClick={onBack} className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow transition-all">
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────────
  if (phase === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50 to-teal-50 dark:from-stone-950 dark:via-emerald-950 dark:to-teal-950 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🗓️</span>
                  <h1 className="text-xl font-extrabold text-stone-800 dark:text-stone-100">Daily Challenge</h1>
                  {withMods && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">✨ Mods</span>}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">{formatDate(today)} · Medium · One attempt</p>
              </div>
            </div>
          </header>

          <GuestBanner />

          <GameControls dailyMode />

          <div className="flex justify-center">
            <GameBoard />
          </div>
        </div>
      </div>
    );
  }

  // ── Saving / Done ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50 to-teal-50 dark:from-stone-950 dark:via-emerald-950 dark:to-teal-950 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 mb-6 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Back to menu
        </button>

        {phase === 'saving' ? (
          <div className="flex items-center justify-center py-20 gap-3 text-stone-500 dark:text-stone-400">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Saving your score…
          </div>
        ) : (
          <>
            {(() => {
              const { stats: s, status: st } = useGameStore.getState();
              return (
                <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl p-6 mb-6 text-center">
                  <div className="text-4xl mb-2">{st === 'won' ? '🎉' : '⏰'}</div>
                  <h2 className="text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-1">
                    {st === 'won' ? 'Board Cleared!' : "Time's Up!"}
                  </h2>
                  <p className="text-stone-500 dark:text-stone-400 text-sm mb-5">{formatDate(today)}</p>
                  <div className="flex justify-center gap-8">
                    <div><p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{s.score.toLocaleString()}</p><p className="text-xs text-stone-400">Score</p></div>
                    <div><p className="text-3xl font-black text-stone-700 dark:text-stone-300">{formatTime(s.time)}</p><p className="text-xs text-stone-400">Time</p></div>
                    {myRank > 0 && <div><p className="text-3xl font-black text-amber-500">#{myRank}</p><p className="text-xs text-stone-400">Rank</p></div>}
                  </div>
                  {!currentUserId && <p className="mt-4 text-xs text-stone-400">Sign in to appear on the leaderboard</p>}
                </div>
              );
            })()}

            <Leaderboard />

            <div className="flex gap-2 mt-6">
              <button onClick={onBack} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow transition-all">
                Back to Menu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
