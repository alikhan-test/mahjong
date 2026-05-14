# Mahjong Solitaire — Technical Documentation

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, `'use client'`) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (class-based dark mode via `@custom-variant`) |
| State | Zustand v5 |
| Backend / Auth | Supabase (PostgreSQL + Google OAuth + RLS) |
| Icons | lucide-react |

---

## Project structure

```
src/
  app/
    page.tsx                  # Root — view router: select / classic / daily
    globals.css               # Tailwind + dark-mode variant + keyframe animations
    auth/callback/route.ts    # OAuth redirect handler (exchanges code → session)
  components/
    GameBoard.tsx             # Renders all tiles + <MatchEffect> overlay
    Tile.tsx                  # Single tile — position, state classes, themed symbol
    GameControls.tsx          # Difficulty, layout, theme picker, actions, score/timer
    MatchEffect.tsx           # Particle burst animations on tile match
    ModeSelector.tsx          # Landing — mode cards + leaderboard + auth header
    DailyChallenge.tsx        # Daily challenge flow (mods-select → playing → done)
    AuthButton.tsx            # Avatar / sign-in / sign-out in game header
    CityModal.tsx             # Geolocation or manual city selection
    GuestBanner.tsx           # Amber notice for unauthenticated users
    ProModal.tsx              # Upgrade-to-Pro modal ($3 one-time)
    StatsModal.tsx            # Per-user stats pulled from Supabase
  lib/
    store.ts                  # Zustand game store — all game state & actions
    themes.ts                 # 8 tile theme definitions + helper functions
    mahjong/
      tiles.ts                # Tile definitions, deck builder, canMatch
      layout.ts               # Three board layouts (Turtle, Dragon, Cross)
      engine.ts               # Game generation, free-tile detection, scoring, specials
    supabase/
      client.ts               # createClient() singleton
      database.ts             # saveGameResult, getDailyLeaderboard, getMyProfile, …
      types.ts                # Supabase schema types
  types/
    index.ts                  # Shared TypeScript interfaces
```

---

## Tile system

### Standard tiles (144 total)

| Group | Count | Matching rule |
|---|---|---|
| Bamboo 1–9 | 4 × 9 = 36 | Same group + same value |
| Character 1–9 | 4 × 9 = 36 | Same group + same value |
| Circle 1–9 | 4 × 9 = 36 | Same group + same value |
| Wind (E/S/W/N) | 4 × 4 = 16 | Same group + same value |
| Dragon (Red/Green/White) | 4 × 3 = 12 | Same group + same value |
| Season (Spring–Winter) | 1 × 4 = 4 | Any season matches any season |
| Flower (Plum/Orchid/Chrysanthemum/Bamboo) | 1 × 4 = 4 | Any flower matches any flower |

### Special tiles (Mods mode only)

| Tile | Symbol | Effect on match |
|---|---|---|
| Shuffle | 🔀 | Reshuffles all remaining tiles (free, solvable) |
| Bomb | 💣 | Removes all tiles within 2.5 tile-widths of each bomb; auto-reshuffles if no moves remain |
| Ice | 🧊 | Freezes all tiles within 3.0 tile-widths of each ice position; frozen tiles show ❄️ and can't be clicked |
| Fire | 🔥 | Instantly unfreezes every frozen tile on the board |

**Thaw mechanic:** after every normal match, any frozen tile within 2.0 tile-widths of the removed pair gets unfrozen automatically.

**Injection rule:** for each special type, a random even count (0 / 2 / 4 / 6) is chosen. The engine always replaces full matching pairs of normal tiles so the board remains solvable — no orphan tiles are created.

---

## Board layouts

All layouts use a **half-unit coordinate system**: each tile occupies `[x, x+2) × [y, y+2)` grid units, sitting on layer z.

### Turtle (default) — 144 tiles across 5 layers

| Layer | Tiles |
|---|---|
| 0 | 10 × 6 = 60 (x ∈ 0–18 step 2, y ∈ 0–10 step 2) |
| 1 | 8 × 5 = 40 |
| 2 | 24 |
| 3 | 12 |
| 4 | 8 |

### Dragon — 144 tiles across 2 layers

| Layer | Tiles |
|---|---|
| 0 | 14 × 6 = 84 |
| 1 | 12 × 5 = 60 |

### Cross — 144 tiles across 4 layers

| Layer | Tiles |
|---|---|
| 0 | 12 × 6 = 72 |
| 1 | 10 × 5 = 50 |
| 2 | 6 × 3 = 18 (x ∈ 3–13) |
| 3 | 4 (center) |

---

## Game generation (reverse-build algorithm)

The engine guarantees every generated board has at least one full solution:

1. All 144 positions start as "active" (occupied but unassigned).
2. Find all currently **free** active positions (not covered above, and unblocked on at least one horizontal side).
3. Pick 2 free positions at random, assign a matching pair to those slots, deactivate them.
4. Repeat until all positions are assigned.

Playing forward, the last-assigned pair is always free first — the reverse of the build order is always a valid solution.

### Free-tile detection

A tile is **free** if:
- No tile on layer `z+1` overlaps it in both x and y (not covered above), **AND**
- It is not blocked on **both** sides horizontally.

Blocking: another tile on the same layer blocks the left side if `other.x + 2 === tile.x` or `other.x + 1 === tile.x` (with y-range overlap). Right-side blocking is symmetric.

### Difficulty-based board filtering

After generation, the engine counts **initial free pairs** (matching pairs among currently-free tiles). If the count doesn't match the difficulty target, it retries up to 80 times:

| Difficulty | Target free pairs | Effect |
|---|---|---|
| Easy | ≥ 4 | Many obvious moves, lots of solution paths |
| Medium | 3–5 | Moderate choice, fewer paths |
| Hard | ≤ 2 | Very constrained; wrong move leads to getting stuck |

---

## Scoring

### Base formula (per matched pair)

```
score = (base + timeBonus + comboBonus) × difficultyMultiplier
```

| Component | Formula |
|---|---|
| base | 100 pts |
| timeBonus | `max(0, 30 − secondsSinceLastMatch) × 2` |
| comboBonus | `max(0, combo − 1) × 20` (starts from the 2nd consecutive match) |

### Difficulty multipliers

| Difficulty | Multiplier |
|---|---|
| Easy | 1× |
| Medium | 2× |
| Hard | 5× |

Combo amplifies the difficulty multiplier: a 4× combo on Hard means each match scores `(100 + bonuses) × 5`.

### Penalties

| Action | Easy | Medium | Hard |
|---|---|---|---|
| Shuffle | 0% | −20% of current score | −20% of current score |
| Undo | — | — | −1% of current score |
| Hint | −5% on all difficulties | −5% | −5% |

Penalty toasts appear as **fixed-position floating overlays** (`top-20`, same `combo-enter` animation as combo banner) for 2 seconds, never pushing content down.

---

## Combo system

- A **combo** increments by 1 with each consecutive matched pair.
- **Combo timeout:** 10 seconds since the last match. If the player takes longer, combo resets to 0.
- **UI:** the combo banner appears only from the **2nd consecutive match** (combo ≥ 2). It shows:
  - Flame icon + `Nx COMBO`
  - Countdown bar (orange → red → dark red) with remaining seconds
- The `tick()` action (called every second via `setInterval`) auto-breaks combo when the timeout is detected.
- The banner is a **fixed overlay** (`top-4`, `z-50`) — it never shifts page content.

---

## Timer

The timer counts **up** (`stats.time` in seconds). A time **limit** is set per difficulty. The countdown displayed in the UI is `timeLimit − stats.time`.

| Difficulty | Time limit |
|---|---|
| Easy | 5 minutes (300 s) |
| Medium | 3 minutes (180 s) |
| Hard | 1 minute (60 s) |

When `stats.time >= timeLimit`, `tick()` sets `status = 'lost'` with `lostReason = 'timeout'` and saves the result to Supabase.

The countdown turns **red** when ≤ 30 seconds remain.

---

## Game state machine

```
idle → playing → won           (all tiles removed)
              → lost/no-moves  (no matching pairs left; shuffle or new game)
              → lost/timeout   (countdown reached zero)
```

Actions that resume play from `lost`:
- `shuffle()` — reshuffles remaining tiles, resets to `playing`
- `newGame()` — full reset

---

## History & Undo

Every matched pair appends the pre-match tile array to `history: GameTile[][]`. `undo()` pops the last snapshot and restores it, decrementing `moves` by 1. On Hard, each undo also deducts 1% of current score. History is not persisted — it resets on new game.

---

## Tile theme system

### ThemeId

```ts
type ThemeId = 'classic' | 'seasons' | 'food' | 'countries' | 'chinese'
             | 'japanese' | 'korean' | 'elements';
```

### TileThemeData interface

```ts
interface TileThemeData {
  id: ThemeId;
  name: string;
  icon: string;  // picker button emoji
  symbols: Record<Exclude<TileGroup, 'special'>, string[]>;  // per-group, indexed by value-1
  labels?:  Partial<Record<Exclude<TileGroup, 'special'>, string[]>>;  // small suit label
  colors?:  Partial<Record<Exclude<TileGroup, 'special'>, string>>;    // CSS color string
}
```

### Render-time lookup

Themes are applied at **render time** — the store holds only a `tileTheme: ThemeId`. Switching theme is instant and requires no game restart.

```ts
// Tile.tsx
const theme  = THEMES[tileTheme ?? 'classic'];
const symbol = getThemedSymbol(theme, tile.def.group, tile.def.value, tile.def.symbol);
const color  = getThemedColor(theme,  tile.def.group, tile.def.color);
const label  = getThemedLabel(theme,  tile.def.group, tile.def.value, tile.def.label);
```

Helper functions in `lib/themes.ts`:
- `getThemedSymbol(theme, group, value, fallback)` — returns `theme.symbols[group][value-1]` or fallback
- `getThemedColor(theme, group, fallback)` — returns `theme.colors?.[group]` or fallback
- `getThemedLabel(theme, group, value, fallback)` — returns `theme.labels?.[group][value-1]` or fallback

### Countries theme

Uses cultural/landmark emojis as symbols (render on all platforms, including Windows where flag emojis display as letter pairs):

| Group | Examples |
|---|---|
| bamboo | 🐉 CN, ⛩️ JP, 🏯 KR, 🗽 US, 🗼 FR, 🍺 DE |
| character | ⚽ BR, 🌮 MX, 🍁 CA, 🦘 AU, 🐘 IN, 🪆 RU |
| circle | 🌷 NL, 🍫 BE, 🎻 AT, 🧜 DK, 🦌 FI, 🍀 IE |

Labels include both flag emoji + code (`🇨🇳 CN`). On Windows the flag renders as the two-letter code, making it doubly readable.

### Pro tier gating

Free themes: `classic`, `seasons`. The other 6 show a purple `🔒` badge on their picker button. Clicking a locked theme opens `ProModal` instead of switching the theme.

```ts
// GameControls.tsx
const FREE_THEMES = new Set<ThemeId>(['classic', 'seasons']);
// ...
onClick={() => isLocked ? setShowProModal(true) : setTileTheme(t.id)}
```

---

## Match particle animations

### `lastMatch` state

`store.ts` tracks the most recent successful match:

```ts
lastMatch: {
  id: number;       // Date.now() — uniquely identifies this match for useEffect
  group: TileGroup;
  value: number;
  pos1: TilePos;
  pos2: TilePos;
} | null
```

Set in `selectTile()` when a match succeeds. Cleared in `newGame()`.

### MatchEffect component

`GameBoard.tsx` renders `<MatchEffect />` inside the `relative` board container. The component subscribes to `lastMatch?.id` changes and spawns:

1. **Burst dots** — 3 large emoji that expand from 0.4× to 4× scale and fade out (`match-burst` keyframe, 600–750 ms)
2. **Flying particles** — 10 small emoji that fly outward from both tile centers and the midpoint (`particle-out` keyframe, 650–1000 ms with staggered delays)

Particle direction uses CSS custom properties set inline:
```css
--tx: 73px;   /* end translate X */
--ty: -42px;  /* end translate Y */
--r:  420deg; /* end rotation */
```

Keyframe:
```css
@keyframes particle-out {
  0%   { opacity: 1; transform: translate(-50%,-50%) scale(1.3) rotate(0deg); }
  100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty)))
                                scale(0.15) rotate(var(--r)); }
}
```

### Particle set selection (`pickParticles`)

The emoji used for particles is chosen based on the matched tile's symbol:

| Matched symbol type | Particle pool |
|---|---|
| Flower (🌸🌺🌻🌹…) | 🌸 🌺 🌼 💐 🌷 |
| Leaf (🍃🍀🌿…) | 🍃 🍀 🌿 🍂 |
| Sun / sky (☀️🌞🌅) | ✨ ⭐ 🌟 💛 ☀️ |
| Stars (⭐🌟✨💫🌕) | ✨ ⭐ 💫 🌟 |
| Snow (❄️🌨️💎⚪) | ❄️ ⛄ 🌨️ 💙 |
| Water (💧🌊🫧💦) | 💧 🌊 🫧 💦 |
| Fire / lightning (⚡🌋💥) | ✨ 💥 ⚡ 🔥 |
| Food (🍕🌮🍜…) | ⭐ ✨ 💫 🎉 |
| Default | `[emoji itself]` ✨ 💫 |

---

## Daily Challenge

### Seeded board generation

`createDailyGame(date, difficulty, layout)` uses the ISO date string as a seed for a deterministic shuffle, producing the same board for all players worldwide on a given day.

### Flow

```
mods-select → loading → playing → saving → done
                     → already-played  (if user already has a result for today)
```

- `getMyDailyResult(date, difficulty)` is checked before starting; redirects to `already-played` if found
- `saveDailyResult()` is called once when `status` transitions to `won` or `lost` (guarded by `savedRef`)
- After save, `getDailyLeaderboard()` is fetched to show final standings

### Leaderboard data shape

```ts
interface DailyLeaderboardEntry {
  user_id:      string;
  username:     string | null;
  avatar_url:   string | null;
  score:        number;
  time_seconds: number;
  won:          boolean;
}
```

---

## Leaderboard caching (stale-while-revalidate)

`ModeSelector.tsx` caches leaderboard data in `localStorage` with two TTL windows:

| Window | Duration | Behaviour |
|---|---|---|
| Fresh | 0–30 min | Render cached data, skip network call |
| Stale | 30–60 min | Render cached data immediately, then background-refresh silently |
| Expired | > 60 min | Discard cache, show skeleton rows, fetch fresh |

Cache key: `mj_lb_${date}_${difficulty}`. Stored as `{ data, ts }`.

While the first fetch is in progress, **5 animated skeleton rows** (matching the real row layout) are shown instead of a spinner or text placeholder.

---

## Auth & profile

### `getSession` vs `getUser`

All auth UI uses `supabase.auth.getSession()` (reads from localStorage, ~0 ms) rather than `getUser()` (validates JWT server-side, ~300–500 ms round-trip). This makes the avatar and auth header render instantly on mount.

`getUser()` is used only in server-side contexts or when security-sensitive validation is needed.

### Profile fields

```sql
profiles (
  id         uuid references auth.users primary key,
  username   text,
  avatar_url text,
  city       text,
  country    text
)
```

`getMyProfile()` fetches the profile and syncs Google auth metadata (`full_name`, `avatar_url`) if missing.

`updateProfile({ city, country })` upserts the row.

### City detection

`CityModal` offers two paths:
1. **Auto-detect** — `navigator.geolocation.getCurrentPosition` → Nominatim reverse geocoding (`nominatim.openstreetmap.org/reverse`)
2. **Manual** — text inputs for city + country

City is displayed under the username in the header with a `MapPin` icon.

---

## Supabase integration

### Tables

| Table | Purpose |
|---|---|
| `profiles` | Username, avatar URL, city, country |
| `game_results` | One row per finished classic game |
| `daily_results` | One row per daily challenge attempt (unique on `user_id + date + difficulty`) |

### RLS policies (profiles)

```sql
-- Public read (needed for leaderboard joins)
create policy "public read" on profiles for select using (true);

-- Own write
create policy "own update" on profiles for update using (auth.uid() = id);
create policy "own insert" on profiles for insert with check (auth.uid() = id);
```

### Key database functions

| Function | Description |
|---|---|
| `saveGameResult(payload)` | Inserts into `game_results`; upserts `best_scores` on win |
| `saveDailyResult(date, diff, score, time, won)` | Inserts into `daily_results`; ignores duplicate on conflict |
| `getMyDailyResult(date, diff)` | Returns existing result for today if any |
| `getDailyLeaderboard(date, diff)` | Returns top 20 rows joined with profiles, ordered by score desc |
| `getMyProfile()` | Fetches + syncs own profile |
| `updateProfile(updates)` | Upserts city/country |

---

## Dark mode

Tailwind v4 uses `prefers-color-scheme` by default. The project overrides this with a class-based variant:

```css
/* globals.css */
@custom-variant dark (&:where(.dark, .dark *));
```

`setTheme()` in the store calls `document.documentElement.classList.toggle('dark', theme === 'dark')`. Theme persists in Zustand state for the session.

---

## Rendering

### Tile positioning

```
left  = (pos.x × TILE_W / 2) + pos.z × LAYER_OFFSET
top   = (pos.y × TILE_H / 2) − pos.z × LAYER_OFFSET
zIndex = pos.z × 200 + pos.y × 10 + pos.x
```

`TILE_W = 52px`, `TILE_H = 64px`, `LAYER_OFFSET = 5px`.

Higher layers shift right and up to create a 3-D stack illusion.

### Z-index layers

| Element | z-index |
|---|---|
| Tile (max) | ~918 (z×200 + y×10 + x) |
| MatchEffect particles | 8000 |
| Penalty toasts | 40 (Tailwind `z-40`) |
| Combo banner | 50 (Tailwind `z-50`) |
| ProModal / StatsModal | 9000 |

### CSS keyframes (globals.css)

```css
@keyframes combo-enter {
  from { opacity: 0; transform: translateY(-14px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0)     scale(1); }
}

@keyframes particle-out {
  0%   { opacity: 1; transform: translate(-50%,-50%) scale(1.3) rotate(0deg); }
  100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty)))
                                scale(0.15) rotate(var(--r)); }
}

@keyframes match-burst {
  0%   { opacity: 0.9; transform: translate(-50%,-50%) scale(0.4); }
  35%  { opacity: 1;   transform: translate(-50%,-50%) scale(2.2); }
  100% { opacity: 0;   transform: translate(-50%,-50%) scale(4); }
}
```

---

## Mods mode

Toggle with the **✨ Mods** button. Applies to the **next** new game — special tiles are injected after board generation. Each special type gets a random even count (0–6). The board remains solvable because only complete normal-tile pairs are swapped.

Special tile visuals:
- Free special tiles render with a purple border
- Frozen tiles show only `❄️` and have `cursor-not-allowed`
- Unfrozen tiles restore their original symbol and color

---

## Monetization (Pro tier)

### Tier split

| Feature | Free | Pro |
|---|---|---|
| Classic + Seasons themes | ✓ | ✓ |
| All 8 tile themes | — | ✓ |
| All gameplay features | ✓ | ✓ |

### ProModal

`ProModal.tsx` shows a gradient modal with price ($3 one-time), perk list, and a CTA. The payment button currently shows an `alert`; replacing it with a Stripe Checkout redirect requires:

1. `POST /api/checkout` → `stripe.checkout.sessions.create({ mode: 'payment', ... })`
2. Redirect to `session.url`
3. Stripe webhook on `checkout.session.completed` → set `is_pro = true` on `profiles`
4. Read `is_pro` in `GameControls.tsx` and pass it to the `FREE_THEMES` check

### Theme lock check

```ts
// GameControls.tsx
const FREE_THEMES = new Set<ThemeId>(['classic', 'seasons']);

const isLocked = !FREE_THEMES.has(t.id);
// locked buttons: show 🔒 badge, onClick → setShowProModal(true)
// unlocked buttons: onClick → setTileTheme(t.id)
```
