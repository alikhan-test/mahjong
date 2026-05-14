import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in to upgrade' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const origin = (body.origin as string | undefined) ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: 300, // $3.00
        product_data: {
          name: 'MahJong Pro',
          description: 'Unlock all 8 tile themes forever',
        },
      },
      quantity: 1,
    }],
    success_url: `${origin}/?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/`,
    customer_email: user.email,
    metadata: { user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
