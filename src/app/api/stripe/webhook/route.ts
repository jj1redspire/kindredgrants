import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const orgId = session.metadata?.org_id
      const subscriptionId = session.subscription as string
      const customerId = session.customer as string

      if (!orgId) break

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end

      await supabase
        .from('kg_subscriptions')
        .upsert({
          org_id: orgId,
          stripe_customer_id: customerId,
          stripe_sub_id: subscriptionId,
          status: subscription.status,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'org_id' })

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end
      const periodEndIso = periodEnd ? new Date(periodEnd * 1000).toISOString() : null

      // Try to find by stripe_sub_id
      const { data } = await supabase
        .from('kg_subscriptions')
        .select('org_id')
        .eq('stripe_sub_id', subscription.id)
        .single()

      if (data) {
        await supabase.from('kg_subscriptions').update({
          status: subscription.status,
          current_period_end: periodEndIso,
          updated_at: new Date().toISOString(),
        }).eq('stripe_sub_id', subscription.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await supabase.from('kg_subscriptions').update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      }).eq('stripe_sub_id', subscription.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
      const subId = invoice.subscription
      if (subId) {
        await supabase.from('kg_subscriptions').update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('stripe_sub_id', subId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
