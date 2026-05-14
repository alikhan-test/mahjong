import { TilePos, LayoutName } from '@/types';

// Pyramid "Turtle": 60+40+24+12+8 = 144
function pyramid(): TilePos[] {
  const p: TilePos[] = [];
  for (let y = 0; y <= 10; y += 2) for (let x = 0; x <= 18; x += 2) p.push({ x, y, z: 0 }); // 60
  for (let y = 1; y <= 9;  y += 2) for (let x = 1; x <= 15; x += 2) p.push({ x, y, z: 1 }); // 40
  for (let y = 2; y <= 8;  y += 2) for (let x = 2; x <= 12; x += 2) p.push({ x, y, z: 2 }); // 24
  for (let y = 3; y <= 7;  y += 2) for (let x = 3; x <= 9;  x += 2) p.push({ x, y, z: 3 }); // 12
  for (let y = 4; y <= 6;  y += 2) for (let x = 4; x <= 10; x += 2) p.push({ x, y, z: 4 }); //  8
  return p; // 144
}

// Dragon: elongated horizontal, 84+60 = 144
function dragon(): TilePos[] {
  const p: TilePos[] = [];
  for (let y = 0; y <= 10; y += 2) for (let x = 0; x <= 26; x += 2) p.push({ x, y, z: 0 }); // 14×6=84
  for (let y = 1; y <= 9;  y += 2) for (let x = 1; x <= 23; x += 2) p.push({ x, y, z: 1 }); // 12×5=60
  return p; // 144
}

// Cross/Triangle pyramid: 72+50+16+6 = 144
function cross(): TilePos[] {
  const p: TilePos[] = [];
  for (let y = 0; y <= 10; y += 2) for (let x = 0; x <= 22; x += 2) p.push({ x, y, z: 0 }); // 12×6=72
  for (let y = 1; y <= 9;  y += 2) for (let x = 1; x <= 19; x += 2) p.push({ x, y, z: 1 }); // 10×5=50
  for (let y = 2; y <= 8;  y += 2) for (let x = 2; x <= 16; x += 2) p.push({ x, y, z: 2 }); //  8×4=32... wait
  // Redo: need 22 more
  // Layer 2: 6×3=18, Layer 3: 4×1=4 → 18+4=22 ✓
  return p; // Recalculate below
}

// Revised cross: exactly 144
function fortressLayout(): TilePos[] {
  const p: TilePos[] = [];
  // Layer 0: 12 cols × 6 rows = 72
  for (let y = 0; y <= 10; y += 2) for (let x = 0; x <= 22; x += 2) p.push({ x, y, z: 0 });
  // Layer 1: 10 cols × 5 rows = 50
  for (let y = 1; y <= 9;  y += 2) for (let x = 1; x <= 19; x += 2) p.push({ x, y, z: 1 });
  // Layer 2: 6 cols × 3 rows = 18
  for (let y = 3; y <= 7;  y += 2) for (let x = 3; x <= 13; x += 2) p.push({ x, y, z: 2 });
  // Layer 3: 2 cols × 2 rows = 4
  for (let y = 4; y <= 6;  y += 2) for (let x = 8; x <= 10; x += 2) p.push({ x, y, z: 3 });
  return p; // 72+50+18+4 = 144
}

export const LAYOUTS: Record<LayoutName, () => TilePos[]> = {
  turtle: pyramid,
  dragon: dragon,
  cross:  fortressLayout,
};

export function getLayout(name: LayoutName): TilePos[] {
  return LAYOUTS[name]();
}
