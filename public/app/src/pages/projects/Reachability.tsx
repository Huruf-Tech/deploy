import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Panel } from "@/components/console/panel"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"
import { ago } from "@/lib/format"
import type { THop, TReach } from "./reach"

const ReachMap = React.lazy(() => import("./ReachMap"))

/** Every hop with its name, where it sits on the way in, in order. */
function hopsOf(reach: TReach, t: (key: string) => string) {
  const list: { where: string; what: string; hop: THop }[] = []
  list.push({
    where: t("Traefik · control plane"),
    what: t("Polls its routes"),
    hop: reach.ingress.traefik,
  })
  for (const d of reach.domains) {
    list.push(
      { where: d.hostname, what: t("DNS"), hop: d.dns },
      { where: d.hostname, what: t("Certificate"), hop: d.certificate },
      { where: d.hostname, what: t("Traefik route"), hop: d.route },
      { where: d.hostname, what: t("Over the internet"), hop: d.https }
    )
  }
  for (const s of reach.servers) {
    list.push(
      { where: s.name, what: t("Traefik sends visitors here"), hop: s.route },
      { where: s.name, what: t("Tunnel"), hop: s.tunnel },
      { where: s.name, what: t("Edge proxy (Caddy)"), hop: s.edge },
      { where: s.name, what: t("App"), hop: s.app },
      ...(s.publicPort
        ? [{ where: s.name, what: t("Public port"), hop: s.publicPort }]
        : [])
    )
  }
  return list
}

/**
 * How visitors reach the project (PLAN §14): the map of every way in, and
 * what stops each one, checked live from the control plane.
 */
export function Reachability({ project }: { project: string }) {
  const { t } = useTranslation()
  const { data, isLoading, reload } = useCached(queries.reach(project))
  const [checking, setChecking] = React.useState(false)
  const again = async () => {
    setChecking(true)
    try {
      await reload()
    } finally {
      setChecking(false)
    }
  }

  const hops = data ? hopsOf(data, t) : []
  const problems = hops.filter(
    (h) => h.hop.state === "failed" || h.hop.state === "warning"
  )
  const nothing = data && !data.domains.length && !data.publicPort

  return (
    <Panel
      title={t("Reachability")}
      description={
        data
          ? t("Checked from the control plane {{ago}}", {
              ago: ago(data.checkedAt),
            })
          : undefined
      }
      actions={
        <Button
          size="xs"
          variant="ghost"
          onClick={again}
          disabled={checking || isLoading}
        >
          {checking ? (
            <IconLoader2 className="animate-spin" aria-hidden />
          ) : (
            <IconRefresh aria-hidden />
          )}
          {t("Check again")}
        </Button>
      }
      bodyClassName="flex flex-col gap-3"
    >
      {!data ? (
        <Skeleton className="h-56 rounded-lg" />
      ) : nothing ? (
        <p className="text-[13px] text-muted-foreground">
          {t(
            "Not public: add a domain, or a public port in Settings, to reach it from the internet."
          )}
        </p>
      ) : (
        <>
          <React.Suspense fallback={<Skeleton className="h-56 rounded-lg" />}>
            <ReachMap reach={data} />
          </React.Suspense>
          {problems.length ? (
            <ul className="flex flex-col gap-2 text-[13px]">
              {problems.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <IconAlertTriangle
                    className={
                      p.hop.state === "failed"
                        ? "mt-0.5 size-4 shrink-0 text-destructive"
                        : "mt-0.5 size-4 shrink-0 text-warning-foreground"
                    }
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="font-medium">
                      <span dir="ltr">{p.where}</span> · {p.what}
                    </span>
                    {p.hop.detail && (
                      <span className="text-muted-foreground">
                        {" "}
                        — {p.hop.detail}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <IconCircleCheck
                className="size-4 shrink-0 text-success"
                aria-hidden
              />
              {t("Every way in works.")}
            </p>
          )}
          {/* The map, for screen readers. */}
          <ul className="sr-only">
            {hops.map((h, i) => (
              <li key={i}>
                {h.where}, {h.what}:{" "}
                {
                  {
                    ok: t("works"),
                    warning: t("works, with a warning"),
                    failed: t("doesn't work"),
                    skipped: t("not checked: an earlier hop stops it"),
                  }[h.hop.state]
                }
                {h.hop.detail ? `. ${h.hop.detail}` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  )
}
