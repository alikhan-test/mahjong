// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient } from './client';
// Use untyped inserts to avoid Supabase generic inference issues
type AnyRecord = Record<string, unknown>;
import type { Layout } from './types';

export interface GameResultInput {
  layout: Layout;
  score: number;
  time_seconds: number;
  moves: number;
  hints_used: number;
  won: boolean;
}

export interface UserStats {
  total_games: number;
  total_wins: number;
  win_rate: number;
  best_scores: Record<Layout, { score: number; time_seconds: number } | null>;
  recent_games: {
    layout: Layout;
    score: number;
    time_seconds: number;
    won: boolean;
    played_at: string;
  }[];
}

export async function saveGameResult(result: GameResultInput): Promise<void> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;

  // Save full game record (cast to any to bypass Supabase generic inference)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('game_results') as any).insert({
    user_id: user.id,
    ...result,
  } as AnyRecord);

  // Update best score if this is a win and better than previous
  if (result.won) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from('best_scores') as any)
      .select('score')
      .eq('user_id', user.id)
      .eq('layout', result.layout)
      .single();

    if (!existing || result.score > ((existing as AnyRecord).score as number)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('best_scores') as any).upsert({
        user_id: user.id,
        layout: result.layout,
        score: result.score,
        time_seconds: result.time_seconds,
        achieved_at: new Date().toISOString(),
      } as AnyRecord, { onConflict: 'user_id,layout' });
    }
  }
}

// ─── Daily Challenge ─────────────────────────────────────────────────────────

export interface DailyLeaderboardEntry {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  score: number;
  time_seconds: number;
  won: boolean;
}

export async function saveDailyResult(
  date: string,
  difficulty: string,
  score: number,
  time_seconds: number,
  won: boolean,
): Promise<void> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;
  // Unique constraint (user_id, date, difficulty) prevents double-submission at DB level
  await (supabase.from('daily_challenge_results') as any).insert({
    user_id: user.id, date, difficulty, score, time_seconds, won,
  } as AnyRecord);
}

export async function getMyDailyResult(
  date: string,
  difficulty: string,
): Promise<{ score: number; time_seconds: number; won: boolean } | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;
  const { data } = await (supabase.from('daily_challenge_results') as any)
    .select('score, time_seconds, won')
    .eq('user_id', user.id)
    .eq('date', date)
    .eq('difficulty', difficulty)
    .maybeSingle();
  if (!data) return null;
  const r = data as AnyRecord;
  return { score: r.score as number, time_seconds: r.time_seconds as number, won: r.won as boolean };
}

export async function getDailyLeaderboard(
  date: string,
  difficulty: string,
): Promise<DailyLeaderboardEntry[]> {
  const supabase = createClient();

  const { data: results } = await (supabase.from('daily_challenge_results') as any)
    .select('user_id, score, time_seconds, won')
    .eq('date', date)
    .eq('difficulty', difficulty)
    .order('score', { ascending: false })
    .limit(10);

  if (!results?.length) return [];

  const userIds = (results as AnyRecord[]).map(r => r.user_id as string);
  const { data: profiles } = await (supabase.from('profiles') as any)
    .select('id, username, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(
    ((profiles ?? []) as AnyRecord[]).map(p => [p.id as string, p]),
  );

  return (results as AnyRecord[]).map(r => {
    const p = profileMap.get(r.user_id as string) as AnyRecord | undefined;
    return {
      user_id: r.user_id as string,
      username: (p?.username as string) ?? null,
      avatar_url: (p?.avatar_url as string) ?? null,
      score: r.score as number,
      time_seconds: r.time_seconds as number,
      won: r.won as boolean,
    };
  });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  is_pro: boolean;
}

export async function getMyProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  const { data } = await (supabase.from('profiles') as any)
    .select('id, username, avatar_url, city, country, is_pro')
    .eq('id', user.id)
    .maybeSingle();

  const r = (data as AnyRecord) ?? {};

  // Sync Google auth metadata to profile if missing
  const username = (r.username as string | null) ?? (user.user_metadata?.full_name as string | null) ?? null;
  const avatar_url = (r.avatar_url as string | null) ?? (user.user_metadata?.avatar_url as string | null) ?? null;

  if (!data || (!r.username && username) || (!r.avatar_url && avatar_url)) {
    await (supabase.from('profiles') as any).upsert(
      { id: user.id, username, avatar_url } as AnyRecord,
      { onConflict: 'id' },
    );
  }

  return {
    id: user.id,
    username,
    avatar_url,
    city: (r.city as string | null) ?? null,
    country: (r.country as string | null) ?? null,
    is_pro: (r.is_pro as boolean | null) ?? false,
  };
}

export async function updateProfile(updates: Partial<{ city: string; country: string; username: string }>): Promise<void> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');
  const { error } = await (supabase.from('profiles') as any).upsert(
    { id: user.id, ...updates } as AnyRecord,
    { onConflict: 'id' },
  );
  if (error) throw error;
}

export async function getUserStats(): Promise<UserStats | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gr = supabase.from('game_results') as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bs = supabase.from('best_scores') as any;

  const [resultsRes, bestRes] = await Promise.all([
    gr.select('layout, score, time_seconds, won, played_at')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(100),
    bs.select('layout, score, time_seconds')
      .eq('user_id', user.id),
  ]);

  const results: AnyRecord[] = resultsRes.data ?? [];
  const bests: AnyRecord[] = bestRes.data ?? [];

  const total_games = results.length;
  const total_wins = results.filter(r => r.won as boolean).length;

  const best_scores: UserStats['best_scores'] = {
    turtle: null,
    dragon: null,
    cross: null,
  };
  for (const b of bests) {
    best_scores[b.layout as Layout] = {
      score: b.score as number,
      time_seconds: b.time_seconds as number,
    };
  }

  return {
    total_games,
    total_wins,
    win_rate: total_games > 0 ? Math.round((total_wins / total_games) * 100) : 0,
    best_scores,
    recent_games: results.slice(0, 10) as UserStats['recent_games'],
  };
}
