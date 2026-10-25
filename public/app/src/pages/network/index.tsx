import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconCheck,
  IconMinus,
  IconNetwork,
  IconPencil,
  IconStar,
  IconX,
} from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Page } from "@/components/page"
import { PageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { DataTable, type TColumn } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { StatusBadge, StatusDot } from "@/components/console/status"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { usePolling } from "@/hooks/use-polling"
import { errorMessage } from "@/lib/utils"

// React Flow loads with this panel only (PLAN §15.5 per-route bundles).
const ReachGraph = React.lazy(() => import("./ReachGraph"))

type TNetwork = Awaited<ReturnType<typeof ThunderSDK.networks.get>>
type TMember = TNetwork["servers"][number]

function EndpointDialog({
  server,
  onOpenChange,
  onSaved,
}: {
  server: TMember | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [value, setValue] = React.useState("")

  React.useEffect(() => {
    setValue(server?.endpointOverride ?? "")
  }, [server])

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await ThunderSDK.networks.updateMember({
        params: { id: server!._id },
        body: { endpoint: value.trim() || null },
      })
      toast.success(t("Saved; peers use it on their next update"))
      onSaved()
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save"))
    }
  }

  return (
    <Dialog open={!!server} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={save} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {t("How peers reach {{name}}", { name: server?.name })}
            </DialogTitle>
            <DialogDescription>
              {t(
                "By default its public address, else its private one. Set host:port when another address works better, e.g. a VPC address shared with the other servers."
              )}
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="endpoint">{t("Endpoint")}</FieldLabel>
            <Input
              id="endpoint"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={server?.endpoint ?? "203.0.113.10:51820"}
              className="font-mono"
            />
            <FieldDescription>
              {t("Leave empty to use the detected address.")}
            </FieldDescription>
          </Field>
          <DialogFooter>
            <Button type="submit">{t("Save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Matrix({ network }: { network: TNetwork }) {
  const { t } = useTranslation()
  const servers = network.servers
  const cell = (from: string, to: string) =>
    network.reachability.find((r) => r.from === from && r.to === to)?.reachable

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-[13px]" aria-label={t("Who reaches whom")}>
        <thead>
          <tr>
            <th className="h-9 px-3 text-start text-xs font-medium text-muted-foreground">
              {t("From ↓ to →")}
            </th>
            {servers.map((s) => (
              <th
                key={s._id}
                scope="col"
                className="h-9 px-3 text-center text-xs font-medium"
              >
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {servers.map((from) => (
            <tr key={from._id} className="border-t">
              <th
                scope="row"
                className="h-9 px-3 text-start text-xs font-medium"
              >
                {from.name}
              </th>
              {servers.map((to) => {
                const state =
                  from._id === to._id ? undefined : cell(from._id, to._id)
                return (
                  <td key={to._id} className="h-9 px-3 text-center">
                    {from._id === to._id ? (
                      <span className="text-muted-foreground">·</span>
                    ) : state === true ? (
                      <IconCheck
                        className="mx-auto size-4 text-success-foreground"
                        aria-label={t("Reachable")}
                      />
                    ) : state === false ? (
                      <IconX
                        className="mx-auto size-4 text-destructive-foreground"
                        aria-label={t("Not reachable")}
                      />
                    ) : (
                      <IconMinus
                        className="mx-auto size-4 text-muted-foreground"
                        aria-label={t("Not in the network")}
                      />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Private network (PLAN §8.2–8.4): WireGuard between servers, reachability, built-in registry. */
export default function NetworkPage() {
  const { t } = useTranslation()
  const [editing, setEditing] = React.useState<TMember | null>(null)
  const request = ThunderSDK.useCaching(
    ["networks"],
    async ({ signal }) => await ThunderSDK.networks.get({ signal })
  )
  const { data } = use(request)
  usePolling(() => request.invalidate(), 15_000)

  const act = async (fn: () => PromiseLike<unknown>, failure: string) => {
    try {
      await fn()
      request.invalidate()
    } catch (e) {
      toast.error(errorMessage(e) ?? failure)
    }
  }

  // One line of state: errors or broken links degrade it, joins pending wait.
  const state = !data?.servers.length
    ? undefined
    : data.servers.some((s) => s.error) ||
        data.reachability.some((r) => r.reachable === false)
      ? "degraded"
      : data.servers.some((s) => s.enabled && !s.joined)
        ? "pending"
        : "healthy"

  const columns: TColumn<TMember>[] = [
    {
      id: "server",
      header: t("Server"),
      sortValue: (s) => s.name,
      cell: (s) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-medium">
            <StatusDot
              tone={
                s.error
                  ? "danger"
                  : !s.enabled
                    ? "neutral"
                    : s.joined
                      ? "success"
                      : "warning"
              }
            />
            <span className="truncate">{s.name}</span>
          </div>
          {s.error ? (
            <div
              className="max-w-64 truncate text-xs text-destructive-foreground"
              title={s.error}
            >
              {s.error}
            </div>
          ) : !s.joined ? (
            <div className="text-xs text-muted-foreground">
              {t("Waiting for its key")}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      id: "mesh",
      header: t("Mesh address"),
      sortValue: (s) => s.meshIp,
      cell: (s) => (
        <span dir="ltr" className="font-mono text-xs">
          {s.meshIp}
        </span>
      ),
    },
    {
      id: "subnet",
      header: t("Containers"),
      className: "hidden md:table-cell",
      cell: (s) => (
        <span dir="ltr" className="font-mono text-xs">
          {s.subnet}
        </span>
      ),
    },
    {
      id: "endpoint",
      header: t("Endpoint"),
      cell: (s) => (
        <div className="flex items-center gap-1">
          <span dir="ltr" className="font-mono text-xs">
            {s.endpoint ?? t("unknown")}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("Change the endpoint of {{name}}", {
              name: s.name,
            })}
            onClick={() => setEditing(s)}
          >
            <IconPencil />
          </Button>
        </div>
      ),
    },
    {
      id: "enabled",
      header: t("In the network"),
      cell: (s) => (
        <Switch
          checked={s.enabled}
          aria-label={t("{{name}} is in the private network", {
            name: s.name,
          })}
          onCheckedChange={(enabled) =>
            act(
              () =>
                ThunderSDK.networks.updateMember({
                  params: { id: s._id },
                  body: { enabled },
                }),
              t("Could not change it")
            )
          }
        />
      ),
    },
    {
      id: "registry",
      header: <span className="sr-only">{t("Registry")}</span>,
      align: "end",
      cell: (s) =>
        data?.primaryServer === s._id ? (
          <Badge variant="secondary" className="gap-1">
            <IconStar aria-hidden /> {t("Registry")}
          </Badge>
        ) : (
          s.enabled &&
          s.joined && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                act(
                  () =>
                    ThunderSDK.networks.setPrimary({
                      body: { server: s._id },
                    }),
                  t("Could not change the primary server")
                )
              }
            >
              {t("Host the registry")}
            </Button>
          )
        ),
    },
  ]

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Private network")}
        status={state && <StatusBadge state={state} />}
        description={t(
          "Your servers connect over WireGuard, so apps reach each other across servers as <project>.internal. Servers need UDP 51820 open to each other (or to share a network); a server behind NAT still reaches servers it can dial."
        )}
      />

      {!data ? (
        <Skeleton className="h-48 rounded-[10px]" />
      ) : !data.servers.length ? (
        <EmptyState
          icon={IconNetwork}
          title={t("Servers join the private network once they're set up.")}
        />
      ) : (
        <>
          <section
            aria-labelledby="network-servers"
            className="flex flex-col gap-2"
          >
            <h2 id="network-servers" className="text-sm font-semibold">
              {t("Servers")}
            </h2>
            <DataTable
              label={t("Servers")}
              columns={columns}
              rows={data.servers}
              rowId={(s) => s._id}
            />
          </section>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Panel
              title={
                <span className="flex items-center gap-2">
                  <IconNetwork className="size-4" aria-hidden />
                  {t("Who reaches whom")}
                </span>
              }
              bodyClassName="flex flex-col gap-3"
            >
              <p className="text-xs text-muted-foreground">
                {t(
                  "From recent WireGuard handshakes, updated every 30 seconds or so. Two servers that can't reach each other keep running their apps; only cross-server traffic between them fails."
                )}
              </p>
              <React.Suspense
                fallback={<Skeleton className="h-80 rounded-lg" />}
              >
                <ReachGraph network={data} />
              </React.Suspense>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <span aria-hidden className="h-0.5 w-5 bg-success" />
                  {t("Reachable both ways")}
                </li>
                <li className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-0 w-5 border-t-2 border-dashed border-destructive"
                  />
                  {t("One way")}
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden className="h-0.5 w-5 bg-destructive" />
                  {t("No link")}
                </li>
                <li className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-0 w-5 border-t-2 border-dotted border-muted-foreground"
                  />
                  {t("Not in the network")}
                </li>
              </ul>
              {/* The graph is visual; screen readers get the same as a table. */}
              <div className="sr-only">
                <Matrix network={data} />
              </div>
            </Panel>

            <Panel
              title={t("Built-in registry")}
              actions={
                data.primaryServer ? <StatusBadge state="active" /> : undefined
              }
              bodyClassName="flex flex-col gap-3"
            >
              <p className="text-[13px] text-muted-foreground">
                {data.primaryServer
                  ? t(
                      "Projects on several servers build once and push here; the other servers pull over the private network. Without a connected registry, this is used whenever every target server reaches it."
                    )
                  : t(
                      "Pick a server to host it, and projects on several servers build once instead of on every server."
                    )}
              </p>
              {data.primaryServer && (
                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      act(
                        () =>
                          ThunderSDK.networks.setPrimary({
                            body: { server: null },
                          }),
                        t("Could not remove it")
                      )
                    }
                  >
                    {t("Stop the built-in registry")}
                  </Button>
                </div>
              )}
            </Panel>
          </div>
        </>
      )}

      <EndpointDialog
        server={editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onSaved={() => request.invalidate()}
      />
    </Page>
  )
}
