# 🀄 MahJong — Modern Mahjong Solitaire Platform

A full-featured, production-ready Mahjong Solitaire web app built as a startup prototype. Not just a game — a competitive platform with daily challenges, global leaderboards, tile themes, combos, and a monetization layer.

---

## What was built

### Core gameplay
- **3 board layouts** — Turtle, Dragon, Cross — each with a distinct challenge
- **3 difficulty levels** — Easy (5 min · 1×), Medium (3 min · 2×), Hard (1 min · 5×)
- **Combo system** — consecutive matches within 10 seconds multiply score; a live countdown bar shows the remaining window
- **Hint / Undo / Shuffle** — with score penalties on Medium/Hard to preserve balance
- **Special tiles (Mods)** — 🔀 Shuffle, 💣 Bomb, 🧊 Ice, 🔥 Fire tiles that trigger board-wide effects on match

### Daily Challenge
- Seeded board identical for every player on a given day — same layout, same tile order
- One attempt per day, any abuse of refreshes locks you out
- Score saved to Supabase and shown on a live leaderboard after completion

### Visual polish
- **Match particle effects** — every tile match triggers a burst animation tuned to the tile type: flower petals, snowflakes, lightning, water ripples, etc.
- **8 tile skin themes** — Classic, Seasons, Food, Countries, Chinese, Japanese, Korean, Elements
- **Countries theme** uses cultural landmark emojis (🗽 🗼 🏯 🦘 🌷 …) + flag + country code labels
- **Dark / light mode** — system preference detected, togglable in-game
- Floating combo banner and penalty toasts — never push content down (fixed-position overlays)

### Auth & social layer
- Google OAuth via Supabase Auth
- City auto-detection (Geolocation + Nominatim reverse geocoding) or manual entry
- Global leaderboard filtered by difficulty and date, with avatars, time, and score
- Leaderboard cache: stale-while-revalidate (30-min fresh / 60-min stale) — instant load on revisit
- Guest mode with clear "scores won't be saved" messaging

### Monetization
- **Free tier**: Classic + Seasons themes, all gameplay features
- **Pro tier ($3 one-time)**: all 8 themes + priority leaderboard badge
- Upgrade modal ready to wire to Stripe Checkout (see integration notes below)

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand v5 |
| Backend | Supabase (Auth + PostgreSQL + RLS) |
| Animations | CSS keyframes + custom properties |
| Icons | Lucide React |

---

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your Supabase keys
cp .env.example .env.local

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Database setup

Run the migration files in order against your Supabase project:

```
supabase/migrations/
  001_initial_schema.sql      — game_results table + RLS
  002_daily_challenge.sql     — daily_results table
  003_city_profile.sql        — city/country columns on profiles + public read policy
```

---

## Stripe integration (Pro tier)

1. Create a Stripe account → Products → add "MahJong Pro" at $3 (one-time)
2. Copy the `price_xxx` ID
3. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_...
   NEXT_PUBLIC_STRIPE_KEY=pk_...
   ```
4. Create `src/app/api/checkout/route.ts`:
   ```ts
   import Stripe from 'stripe';
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

   export async function POST() {
     const session = await stripe.checkout.sessions.create({
       mode: 'payment',
       line_items: [{ price: 'price_XXX', quantity: 1 }],
       success_url: `${process.env.NEXT_PUBLIC_URL}/?upgraded=1`,
       cancel_url:  `${process.env.NEXT_PUBLIC_URL}/`,
     });
     return Response.json({ url: session.url });
   }
   ```
5. In `ProModal.tsx`, replace the `alert` with:
   ```ts
   const res = await fetch('/api/checkout', { method: 'POST' });
   const { url } = await res.json();
   window.location.href = url;
   ```
6. Add a Stripe webhook → on `checkout.session.completed`, set `is_pro = true` on the user's Supabase profile row
7. Read `is_pro` in `GameControls.tsx` and pass it to `FREE_THEMES` check to unlock all themes

---

## Architecture decisions

**Half-tile coordinate system** — tiles are positioned on a grid where one tile occupies 2 units, allowing fractional overlaps. `left = (pos.x × TILE_W) / 2 + pos.z × LAYER_OFFSET`.

**Theme system** — themes are a pure render-time lookup (group + value → emoji). No game restart needed for theme switching; the store holds only a `ThemeId` string.

**Seeded daily board** — `createDailyGame(date, difficulty, layout)` seeds a deterministic shuffle with the date string so every player worldwide gets the same board.

**Stale-while-revalidate leaderboard** — cached in `localStorage` with a 30-min fresh window and 60-min stale window. On cache hit, data renders immediately; a background fetch silently updates the cache if stale.

**`getSession()` over `getUser()`** — Supabase's `getUser()` validates the JWT server-side on every call (~300–500 ms). `getSession()` reads from localStorage instantly. All auth UI uses `getSession()` for immediate render.

---

## Why this is a product, not homework

- One-shot Daily Challenge creates daily retention (users come back tomorrow)
- City-based leaderboard creates local community ("beat players from Almaty")
- Combo + difficulty multipliers create score ceiling to chase
- Tile themes + Pro gate = real monetization path, not an afterthought
- Match particle effects make every move feel satisfying — UX that keeps players in flow state
