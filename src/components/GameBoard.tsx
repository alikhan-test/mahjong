'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/lib/store';
import TileComponent, { TILE_W, TILE_H, LAYER_OFFSET } from './Tile';
import MatchEffect from './MatchEffect';

export default function GameBoard() {
  const tiles = useGameStore(s => s.tiles);

  const { boardW, boardH } = useMemo(() => {
    if (!tiles.length) return { boardW: 600, boardH: 400 };
    let maxX = 0, maxY = 0, maxZ = 0;
    for (const t of tiles) {
      if (!t.removed) {
        maxX = Math.max(maxX, t.pos.x);
        maxY = Math.max(maxY, t.pos.y);
        maxZ = Math.max(maxZ, t.pos.z);
      }
    }
    return {
      boardW: (maxX * TILE_W) / 2 + TILE_W + maxZ * LAYER_OFFSET + 20,
      boardH: (maxY * TILE_H) / 2 + TILE_H + maxZ * LAYER_OFFSET + 20,
    };
  }, [tiles]);

  // Render back-to-front for correct overlap
  const sorted = useMemo(
    () =>
      [...tiles]
        .filter(t => !t.removed)
        .sort((a, b) => {
          if (a.pos.z !== b.pos.z) return a.pos.z - b.pos.z;
          if (a.pos.y !== b.pos.y) return a.pos.y - b.pos.y;
          return a.pos.x - b.pos.x;
        }),
    [tiles]
  );

  return (
    <div className="overflow-auto max-w-full max-h-[70vh] p-4 rounded-2xl bg-emerald-900/20 dark:bg-emerald-950/40 ring-1 ring-emerald-700/30">
      <div
        className="relative"
        style={{ width: boardW, height: boardH, minWidth: boardW }}
      >
        {sorted.map(tile => (
          <TileComponent key={tile.id} tile={tile} allTiles={tiles} />
        ))}
        <MatchEffect />
      </div>
    </div>
  );
}
