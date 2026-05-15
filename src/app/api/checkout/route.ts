import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let userId: string | undefined;
  let userEmail: string | undefined;

  // Try Bearer token first (localStorage-based auth flow)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data: { user } } = await adminClient().auth.getUser(token);
    if (user) { userId = user.id; userEmail = user.email ?? undefined; }
  }

  // Fall back to cookie-based session
  if (!userId) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { userId = user.id; userEmail = user.email ?? undefined; }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Sign in to upgrade' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const origin = (body.origin as string | undefined) ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: 300,
        product_data: {
          name: 'MahJong Pro',
          description: 'Unlock all 8 tile themes forever',
        },
      },
      quantity: 1,
    }],
    success_url: `${origin}/?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/`,
    customer_email: userEmail,
    metadata: { user_id: userId },
  });

  return NextResponse.json({ url: session.url });
}
