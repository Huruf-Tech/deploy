import { loadStripe, type Appearance, type Stripe } from "@stripe/stripe-js"
import { ThunderSDK } from "thunder-sdk"

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

/** Waits for a top-up the webhook settles (3-D Secure, bank processing). */
export async function waitForTopup(topup: string, timeoutMs = 60_000) {
  const until = Date.now() + timeoutMs
  while (Date.now() < until) {
    const row = await ThunderSDK.payments.topupStatus({
      params: { id: topup },
    })
    if (row.status === "completed" || row.status === "failed") return row
    await new Promise((resolve) => setTimeout(resolve, 2_000))
  }
  return null
}

/**
 * A payment the bank wants confirmed (3-D Secure): Stripe shows its own
 * window, then we wait for the webhook to credit the wallet. Throws with the
 * bank's reason when it fails; resolves false while the bank still processes.
 */
export async function confirmPayment(payment: {
  topup: string
  clientSecret?: string
}) {
  if (payment.clientSecret) {
    const { publishableKey } = await ThunderSDK.payments.config({})
    const stripe = await stripeFor(publishableKey)
    const action = await stripe?.handleNextAction({
      clientSecret: payment.clientSecret,
    })
    if (action?.error) throw new Error(action.error.message)
  }
  const row = await waitForTopup(payment.topup)
  if (row?.status === "failed") throw new Error(row.error ?? "The payment failed")
  return !!row
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
