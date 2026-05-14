'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { THEMES, getThemedSymbol } from '@/lib/themes';
import { TileGroup } from '@/types';
import { TILE_W, TILE_H, LAYER_OFFSET } from './Tile';

interface Particle {
  key: string;
  cx: number;      // center x in board px
  cy: number;      // center y in board px
  tx: number;      // translate x (px)
  ty: number;      // translate y (px)
  rot: number;     // end rotation (deg)
  emoji: string;
  delay: number;   // ms
  duration: number; // ms
  size: number;    // rem
}

interface BurstDot {
  key: string;
  cx: number;
  cy: number;
  emoji: string;
  duration: number;
}

// How many particles per match point (spread around both tile centers)
const PARTICLE_COUNT = 10;

// Choose emoji particles based on matched symbol type
function pickParticles(emoji: string): string[] {
  const flowers  = ['🌸','🌺','🌻','🌹','💐','🌷','🌼','🪷'];
  const leaves   = ['🍃','🍀','🌿','🌱','🍂','🍁','🌾'];
  const sun      = ['✨','⭐','🌟','💫','☀️'];
  const snow     = ['❄️','🌨️','💎','⚪'];
  const water    = ['💧','🌊','🫧','💦'];
  const fire     = ['✨','💥','⚡','🔥'];

  if (flowers.includes(emoji))  return ['🌸','🌺','🌼','💐','🌷'];
  if (leaves.includes(emoji))   return ['🍃','🍀','🌿','🍂'];
  if (['☀️','🌞','🌅'].includes(emoji)) return ['✨','⭐','🌟','💛','☀️'];
  if (['⭐','🌟','✨','💫','🌕'].includes(emoji)) return ['✨','⭐','💫','🌟'];
  if (snow.includes(emoji))     return ['❄️','⛄','🌨️','💙'];
  if (water.includes(emoji))    return ['💧','🌊','🫧','💦'];
  if (['⚡','🌋','💥'].includes(emoji)) return ['✨','💥','⚡','🔥'];
  if (['🍕','🌮','🍜','🍱','🍣'].includes(emoji)) return ['⭐','✨','💫','🎉'];
  // default: use the emoji itself as particle
  return [emoji, '✨', '💫'];
}

function tileCenter(pos: { x: number; y: number; z: number }): { x: number; y: number } {
  return {
    x: (pos.x * TILE_W) / 2 + pos.z * LAYER_OFFSET + TILE_W / 2,
    y: (pos.y * TILE_H) / 2 - pos.z * LAYER_OFFSET + TILE_H / 2,
  };
}

function buildParticles(
  c1: { x: number; y: number },
  c2: { x: number; y: number },
  emoji: string,
  matchId: number,
): { particles: Particle[]; burst: BurstDot[] } {
  const pool = pickParticles(emoji);
  const mid = { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 };
  const centers = [c1, c2, mid];

  const particles: Particle[] = [];
  centers.forEach((center, ci) => {
    const count = ci === 2 ? 4 : 3; // more at midpoint
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (ci * 0.7) + Math.random() * 0.6;
      const dist  = 45 + Math.random() * 55;
      particles.push({
        key:      `${matchId}-${ci}-${i}`,
        cx:       center.x,
        cy:       center.y,
        tx:       Math.cos(angle) * dist,
        ty:       Math.sin(angle) * dist,
        rot:      (Math.random() - 0.5) * 900,
        emoji:    pool[Math.floor(Math.random() * pool.length)],
        delay:    ci * 40 + Math.random() * 80,
        duration: 650 + Math.random() * 350,
        size:     0.9 + Math.random() * 0.6,
      });
    }
  });

  const burst: BurstDot[] = [
    { key: `b1-${matchId}`, cx: c1.x,  cy: c1.y,  emoji, duration: 600 },
    { key: `b2-${matchId}`, cx: c2.x,  cy: c2.y,  emoji, duration: 600 },
    { key: `bm-${matchId}`, cx: mid.x, cy: mid.y, emoji, duration: 750 },
  ];

  return { particles, burst };
}

export default function MatchEffect() {
  const lastMatch  = useGameStore(s => s.lastMatch);
  const tileTheme  = useGameStore(s => s.tileTheme);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [bursts, setBursts]       = useState<BurstDot[]>([]);

  useEffect(() => {
    if (!lastMatch) return;

    const theme  = THEMES[tileTheme ?? 'classic'];
    const symbol = getThemedSymbol(theme, lastMatch.group as TileGroup, lastMatch.value, '✨');

    const c1 = tileCenter(lastMatch.pos1);
    const c2 = tileCenter(lastMatch.pos2);
    const { particles: newP, burst: newB } = buildParticles(c1, c2, symbol, lastMatch.id);

    setParticles(prev => [...prev, ...newP]);
    setBursts(prev  => [...prev, ...newB]);

    const cleanup = setTimeout(() => {
      const ids = new Set(newP.map(p => p.key));
      const bids = new Set(newB.map(b => b.key));
      setParticles(prev => prev.filter(p => !ids.has(p.key)));
      setBursts(prev    => prev.filter(b => !bids.has(b.key)));
    }, 1400);

    return () => clearTimeout(cleanup);
  }, [lastMatch?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (particles.length === 0 && bursts.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 8000, overflow: 'visible' }}>
      {/* Central burst — big emoji that expands and fades */}
      {bursts.map(b => (
        <span
          key={b.key}
          className="absolute select-none"
          style={{
            left: b.cx,
            top:  b.cy,
            fontSize: '2rem',
            lineHeight: 1,
            animationName: 'match-burst',
            animationDuration: `${b.duration}ms`,
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
          } as React.CSSProperties}
        >
          {b.emoji}
        </span>
      ))}

      {/* Flying particles */}
      {particles.map(p => (
        <span
          key={p.key}
          className="absolute select-none"
          style={{
            left: p.cx,
            top:  p.cy,
            fontSize: `${p.size}rem`,
            lineHeight: 1,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--r':  `${p.rot}deg`,
            animationName: 'particle-out',
            animationDuration: `${p.duration}ms`,
            animationTimingFunction: 'ease-out',
            animationDelay: `${p.delay}ms`,
            animationFillMode: 'forwards',
            opacity: 0,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
