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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePolling } from "@/hooks/use-polling"
import { errorMessage } from "@/lib/utils"

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
    <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="p-3 text-start text-xs font-medium text-muted-foreground">
              {t("From ↓ to →")}
            </th>
            {servers.map((s) => (
              <th
                key={s._id}
                scope="col"
                className="p-3 text-center text-xs font-medium"
              >
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {servers.map((from) => (
            <tr key={from._id} className="border-t">
              <th scope="row" className="p-3 text-start text-xs font-medium">
                {from.name}
              </th>
              {servers.map((to) => {
                const state =
                  from._id === to._id ? undefined : cell(from._id, to._id)
                return (
                  <td key={to._id} className="p-3 text-center">
                    {from._id === to._id ? (
                      <span className="text-muted-foreground">·</span>
                    ) : state === true ? (
                      <IconCheck
                        className="mx-auto size-4 text-success"
                        aria-label={t("Reachable")}
                      />
                    ) : state === false ? (
                      <IconX
                        className="mx-auto size-4 text-destructive"
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

  return (
    <Page className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-xl font-semibold">{t("Private network")}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t(
            "Your servers connect over WireGuard, so apps reach each other across servers as <project>.internal. Servers need UDP 51820 open to each other (or to share a network); a server behind NAT still reaches servers it can dial."
          )}
        </p>
      </div>

      {!data ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : !data.servers.length ? (
        <p className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("Servers join the private network once they're set up.")}
        </p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Servers")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Server")}</TableHead>
                      <TableHead>{t("Mesh address")}</TableHead>
                      <TableHead>{t("Containers")}</TableHead>
                      <TableHead>{t("Endpoint")}</TableHead>
                      <TableHead>{t("In the network")}</TableHead>
                      <TableHead>
                        <span className="sr-only">{t("Registry")}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.servers.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell>
                          <div className="font-medium">{s.name}</div>
                          {s.error ? (
                            <div
                              className="max-w-64 truncate text-xs text-destructive"
                              title={s.error}
                            >
                              {s.error}
                            </div>
                          ) : !s.joined ? (
                            <div className="text-xs text-muted-foreground">
                              {t("Waiting for its key")}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.meshIp}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.subnet}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs">
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
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={s.enabled}
                            aria-label={t(
                              "{{name}} is in the private network",
                              { name: s.name }
                            )}
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
                        </TableCell>
                        <TableCell className="text-end">
                          {data.primaryServer === s._id ? (
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
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconNetwork className="size-4" aria-hidden />{" "}
                {t("Who reaches whom")}
              </CardTitle>
              <CardDescription>
                {t(
                  "From recent WireGuard handshakes, updated every 30 seconds or so. Two servers that can't reach each other keep running their apps; only cross-server traffic between them fails."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Matrix network={data} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("Built-in registry")}
              </CardTitle>
              <CardDescription>
                {data.primaryServer
                  ? t(
                      "Projects on several servers build once and push here; the other servers pull over the private network. Without a connected registry, this is used whenever every target server reaches it."
                    )
                  : t(
                      "Pick a server to host it, and projects on several servers build once instead of on every server."
                    )}
              </CardDescription>
            </CardHeader>
            {data.primaryServer && (
              <CardContent>
                <Button
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
              </CardContent>
            )}
          </Card>
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
