import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
  typescript: true,
})

export const PLAN_PRICES = {
  PRO: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
  SPONSOR_299: process.env.STRIPE_PRICE_SPONSOR_299!,
  SPONSOR_599: process.env.STRIPE_PRICE_SPONSOR_599!,
  SPONSOR_1499: process.env.STRIPE_PRICE_SPONSOR_1499!,
} as const

export type PlanKey = keyof typeof PLAN_PRICES

export async function createOrRetrieveCustomer(
  email: string,
  name: string,
  metadata: Record<string, string> = {}
) {
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) return existing.data[0]

  return stripe.customers.create({ email, name, metadata })
}

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
  mode = 'subscription',
}: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
  mode?: 'subscription' | 'payment'
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    currency: 'inr',
    locale: 'en',
  })
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
