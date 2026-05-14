-- Run this in Supabase SQL Editor after supabase-schema.sql
-- Adds city/country to profiles and fixes leaderboard read access

-- 1. Add city and country columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- 2. Drop the restrictive read policy and replace with a public one
--    (needed so leaderboard rows can show username/avatar of other players)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT USING (true);

-- 3. Allow users to update their own profile (for city/country/username)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Allow upsert for profile sync (in case the signup trigger didn't fire)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
