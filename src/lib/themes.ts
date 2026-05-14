import { TileGroup } from '@/types';

export type ThemeId = 'classic' | 'seasons' | 'food' | 'countries' | 'chinese' | 'japanese' | 'korean' | 'elements';

export interface TileThemeData {
  id: ThemeId;
  name: string;
  icon: string;
  symbols: Record<Exclude<TileGroup, 'special'>, string[]>;
  labels?: Partial<Record<Exclude<TileGroup, 'special'>, string[]>>;
  colors?: Partial<Record<Exclude<TileGroup, 'special'>, string>>;
}

export const THEMES: Record<ThemeId, TileThemeData> = {

  classic: {
    id: 'classic',
    name: 'Classic',
    icon: '🀄',
    symbols: {
      bamboo:    ['🎋','🎋','🎋','🎋','🎋','🎋','🎋','🎋','🎋'],
      character: ['一','二','三','四','五','六','七','八','九'],
      circle:    ['①','②','③','④','⑤','⑥','⑦','⑧','⑨'],
      wind:      ['東','南','西','北'],
      dragon:    ['中','發','白'],
      season:    ['春','夏','秋','冬'],
      flower:    ['梅','蘭','菊','竹'],
    },
  },

  seasons: {
    id: 'seasons',
    name: 'Seasons',
    icon: '🌸',
    symbols: {
      bamboo:    ['🌱','🌿','🍃','🍀','🌾','🌲','🌳','🌴','🎋'],
      character: ['🌸','🌺','🌻','🌹','💐','🌷','🌼','🪷','🏵️'],
      circle:    ['🌙','⭐','🌟','✨','☀️','🌈','🌅','🌕','🌞'],
      wind:      ['🌸','☀️','🍂','❄️'],
      dragon:    ['🌊','🌋','⚡'],
      season:    ['🌸','☀️','🍂','❄️'],
      flower:    ['🌷','🌻','🌹','🌸'],
    },
    colors: {
      bamboo:    '#16a34a',
      character: '#ec4899',
      circle:    '#0891b2',
      wind:      '#d97706',
      dragon:    '#6d28d9',
      season:    '#f59e0b',
      flower:    '#be185d',
    },
  },

  food: {
    id: 'food',
    name: 'Food',
    icon: '🍜',
    symbols: {
      bamboo:    ['🍕','🌮','🍜','🍱','🍣','🍛','🥗','🌯','🥙'],
      character: ['🍎','🍊','🍋','🍇','🍓','🫐','🍑','🥭','🍒'],
      circle:    ['🍩','🍪','🎂','🍰','🧁','🍫','🍬','🍭','🍮'],
      wind:      ['🍵','☕','🧋','🥤'],
      dragon:    ['🦞','🐙','🦑'],
      season:    ['🥕','🌽','🍅','🥑'],
      flower:    ['🍓','🍑','🍒','🍇'],
    },
    colors: {
      bamboo:    '#ea580c',
      character: '#ef4444',
      circle:    '#d97706',
      wind:      '#0891b2',
      dragon:    '#be185d',
      season:    '#16a34a',
      flower:    '#7c3aed',
    },
  },

  countries: {
    id: 'countries',
    name: 'Countries',
    icon: '🌍',
    symbols: {
      // Cultural/landmark emojis — render correctly on all platforms
      bamboo:    ['🐉','⛩️','🏯','🗽','🎡','🗼','🍺','🍕','🐂'],
      character: ['⚽','🌮','🥩','🍁','🦘','🐘','🪆','🐓','🦅'],
      circle:    ['🌷','🍫','🎻','⛷️','🎄','🌊','🧜','🦌','🍀'],
      wind:      ['🐎','🕌','🌙','🌹'],
      dragon:    ['🏕️','🌾','🛕'],
      season:    ['🌻','🏛️','🐪','🦁'],
      flower:    ['🌋','🏙️','🌴','🏝️'],
    },
    labels: {
      // Country code + flag emoji (flag renders as letters on Windows = still readable)
      bamboo:    ['🇨🇳 CN','🇯🇵 JP','🇰🇷 KR','🇺🇸 US','🇬🇧 GB','🇫🇷 FR','🇩🇪 DE','🇮🇹 IT','🇪🇸 ES'],
      character: ['🇧🇷 BR','🇲🇽 MX','🇦🇷 AR','🇨🇦 CA','🇦🇺 AU','🇮🇳 IN','🇷🇺 RU','🇵🇹 PT','🇵🇱 PL'],
      circle:    ['🇳🇱 NL','🇧🇪 BE','🇦🇹 AT','🇨🇭 CH','🇸🇪 SE','🇳🇴 NO','🇩🇰 DK','🇫🇮 FI','🇮🇪 IE'],
      wind:      ['🇰🇿 KZ','🇺🇿 UZ','🇹🇷 TR','🇮🇷 IR'],
      dragon:    ['🇲🇳 MN','🇻🇳 VN','🇹🇭 TH'],
      season:    ['🇺🇦 UA','🇬🇷 GR','🇪🇬 EG','🇿🇦 ZA'],
      flower:    ['🇮🇩 ID','🇸🇬 SG','🇲🇾 MY','🇵🇭 PH'],
    },
  },

  chinese: {
    id: 'chinese',
    name: 'Chinese',
    icon: '🐉',
    symbols: {
      bamboo:    ['🏮','🪭','🧧','🥢','🪔','🎋','🎍','🎎','🎏'],
      character: ['⛰️','🌊','🌕','☁️','🌸','🍃','🌿','🌺','🐼'],
      circle:    ['💎','🔮','🪬','🧿','💮','👁️','🌀','🌐','🌑'],
      wind:      ['🐉','🦅','🐯','🦁'],
      dragon:    ['🔴','🟡','⚪'],
      season:    ['🌸','🏮','🍂','❄️'],
      flower:    ['🏵️','🌺','🌸','💮'],
    },
    colors: {
      bamboo:    '#dc2626',
      character: '#d97706',
      circle:    '#7c3aed',
      wind:      '#16a34a',
      dragon:    '#ef4444',
      season:    '#ec4899',
      flower:    '#0891b2',
    },
  },

  japanese: {
    id: 'japanese',
    name: 'Japanese',
    icon: '⛩️',
    symbols: {
      bamboo:    ['⛩️','🎐','🎏','🏯','🗻','🎍','🪭','🎎','🎋'],
      character: ['🍱','🍣','🍜','🍙','🍡','🎌','👘','🥋','⚔️'],
      circle:    ['🌕','🌙','⭐','🌸','🎑','🏮','🎇','🌊','🎆'],
      wind:      ['🌸','🌊','⛰️','🎋'],
      dragon:    ['🐉','🦊','🐢'],
      season:    ['🌸','🌻','🍁','⛄'],
      flower:    ['🌸','🌺','🌼','🌷'],
    },
    colors: {
      bamboo:    '#dc2626',
      character: '#d97706',
      circle:    '#1d4ed8',
      wind:      '#16a34a',
      dragon:    '#7c3aed',
      season:    '#ec4899',
      flower:    '#0891b2',
    },
  },

  korean: {
    id: 'korean',
    name: 'Korean',
    icon: '💜',
    symbols: {
      bamboo:    ['🎋','🌿','🍃','🌱','🌾','🌲','🌳','🌴','🎍'],
      character: ['💜','💙','💚','💛','🧡','❤️','🤎','🖤','🤍'],
      circle:    ['⭕','🔵','🟢','🟡','🟠','🔴','🟣','⚫','⚪'],
      wind:      ['🎵','🎶','💜','🌙'],
      dragon:    ['🐉','🦋','🌊'],
      season:    ['🌸','💜','🍂','❄️'],
      flower:    ['💜','💙','💚','🌸'],
    },
    colors: {
      bamboo:    '#16a34a',
      character: '#a855f7',
      circle:    '#3b82f6',
      wind:      '#8b5cf6',
      dragon:    '#0891b2',
      season:    '#ec4899',
      flower:    '#8b5cf6',
    },
  },

  elements: {
    id: 'elements',
    name: 'Elements',
    icon: '🔥',
    symbols: {
      bamboo:    ['🔥','💧','🌍','💨','⚡','🌑','✨','🌀','🌊'],
      character: ['🕯️','🌊','🌱','🌬️','🌩️','🌙','🌟','🌪️','🏔️'],
      circle:    ['🔴','🔵','🟤','🟡','🟢','⚫','⭐','🔮','🌈'],
      wind:      ['🔥','💧','🌍','💨'],
      dragon:    ['🌑','✨','⚡'],
      season:    ['🌋','🌊','🌪️','❄️'],
      flower:    ['🔥','💧','🌿','💨'],
    },
    colors: {
      bamboo:    '#f97316',
      character: '#3b82f6',
      circle:    '#78716c',
      wind:      '#6b7280',
      dragon:    '#a855f7',
      season:    '#ef4444',
      flower:    '#22c55e',
    },
  },

};

export function getThemedLabel(
  theme: TileThemeData,
  group: TileGroup,
  value: number,
  fallback: string,
): string {
  if (group === 'special') return fallback;
  const arr = theme.labels?.[group as Exclude<TileGroup, 'special'>];
  return arr?.[value - 1] ?? fallback;
}

export function getThemedSymbol(
  theme: TileThemeData,
  group: TileGroup,
  value: number,
  fallback: string,
): string {
  if (group === 'special') return fallback;
  const arr = theme.symbols[group as Exclude<TileGroup, 'special'>];
  return arr?.[value - 1] ?? fallback;
}

export function getThemedColor(
  theme: TileThemeData,
  group: TileGroup,
  fallback: string,
): string {
  if (group === 'special') return fallback;
  return theme.colors?.[group as Exclude<TileGroup, 'special'>] ?? fallback;
}
