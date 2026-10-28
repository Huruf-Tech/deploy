import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"
import { IconCoin } from "@tabler/icons-react"

import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Stat, StatStrip } from "@/components/console/stat"
import { DataTable } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { StatusBadge } from "@/components/console/status"
import { useCached } from "@/hooks/use-cached"
import { dateTime, day, toCents, toDollars } from "@/lib/format"
import { money } from "@/lib/plans"
import { queries } from "@/lib/queries"
import { errorMessage } from "@/lib/utils"
import { useIsOwner } from "@/pages/rentals/rental"

type TEntry = Awaited<
  ReturnType<typeof ThunderSDK.earnings.summary>
>["entries"][number]

const TYPES: Record<string, string> = {
  month: "A month matured",
  release: "Security paid out",
  forfeit: "Security to renters",
  claim: "Claimed to the wallet",
  revert: "Taken back from the wallet",
  dispute: "Paid for a dispute",
}

/**
 * What the workspace's machines earned (PLAN §30.7): balances, the ledger,
 * claiming into the wallet (spendable, never cashed out) and taking a claim
 * back.
 */
export default function Earnings() {
  const { t } = useTranslation()
  const { data, reload } = useCached(queries.earnings())
  const isOwner = useIsOwner()
  const [amount, setAmount] = React.useState("")
  const [claiming, setClaiming] = React.useState(false)
  const [reverting, setReverting] = React.useState<TEntry>()
  const cents = toCents(amount)
  const usd = (n: number) => money(n, "usd")

  const claim = async () => {
    try {
      await ThunderSDK.earnings.claim({ body: { amount: cents } })
      toast.success(t("{{amount}} is in your wallet", { amount: usd(cents) }))
      setClaiming(false)
      setAmount("")
      reload()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not claim it"))
    }
  }
  const revert = async () => {
    if (!reverting) return
    try {
      const r = await ThunderSDK.earnings.revert({
        params: { id: reverting._id },
      })
      toast.success(
        r.result === "reverted"
          ? t("{{amount}} is back in your earnings", { amount: usd(r.amount) })
          : t(
              "Your wallet moved since: an admin reviews it, up to {{amount}}",
              { amount: usd(r.amount) }
            )
      )
      setReverting(undefined)
      reload()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not take it back"))
    }
  }

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Earnings")}
        description={t(
          "What your machines earn from renters, minus Huruf's commission. Each month is claimable 14 days after it ends."
        )}
      />
      <StatStrip>
        <Stat
          label={t("Available")}
          value={data ? usd(data.available) : "—"}
          hint={t("Claimable now")}
        />
        <Stat
          label={t("Held")}
          value={data ? usd(data.held) : "—"}
          hint={t("14 days after each month")}
        />
        <Stat
          label={t("Frozen")}
          value={data ? usd(data.frozen) : "—"}
          hint={t("By an open dispute")}
        />
        <Stat
          label={t("This month")}
          value={data ? usd(data.pending) : "—"}
          hint={t("Expected from running rentals")}
        />
      </StatStrip>

      {isOwner && data && (
        <Panel
          title={t("Claim to the wallet")}
          bodyClassName="flex flex-wrap items-end gap-3 py-3"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="claim-amount">{t("Amount ($)")}</Label>
            <Input
              id="claim-amount"
              type="number"
              dir="ltr"
              min={0.01}
              max={toDollars(data.available)}
              step="0.01"
              className="w-40"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAmount(String(toDollars(data.available)))}
          >
            {t("All of it")}
          </Button>
          <Button
            size="sm"
            disabled={!(cents > 0 && cents <= data.available)}
            onClick={() => setClaiming(true)}
          >
            {t("Claim")}
          </Button>
          <p className="basis-full text-xs text-muted-foreground">
            {t(
              "Money in the wallet can be spent on Huruf but never cashed out. Cash payouts come later, straight from your earnings."
            )}
          </p>
        </Panel>
      )}

      {!!data?.security.length && (
        <Panel title={t("Security per machine")} bodyClassName="py-1">
          <ul className="divide-y text-[13px]">
            {data.security.map((s) => (
              <li key={s.machine} className="flex justify-between gap-3 py-2">
                <span>{s.name ?? s.machine}</span>
                <span className="tabular-nums">{usd(s.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="pb-2 text-xs text-muted-foreground">
            {t(
              "Kept while the machine is rented out, paid out 14 days after it leaves properly."
            )}
          </p>
        </Panel>
      )}

      {data && !data.entries.length ? (
        <EmptyState
          icon={IconCoin}
          title={t("Nothing earned yet.")}
          description={t(
            "Put a machine up for rent on its page; each month a renter pays shows here once it ends."
          )}
        />
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            label={t("Earnings")}
            rows={data?.entries}
            loading={!data}
            rowId={(e) => e._id}
            limit={50}
            columns={[
              {
                id: "when",
                header: t("When"),
                sortValue: (e) => new Date(e.createdAt).getTime(),
                className: "whitespace-nowrap text-xs tabular-nums",
                cell: (e) => dateTime(e.createdAt),
              },
              {
                id: "what",
                header: t("What"),
                cell: (e) => (
                  <div className="min-w-0">
                    <div>{t(TYPES[e.type] ?? e.type)}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.bucket === "security"
                        ? t("Security")
                        : new Date(e.availableAt).getTime() > Date.now()
                          ? t("Claimable on {{date}}", {
                              date: day(e.availableAt),
                            })
                          : t("Earnings")}
                    </div>
                  </div>
                ),
              },
              {
                id: "amount",
                header: t("Amount"),
                align: "end",
                className: "whitespace-nowrap tabular-nums",
                cell: (e) => <span dir="ltr">{usd(e.amount)}</span>,
              },
              {
                id: "actions",
                header: <span className="sr-only">{t("Actions")}</span>,
                align: "end",
                cell: (e) =>
                  e.type !== "claim" ? null : e.revert ? (
                    <StatusBadge
                      tone={
                        e.revert === "done"
                          ? "neutral"
                          : e.revert === "pending"
                            ? "info"
                            : "danger"
                      }
                      label={
                        e.revert === "done"
                          ? t("Taken back")
                          : e.revert === "pending"
                            ? t("An admin reviews it")
                            : t("Refused")
                      }
                    />
                  ) : (
                    isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7"
                        onClick={() => setReverting(e)}
                      >
                        {t("Take back to earnings")}
                      </Button>
                    )
                  ),
              },
            ]}
          />
        </div>
      )}

      <ConfirmDialog
        open={claiming}
        onOpenChange={setClaiming}
        title={t("Claim {{amount}} to the wallet?", {
          amount: usd(cents || 0),
        })}
        description={t(
          "Money in the wallet can be spent on Huruf but never cashed out. If you change your mind, you can take it back while the wallet hasn't moved; after that an admin decides."
        )}
        confirmLabel={t("Claim")}
        onConfirm={claim}
      />
      <ConfirmDialog
        open={!!reverting}
        onOpenChange={(o) => !o && setReverting(undefined)}
        title={t("Take this claim back to earnings?")}
        description={t(
          "If nothing came in or went out of the wallet since, it's back at once. Otherwise an admin reviews it, up to what wasn't spent."
        )}
        confirmLabel={t("Take back")}
        onConfirm={revert}
      />
    </Page>
  )
}
