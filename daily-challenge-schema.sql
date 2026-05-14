-- Run this in Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS daily_challenge_results (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE        NOT NULL,
  difficulty   TEXT        NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  score        INTEGER     NOT NULL DEFAULT 0,
  time_seconds INTEGER     NOT NULL DEFAULT 0,
  won          BOOLEAN     NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),

  -- One submission per user per day per difficulty
  UNIQUE (user_id, date, difficulty)
);

ALTER TABLE daily_challenge_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own daily result"
  ON daily_challenge_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone authenticated can read daily results"
  ON daily_challenge_results FOR SELECT
  TO authenticated
  USING (true);
