# 🀄 MahJong — Modern Mahjong Solitaire Platform

A full-featured, production-ready Mahjong Solitaire web app built as a startup prototype. Not just a game — a competitive platform with daily challenges, global leaderboards, tile themes, combos, and a monetization layer.

---

## Game Guide (for players)

### How to Play

Mahjong Solitaire is a matching puzzle. The board starts with **144 tiles** stacked in up to 5 layers. Your goal: remove all tiles by matching identical pairs.

**A tile is free (clickable) when:**
- Nothing is stacked on top of it
- It has at least one open side — left or right is not blocked by another tile

Click one free tile, then click its matching partner — both disappear. Clear the entire board to win.

---

### Tile Types & Matching Rules

The deck has **144 tiles across 7 suits** (72 matching pairs):

| Suit | Tiles | Match rule |
|------|-------|-----------|
| **Bamboo** 🎋 | 9 values × 4 copies = 36 | Same value only |
| **Characters** 一…九 | 9 values × 4 copies = 36 | Same value only |
| **Circles** ①…⑨ | 9 values × 4 copies = 36 | Same value only |
| **Winds** 東南西北 | 4 values × 4 copies = 16 | Same value only |
| **Dragons** 中發白 | 3 values × 4 copies = 12 | Same value only |
| **Seasons** 春夏秋冬 | 4 tiles × 1 copy each = 4 | **Any Season matches any Season** |
| **Flowers** 梅蘭菊竹 | 4 tiles × 1 copy each = 4 | **Any Flower matches any Flower** |

Seasons and Flowers are wildcards within their own suit — Spring matches Winter, Plum matches Orchid, etc.

---

### Layouts

| Layout | Character |
|--------|-----------|
| **Turtle** | Classic 5-layer pyramid — balanced, good for beginners |
| **Dragon** | Long narrow shape — more open sides, faster games |
| **Cross** | Symmetric cross — tight center, strategic edges |

Switching layout starts a new game immediately.

---

### Difficulty

| Mode | Time limit | Score multiplier |
|------|-----------|-----------------|
| **Easy** | 5 minutes | ×1 |
| **Medium** | 3 minutes | ×2 |
| **Hard** | 1 minute | ×5 |

Higher difficulty multiplies all score gains. On Hard, the board is also generated with ≤2 free pairs at the surface to force deeper planning from move one.

---

### Scoring System

Every matched pair earns points:

```
points = (100 + time_bonus + combo_bonus) × difficulty_multiplier
```

**Time bonus** — reward for matching quickly after your last match:
```
time_bonus = max(0, 30 − seconds_since_last_match) × 2
```
Match within 1 second: +58. Match after 30+ seconds: +0.

**Combo bonus** — consecutive fast matches build a chain:
```
combo_bonus = combo_count × 20
```
First match of a chain: +0. Second: +20. Third: +40. And so on.

**Example (Medium, 3rd match in combo, 5 seconds since last):**
```
(100 + (30−5)×2 + 2×20) × 2 = (100 + 50 + 40) × 2 = 380 pts
```

---

### Combo System

A **combo chain** builds when you make consecutive matches within **10 seconds** of each other.

The combo resets if you:
- Wait more than 10 seconds between matches
- Use Shuffle or Undo (both reset combo to 0)

The orange 🔥 banner shows your current combo count and a countdown bar. Keep matching fast to multiply your score.

---

### Tools

| Tool | Cost | Notes |
|------|------|-------|
| **Hint** 💡 | −5% of current score | Highlights a valid pair for 2 seconds |
| **Undo** ↩ | Free on Easy & Medium · −1% on Hard | Reverts the last match; resets combo |
| **Shuffle** 🔀 | Free on Easy · −20% on Medium & Hard | Rearranges remaining tiles into a new solvable layout; resets combo |

Using tools never prevents you from winning — they only reduce your score.

---

### Special Tiles (Mods Mode)

Enable **✨ Mods** in the controls to inject special tiles into the board. Four types appear in random quantities (0, 2, 4, or 6 of each per game):

| Tile | Trigger | Effect |
|------|---------|--------|
| **Shuffle** 🔀 | Match two Shuffle tiles | Instantly reshuffles all remaining tiles into a new solvable arrangement |
| **Bomb** 💣 | Match two Bomb tiles | Destroys all tiles within radius ~2.5 tile-widths around both bombs |
| **Ice** 🧊 | Match two Ice tiles | Freezes all tiles within radius ~3 tile-widths — frozen tiles can't be selected |
| **Fire** 🔥 | Match two Fire tiles | Thaws **all** frozen tiles on the board instantly |

Frozen tiles display a blue tint and are unclickable. Matching any normal pair also thaws nearby frozen tiles (radius ~2 tile-widths). Special tiles always appear as matched pairs so the board stays solvable.

---

### Game Modes

**Classic Mode** — Unlimited games. Pick any layout, difficulty, and tile theme. Best scores saved locally per layout.

**Daily Challenge** — One seeded board per day, identical for every player worldwide. You get one attempt only. Scores go to the global leaderboard (sign in required). Your rank shows on the home screen.

**Multiplayer** *(Coming Soon)* — Real-time matchmaking with a ranked cup system.

---

### Tile Themes

Change the visual skin of all tiles without restarting. Two themes are free; six require Pro.

| Theme | Access |
|-------|--------|
| 🀄 Classic | Free — traditional Chinese characters |
| 🌸 Seasons | Free — nature emojis (flowers, moons, stars) |
| 🍜 Food | Pro — pizza, sushi, desserts, drinks |
| 🌍 Countries | Pro — flags and cultural landmarks |
| 🐉 Chinese | Pro — lanterns, dragons, cultural icons |
| ⛩️ Japanese | Pro — torii, sakura, samurai, ramen |
| 💜 Korean | Pro — K-aesthetic colors and symbols |
| 🔥 Elements | Pro — fire, water, earth, air, lightning |

---

### Pro Tier

**$3 one-time payment** — no subscription, no expiry. Unlocks all 6 extra tile themes forever. Payment processed via Stripe; `is_pro` is saved to your profile and persists across devices.

---

### Tips & Strategy

- **Clear top layers first** — tiles on higher layers block more of the board. Freeing them opens more choices below.
- **Save Seasons/Flowers** — since all four match each other, they're easy pairs. Hold them for when you need a quick combo restart.
- **Watch the combo timer** — 10 seconds goes fast. Pre-scan your next pair while the current animation plays.
- **Shuffle is not a panic button** — on Medium/Hard it costs 20% of your score. Use it while your score is still low.
- **Mods — Bombs are high-risk** — a blast can open a locked section or destroy tiles you needed. Plan before matching.
- **Hard mode** — the board starts with ≤2 free pairs on purpose. Think several moves ahead before clicking.

---

## Product Overview

### What was built

**Core gameplay**
- 3 board layouts (Turtle 5-layer, Dragon, Cross), 3 difficulty levels
- Combo system — consecutive matches within 10s multiply score; live countdown bar
- Hint / Undo / Shuffle with score penalties on Medium/Hard
- Special tiles Mods mode: 🔀 Shuffle, 💣 Bomb, 🧊 Ice, 🔥 Fire

**Daily Challenge**
- Seeded board identical for every player on a given day (xorshift32 + date string seed)
- One attempt per day; score saved to Supabase leaderboard after completion

**Visual polish**
- Match particle burst animations per tile type (petals, snowflakes, lightning, ripples…)
- 8 tile skin themes switchable mid-game without restart
- Dark/light mode, floating combo banner and penalty toasts (never push content)

**Auth & social**
- Google OAuth via Supabase Auth
- Global leaderboard with avatars, time, and score — visible to guests
- Leaderboard cache: stale-while-revalidate (30-min fresh / 60-min stale)
- Guest mode with clear "scores won't be saved" messaging

**Monetization**
- Free tier: Classic + Seasons themes, all gameplay features
- Pro tier ($3 one-time via Stripe Checkout): all 8 themes
- Payment verified server-side via `/api/verify-payment` — works without webhooks in local dev

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript strict |
| Styling | Tailwind CSS v4 |
| State | Zustand v5 |
| Backend | Supabase (Auth + PostgreSQL + RLS) |
| Payments | Stripe Checkout |
| Icons | Lucide React |

---

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Database

Run `fix-leaderboard-rls.sql` in the Supabase SQL Editor. It creates RLS policies and ensures the `is_pro`, `city`, `country` columns exist on `profiles`.

---

## Deploy to Vercel

1. Push to GitHub
2. Import repo at vercel.com — Next.js detected automatically
3. Add all env vars from `.env.local` in Vercel → Settings → Environment Variables
4. In Supabase → Authentication → URL Configuration, set Site URL and Redirect URL to your Vercel domain
5. In Stripe Dashboard → Webhooks → add `https://your-app.vercel.app/api/webhook` for `checkout.session.completed`; copy the new signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel and redeploy

---

## Architecture Notes

**Half-tile coordinate system** — tiles are positioned on a grid where one tile occupies 2 units, allowing fractional overlaps without floating point issues. `left = (pos.x × TILE_W) / 2 + pos.z × LAYER_OFFSET`.

**Reverse-build generation** — boards are generated backwards (free slots → assign pairs → deactivate) guaranteeing at least one valid solution. Up to 80 retries per difficulty target.

**Seeded daily board** — `createDailyGame(date, difficulty, layout)` seeds xorshift32 from the date string so every player worldwide gets the same board with no server coordination.

**Theme system** — pure render-time lookup (group + value → emoji/color). No game state involved; switching themes re-renders only the tile visuals.

**`getSession()` over `getUser()`** — `getUser()` validates JWT via network (~300–500 ms). `getSession()` reads localStorage instantly. All auth UI uses `getSession()` for zero-lag render.

**Payment verification without webhooks** — `/api/verify-payment` retrieves the Stripe checkout session by ID and updates `is_pro` via the admin Supabase client. Works in local dev where webhooks can't reach localhost.
