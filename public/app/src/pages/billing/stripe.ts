import { loadStripe, type Appearance, type Stripe } from "@stripe/stripe-js"

/**
 * Stripe.js, loaded once per publishable key (PLAN §25.3). Card details go
 * from Stripe's own iframe straight to Stripe; we only ever see its ids.
 */
const loaded = new Map<string, Promise<Stripe | null>>()

export function stripeFor(publishableKey: string) {
  let stripe = loaded.get(publishableKey)
  if (!stripe) {
    stripe = loadStripe(publishableKey)
    loaded.set(publishableKey, stripe)
  }
  return stripe
}

/** The card form in Huruf's theme (DESIGN §3): orange accent, Geist, our radius. */
export function stripeAppearance(dark: boolean): Appearance {
  return {
    theme: dark ? "night" : "stripe",
    variables: {
      colorPrimary: "#ff6900",
      fontFamily: '"Geist Variable", system-ui, sans-serif',
      borderRadius: "8px",
      fontSizeBase: "14px",
    },
  }
}
