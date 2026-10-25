import * as React from "react"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
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
import { IconServer2, IconStar } from "@tabler/icons-react"

import { useTheme } from "@/components/theme-provider"
import { StatusDot } from "@/components/console/status"
import { cn } from "@/lib/utils"

type TNetwork = Awaited<ReturnType<typeof ThunderSDK.networks.get>>
type TMember = TNetwork["servers"][number]
type TServerNode = Node<{ member: TMember; primary: boolean }, "server">

/** One server on the graph: name, mesh IP and whether it's in the mesh. */
function ServerNode({ data }: NodeProps<TServerNode>) {
  const { t } = useTranslation()
  const { member, primary } = data
  const state = !member.enabled
    ? "stopped"
    : member.error
      ? "error"
      : !member.joined
        ? "pending"
        : member.online
          ? "online"
          : "offline"
  return (
    <div
      className={cn(
        "flex min-w-36 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-[13px] shadow-sm",
        primary && "border-primary"
      )}
    >
      {/* Edges attach at the centre; the handles stay invisible. */}
      <Handle
        type="target"
        position={Position.Top}
        className="!top-1/2 !left-1/2 !size-0 !min-h-0 !min-w-0 !border-0 !opacity-0"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!top-1/2 !left-1/2 !size-0 !min-h-0 !min-w-0 !border-0 !opacity-0"
        isConnectable={false}
      />
      <IconServer2
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 font-medium">
          <StatusDot state={state} />
          <span className="truncate">{member.name}</span>
          {primary && (
            <IconStar
              className="size-3.5 shrink-0 text-brand-text"
              aria-label={t("Hosts the built-in registry")}
            />
          )}
        </div>
        <div dir="ltr" className="font-mono text-[11px] text-muted-foreground">
          {member.meshIp}
        </div>
      </div>
    </div>
  )
}

const nodeTypes = { server: ServerNode }

/**
 * Who reaches whom (PLAN §8.4) as a graph: servers on a circle, one line per
 * pair. Green both ways, red when either way fails (dashed if only one way),
 * grey when a side isn't in the mesh. Visual only: the matrix beside it is
 * the screen-reader version.
 */
export default function ReachGraph({ network }: { network: TNetwork }) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()

  const { nodes, edges } = React.useMemo(() => {
    const servers = network.servers
    const radius = Math.max(140, servers.length * 45)
    const nodes: TServerNode[] = servers.map((member, i) => {
      const angle = (2 * Math.PI * i) / servers.length - Math.PI / 2
      return {
        id: member._id,
        type: "server",
        position:
          servers.length === 1
            ? { x: 0, y: 0 }
            : {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
              },
        data: { member, primary: member._id === network.primaryServer },
        draggable: true,
      }
    })
    const reach = (from: string, to: string) =>
      network.reachability.find((r) => r.from === from && r.to === to)
        ?.reachable
    const edges: Edge[] = []
    servers.forEach((a, i) =>
      servers.slice(i + 1).forEach((b) => {
        const there = reach(a._id, b._id)
        const back = reach(b._id, a._id)
        const unknown = there == null || back == null
        const both = there === true && back === true
        const none = there === false && back === false
        edges.push({
          id: `${a._id}-${b._id}`,
          source: a._id,
          target: b._id,
          type: "straight",
          label: unknown
            ? undefined
            : both
              ? undefined
              : none
                ? t("No link")
                : t("One way"),
          labelStyle: { fontSize: 11, fill: "var(--foreground)" },
          labelBgStyle: { fill: "var(--card)" },
          style: {
            stroke: unknown
              ? "var(--muted-foreground)"
              : both
                ? "var(--success)"
                : "var(--destructive)",
            strokeWidth: 1.75,
            strokeDasharray: unknown ? "2 4" : both || none ? undefined : "6 4",
          },
        })
      })
    )
    return { nodes, edges }
  }, [network, t])

  return (
    <div
      className="h-80 overflow-hidden rounded-lg border bg-background"
      aria-hidden
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        nodesConnectable={false}
        elementsSelectable={false}
        minZoom={0.4}
        maxZoom={1.5}
      >
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  )
}
