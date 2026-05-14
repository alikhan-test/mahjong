export type Layout = 'turtle' | 'dragon' | 'cross';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          username?: string | null;
          avatar_url?: string | null;
        };
      };
      game_results: {
        Row: {
          id: string;
          user_id: string;
          layout: Layout;
          score: number;
          time_seconds: number;
          moves: number;
          hints_used: number;
          won: boolean;
          played_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          layout: Layout;
          score: number;
          time_seconds: number;
          moves: number;
          hints_used: number;
          won: boolean;
          played_at?: string;
        };
        Update: {
          score?: number;
        };
      };
      best_scores: {
        Row: {
          id: string;
          user_id: string;
          layout: Layout;
          score: number;
          time_seconds: number;
          achieved_at: string;
        };
        Insert: {
          user_id: string;
          layout: Layout;
          score: number;
          time_seconds: number;
        };
        Update: {
          score?: number;
          time_seconds?: number;
          achieved_at?: string;
        };
      };
    };
  };
}
