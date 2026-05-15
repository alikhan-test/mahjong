const bom = (s: string | undefined): string =>
  s ? (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s) : '';

export const SUPABASE_URL              = bom(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY         = bom(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const SUPABASE_SERVICE_ROLE_KEY = bom(process.env.SUPABASE_SERVICE_ROLE_KEY);
export const STRIPE_SECRET_KEY         = bom(process.env.STRIPE_SECRET_KEY);
export const STRIPE_WEBHOOK_SECRET     = bom(process.env.STRIPE_WEBHOOK_SECRET);
