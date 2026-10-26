/**
 * Plan display helpers, shared by Plan & usage and the admin plan cards.
 * Keep UNLIMITED in step with `UNLIMITED` in schemas/billing/plan.ts.
 */
export const UNLIMITED = 1_000_000

/** A price in minor units, without ".00" for whole amounts ($0, $15, $9.50). */
export const money = (cents: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100)

export const isUnlimited = (limit: number) => limit >= UNLIMITED
