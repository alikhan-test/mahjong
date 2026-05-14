'use client';

import { create } from 'zustand';
import { GameTile, LayoutName, Difficulty, GameStats, BestScore, TilePos, TileGroup } from '@/types';
import {
  createGame,
  shuffleRemaining,
  isTileFree,
  getHints,
  hasAvailableMoves,
  calcScore,
  applyBombBlast,
  applyIceFreeze,
  unfreezeNearby,
  injectSpecialTiles,
} from './mahjong/engine';
import { canMatch } from './mahjong/tiles';
import { saveGameResult } from './supabase/database';
import { ThemeId } from './themes';

const COMBO_TIMEOUT = 10; // seconds before combo breaks

const TIME_LIMITS: Record<Difficulty, number>   = { easy: 300, medium: 180, hard: 60 };
const DIFF_MULTIPLIERS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 5 };

interface GameState {
  tiles: GameTile[];
  selectedId: number | null;
  stats: GameStats;
  combo: number;
  lastMoveTime: number;
  history: GameTile[][];
  hintIds: number[];
  layout: LayoutName;
  difficulty: Difficulty;
  timeLimit: number;
  status: 'idle' | 'playing' | 'won' | 'lost';
  lostReason: 'no-moves' | 'timeout' | null;
  shufflePenalty: number | null;
  bestScores: Record<LayoutName, BestScore | null>;
  theme: 'light' | 'dark';

  modsEnabled: boolean;
  undoPenalty: number | null;
  hintPenalty: number | null;

  tileTheme: ThemeId;
  lastMatch: { id: number; group: TileGroup; value: number; pos1: TilePos; pos2: TilePos } | null;

  // actions
  newGame: (layout?: LayoutName, difficulty?: Difficulty) => void;
  setTileTheme: (theme: ThemeId) => void;
  startGame: (tiles: GameTile[], difficulty: Difficulty, layout?: LayoutName) => void;
  selectTile: (id: number) => void;
  hint: () => void;
  undo: () => void;
  shuffle: () => void;
  tick: () => void;
  setTheme: (t: 'light' | 'dark') => void;
  toggleMods: () => void;
}

function loadBestScores(): Record<LayoutName, BestScore | null> {
  if (typeof window === 'undefined') return { turtle: null, dragon: null, cross: null };
  try {
    const raw = localStorage.getItem('mj_best');
    return raw ? JSON.parse(raw) : { turtle: null, dragon: null, cross: null };
  } catch {
    return { turtle: null, dragon: null, cross: null };
  }
}

function saveBestScore(layout: LayoutName, entry: BestScore, current: Record<LayoutName, BestScore | null>) {
  const updated = { ...current, [layout]: entry };
  localStorage.setItem('mj_best', JSON.stringify(updated));
  return updated;
}

export const useGameStore = create<GameState>((set, get) => ({
  tiles: [],
  selectedId: null,
  stats: { score: 0, moves: 0, time: 0, hintsUsed: 0 },
  combo: 0,
  lastMoveTime: 0,
  history: [],
  hintIds: [],
  layout: 'turtle',
  difficulty: 'easy',
  timeLimit: TIME_LIMITS.easy,
  status: 'idle',
  lostReason: null,
  shufflePenalty: null,
  modsEnabled: false,
  undoPenalty: null,
  hintPenalty: null,
  bestScores: { turtle: null, dragon: null, cross: null },
  theme: 'light',
  tileTheme: 'classic' as ThemeId,
  lastMatch: null,

  startGame: (tiles, difficulty, layout = 'turtle') => {
    const bestScores = loadBestScores();
    set({
      tiles,
      selectedId: null,
      stats: { score: 0, moves: 0, time: 0, hintsUsed: 0 },
      combo: 0,
      lastMoveTime: 0,
      history: [],
      hintIds: [],
      layout,
      difficulty,
      timeLimit: TIME_LIMITS[difficulty],
      status: 'playing',
      lostReason: null,
      shufflePenalty: null,
      undoPenalty: null,
      bestScores,
    });
  },

  newGame: (layout, difficulty) => {
    const l = layout ?? get().layout;
    const d = difficulty ?? get().difficulty;
    const { modsEnabled } = get();
    let tiles = createGame(l, d);
    if (modsEnabled) tiles = injectSpecialTiles(tiles);
    const bestScores = loadBestScores();
    set({
      tiles,
      selectedId: null,
      stats: { score: 0, moves: 0, time: 0, hintsUsed: 0 },
      combo: 0,
      lastMoveTime: 0,
      history: [],
      hintIds: [],
      layout: l,
      difficulty: d,
      timeLimit: TIME_LIMITS[d],
      status: 'playing',
      lostReason: null,
      shufflePenalty: null,
      bestScores,
      lastMatch: null,
    });
  },

  selectTile: (id) => {
    const { tiles, selectedId, stats, combo, lastMoveTime, history, layout, difficulty, bestScores } = get();
    const tile = tiles.find(t => t.id === id);
    if (!tile || tile.removed || tile.frozen) return;
    if (!isTileFree(tile, tiles)) return;

    if (selectedId === id) {
      set({ selectedId: null, hintIds: [] });
      return;
    }

    if (selectedId === null) {
      set({ selectedId: id, hintIds: [] });
      return;
    }

    const prev = tiles.find(t => t.id === selectedId)!;
    if (!canMatch(prev.def, tile.def)) {
      set({ selectedId: id, hintIds: [] });
      return;
    }

    // Break combo if player took too long since last match
    const timeSinceLastMove = stats.time - lastMoveTime;
    const activeCombo = timeSinceLastMove >= COMBO_TIMEOUT ? 0 : combo;
    const newCombo = activeCombo + 1;

    // Combo bonus kicks in only from the 2nd consecutive match; multiplied by difficulty
    const gained = calcScore(timeSinceLastMove, Math.max(0, newCombo - 1)) * DIFF_MULTIPLIERS[difficulty];
    const newScore = stats.score + gained;
    const newMoves = stats.moves + 1;

    let newTiles = tiles.map(t =>
      t.id === prev.id || t.id === tile.id ? { ...t, removed: true, selected: false } : t
    );

    // Special tile effects
    if (prev.def.group === 'special' && prev.def.value === tile.def.value) {
      switch (prev.def.value) {
        case 1: newTiles = shuffleRemaining(newTiles); break;                              // shuffle
        case 2: newTiles = applyBombBlast(newTiles, [prev.pos, tile.pos]); break;         // bomb
        case 3: newTiles = applyIceFreeze(newTiles, [prev.pos, tile.pos]); break;         // ice
        case 4: newTiles = newTiles.map(t => ({ ...t, frozen: false })); break;           // fire
      }
    }

    // Matching tiles near frozen tiles thaw them
    newTiles = unfreezeNearby(newTiles, [prev.pos, tile.pos]);

    const allRemoved = newTiles.every(t => t.removed);
    const noMoves = !allRemoved && !hasAvailableMoves(newTiles);

    let newBestScores = bestScores;
    if (allRemoved) {
      const best = bestScores[layout];
      if (!best || newScore > best.score) {
        newBestScores = saveBestScore(layout, {
          score: newScore,
          time: stats.time,
          date: new Date().toLocaleDateString(),
        }, bestScores);
      }
    }

    const newStatus = allRemoved ? 'won' : noMoves ? 'lost' : 'playing';

    set({
      tiles: newTiles,
      selectedId: null,
      hintIds: [],
      combo: newCombo,
      lastMoveTime: stats.time,
      history: [...history, tiles],
      stats: { ...stats, score: newScore, moves: newMoves },
      status: newStatus,
      lostReason: noMoves && !allRemoved ? 'no-moves' : null,
      bestScores: newBestScores,
      lastMatch: { id: Date.now(), group: prev.def.group, value: prev.def.value, pos1: prev.pos, pos2: tile.pos },
    });

    // Persist to Supabase when game ends
    if (newStatus === 'won' || newStatus === 'lost') {
      saveGameResult({
        layout,
        score: newScore,
        time_seconds: stats.time,
        moves: newMoves,
        hints_used: stats.hintsUsed,
        won: newStatus === 'won',
      }).catch(() => {}); // silent fail if not logged in
    }
  },

  hint: () => {
    const { tiles, stats } = get();
    const pair = getHints(tiles);
    if (!pair) return;
    const penalty = Math.floor(stats.score * 0.05);
    set({
      hintIds: [pair[0].id, pair[1].id],
      stats: { ...stats, hintsUsed: stats.hintsUsed + 1, score: Math.max(0, stats.score - penalty) },
      hintPenalty: penalty > 0 ? penalty : null,
    });
    setTimeout(() => set({ hintIds: [], hintPenalty: null }), 2000);
  },

  undo: () => {
    const { history, stats, difficulty } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    const penalty = difficulty === 'hard' ? Math.floor(stats.score * 0.01) : 0;
    set({
      tiles: prev,
      history: history.slice(0, -1),
      selectedId: null,
      hintIds: [],
      combo: 0,
      lastMoveTime: 0,
      stats: { ...stats, moves: Math.max(0, stats.moves - 1), score: Math.max(0, stats.score - penalty) },
      status: 'playing',
      undoPenalty: penalty > 0 ? penalty : null,
    });
    if (penalty > 0) setTimeout(() => set({ undoPenalty: null }), 2000);
  },

  shuffle: () => {
    const { tiles, stats, difficulty } = get();
    const penaltyRate = difficulty === 'easy' ? 0 : 0.2;
    const penalty = Math.floor(stats.score * penaltyRate);
    set({
      tiles: shuffleRemaining(tiles),
      selectedId: null,
      hintIds: [],
      combo: 0,
      lastMoveTime: 0,
      status: 'playing',
      lostReason: null,
      stats: { ...stats, score: Math.max(0, stats.score - penalty) },
      shufflePenalty: penalty > 0 ? penalty : null,
    });
    if (penalty > 0) {
      setTimeout(() => set({ shufflePenalty: null }), 2000);
    }
  },

  tick: () => {
    const { stats, status, combo, lastMoveTime, timeLimit, layout } = get();
    if (status !== 'playing') return;
    const newTime = stats.time + 1;
    const newCombo = combo > 0 && (newTime - lastMoveTime) >= COMBO_TIMEOUT ? 0 : combo;

    if (timeLimit > 0 && newTime >= timeLimit) {
      set({ stats: { ...stats, time: timeLimit }, combo: 0, status: 'lost', lostReason: 'timeout' });
      saveGameResult({
        layout,
        score: stats.score,
        time_seconds: timeLimit,
        moves: stats.moves,
        hints_used: stats.hintsUsed,
        won: false,
      }).catch(() => {});
      return;
    }

    set({ stats: { ...stats, time: newTime }, combo: newCombo });
  },

  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  toggleMods: () => {
    set(s => ({ modsEnabled: !s.modsEnabled }));
  },

  setTileTheme: (tileTheme) => {
    set({ tileTheme });
  },
}));
