import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconCheck,
  IconCircleDashed,
  IconLoader2,
  IconX,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePolling } from "@/hooks/use-polling"
import { useStream, type TStreamChunk } from "@/hooks/use-stream"
import { errorMessage } from "@/lib/utils"
import { ago, DeploymentStatus, duration, isLive, shortSha } from "./shared"

type TDeployment = Awaited<ReturnType<typeof ThunderSDK.projects.deployment>>
type TStep = "pending" | "applying" | "healthy" | "failed" | "running" | "done"

function StepIcon({ state }: { state?: TStep }) {
  if (state === "healthy" || state === "done")
    return <IconCheck className="size-4 text-success" aria-hidden />
  if (state === "failed")
    return <IconX className="size-4 text-destructive" aria-hidden />
  if (state === "applying" || state === "running")
    return (
      <IconLoader2
        className="size-4 text-sky-600 motion-safe:animate-spin"
        aria-hidden
      />
    )
  return (
    <IconCircleDashed className="size-4 text-muted-foreground" aria-hidden />
  )
}

/** The build log stays on the server that built it; this streams it while open. */
function BuildLog({
  server,
  deployment,
}: {
  server: string
  deployment: string
}) {
  const { t } = useTranslation()
  const [text, setText] = React.useState("")
  const box = React.useRef<HTMLPreElement>(null)
  const follow = React.useRef(true)

  const open = React.useCallback(
    () =>
      ThunderSDK.streams
        .openBuild({ body: { server, deployment } })
        .then((r) => r.session),
    [server, deployment]
  )
  const onChunk = React.useCallback((chunk: TStreamChunk) => {
    // eslint-disable-next-line no-control-regex
    setText((current) =>
      (current + chunk.data.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "")).slice(
        -500_000
      )
    )
  }, [])
  const { status, error } = useStream(open, onChunk, 1_000, false)

  React.useEffect(() => {
    if (follow.current && box.current)
      box.current.scrollTop = box.current.scrollHeight
  }, [text])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <pre
        ref={box}
        onScroll={(e) => {
          const el = e.currentTarget
          follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
        }}
        className="min-h-0 flex-1 overflow-auto rounded-2xl bg-muted/50 p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap"
      >
        {text || (status === "error" ? "" : t("Waiting for the build log…"))}
      </pre>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {status === "error" ? (
          error
        ) : status === "done" ? (
          t("End of the log.")
        ) : (
          <>
            <Spinner className="inline size-3" /> {t("Live")}
          </>
        )}
      </p>
    </div>
  )
}

export function DeploymentSheet({
  deployment,
  onOpenChange,
  onChanged,
}: {
  deployment: string | null
  onOpenChange: (open: boolean) => void
  onChanged?: () => void
}) {
  const { t } = useTranslation()
  const [data, setData] = React.useState<TDeployment>()
  const [logServer, setLogServer] = React.useState<string>()

  const load = React.useCallback(() => {
    if (!deployment) return
    ThunderSDK.projects
      .deployment({ params: { deployment } })
      .then((d) => {
        setData(d)
        setLogServer(
          (current) => current ?? d.servers.find((s) => s.build)?._id
        )
      })
      .catch(() => {})
  }, [deployment])

  React.useEffect(() => {
    setData(undefined)
    setLogServer(undefined)
    load()
  }, [load])

  usePolling(() => {
    if (isLive(data?.status) || data?.status === "queued") load()
  }, 2_000)

  const cancel = async () => {
    try {
      await ThunderSDK.projects.cancelDeployment({
        params: { deployment: deployment! },
      })
      toast.success(t("Deployment cancelled"))
      load()
      onChanged?.()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not cancel"))
    }
  }

  const builders = data?.servers.filter((s) => s.build) ?? []

  return (
    <Sheet open={!!deployment} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {data?.releaseNumber
              ? t("Release {{n}}", { n: data.releaseNumber })
              : t("Deployment")}
            {data && <DeploymentStatus status={data.status} />}
          </SheetTitle>
          <SheetDescription>
            {data
              ? [
                  data.trigger === "push"
                    ? t("Pushed")
                    : data.trigger === "rollback"
                      ? t("Rollback")
                      : t("Manual"),
                  data.commit &&
                    `${shortSha(data.commit.sha)} ${data.commit.message ?? ""}`,
                  ago(data.createdAt),
                  data.durationMs !== undefined && duration(data.durationMs),
                  data.noCache && t("without cache"),
                ]
                  .filter(Boolean)
                  .join(" · ")
              : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4">
          {!data ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : (
            <>
              {data.errorSummary && data.status !== "cancelled" && (
                <p className="rounded-2xl bg-destructive/10 p-3 font-mono text-xs whitespace-pre-wrap text-destructive">
                  {data.errorSummary}
                </p>
              )}

              <ol className="flex flex-col gap-1 rounded-2xl border p-2">
                {data.servers.map((s) => (
                  <li
                    key={s._id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl px-2 py-1.5 text-sm"
                  >
                    <span className="min-w-28 flex-1 font-medium">
                      {s.name}
                    </span>
                    {s.build && (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <StepIcon state={s.build} /> {t("Build")}{" "}
                        {s.buildMs !== undefined && duration(s.buildMs)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <StepIcon state={s.rollout} />
                      {s.rollout === "healthy"
                        ? t("Serving")
                        : s.rollout === "applying"
                          ? data.phase === "prepare"
                            ? t("Starting unrouted")
                            : t("Rolling out")
                          : s.rollout === "failed"
                            ? t("Failed")
                            : t("Waiting")}
                    </span>
                  </li>
                ))}
              </ol>

              {builders.length > 0 && logServer && deployment && (
                <div className="flex min-h-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">{t("Build log")}</h3>
                    {builders.length > 1 && (
                      <Tabs
                        value={logServer}
                        onValueChange={(v) => setLogServer(String(v))}
                      >
                        <TabsList>
                          {builders.map((s) => (
                            <TabsTrigger key={s._id} value={s._id}>
                              {s.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    )}
                  </div>
                  <BuildLog
                    key={logServer}
                    server={logServer}
                    deployment={deployment}
                  />
                </div>
              )}

              {(isLive(data.status) || data.status === "queued") && (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={cancel}>
                    {t("Cancel deployment")}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
