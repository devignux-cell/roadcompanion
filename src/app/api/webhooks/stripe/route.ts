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

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const stripeSub = event.data.object as Stripe.Subscription
    const userId = stripeSub.metadata['supabase_user_id']
    if (userId) {
      const stripeStatus = stripeSub.status
      const status: SubStatus =
        stripeStatus === 'active' || stripeStatus === 'trialing' || stripeStatus === 'past_due' || stripeStatus === 'canceled'
          ? stripeStatus
          : 'inactive'

      await admin.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id,
        stripe_subscription_id: stripeSub.id,
        plan_code: status === 'active' || status === 'trialing' ? 'plus' : 'free',
        status,
        current_period_end: new Date((stripeSub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000).toISOString(),
        updated_at: now,
      }, { onConflict: 'user_id' })
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
}
