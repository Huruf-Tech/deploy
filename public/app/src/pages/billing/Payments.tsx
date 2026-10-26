import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"
import {
  IconAlertTriangle,
  IconBrandMastercard,
  IconBrandVisa,
  IconCreditCard,
  IconLoader2,
  IconPlus,
  IconShieldCheck,
  IconTrash,
} from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Stat, StatStrip } from "@/components/console/stat"
import { StatusBadge } from "@/components/console/status"
import { DataTable } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { useTheme } from "@/components/theme-provider"
import { useFresh } from "@/hooks/use-fresh"
import { cn, errorMessage } from "@/lib/utils"
import { money } from "@/lib/plans"
import { stripeAppearance, stripeFor } from "./stripe"

type TCards = Awaited<ReturnType<typeof ThunderSDK.payments.cards>>
type TCard = TCards["cards"][number]

const PRESETS = [1_000, 2_000, 5_000, 10_000]

/** Waits for a top-up the webhook settles (3-D Secure, bank processing). */
async function settled(topup: string, timeoutMs = 60_000) {
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

function CardBrand({ brand }: { brand: string }) {
  const Icon =
    brand === "visa"
      ? IconBrandVisa
      : brand === "mastercard"
        ? IconBrandMastercard
        : IconCreditCard
  return <Icon className="size-5 shrink-0" aria-hidden />
}

/** Stripe's card form inside a dialog; saving never charges the card. */
function AddCardForm({
  setupRef,
  onSaved,
  onCancel,
}: {
  setupRef: string
  onSaved: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string>()

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setBusy(true)
    setError(undefined)
    // The bank may ask for 3-D Secure here, inside Stripe's own window.
    const result = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    })
    if (result.error) {
      setError(result.error.message)
      setBusy(false)
      return
    }
    try {
      await ThunderSDK.payments.finishCard({ body: { setupRef } })
      toast.success(t("Card saved"))
      onSaved()
    } catch (err) {
      setError(errorMessage(err) ?? t("Could not save the card"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      {/* Cards only: no Link sign-up or bank tab (PLAN §25.1). */}
      <PaymentElement
        options={{ layout: "tabs", wallets: { link: "never" } }}
      />
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <IconShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t(
          "We won't charge you now. Your card details go straight to Stripe; we only keep its brand, last 4 digits and expiry."
        )}
      </p>
      {error && (
        <p role="alert" className="text-[13px] text-destructive-foreground">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("Cancel")}
        </Button>
        <Button type="submit" disabled={busy || !stripe}>
          {busy && <IconLoader2 className="animate-spin" aria-hidden />}
          {t("Save card")}
        </Button>
      </DialogFooter>
    </form>
  )
}

function AddCardDialog({
  publishableKey,
  open,
  onOpenChange,
  onSaved,
}: {
  publishableKey: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const [setup, setSetup] = React.useState<{
    clientSecret: string
    setupRef: string
  }>()

  React.useEffect(() => {
    if (!open) return setSetup(undefined)
    ThunderSDK.payments
      .setupCard({})
      .then(setSetup)
      .catch((err) => {
        toast.error(errorMessage(err) ?? t("Could not start adding a card"))
        onOpenChange(false)
      })
  }, [open, onOpenChange, t])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Add a card")}</DialogTitle>
          <DialogDescription>
            {t(
              "A card verifies your account. Free stays free: you're only charged if you choose a paid plan or add funds."
            )}
          </DialogDescription>
        </DialogHeader>
        {!setup ? (
          <Skeleton className="h-40 rounded-lg" />
        ) : (
          <Elements
            stripe={stripeFor(publishableKey)}
            options={{
              clientSecret: setup.clientSecret,
              appearance: stripeAppearance(resolvedTheme === "dark"),
            }}
          >
            <AddCardForm
              setupRef={setup.setupRef}
              onSaved={() => {
                onOpenChange(false)
                onSaved()
              }}
              onCancel={() => onOpenChange(false)}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** "Add funds": an exact amount from the default card, 3-D Secure handled here. */
function AddFundsDialog({
  publishableKey,
  open,
  onOpenChange,
  onDone,
}: {
  publishableKey: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [dollars, setDollars] = React.useState("20")
  const [busy, setBusy] = React.useState(false)
  // One per opening: a double click reuses the same charge.
  const nonce = React.useMemo(() => (open ? crypto.randomUUID() : ""), [open])
  const cents = Math.round(Number(dollars) * 100)
  const valid = Number.isFinite(cents) && cents >= 500 && cents <= 100_000

  const pay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setBusy(true)
    try {
      const result = await ThunderSDK.payments.addFunds({
        body: { amount: cents, nonce },
      })
      if (result.status === "pending") {
        if (result.clientSecret) {
          // The bank wants the cardholder: Stripe shows its own window.
          const stripe = await stripeFor(publishableKey)
          const action = await stripe?.handleNextAction({
            clientSecret: result.clientSecret,
          })
          if (action?.error) throw new Error(action.error.message)
        }
        toast.info(t("Confirming the payment with your bank…"))
        const row = await settled(result.topup)
        if (row?.status === "failed")
          throw new Error(row.error ?? t("The payment failed"))
        if (!row) {
          toast.info(
            t(
              "Your bank is still processing it; the funds appear when it confirms."
            )
          )
          onOpenChange(false)
          onDone()
          return
        }
      }
      toast.success(t("{{amount}} added", { amount: money(cents, "usd") }))
      onOpenChange(false)
      onDone()
    } catch (err) {
      toast.error(errorMessage(err) ?? t("The payment failed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={pay} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("Add funds")}</DialogTitle>
            <DialogDescription>
              {t(
                "Charged to your default card now. Plans and other payments come out of this balance."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                size="sm"
                variant={cents === preset ? "default" : "outline"}
                onClick={() => setDollars(String(preset / 100))}
              >
                {money(preset, "usd")}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-funds-amount">{t("Amount (USD)")}</Label>
            <Input
              id="add-funds-amount"
              inputMode="decimal"
              value={dollars}
              onChange={(e) => setDollars(e.target.value)}
              aria-describedby="add-funds-hint"
            />
            <p id="add-funds-hint" className="text-xs text-muted-foreground">
              {t("Between $5 and $1,000.")}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={busy || !valid}>
              {busy && <IconLoader2 className="animate-spin" aria-hidden />}
              {valid
                ? t("Pay {{amount}}", { amount: money(cents, "usd") })
                : t("Pay")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Billing (PLAN §25, Phase 15b): balance, saved cards, Add funds and the
 * wallet's transactions. Replaces core's Wallet page in the sidebar.
 */
export default function Payments() {
  const { t } = useTranslation()
  const configRequest = ThunderSDK.useCaching(
    ["payments", "config"],
    async ({ signal }) => await ThunderSDK.payments.config({ signal })
  )
  const summaryRequest = ThunderSDK.useCaching(
    ["payments", "summary"],
    async ({ signal }) => await ThunderSDK.payments.summary({ signal })
  )
  const { data: config } = use(configRequest)
  const { data: summary } = use(summaryRequest)
  useFresh(configRequest, summaryRequest)

  const isOwner = !!summary?.isOwner
  const cardsRequest = ThunderSDK.useCaching(
    ["payments", "cards", String(isOwner)],
    async ({ signal }) =>
      isOwner ? await ThunderSDK.payments.cards({ signal }) : null
  )
  const statementRequest = ThunderSDK.useCaching(
    ["payments", "statement", String(isOwner)],
    async ({ signal }) =>
      isOwner ? await ThunderSDK.payments.statement({ signal }) : null
  )
  const { data: cards } = use(cardsRequest)
  const { data: statement } = use(statementRequest)

  const [adding, setAdding] = React.useState(false)
  const [funding, setFunding] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)

  const refresh = () => {
    summaryRequest.invalidate()
    cardsRequest.invalidate()
    statementRequest.invalidate()
  }

  const act = async (fn: () => PromiseLike<unknown>, done: string) => {
    try {
      await fn()
      toast.success(done)
      refresh()
    } catch (err) {
      toast.error(errorMessage(err) ?? t("Something went wrong"))
    }
  }

  // A renewal the bank wants confirmed: retry that charge with the owner here.
  const confirmFlagged = async () => {
    if (!config?.publishableKey) return
    setConfirming(true)
    try {
      const { charge } = await ThunderSDK.payments.flaggedCharge({})
      if (!charge) throw new Error(t("Nothing to confirm"))
      const stripe = await stripeFor(config.publishableKey)
      const result = await stripe?.confirmCardPayment(charge.clientSecret, {
        payment_method: charge.cardRef,
      })
      if (result?.error) throw new Error(result.error.message)
      const row = await settled(charge.topup)
      if (row?.status === "failed")
        throw new Error(row.error ?? t("The payment failed"))
      toast.success(t("Payment confirmed"))
      refresh()
    } catch (err) {
      toast.error(errorMessage(err) ?? t("The payment failed"))
    } finally {
      setConfirming(false)
    }
  }

  const ready = config?.configured && config.publishableKey

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Billing")}
        status={
          summary &&
          (summary.hasCard ? (
            <StatusBadge tone="success" label={t("Card on file")} />
          ) : (
            <StatusBadge tone="warning" label={t("No card")} />
          ))
        }
        description={t("Your balance, payment methods and transactions.")}
        actions={
          isOwner &&
          ready && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAdding(true)}
              >
                <IconPlus aria-hidden /> {t("Add card")}
              </Button>
              <Button
                size="sm"
                disabled={!summary?.hasCard}
                onClick={() => setFunding(true)}
              >
                {t("Add funds")}
              </Button>
            </>
          )
        }
      />

      {config && !config.configured && (
        <p
          role="status"
          className="rounded-lg bg-warning-soft px-3 py-2 text-[13px] text-warning-foreground"
        >
          {t("Payments aren't set up on this platform yet.")}
        </p>
      )}

      {summary && !summary.hasCard && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-[10px] border border-info/30 bg-info-soft px-4 py-3 text-[13px] text-info-foreground"
        >
          <IconShieldCheck className="size-5 shrink-0" aria-hidden />
          <p className="min-w-0 flex-1">
            <span className="font-medium">
              {t("Add a card to start using Huruf Deploy.")}
            </span>{" "}
            {isOwner
              ? t(
                  "We won't charge you: a card verifies your account. Free stays free, and you're only charged if you choose a paid plan or add funds."
                )
              : t("Ask the workspace owner to add one.")}
          </p>
          {isOwner && ready && (
            <Button size="sm" onClick={() => setAdding(true)}>
              {t("Add card")}
            </Button>
          )}
        </div>
      )}

      {cards?.actionRequired && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-[10px] border border-warning/40 bg-warning-soft px-4 py-3 text-[13px] text-warning-foreground"
        >
          <IconAlertTriangle className="size-5 shrink-0" aria-hidden />
          <p className="min-w-0 flex-1">
            <span className="font-medium">
              {t("Your bank needs you to confirm a payment.")}
            </span>{" "}
            {cards.actionRequired.message}
          </p>
          <Button size="sm" onClick={confirmFlagged} disabled={confirming}>
            {confirming && <IconLoader2 className="animate-spin" aria-hidden />}
            {t("Confirm payment")}
          </Button>
        </div>
      )}

      <StatStrip className="lg:grid-cols-3">
        <Stat
          label={t("Balance")}
          value={summary ? money(summary.balance, "usd") : "…"}
          hint={t("Plans and other payments come out of it")}
        />
        <Stat
          label={t("Default card")}
          value={(() => {
            const card = cards?.cards.find((c) => c.isDefault)
            return card ? `•••• ${card.last4}` : "—"
          })()}
          hint={(() => {
            const card = cards?.cards.find((c) => c.isDefault)
            return card
              ? `${card.brand.charAt(0).toUpperCase()}${card.brand.slice(1)} · ${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}`
              : undefined
          })()}
        />
        <Stat
          label={t("Pay automatically")}
          value={cards ? (cards.autoPay ? t("On") : t("Off")) : "—"}
          hint={t("When a renewal or payment is short")}
        />
      </StatStrip>

      {!isOwner ? (
        summary && (
          <p className="text-[13px] text-muted-foreground">
            {t("Only the workspace owner manages cards and payments.")}
          </p>
        )
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Panel
            title={t("Payment methods")}
            actions={
              ready && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAdding(true)}
                >
                  <IconPlus aria-hidden /> {t("Add card")}
                </Button>
              )
            }
            bodyClassName="flex flex-col gap-3"
          >
            {!cards ? (
              <Skeleton className="h-20 rounded-lg" />
            ) : !cards.cards.length ? (
              <EmptyState
                icon={IconCreditCard}
                title={t("No cards yet")}
                description={t(
                  "We won't charge a card until you pay for something."
                )}
              />
            ) : (
              <ul className="divide-y rounded-lg border">
                {cards.cards.map((card: TCard) => (
                  <li
                    key={card._id}
                    className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-[13px]"
                  >
                    <CardBrand brand={card.brand} />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium capitalize">
                        {card.brand}
                      </span>{" "}
                      <span className="font-mono">•••• {card.last4}</span>
                      <span className="block text-xs text-muted-foreground tabular-nums">
                        {t("Expires {{date}}", {
                          date: `${String(card.expMonth).padStart(2, "0")}/${card.expYear}`,
                        })}
                      </span>
                    </span>
                    {card.isDefault && (
                      <StatusBadge tone="info" label={t("Default")} />
                    )}
                    {card.expired && (
                      <StatusBadge tone="danger" label={t("Expired")} />
                    )}
                    <div className="flex gap-1">
                      {!card.isDefault && !card.expired && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            act(
                              () =>
                                ThunderSDK.payments.setDefaultCard({
                                  params: { id: card._id },
                                }),
                              t("Default card changed")
                            )
                          }
                        >
                          {t("Make default")}
                        </Button>
                      )}
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={t("Remove card ending {{last4}}", {
                          last4: card.last4,
                        })}
                        onClick={() =>
                          act(
                            () =>
                              ThunderSDK.payments.removeCard({
                                params: { id: card._id },
                              }),
                            t("Card removed")
                          )
                        }
                      >
                        <IconTrash />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {cards && (
              <label className="flex items-start gap-3 rounded-lg border px-3 py-2.5 text-[13px]">
                <Switch
                  checked={cards.autoPay}
                  onCheckedChange={(autoPay) =>
                    act(
                      () =>
                        ThunderSDK.payments.updateAccount({
                          body: { autoPay },
                        }),
                      autoPay
                        ? t("Automatic payments on")
                        : t("Automatic payments off")
                    )
                  }
                />
                <span>
                  <span className="block font-medium">
                    {t("Pay automatically when the balance is short")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t(
                      "Renewals charge your default card for what the balance can't cover. Off: they wait for you to add funds."
                    )}
                  </span>
                </span>
              </label>
            )}
          </Panel>

          <section
            aria-labelledby="transactions-title"
            className="flex min-w-0 flex-col gap-2"
          >
            <h2 id="transactions-title" className="text-sm font-semibold">
              {t("Transactions")}
            </h2>
            <DataTable
              label={t("Transactions")}
              rows={statement?.entries}
              loading={!statement}
              rowId={(e) => e._id}
              limit={10}
              empty={t("No transactions yet.")}
              columns={[
                {
                  id: "date",
                  header: t("Date"),
                  sortValue: (e) =>
                    e.createdAt ? new Date(e.createdAt).getTime() : 0,
                  cell: (e) => (
                    <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                      {e.createdAt
                        ? new Date(e.createdAt).toLocaleString()
                        : "—"}
                    </span>
                  ),
                },
                {
                  id: "description",
                  header: t("Description"),
                  cell: (e) => (
                    <span className="block max-w-72 truncate">
                      {/* thunder-core's wording ("Wallet top-up via stripe") reads as ours. */}
                      {e.purpose === "wallet_topup"
                        ? t("Funds added by card")
                        : (e.description ?? e.purpose ?? "—")}
                    </span>
                  ),
                },
                {
                  id: "reference",
                  header: t("Reference"),
                  className: "max-md:hidden",
                  cell: (e) => (
                    <span
                      dir="ltr"
                      className="font-mono text-xs text-muted-foreground"
                    >
                      {e.reference}
                    </span>
                  ),
                },
                {
                  id: "amount",
                  header: t("Amount"),
                  align: "end",
                  sortValue: (e) =>
                    e.type === "credit" ? e.amount : -e.amount,
                  cell: (e) => (
                    <span
                      dir="ltr"
                      className={cn(
                        "font-mono text-xs",
                        e.type === "credit" && "text-success-foreground"
                      )}
                    >
                      {e.type === "credit" ? "+" : "−"}
                      {money(e.amount, "usd")}
                    </span>
                  ),
                },
              ]}
            />
          </section>
        </div>
      )}

      {ready && (
        <>
          <AddCardDialog
            publishableKey={config.publishableKey}
            open={adding}
            onOpenChange={setAdding}
            onSaved={refresh}
          />
          <AddFundsDialog
            publishableKey={config.publishableKey}
            open={funding}
            onOpenChange={setFunding}
            onDone={refresh}
          />
        </>
      )}
    </Page>
  )
}
