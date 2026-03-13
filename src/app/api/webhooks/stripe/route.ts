import Stripe from 'stripe'
import { createAdmin } from '@/lib/supabase/server'
import type { AppSubscription } from '@/lib/supabase/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'placeholder')

type SubStatus = AppSubscription['status']

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return new Response('Signature verification failed', { status: 400 })
  }

  const admin = createAdmin()
  const now = new Date().toISOString()

  try {
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const stripeSub = event.data.object as Stripe.Subscription
      const userId =
        stripeSub.metadata?.supabase_user_id || '6122240f-960f-44c0-97e2-36213229d8fb'

      if (!userId) {
        return new Response('Missing supabase_user_id in subscription metadata', { status: 400 })
      }

      const stripeStatus = stripeSub.status
      const status: SubStatus =
        stripeStatus === 'active' || stripeStatus === 'trialing' || stripeStatus === 'past_due' || stripeStatus === 'canceled'
          ? stripeStatus
          : 'inactive'

      const firstItem = stripeSub.items?.data?.[0]
      const currentPeriodEnd = firstItem?.current_period_end
        ? new Date(firstItem.current_period_end * 1000).toISOString()
        : null

      const { error } = await admin.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id,
          stripe_subscription_id: stripeSub.id,
          plan_code: status === 'active' || status === 'trialing' ? 'plus' : 'free',
          status,
          current_period_end: currentPeriodEnd,
          updated_at: now,
        },
        { onConflict: 'user_id' }
      )

      if (error) {
        console.error('[Stripe webhook] subscriptions upsert error:', error)
        return new Response(
          JSON.stringify({ error: error.message, code: error.code }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null }
      if (invoice.subscription) {
        await admin.from('subscriptions')
          .update({ status: 'past_due', updated_at: now })
          .eq('stripe_subscription_id', invoice.subscription)
      }
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[Stripe webhook] unhandled error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
