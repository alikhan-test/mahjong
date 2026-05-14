import { GameTile, TilePos, LayoutName, Difficulty, TileDefinition } from '@/types';
import { createDeck, canMatch, SPECIAL_TILE_DEFS } from './tiles';
import { getLayout } from './layout';

type Rng = () => number;

function shuffleWith<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffle<T>(arr: T[]): T[] { return shuffleWith(arr, Math.random); }

// Deterministic xorshift32 seeded from a string (for daily challenges)
function makeSeededRng(seed: string): Rng {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let s = h || 1;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967295;
  };
}

// ─── Free-tile detection (shared logic for GameTile and WorkTile) ────────────

function isCoveredAbove(pos: TilePos, others: TilePos[]): boolean {
  return others.some(o =>
    o.z === pos.z + 1 &&
    o.x < pos.x + 2 && o.x + 2 > pos.x &&
    o.y < pos.y + 2 && o.y + 2 > pos.y,
  );
}

function isBlockedLeft(pos: TilePos, others: TilePos[]): boolean {
  return others.some(o =>
    o.z === pos.z &&
    (o.x + 2 === pos.x || o.x + 1 === pos.x) &&
    o.y < pos.y + 2 && o.y + 2 > pos.y,
  );
}

function isBlockedRight(pos: TilePos, others: TilePos[]): boolean {
  return others.some(o =>
    o.z === pos.z &&
    (pos.x + 2 === o.x || pos.x + 1 === o.x) &&
    o.y < pos.y + 2 && o.y + 2 > pos.y,
  );
}

export function isTileFree(tile: GameTile, allTiles: GameTile[]): boolean {
  if (tile.removed) return false;
  const others = allTiles.filter(t => !t.removed && t.id !== tile.id).map(t => t.pos);
  if (isCoveredAbove(tile.pos, others)) return false;
  return !isBlockedLeft(tile.pos, others) || !isBlockedRight(tile.pos, others);
}

export function getFreeTiles(tiles: GameTile[]): GameTile[] {
  return tiles.filter(t => !t.removed && isTileFree(t, tiles));
}

export function getHints(tiles: GameTile[]): [GameTile, GameTile] | null {
  const free = getFreeTiles(tiles);
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (canMatch(free[i].def, free[j].def)) return [free[i], free[j]];
    }
  }
  return null;
}

export function hasAvailableMoves(tiles: GameTile[]): boolean {
  return getHints(tiles) !== null;
}

// ─── Solvable game generation (reverse-build algorithm) ─────────────────────
//
// Build the board backwards:
//   1. All 144 positions start as "active" (occupied but unassigned).
//   2. Find all currently free active positions.
//   3. Pick 2 of them at random, assign a matching pair to those slots.
//   4. Deactivate those 2 positions (simulate removing them).
//   5. Repeat until all positions are assigned.
//
// Result: the forward game has at least one valid solution —
// the reverse of the build order.

interface WorkSlot {
  pos: TilePos;
  active: boolean;
}

function freeSlots(slots: WorkSlot[]): WorkSlot[] {
  const activePoses = slots.filter(s => s.active).map(s => s.pos);
  return slots.filter(s => {
    if (!s.active) return false;
    const others = activePoses.filter(p => p !== s.pos);
    if (isCoveredAbove(s.pos, others)) return false;
    return !isBlockedLeft(s.pos, others) || !isBlockedRight(s.pos, others);
  });
}

function buildMatchingPairs(): [TileDefinition, TileDefinition][] {
  const deck = createDeck();
  const pairs: [TileDefinition, TileDefinition][] = [];
  const used = new Set<number>();

  for (let i = 0; i < deck.length; i++) {
    if (used.has(i)) continue;
    for (let j = i + 1; j < deck.length; j++) {
      if (used.has(j)) continue;
      if (canMatch(deck[i], deck[j])) {
        pairs.push([deck[i], deck[j]]);
        used.add(i);
        used.add(j);
        break;
      }
    }
  }
  return pairs; // exactly 72 pairs
}

export function countFreePairs(tiles: GameTile[]): number {
  const free = getFreeTiles(tiles);
  let count = 0;
  const used = new Set<number>();
  for (let i = 0; i < free.length; i++) {
    if (used.has(i)) continue;
    for (let j = i + 1; j < free.length; j++) {
      if (!used.has(j) && canMatch(free[i].def, free[j].def)) {
        count++;
        used.add(i);
        used.add(j);
        break;
      }
    }
  }
  return count;
}

function generateOnce(layoutName: LayoutName, rng: Rng = Math.random): GameTile[] {
  const positions = getLayout(layoutName);
  const pairs = shuffleWith(buildMatchingPairs(), rng);

  const slots: WorkSlot[] = positions.map(pos => ({ pos, active: true }));
  const result: { pos: TilePos; def: TileDefinition }[] = [];
  let pairIdx = 0;

  while (slots.some(s => s.active)) {
    const free = shuffleWith(freeSlots(slots), rng);

    if (free.length < 2) {
      // Safety fallback: assign remaining positions with any pair (shouldn't happen for valid layouts)
      const remaining = slots.filter(s => s.active);
      for (let i = 0; i + 1 < remaining.length; i += 2) {
        const [d1, d2] = pairs[pairIdx++ % pairs.length];
        result.push({ pos: remaining[i].pos, def: d1 });
        result.push({ pos: remaining[i + 1].pos, def: d2 });
        remaining[i].active = false;
        remaining[i + 1].active = false;
      }
      break;
    }

    const [s1, s2] = free;
    const [def1, def2] = pairs[pairIdx++ % pairs.length];
    result.push({ pos: s1.pos, def: def1 });
    result.push({ pos: s2.pos, def: def2 });
    s1.active = false;
    s2.active = false;
  }

  // Restore original position order so rendering is stable
  const posOrder = new Map(positions.map((p, i) => [`${p.x},${p.y},${p.z}`, i]));
  result.sort((a, b) => {
    const ia = posOrder.get(`${a.pos.x},${a.pos.y},${a.pos.z}`) ?? 0;
    const ib = posOrder.get(`${b.pos.x},${b.pos.y},${b.pos.z}`) ?? 0;
    return ia - ib;
  });

  return result.map((item, i) => ({
    id: i,
    def: item.def,
    pos: item.pos,
    removed: false,
    selected: false,
  }));
}

export function createGame(layoutName: LayoutName, difficulty: Difficulty = 'easy'): GameTile[] {
  // For easy we accept the first result; for medium/hard we retry to hit the pair-count target
  const MAX = 80;
  for (let attempt = 0; attempt < MAX; attempt++) {
    const tiles = generateOnce(layoutName);
    const pairs = countFreePairs(tiles);
    const ok =
      difficulty === 'easy'   ? pairs >= 4 :
      difficulty === 'medium' ? pairs >= 3 && pairs <= 5 :
      /* hard */                pairs <= 2;
    if (ok || attempt === MAX - 1) return tiles;
  }
  return generateOnce(layoutName);
}

// Deterministic board seeded by date string — same for all users on the same day
export function createDailyGame(dateStr: string, difficulty: Difficulty, layoutName: LayoutName = 'turtle'): GameTile[] {
  const rng = makeSeededRng(`${dateStr}|${difficulty}|${layoutName}`);
  return generateOnce(layoutName, rng);
}

// ─── Solvable reshuffle (used when player is stuck) ─────────────────────────
//
// Re-runs the same reverse algorithm on only the remaining active positions,
// preserving their locations but reassigning tile values solvably.

export function shuffleRemaining(tiles: GameTile[]): GameTile[] {
  const active = tiles.filter(t => !t.removed);
  if (active.length < 2) return tiles;

  // Collect active positions and build a solvable assignment for them
  const activeDefs = active.map(t => t.def);

  // Build pairs from current active tile defs
  const used = new Set<number>();
  const pairs: [TileDefinition, TileDefinition][] = [];
  for (let i = 0; i < activeDefs.length; i++) {
    if (used.has(i)) continue;
    for (let j = i + 1; j < activeDefs.length; j++) {
      if (used.has(j)) continue;
      if (canMatch(activeDefs[i], activeDefs[j])) {
        pairs.push([activeDefs[i], activeDefs[j]]);
        used.add(i);
        used.add(j);
        break;
      }
    }
  }

  const shuffledPairs = shuffle(pairs);
  const slots: WorkSlot[] = active.map(t => ({ pos: t.pos, active: true }));
  const assignment = new Map<string, TileDefinition>();
  let pairIdx = 0;

  while (slots.some(s => s.active)) {
    const free = shuffle(freeSlots(slots));
    if (free.length < 2) break;
    const [s1, s2] = free;
    const [d1, d2] = shuffledPairs[pairIdx++ % shuffledPairs.length];
    assignment.set(`${s1.pos.x},${s1.pos.y},${s1.pos.z}`, d1);
    assignment.set(`${s2.pos.x},${s2.pos.y},${s2.pos.z}`, d2);
    s1.active = false;
    s2.active = false;
  }

  return tiles.map(t => {
    if (t.removed) return t;
    const key = `${t.pos.x},${t.pos.y},${t.pos.z}`;
    const newDef = assignment.get(key) ?? t.def;
    return { ...t, def: newDef, selected: false };
  });
}

export function calcScore(timeElapsed: number, combo: number): number {
  const base = 100;
  const timeBonus = Math.max(0, 30 - timeElapsed) * 2;
  const comboBonus = combo * 20;
  return base + timeBonus + comboBonus;
}

// ─── Special tile helpers ────────────────────────────────────────────────────

function tileDistXY(a: TilePos, b: TilePos): number {
  const dx = (a.x - b.x) / 2;
  const dy = (a.y - b.y) / 2;
  return Math.sqrt(dx * dx + dy * dy);
}

export function applyBombBlast(tiles: GameTile[], bombPositions: TilePos[]): GameTile[] {
  const RADIUS = 2.5; // tile widths
  let result = tiles.map(t => {
    if (t.removed) return t;
    for (const pos of bombPositions) {
      if (tileDistXY(t.pos, pos) <= RADIUS) {
        return { ...t, removed: true, selected: false, frozen: false };
      }
    }
    return t;
  });
  // If remaining tiles have no moves, reshuffle for free
  const remaining = result.filter(t => !t.removed);
  if (remaining.length > 0 && !hasAvailableMoves(result)) {
    result = shuffleRemaining(result);
  }
  return result;
}

export function applyIceFreeze(tiles: GameTile[], icePositions: TilePos[]): GameTile[] {
  const RADIUS = 3.0; // tile widths
  return tiles.map(t => {
    if (t.removed) return t;
    for (const pos of icePositions) {
      if (tileDistXY(t.pos, pos) <= RADIUS) return { ...t, frozen: true };
    }
    return t;
  });
}

export function unfreezeNearby(tiles: GameTile[], removedPositions: TilePos[]): GameTile[] {
  const RADIUS = 2.0; // tile widths
  return tiles.map(t => {
    if (!t.frozen || t.removed) return t;
    for (const pos of removedPositions) {
      if (tileDistXY(t.pos, pos) <= RADIUS) return { ...t, frozen: false };
    }
    return t;
  });
}

// ─── Special tile injection ──────────────────────────────────────────────────
//
// After generating a solvable board, replace N pairs of normal tiles with
// special tiles. N is a random even number 0-6 per type. Replacement always
// swaps a full matching pair so pairability is maintained.

export function injectSpecialTiles(tiles: GameTile[]): GameTile[] {
  const TYPES = [SPECIAL_TILE_DEFS.shuffle, SPECIAL_TILE_DEFS.bomb, SPECIAL_TILE_DEFS.ice, SPECIAL_TILE_DEFS.fire];
  let result = [...tiles];

  for (const specialDef of TYPES) {
    const count = [0, 2, 4, 6][Math.floor(Math.random() * 4)];
    if (count === 0) continue;

    // Build groups of normal (non-special) tiles keyed by their matchable identity
    const normal = result.filter(t => t.def.group !== 'special' && !t.removed);
    const groups = new Map<string, GameTile[]>();
    for (const t of normal) {
      const key = t.def.group === 'season' || t.def.group === 'flower'
        ? t.def.group
        : `${t.def.group}-${t.def.value}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }

    const available = shuffle([...groups.values()].filter(g => g.length >= 2));
    let replaced = 0;

    for (const group of available) {
      if (replaced >= count) break;
      const [t1, t2] = shuffle(group);
      for (const t of [t1, t2]) {
        const idx = result.findIndex(r => r.id === t.id);
        if (idx >= 0) result[idx] = { ...result[idx], def: specialDef };
      }
      replaced += 2;
    }
  }

  return result;
}
