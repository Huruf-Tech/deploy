import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"
import { IconAlertTriangle } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { day } from "@/lib/format"
import { money } from "@/lib/plans"
import { errorMessage } from "@/lib/utils"
import { confirmPayment } from "@/pages/billing/stripe"
import { useIsOwner, useRentals } from "./rental"

type TRental = NonNullable<ReturnType<typeof useRentals>["rentals"]>[number]

/** Why a renewal couldn't be paid, in the customer's words. */
function reasonOf(
  t: (key: string) => string,
  lastError?: string | null
): string {
  if (!lastError) return t("the payment didn't go through")
  if (lastError === "Waiting for the payment to be confirmed")
    return t("your bank wants you to confirm the payment")
  if (/insufficient|balance/i.test(lastError))
    return t("your wallet is short and your card couldn't be charged")
  return lastError
}

/** Pays a rental's renewal now, with 3-D Secure in the browser when asked. */
function usePayRental(onPaid: () => void) {
  const { t } = useTranslation()
  const [paying, setPaying] = React.useState<string>()
  const pay = async (id: string) => {
    setPaying(id)
    try {
      let result = await ThunderSDK.rentals.pay({ params: { id } })
      if (result.result === "pending" && result.topup) {
        toast.info(t("Confirming the payment with your bank…"))
        await confirmPayment({
          topup: result.topup,
          clientSecret: result.clientSecret,
        })
        // The card's charge has landed in the wallet: renew with it.
        result = await ThunderSDK.rentals.pay({ params: { id } })
      }
      if (result.result === "active") {
        toast.success(t("Paid: it's renewed for another month"))
      }
      onPaid()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("The payment didn't go through"))
    } finally {
      setPaying(undefined)
    }
  }
  return { pay, paying }
}

/**
 * A rental whose renewal couldn't be paid (PLAN §26.9): why, what's due,
 * when it stops or is deleted, and Pay now. `name` shows which, in lists.
 */
export function RentalDue({
  rental,
  name,
  onPaid,
}: {
  rental: TRental
  name?: string
  onPaid: () => void
}) {
  const { t } = useTranslation()
  const isOwner = useIsOwner()
  const { pay, paying } = usePayRental(onPaid)
  if (rental.amountDue === undefined) return null
  const suspended = rental.status === "suspended"
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-[13px]"
    >
      <IconAlertTriangle
        className="size-4 shrink-0 text-destructive"
        aria-hidden
      />
      <div className="min-w-0 flex-[1_1_16rem]">
        <p className="font-medium">
          {name
            ? t("{{name}} couldn't renew: {{reason}}", {
                name,
                reason: reasonOf(t, rental.lastError),
              })
            : t("Its renewal couldn't be paid: {{reason}}", {
                reason: reasonOf(t, rental.lastError),
              })}
        </p>
        <p className="text-xs text-muted-foreground">
          {suspended
            ? t(
                "{{amount}} is due. It's stopped; pay and it starts again. Unpaid, it's deleted with its data on {{date}}.",
                {
                  amount: money(rental.amountDue, "usd"),
                  date: day(rental.deletedAt),
                }
              )
            : t(
                "{{amount}} is due. We try again every hour; unpaid, it stops on {{date}}.",
                {
                  amount: money(rental.amountDue, "usd"),
                  date: day(rental.stopsAt),
                }
              )}
        </p>
      </div>
      {isOwner && (
        <Button size="sm" disabled={!!paying} onClick={() => pay(rental._id)}>
          {t("Pay now")}
        </Button>
      )}
    </div>
  )
}

/** Every rental of the workspace waiting for payment: Billing and Overview. */
export function RentalsDue() {
  const { rentals, reload } = useRentals()
  const due = (rentals ?? []).filter((r) => r.amountDue !== undefined)
  if (!due.length) return null
  return (
    <div className="flex flex-col gap-2">
      {due.map((r) => (
        <RentalDue
          key={r._id}
          rental={r}
          name={r.plan?.name ?? r.machine?.name}
          onPaid={reload}
        />
      ))}
    </div>
  )
}
