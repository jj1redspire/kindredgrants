import Stripe from 'stripe'

// Lazy singleton — avoids instantiation at build time when env vars aren't set
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-03-25.dahlia',
    })
  }
  return _stripe
}

// Keep named export for convenience
export const stripe = {
  get instance() { return getStripe() },
  customers: { create: (...args: Parameters<Stripe['customers']['create']>) => getStripe().customers.create(...args) },
  subscriptions: { retrieve: (...args: Parameters<Stripe['subscriptions']['retrieve']>) => getStripe().subscriptions.retrieve(...args) },
  billingPortal: { sessions: { create: (...args: Parameters<Stripe['billingPortal']['sessions']['create']>) => getStripe().billingPortal.sessions.create(...args) } },
  checkout: { sessions: { create: (...args: Parameters<Stripe['checkout']['sessions']['create']>) => getStripe().checkout.sessions.create(...args) } },
  webhooks: { constructEvent: (...args: Parameters<Stripe['webhooks']['constructEvent']>) => getStripe().webhooks.constructEvent(...args) },
}

export const PRICE_ID = process.env.STRIPE_PRICE_ID || ''

export const PLAN = {
  name: 'KindredGrants Pro',
  price: 4900, // cents
  interval: 'month' as const,
  trialDays: 14,
}
