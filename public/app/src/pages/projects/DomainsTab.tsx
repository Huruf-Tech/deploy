import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconExternalLink,
  IconLoader2,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconWorld,
} from "@tabler/icons-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CodeBlock } from "@/components/console/code-block"
import { DataTable, type TColumn } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { Panel } from "@/components/console/panel"
import { StatusBadge } from "@/components/console/status"
import { usePolling } from "@/hooks/use-polling"
import { cn, errorMessage } from "@/lib/utils"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"
import { day } from "@/lib/format"

type TDomain = Awaited<ReturnType<typeof ThunderSDK.domains.list>>[number]

/** Domain states on the shared status tokens (checks and issuing pulse). */
const STATE: Record<TDomain["status"], string> = {
  pending: "pending",
  checking: "deploying",
  issuing: "deploying",
  active: "healthy",
  failed: "failed",
}

function DomainStatus({ status }: { status: TDomain["status"] }) {
  const { t } = useTranslation()
  const label = {
    pending: t("Waiting for DNS records"),
    checking: t("Checking DNS"),
    issuing: t("Getting a certificate"),
    active: t("Live"),
    failed: t("Needs attention"),
  }[status]
  return <StatusBadge state={STATE[status]} label={label} />
}

/** Check now and remove, with their own busy state. */
function DomainActions({
  domain,
  onChanged,
}: {
  domain: TDomain
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = React.useState<"check" | "remove" | null>(null)
  const { records } = domain
  const configured = !!records.cname || !!records.ipv4?.length
  const canCheck = ["pending", "failed", "checking"].includes(domain.status)

  const run = async (
    kind: "check" | "remove",
    fn: () => PromiseLike<unknown>,
    failure: string
  ) => {
    setBusy(kind)
    try {
      await fn()
      onChanged()
    } catch (e) {
      toast.error(errorMessage(e) ?? failure)
    } finally {
      setBusy(null)
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      {canCheck && (
        <Button
          size="xs"
          variant={domain.status === "checking" ? "ghost" : "outline"}
          disabled={!!busy || !configured}
          onClick={() =>
            run(
              "check",
              () => ThunderSDK.domains.check({ params: { id: domain._id } }),
              t("Could not start the check")
            )
          }
        >
          {busy === "check" ? (
            <IconLoader2 className="animate-spin" aria-hidden />
          ) : (
            <IconRefresh aria-hidden />
          )}
          {t("Check now")}
        </Button>
      )}
      <Button
        size="icon-xs"
        variant="ghost"
        disabled={!!busy}
        aria-label={t("Remove {{name}}", { name: domain.hostname })}
        onClick={() =>
          run(
            "remove",
            () => ThunderSDK.domains.del({ params: { id: domain._id } }),
            t("Could not remove it")
          )
        }
      >
        {busy === "remove" ? (
          <IconLoader2 className="animate-spin" aria-hidden />
        ) : (
          <IconTrash />
        )}
      </Button>
    </span>
  )
}

/** The DNS records a domain that isn't live yet still needs. */
function DomainSetup({ domain }: { domain: TDomain }) {
  const { t } = useTranslation()
  const { records } = domain
  const configured = !!records.cname || !!records.ipv4?.length
  const apex = domain.hostname.split(".").length === 2
  const rows = [
    records.ownership,
    ...(records.cname && !(apex && records.ipv4?.length)
      ? [{ type: "CNAME", name: domain.hostname, value: records.cname }]
      : (records.ipv4 ?? []).map((ip) => ({
          type: "A",
          name: domain.hostname,
          value: ip,
        }))),
  ]

  return (
    <Panel
      title={
        <span dir="ltr" className="font-mono text-[13px]">
          {domain.hostname}
        </span>
      }
      actions={<DomainStatus status={domain.status} />}
      bodyClassName="flex flex-col gap-3"
    >
      {!configured ? (
        <Alert variant="destructive">
          <IconAlertTriangle />
          <AlertTitle>{t("Custom domains aren't set up yet")}</AlertTitle>
          <AlertDescription>
            {t(
              "The platform admin needs to set INGRESS_HOSTNAME or INGRESS_IPV4 first."
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <p className="text-[13px] text-muted-foreground">
            {t(
              "Create these records at your DNS provider, then click Check now. Checking continues for 30 minutes while they propagate."
            )}
          </p>
          <div
            role="table"
            aria-label={t("DNS records for {{name}}", {
              name: domain.hostname,
            })}
            className="flex flex-col gap-2"
          >
            <div
              role="row"
              className="grid grid-cols-[3.5rem_1fr_1fr] gap-2 text-xs text-muted-foreground max-sm:hidden"
            >
              <span role="columnheader">{t("Type")}</span>
              <span role="columnheader">{t("Name")}</span>
              <span role="columnheader">{t("Value")}</span>
            </div>
            {rows.map((r) => (
              <div
                key={`${r.type}:${r.value}`}
                role="row"
                className="grid items-start gap-2 sm:grid-cols-[3.5rem_1fr_1fr]"
              >
                <span
                  role="cell"
                  className="pt-2 font-mono text-xs font-medium"
                >
                  {r.type}
                </span>
                <div role="cell" className="min-w-0">
                  <CodeBlock code={r.name} wrap className="[&_pre]:py-2" />
                </div>
                <div role="cell" className="min-w-0">
                  <CodeBlock code={r.value} wrap className="[&_pre]:py-2" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              "If your DNS is on Cloudflare, set the record to DNS only (grey cloud)."
            )}
          </p>
        </>
      )}
      {(domain.error || domain.checks?.detail) && (
        <p
          aria-live="polite"
          className={cn(
            "text-[13px]",
            domain.status === "failed"
              ? "text-destructive-foreground"
              : "text-muted-foreground"
          )}
        >
          {domain.error ?? domain.checks?.detail}
        </p>
      )}
    </Panel>
  )
}

/** A project's custom domains (PLAN §14). */
export function DomainsTab({ project }: { project: string }) {
  const { t } = useTranslation()
  const [hostname, setHostname] = React.useState("")
  const [adding, setAdding] = React.useState(false)
  const { data, isLoading, reload } = useCached(queries.domains(project))
  const working = data?.some(
    (d) => d.status === "checking" || d.status === "issuing"
  )
  usePolling(() => working && reload(), 5_000)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      await ThunderSDK.domains.create({ body: { project, hostname } })
      setHostname("")
      reload()
    } catch (err) {
      toast.error(errorMessage(err) ?? t("Could not add the domain"))
    } finally {
      setAdding(false)
    }
  }

  const onChanged = reload
  const columns: TColumn<TDomain>[] = [
    {
      id: "hostname",
      header: t("Domain"),
      sortValue: (d) => d.hostname,
      cell: (d) =>
        d.status === "active" ? (
          <a
            href={`https://${d.hostname}`}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="inline-flex items-center gap-1 font-mono text-xs break-all text-brand-text hover:underline"
          >
            {d.hostname}
            <IconExternalLink className="size-3" aria-hidden />
          </a>
        ) : (
          <span dir="ltr" className="font-mono text-xs break-all">
            {d.hostname}
          </span>
        ),
    },
    {
      id: "status",
      header: t("Status"),
      sortValue: (d) => d.status,
      cell: (d) => <DomainStatus status={d.status} />,
    },
    {
      id: "certificate",
      header: t("Certificate"),
      className: "max-md:hidden",
      cell: (d) =>
        d.status === "active" && d.certificate ? (
          <span className="text-xs text-muted-foreground">
            {t("Certificate valid until {{date}}; it renews automatically.", {
              date: day(d.certificate.notAfter),
            })}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("Actions")}</span>,
      align: "end",
      cell: (d) => <DomainActions domain={d} onChanged={onChanged} />,
    },
  ]
  const pending = (data ?? []).filter((d) => d.status !== "active")

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={add} className="flex flex-wrap gap-2">
        <Input
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          placeholder="app.example.com"
          aria-label={t("Domain")}
          className="h-8 max-w-sm min-w-0 flex-1 font-mono text-[13px]"
          dir="ltr"
        />
        <Button size="sm" type="submit" disabled={adding || !hostname.trim()}>
          {adding ? (
            <IconLoader2 className="animate-spin" aria-hidden />
          ) : (
            <IconPlus aria-hidden />
          )}
          {t("Add domain")}
        </Button>
      </form>

      {!isLoading && !data?.length ? (
        <EmptyState
          icon={IconWorld}
          title={t("No custom domains")}
          description={t(
            "Add a domain you own: traffic is spread evenly across this project's servers, with HTTPS from Let's Encrypt. No redeploy needed."
          )}
        />
      ) : (
        <div aria-live="polite" className="flex flex-col gap-4">
          <DataTable
            label={t("Domains")}
            columns={columns}
            rows={data}
            rowId={(d) => d._id}
            loading={isLoading}
          />
          {pending.map((d) => (
            <DomainSetup key={d._id} domain={d} />
          ))}
        </div>
      )}
    </div>
  )
}
