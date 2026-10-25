import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
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
import { Timeline, type TTimelineItem } from "@/components/console/timeline"
import { usePolling } from "@/hooks/use-polling"
import { useStream, type TStreamChunk } from "@/hooks/use-stream"
import { errorMessage } from "@/lib/utils"
import { ago, DeploymentStatus, duration, isLive, shortSha } from "./shared"
import { AiFixButton } from "./AiFix"

type TDeployment = Awaited<ReturnType<typeof ThunderSDK.projects.deployment>>
type TStep = "pending" | "applying" | "healthy" | "failed" | "running" | "done"

/** A step's state as a Timeline status (dot + pulse while it runs). */
const STEP_STATE: Record<TStep, string> = {
  pending: "new",
  applying: "deploying",
  running: "building",
  healthy: "healthy",
  done: "healthy",
  failed: "failed",
}

/** The build log stays on the server that built it; this streams it while open. */
function BuildLog({
  server,
  deployment,
  onText,
}: {
  server: string
  deployment: string
  onText?: (text: string) => void
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
    setText((current) =>
      (current + chunk.data.replace(ANSI, "")).slice(-500_000)
    )
  }, [])
  const { status, error } = useStream(open, onChunk, 1_000, false)

  React.useEffect(() => {
    if (follow.current && box.current)
      box.current.scrollTop = box.current.scrollHeight
    onText?.(text)
  }, [text, onText])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <pre
        ref={box}
        onScroll={(e) => {
          const el = e.currentTarget
          follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
        }}
        dir="ltr"
        tabIndex={0}
        aria-label={t("Build log")}
        className="min-h-48 flex-1 overflow-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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

/** Terminal colors and cursor codes in build output. */
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]/g

export function DeploymentSheet({
  deployment,
  onOpenChange,
  onChanged,
  onRedeployed,
}: {
  deployment: string | null
  onOpenChange: (open: boolean) => void
  onChanged?: () => void
  /** A fix was applied and a new deployment started. */
  onRedeployed?: (deployment: string) => void
}) {
  const { t } = useTranslation()
  // The build log shown, for "Fix with AI" (the control plane doesn't keep it).
  const logText = React.useRef("")
  const setLogText = React.useCallback((text: string) => {
    logText.current = text
  }, [])
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
  const rolloutLabel = (step?: TStep) =>
    step === "healthy"
      ? t("Serving")
      : step === "applying"
        ? data?.phase === "prepare"
          ? t("Starting unrouted")
          : t("Rolling out")
        : step === "failed"
          ? t("Failed")
          : t("Waiting")
  // Build (where it ran) then rollout, per server.
  const steps: TTimelineItem[] = (data?.servers ?? []).flatMap((s) => [
    ...(s.build
      ? [
          {
            id: `${s._id}:build`,
            state: STEP_STATE[s.build],
            label: (
              <>
                <span className="font-medium">{s.name}</span>{" "}
                <span className="text-muted-foreground">{t("Build")}</span>
              </>
            ),
            time: s.buildMs !== undefined ? duration(s.buildMs) : undefined,
          },
        ]
      : []),
    {
      id: `${s._id}:rollout`,
      state: STEP_STATE[s.rollout ?? "pending"],
      label: (
        <>
          <span className="font-medium">{s.name}</span>{" "}
          <span className="text-muted-foreground">
            {rolloutLabel(s.rollout)}
          </span>
        </>
      ),
    },
  ])

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
            <Skeleton className="h-32 rounded-lg" />
          ) : (
            <>
              {data.errorSummary && data.status !== "cancelled" && (
                <p
                  dir="ltr"
                  className="rounded-lg bg-destructive-soft p-3 font-mono text-xs whitespace-pre-wrap text-destructive-foreground"
                >
                  {data.errorSummary}
                </p>
              )}
              {data.status === "failed" && deployment && (
                <div>
                  <AiFixButton
                    deployment={deployment}
                    log={() => logText.current}
                    onRedeployed={(next) => {
                      onChanged?.()
                      onRedeployed?.(next)
                    }}
                  />
                </div>
              )}

              <div className="rounded-lg border p-3">
                <Timeline items={steps} />
              </div>

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
                    onText={setLogText}
                  />
                </div>
              )}

              {(isLive(data.status) || data.status === "queued") && (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={cancel}>
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
