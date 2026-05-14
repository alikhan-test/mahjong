import { TileDefinition, TileGroup } from '@/types';

const SUIT_SYMBOLS: Record<TileGroup, string[]> = {
  bamboo:    ['🎋','🎋','🎋','🎋','🎋','🎋','🎋','🎋','🎋'],
  character: ['一','二','三','四','五','六','七','八','九'],
  circle:    ['①','②','③','④','⑤','⑥','⑦','⑧','⑨'],
  wind:      ['東','南','西','北'],
  dragon:    ['中','發','白'],
  season:    ['春','夏','秋','冬'],
  flower:    ['梅','蘭','菊','竹'],
  special:   ['🔀','💣','🧊','🔥'],
};

const SUIT_COLORS: Record<TileGroup, string> = {
  bamboo:    '#16a34a',
  character: '#dc2626',
  circle:    '#2563eb',
  wind:      '#7c3aed',
  dragon:    '#d97706',
  season:    '#be185d',
  flower:    '#0891b2',
  special:   '#6366f1',
};

const SUIT_LABELS: Record<TileGroup, string[]> = {
  bamboo:    ['1','2','3','4','5','6','7','8','9'],
  character: ['1','2','3','4','5','6','7','8','9'],
  circle:    ['1','2','3','4','5','6','7','8','9'],
  wind:      ['E','S','W','N'],
  dragon:    ['Red','Grn','Wht'],
  season:    ['Spr','Sum','Aut','Win'],
  flower:    ['Plm','Orc','Chr','Bam'],
  special:   ['Shfl','Bomb','Ice','Fire'],
};

function buildDefs(group: TileGroup): TileDefinition[] {
  return SUIT_SYMBOLS[group].map((symbol, i) => ({
    group,
    value: i + 1,
    symbol,
    label: SUIT_LABELS[group][i],
    color: SUIT_COLORS[group],
  }));
}

export const ALL_TILE_DEFS: TileDefinition[] = [
  ...buildDefs('bamboo'),
  ...buildDefs('character'),
  ...buildDefs('circle'),
  ...buildDefs('wind'),
  ...buildDefs('dragon'),
  ...buildDefs('season'),
  ...buildDefs('flower'),
];

export const SPECIAL_TILE_DEFS = {
  shuffle: { group: 'special' as TileGroup, value: 1, symbol: '🔀', label: 'Shfl', color: '#8b5cf6' },
  bomb:    { group: 'special' as TileGroup, value: 2, symbol: '💣', label: 'Bomb', color: '#ef4444' },
  ice:     { group: 'special' as TileGroup, value: 3, symbol: '🧊', label: 'Ice',  color: '#38bdf8' },
  fire:    { group: 'special' as TileGroup, value: 4, symbol: '🔥', label: 'Fire', color: '#f97316' },
} satisfies Record<string, TileDefinition>;

export function createDeck(): TileDefinition[] {
  const deck: TileDefinition[] = [];
  for (const def of ALL_TILE_DEFS) {
    const copies = def.group === 'season' || def.group === 'flower' ? 1 : 4;
    for (let i = 0; i < copies; i++) deck.push(def);
  }
  return deck; // 144 tiles
}

export function canMatch(a: TileDefinition, b: TileDefinition): boolean {
  if (a.group === 'season' && b.group === 'season') return true;
  if (a.group === 'flower' && b.group === 'flower') return true;
  return a.group === b.group && a.value === b.value;
}
