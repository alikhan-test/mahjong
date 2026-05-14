-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Profiles: auto-created when user signs up
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  avatar_url text,
  created_at timestamptz default now()
);

-- All game sessions
create table if not exists public.game_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  layout text not null check (layout in ('turtle','dragon','cross')),
  score integer not null default 0,
  time_seconds integer not null default 0,
  moves integer not null default 0,
  hints_used integer not null default 0,
  won boolean not null default false,
  played_at timestamptz default now()
);

-- Best score per user per layout (upserted on win)
create table if not exists public.best_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  layout text not null check (layout in ('turtle','dragon','cross')),
  score integer not null default 0,
  time_seconds integer not null default 0,
  achieved_at timestamptz default now(),
  unique (user_id, layout)
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.game_results enable row level security;
alter table public.best_scores enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can insert own game results"
  on public.game_results for insert with check (auth.uid() = user_id);

create policy "Users can read own game results"
  on public.game_results for select using (auth.uid() = user_id);

create policy "Users can upsert own best scores"
  on public.best_scores for all using (auth.uid() = user_id);
