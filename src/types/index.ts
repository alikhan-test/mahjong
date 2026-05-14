export type TileGroup = 'bamboo' | 'character' | 'circle' | 'wind' | 'dragon' | 'season' | 'flower' | 'special';

export interface TileDefinition {
  group: TileGroup;
  value: number;
  symbol: string;
  label: string;
  color: string;
}

export interface TilePos {
  x: number;
  y: number;
  z: number;
}

export interface GameTile {
  id: number;
  def: TileDefinition;
  pos: TilePos;
  removed: boolean;
  selected: boolean;
  frozen?: boolean;
}

export type LayoutName = 'turtle' | 'dragon' | 'cross';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameStats {
  score: number;
  moves: number;
  time: number;
  hintsUsed: number;
}

export interface BestScore {
  score: number;
  time: number;
  date: string;
}
