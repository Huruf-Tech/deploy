import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  Background,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  IconApps,
  IconPlugConnected,
  IconRoute,
  IconServer2,
  IconWorld,
} from "@tabler/icons-react"

import { useTheme } from "@/components/theme-provider"
import { StatusDot } from "@/components/console/status"
import { cn } from "@/lib/utils"
import { worst, type THop, type TReach } from "./reach"

const ICONS = {
  domain: IconWorld,
  port: IconPlugConnected,
  traefik: IconRoute,
  server: IconServer2,
  app: IconApps,
}

type THopNode = Node<
  {
    kind: keyof typeof ICONS
    title: string
    subtitle?: string
    state: THop["state"]
  },
  "hop"
>

const DOT = {
  ok: "online",
  warning: "warning",
  failed: "failed",
  skipped: "stopped",
} as const

/** One hop of the way in: what it is and whether it works. */
function HopNode({ data }: NodeProps<THopNode>) {
  const Icon = ICONS[data.kind]
  return (
    <div
      className={cn(
        "flex w-56 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-[13px] shadow-sm",
        data.state === "failed" && "border-destructive"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-0 !min-h-0 !min-w-0 !border-0 !opacity-0"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!size-0 !min-h-0 !min-w-0 !border-0 !opacity-0"
        isConnectable={false}
      />
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 font-medium">
          <StatusDot state={DOT[data.state]} />
          <span dir="ltr" className="truncate">
            {data.title}
          </span>
        </div>
        {data.subtitle && (
          <div
            dir="ltr"
            className="truncate font-mono text-[11px] text-muted-foreground"
          >
            {data.subtitle}
          </div>
        )}
      </div>
    </div>
  )
}

const nodeTypes = { hop: HopNode }

const STROKE = {
  ok: "var(--success)",
  warning: "var(--warning)",
  failed: "var(--destructive)",
  skipped: "var(--muted-foreground)",
}

/**
 * The way in as a graph (PLAN §14): domains and the public port on the left,
 * through Traefik and each server's tunnel and edge proxy to the app. A red
 * line is where it stops, labelled with the hop. Visual only: the list beside
 * it is the screen-reader version.
 */
export default function ReachMap({ reach }: { reach: TReach }) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()

  const { nodes, edges } = React.useMemo(() => {
    const COL = [0, 300, 600, 900]
    const ROW = 90
    const nodes: THopNode[] = []
    const edges: Edge[] = []
    const edge = (
      id: string,
      source: string,
      target: string,
      hops: [string, THop][]
    ) => {
      const state = worst(hops.map(([, h]) => h))
      const stop = hops.find(([, h]) => h.state === "failed")?.[0]
      edges.push({
        id,
        source,
        target,
        type: "smoothstep",
        animated: state === "ok",
        label: stop,
        labelStyle: { fontSize: 11, fill: "var(--foreground)" },
        labelBgStyle: { fill: "var(--card)" },
        style: {
          stroke: STROKE[state],
          strokeWidth: 1.75,
          strokeDasharray: state === "skipped" ? "2 4" : undefined,
        },
      })
    }

    const entries = reach.domains.length + (reach.publicPort ? 1 : 0)
    const tall = Math.max(entries, reach.servers.length, 1) * ROW
    const top = (count: number) => (tall - count * ROW) / 2

    reach.domains.forEach((d, i) => {
      nodes.push({
        id: `d-${d._id}`,
        type: "hop",
        position: { x: COL[0], y: top(entries) + i * ROW },
        data: {
          kind: "domain",
          title: d.hostname,
          subtitle: d.appDomain ? t("Test domain") : d.dns.detail,
          state: worst([d.dns, d.certificate]),
        },
      })
      edge(`d-${d._id}-traefik`, `d-${d._id}`, "traefik", [
        [t("DNS"), d.dns],
        [t("Certificate"), d.certificate],
        [t("Not routed"), d.route],
        [t("Over the internet"), d.https],
      ])
    })
    if (reach.publicPort) {
      nodes.push({
        id: "port",
        type: "hop",
        position: { x: COL[0], y: top(entries) + reach.domains.length * ROW },
        data: {
          kind: "port",
          title: t("Public port {{port}}", { port: reach.publicPort }),
          subtitle: t("On each server's address"),
          state: worst(reach.servers.flatMap((s) => s.publicPort ?? [])),
        },
      })
    }
    if (reach.domains.length) {
      nodes.push({
        id: "traefik",
        type: "hop",
        position: { x: COL[1], y: tall / 2 - ROW / 2 },
        data: {
          kind: "traefik",
          title: t("Traefik · control plane"),
          subtitle: [reach.ingress.hostname, ...reach.ingress.ipv4]
            .filter(Boolean)
            .join(" · "),
          state: reach.ingress.traefik.state,
        },
      })
    }
    reach.servers.forEach((s, i) => {
      const y = top(reach.servers.length) + i * ROW
      nodes.push({
        id: `s-${s._id}`,
        type: "hop",
        position: { x: COL[2], y },
        data: {
          kind: "server",
          title: s.name,
          subtitle: t("Edge proxy (Caddy)"),
          state: s.online ? s.edge.state : "failed",
        },
      })
      nodes.push({
        id: `a-${s._id}`,
        type: "hop",
        position: { x: COL[3], y },
        data: {
          kind: "app",
          title: t("App"),
          subtitle: reach.healthcheckPath,
          state: s.app.state,
        },
      })
      if (reach.domains.length) {
        edge(`traefik-${s._id}`, "traefik", `s-${s._id}`, [
          [t("Not routed"), s.route],
          [t("Tunnel"), s.tunnel],
        ])
      }
      if (s.publicPort) {
        edge(`port-${s._id}`, "port", `s-${s._id}`, [
          [t("Public port"), s.publicPort],
        ])
      }
      edge(`app-${s._id}`, `s-${s._id}`, `a-${s._id}`, [
        [t("Edge proxy"), s.edge],
        [t("App"), s.app],
      ])
    })
    return { nodes, edges }
  }, [reach, t])

  const rows = Math.max(
    reach.domains.length + (reach.publicPort ? 1 : 0),
    reach.servers.length,
    1
  )
  return (
    <div
      className="overflow-hidden rounded-lg border bg-background"
      style={{ height: Math.min(520, 140 + rows * 90) }}
      aria-hidden
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesConnectable={false}
        elementsSelectable={false}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  )
}
