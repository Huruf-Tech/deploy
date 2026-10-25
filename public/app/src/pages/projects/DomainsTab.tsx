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

import { use } from "@/core/hooks/use"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { usePolling } from "@/hooks/use-polling"
import { useFresh } from "@/hooks/use-fresh"
import { errorMessage } from "@/lib/utils"

type TDomain = Awaited<ReturnType<typeof ThunderSDK.domains.list>>[number]

function StatusBadge({ status }: { status: TDomain["status"] }) {
  const { t } = useTranslation()
  const label = {
    pending: t("Waiting for DNS records"),
    checking: t("Checking DNS"),
    issuing: t("Getting a certificate"),
    active: t("Live"),
    failed: t("Needs attention"),
  }[status]
  const busy = status === "checking" || status === "issuing"
  return (
    <Badge
      variant={
        status === "active"
          ? "default"
          : status === "failed"
            ? "destructive"
            : "secondary"
      }
    >
      {busy && <IconLoader2 className="animate-spin" aria-hidden />}
      {label}
    </Badge>
  )
}

function Record({
  type,
  name,
  value,
}: {
  type: string
  name: string
  value: string
}) {
  return (
    <tr className="border-t align-top">
      <td className="py-2 pe-3 font-mono text-xs">{type}</td>
      <td className="py-2 pe-3">
        <span className="flex items-center gap-1 font-mono text-xs break-all">
          {name}
          <CopyButton value={name} />
        </span>
      </td>
      <td className="py-2">
        <span className="flex items-center gap-1 font-mono text-xs break-all">
          {value}
          <CopyButton value={value} />
        </span>
      </td>
    </tr>
  )
}

function DomainCard({
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
  const apex = domain.hostname.split(".").length === 2
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
    <li className="flex flex-col gap-3 rounded-2xl border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <IconWorld className="size-5 text-muted-foreground" aria-hidden />
        <span className="min-w-48 flex-1 font-medium break-all">
          {domain.status === "active" ? (
            <a
              href={`https://${domain.hostname}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              {domain.hostname}
              <IconExternalLink className="size-4" aria-hidden />
            </a>
          ) : (
            domain.hostname
          )}
        </span>
        <StatusBadge status={domain.status} />
        {canCheck && (
          <Button
            size="sm"
            variant={domain.status === "checking" ? "ghost" : "default"}
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
          size="icon-sm"
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
          <IconTrash />
        </Button>
      </div>

      {domain.status === "active" && domain.certificate && (
        <p className="text-sm text-muted-foreground">
          {t("Certificate valid until {{date}}; it renews automatically.", {
            date: new Date(domain.certificate.notAfter).toLocaleDateString(),
          })}
        </p>
      )}

      {domain.status !== "active" && (
        <>
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
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {t(
                  "Create these records at your DNS provider, then click Check now. Checking continues for 30 minutes while they propagate."
                )}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="pe-3 pb-1 text-start font-normal">
                        {t("Type")}
                      </th>
                      <th className="pe-3 pb-1 text-start font-normal">
                        {t("Name")}
                      </th>
                      <th className="pb-1 text-start font-normal">
                        {t("Value")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <Record
                      type={records.ownership.type}
                      name={records.ownership.name}
                      value={records.ownership.value}
                    />
                    {records.cname && !(apex && records.ipv4?.length) ? (
                      <Record
                        type="CNAME"
                        name={domain.hostname}
                        value={records.cname}
                      />
                    ) : (
                      records.ipv4?.map((ip) => (
                        <Record
                          key={ip}
                          type="A"
                          name={domain.hostname}
                          value={ip}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                {t(
                  "If your DNS is on Cloudflare, set the record to DNS only (grey cloud)."
                )}
              </p>
            </div>
          )}
          {(domain.error || domain.checks?.detail) && (
            <p
              className={
                domain.status === "failed"
                  ? "text-sm text-destructive"
                  : "text-sm text-muted-foreground"
              }
            >
              {domain.error ?? domain.checks?.detail}
            </p>
          )}
        </>
      )}
    </li>
  )
}

/** A project's custom domains (PLAN §14). */
export function DomainsTab({ project }: { project: string }) {
  const { t } = useTranslation()
  const [hostname, setHostname] = React.useState("")
  const [adding, setAdding] = React.useState(false)
  const request = ThunderSDK.useCaching(
    ["domains", project],
    async ({ signal }) =>
      await ThunderSDK.domains.list({ signal, query: { project } })
  )
  const { data, isLoading } = use(request)
  useFresh(request)
  const working = data?.some(
    (d) => d.status === "checking" || d.status === "issuing"
  )
  usePolling(() => working && request.invalidate(), 5_000)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      await ThunderSDK.domains.create({ body: { project, hostname } })
      setHostname("")
      request.invalidate()
    } catch (err) {
      toast.error(errorMessage(err) ?? t("Could not add the domain"))
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={add} className="flex flex-wrap gap-2">
        <Input
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          placeholder="app.example.com"
          aria-label={t("Domain")}
          className="max-w-sm min-w-0 flex-1"
          dir="ltr"
        />
        <Button type="submit" disabled={adding || !hostname.trim()}>
          {adding ? (
            <IconLoader2 className="animate-spin" aria-hidden />
          ) : (
            <IconPlus aria-hidden />
          )}
          {t("Add domain")}
        </Button>
      </form>

      {isLoading && !data ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : !data?.length ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconWorld />
            </EmptyMedia>
            <EmptyTitle>{t("No custom domains")}</EmptyTitle>
            <EmptyDescription>
              {t(
                "Add a domain you own: traffic is spread evenly across this project's servers, with HTTPS from Let's Encrypt. No redeploy needed."
              )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((d) => (
            <DomainCard
              key={d._id}
              domain={d}
              onChanged={() => request.invalidate()}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
