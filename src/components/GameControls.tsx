'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, RotateCcw, Shuffle, Sun, Moon, Play, Lock } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { LayoutName, Difficulty } from '@/types';
import { THEMES, ThemeId } from '@/lib/themes';
import { getMyProfile } from '@/lib/supabase/database';
import ProModal from './ProModal';

const FREE_THEMES = new Set<ThemeId>(['classic', 'seasons']);

const COMBO_TIMEOUT = 10;

const LAYOUTS: { name: LayoutName; label: string }[] = [
  { name: 'turtle', label: 'Turtle' },
  { name: 'dragon', label: 'Dragon' },
  { name: 'cross',  label: 'Cross'  },
];

const DIFFICULTIES: { name: Difficulty; label: string; desc: string }[] = [
  { name: 'easy',   label: 'Easy',   desc: '5 min · 1x' },
  { name: 'medium', label: 'Medium', desc: '3 min · 2x' },
  { name: 'hard',   label: 'Hard',   desc: '1 min · 5x' },
];

const DIFF_COLORS: Record<Difficulty, { active: string; hover: string }> = {
  easy:   { active: 'bg-emerald-600 text-white shadow', hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30' },
  medium: { active: 'bg-amber-500 text-white shadow',   hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/30' },
  hard:   { active: 'bg-red-600 text-white shadow',     hover: 'hover:bg-red-50 dark:hover:bg-red-900/30' },
};

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

interface Props { dailyMode?: boolean; verifiedPro?: boolean }

export default function GameControls({ dailyMode, verifiedPro }: Props) {
  const {
    stats, status, layout, difficulty, timeLimit, lostReason, shufflePenalty, undoPenalty, hintPenalty,
    modsEnabled, bestScores, theme, combo, lastMoveTime, tileTheme,
    newGame, hint, undo, shuffle, tick, setTheme, toggleMods, setTileTheme,
  } = useGameStore();

  const [showProModal, setShowProModal] = useState(false);
  const [isPro, setIsPro] = useState(verifiedPro ?? false);

  // Load Pro status from DB (verifiedPro from page.tsx already set if post-payment)
  useEffect(() => {
    if (verifiedPro) { setIsPro(true); return; }
    getMyProfile().then(p => { if (p?.is_pro) setIsPro(true); }).catch(() => {});
  }, [verifiedPro]);

  useEffect(() => {
    if (status !== 'playing') return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [status, tick]);

  const best = bestScores[layout];

  const timeLeft = timeLimit > 0 ? Math.max(0, timeLimit - stats.time) : null;
  const isUrgent = timeLeft !== null && timeLeft <= 30;

  const comboTimeLeft = combo >= 2
    ? Math.max(0, COMBO_TIMEOUT - (stats.time - lastMoveTime))
    : 0;
  const comboProgress = comboTimeLeft / COMBO_TIMEOUT;

  return (
    <>
      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}

      {/* Floating combo banner — fixed overlay, never pushes content down */}
      {combo >= 2 && (
        <div
          className="combo-enter fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{ minWidth: 264 }}
        >
          <div className={[
            'rounded-xl px-4 py-2.5 flex items-center gap-3',
            'bg-orange-100/95 dark:bg-orange-950/95 border border-orange-300 dark:border-orange-700 shadow-xl backdrop-blur-sm',
          ].join(' ')}>
            <span className="text-2xl leading-none">🔥</span>
            <div className="flex-1">
              <p className="text-lg font-extrabold text-orange-600 dark:text-orange-300 leading-none">
                {combo}x COMBO
              </p>
              <p className="text-xs text-orange-500 dark:text-orange-400">
                {comboTimeLeft > 0 ? `${comboTimeLeft}s to keep it` : 'Last chance!'}
              </p>
            </div>
            <div className="w-20">
              <div className="h-2 rounded-full bg-orange-200 dark:bg-orange-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${comboProgress * 100}%`,
                    background: comboProgress > 0.5 ? '#f97316' : comboProgress > 0.25 ? '#ef4444' : '#dc2626',
                  }}
                />
              </div>
              <p className="text-right text-xs font-bold text-orange-500 dark:text-orange-400 mt-0.5">
                {comboTimeLeft}s
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating penalty flashes — same style as combo banner, never push content */}
      {(shufflePenalty ?? 0) > 0 && (
        <div className="combo-enter fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="rounded-xl px-4 py-2.5 bg-red-100/95 dark:bg-red-950/95 border border-red-300 dark:border-red-700 shadow-xl backdrop-blur-sm flex items-center gap-2">
            <span className="text-lg leading-none">🔀</span>
            <span className="font-bold text-red-600 dark:text-red-400 text-sm">Shuffle penalty: −{shufflePenalty} pts (−20%)</span>
          </div>
        </div>
      )}
      {(undoPenalty ?? 0) > 0 && (
        <div className="combo-enter fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="rounded-xl px-4 py-2.5 bg-orange-100/95 dark:bg-orange-950/95 border border-orange-300 dark:border-orange-700 shadow-xl backdrop-blur-sm flex items-center gap-2">
            <span className="text-lg leading-none">↩</span>
            <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">Undo penalty: −{undoPenalty} pts (−1%)</span>
          </div>
        </div>
      )}
      {(hintPenalty ?? 0) > 0 && (
        <div className="combo-enter fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="rounded-xl px-4 py-2.5 bg-blue-100/95 dark:bg-blue-950/95 border border-blue-300 dark:border-blue-700 shadow-xl backdrop-blur-sm flex items-center gap-2">
            <span className="text-lg leading-none">💡</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">Hint penalty: −{hintPenalty} pts (−5%)</span>
          </div>
        </div>
      )}

    <div className="w-full flex flex-col gap-3">

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Score', value: stats.score },
          {
            label: timeLeft !== null ? 'Time Left' : 'Time',
            value: timeLeft !== null ? formatTime(timeLeft) : formatTime(stats.time),
            urgent: isUrgent,
          },
          { label: 'Moves', value: stats.moves },
          { label: 'Best',  value: best ? best.score : '—' },
        ].map(({ label, value, urgent }) => (
          <div
            key={label}
            className={[
              'rounded-xl px-3 py-2 text-center ring-1 transition-colors',
              urgent
                ? 'bg-red-50 dark:bg-red-900/30 ring-red-300 dark:ring-red-700'
                : 'bg-white/60 dark:bg-stone-800/60 ring-stone-200 dark:ring-stone-700',
            ].join(' ')}
          >
            <p className={`text-xs font-medium uppercase tracking-wide ${urgent ? 'text-red-500 dark:text-red-400' : 'text-stone-500 dark:text-stone-400'}`}>
              {label}
            </p>
            <p className={`text-lg font-bold ${urgent ? 'text-red-600 dark:text-red-400' : 'text-stone-800 dark:text-stone-100'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Difficulty selector — hidden in daily mode */}
      {!dailyMode && <div className="flex gap-1 w-full">
        {DIFFICULTIES.map(d => {
          const isActive = difficulty === d.name;
          const colors = DIFF_COLORS[d.name];
          return (
            <button
              key={d.name}
              onClick={() => newGame(layout, d.name)}
              className={[
                'flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all',
                isActive
                  ? colors.active
                  : `bg-white/60 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 ${colors.hover} ring-1 ring-stone-200 dark:ring-stone-700`,
              ].join(' ')}
            >
              {d.label}
              <span className="ml-1 text-xs opacity-75">({d.desc})</span>
            </button>
          );
        })}
      </div>}

      {/* Layout selector + theme — layout hidden in daily mode */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        {!dailyMode && <div className="flex gap-1">
          {LAYOUTS.map(l => (
            <button
              key={l.name}
              onClick={() => newGame(l.name)}
              className={[
                'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                layout === l.name
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-white/60 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 ring-1 ring-stone-200 dark:ring-stone-700',
              ].join(' ')}
            >
              {l.label}
            </button>
          ))}
        </div>}
        <div className="flex gap-1.5 ml-auto">
          {!dailyMode && (
            <button
              onClick={toggleMods}
              className={[
                'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ring-1',
                modsEnabled
                  ? 'bg-purple-600 text-white shadow ring-purple-500'
                  : 'bg-white/60 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 ring-stone-200 dark:ring-stone-700 hover:bg-purple-50 dark:hover:bg-purple-900/30',
              ].join(' ')}
              title="Special tiles: Shuffle, Bomb, Ice, Fire"
            >
              ✨ Mods {modsEnabled ? 'ON' : 'OFF'}
            </button>
          )}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-lg bg-white/60 dark:bg-stone-800/60 ring-1 ring-stone-200 dark:ring-stone-700 text-stone-600 dark:text-stone-300 hover:text-yellow-500 transition-colors"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>

      {/* Tile skin picker */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium mr-0.5">🎨</span>
        {(Object.values(THEMES) as typeof THEMES[ThemeId][]).map(t => {
          const isLocked = !isPro && !FREE_THEMES.has(t.id);
          const isActive = tileTheme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => isLocked ? setShowProModal(true) : setTileTheme(t.id)}
              title={isLocked ? `${t.name} — Pro only` : t.name}
              className={[
                'relative w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ring-1',
                isActive
                  ? 'bg-emerald-600 ring-emerald-400 shadow scale-110'
                  : isLocked
                  ? 'bg-stone-100 dark:bg-stone-800 ring-stone-200 dark:ring-stone-700 opacity-60 hover:opacity-90 hover:ring-violet-400'
                  : 'bg-white/60 dark:bg-stone-800/60 ring-stone-200 dark:ring-stone-700 hover:ring-emerald-400 hover:scale-105',
              ].join(' ')}
            >
              {t.icon}
              {isLocked && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-violet-600 rounded-full flex items-center justify-center">
                  <Lock size={8} className="text-white" />
                </span>
              )}
            </button>
          );
        })}
        <span className="text-xs text-stone-400 dark:text-stone-500 ml-1">
          🔒 <button onClick={() => setShowProModal(true)} className="underline hover:text-violet-500 transition-colors">Pro</button>
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => newGame()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow transition-all"
        >
          <Play size={15} /> New Game
        </button>
        <button
          onClick={hint}
          disabled={status !== 'playing'}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-semibold text-sm shadow transition-all"
        >
          <Lightbulb size={15} /> Hint
        </button>
        <button
          onClick={undo}
          disabled={status !== 'playing'}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-600 hover:bg-stone-700 disabled:opacity-40 text-white font-semibold text-sm shadow transition-all"
        >
          <RotateCcw size={15} /> Undo
        </button>
        <button
          onClick={shuffle}
          disabled={status !== 'playing'}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-semibold text-sm shadow transition-all"
        >
          <Shuffle size={15} /> Shuffle{difficulty !== 'easy' ? ' −20%' : ''}
        </button>
      </div>

      {/* Game over banners */}
      {status === 'won' && (
        <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-400 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">🎉 You Won!</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
            Score: {stats.score} · Time: {formatTime(stats.time)} · Hints: {stats.hintsUsed}
          </p>
          <button onClick={() => newGame()} className="mt-3 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm shadow">
            Play Again
          </button>
        </div>
      )}

      {status === 'lost' && lostReason === 'timeout' && (
        <div className="rounded-xl bg-red-100 dark:bg-red-900/50 border border-red-400 p-4 text-center">
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">⏰ Time&apos;s Up!</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">Score: {stats.score}</p>
          <button onClick={() => newGame()} className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm shadow">
            Try Again
          </button>
        </div>
      )}

      {status === 'lost' && lostReason === 'no-moves' && (
        <div className="rounded-xl bg-red-100 dark:bg-red-900/50 border border-red-400 p-4 text-center">
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">😔 No More Moves</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {difficulty === 'easy' ? 'Shuffle is free on Easy.' : 'Shuffle costs −20% of your score.'}
          </p>
          <div className="flex gap-2 justify-center mt-3">
            <button onClick={shuffle} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm shadow">
              Shuffle −20%
            </button>
            <button onClick={() => newGame()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm shadow">
              New Game
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
