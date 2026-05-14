-- Run this in Supabase → SQL Editor
-- Fixes leaderboard visibility for all users (including guests)

-- 1. Allow anyone (including anon/guests) to read daily results
--    Needed so leaderboard loads even when not logged in
DROP POLICY IF EXISTS "Anyone authenticated can read daily results" ON daily_challenge_results;

CREATE POLICY "Anyone can read daily results"
  ON daily_challenge_results FOR SELECT
  USING (true);

-- 2. Ensure profiles are publicly readable (for leaderboard username/avatar display)
--    Run this only if city-profile-migration.sql was NOT already applied
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;

CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT USING (true);

-- 3. Ensure update/insert policies exist for profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Ensure city/country/is_pro columns exist (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;
