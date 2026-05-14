'use client';

import { GameTile } from '@/types';
import { isTileFree } from '@/lib/mahjong/engine';
import { useGameStore } from '@/lib/store';
import { THEMES, getThemedSymbol, getThemedColor, getThemedLabel } from '@/lib/themes';

const TILE_W = 52;
const TILE_H = 64;
const LAYER_OFFSET = 5;

interface Props {
  tile: GameTile;
  allTiles: GameTile[];
}

export default function Tile({ tile, allTiles }: Props) {
  const { selectedId, hintIds, selectTile, status, tileTheme } = useGameStore();
  const theme = THEMES[tileTheme ?? 'classic'];

  if (tile.removed) return null;

  const free = isTileFree(tile, allTiles);
  const frozen = tile.frozen ?? false;
  const selected = selectedId === tile.id;
  const hinted = hintIds.includes(tile.id);
  const clickable = status === 'playing' && free && !frozen;

  const left = (tile.pos.x * TILE_W) / 2 + tile.pos.z * LAYER_OFFSET;
  const top  = (tile.pos.y * TILE_H) / 2 - tile.pos.z * LAYER_OFFSET;
  const zIndex = tile.pos.z * 200 + tile.pos.y * 10 + tile.pos.x;

  const isSpecial = tile.def.group === 'special';

  return (
    <div
      onClick={() => { if (clickable) selectTile(tile.id); }}
      style={{ left, top, zIndex, width: TILE_W, height: TILE_H }}
      className={[
        'absolute select-none rounded-md transition-all duration-150',
        'border flex flex-col items-center justify-center',
        clickable ? 'cursor-pointer' : frozen ? 'cursor-not-allowed' : 'cursor-default',
        frozen
          ? 'border-sky-400 bg-sky-100 dark:bg-sky-900/50'
          : selected
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/60 scale-[1.06] shadow-lg shadow-yellow-400/40'
          : hinted
          ? 'border-green-400 bg-green-50 dark:bg-green-900/60 animate-pulse'
          : isSpecial && free
          ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/40 hover:border-purple-500 shadow-md shadow-purple-200/40'
          : free
          ? 'border-stone-300 bg-white dark:bg-stone-700 dark:border-stone-500 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 shadow-md'
          : 'border-stone-200 bg-stone-100 dark:bg-stone-800 dark:border-stone-600 shadow-sm opacity-75',
      ].join(' ')}
    >
      {/* 3-D depth edge */}
      <div
        className={[
          'absolute inset-0 rounded-md pointer-events-none',
          selected ? 'ring-2 ring-yellow-400' : hinted ? 'ring-2 ring-green-400' : '',
        ].join(' ')}
        style={{
          boxShadow: frozen
            ? 'inset 0 -3px 0 #7dd3fc, inset -3px 0 0 #7dd3fc'
            : selected
            ? 'inset 0 -3px 0 #ca8a04, inset -3px 0 0 #ca8a04'
            : free
            ? 'inset 0 -3px 0 #a8a29e, inset -3px 0 0 #a8a29e'
            : 'inset 0 -2px 0 #d6d3d1, inset -2px 0 0 #d6d3d1',
        }}
      />

      {frozen ? (
        /* Frozen overlay */
        <span className="text-2xl leading-none">❄️</span>
      ) : (
        <>
          {/* Suit label */}
          <span
            className="text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5 opacity-60"
            style={{ color: getThemedColor(theme, tile.def.group, tile.def.color) }}
          >
            {getThemedLabel(theme, tile.def.group, tile.def.value, tile.def.label)}
          </span>

          {/* Main symbol */}
          <span
            className="text-2xl leading-none font-bold"
            style={{ color: free ? getThemedColor(theme, tile.def.group, tile.def.color) : '#9ca3af' }}
          >
            {getThemedSymbol(theme, tile.def.group, tile.def.value, tile.def.symbol)}
          </span>
        </>
      )}
    </div>
  );
}

export { TILE_W, TILE_H, LAYER_OFFSET };
