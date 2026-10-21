import z from "zod"
import { ThunderSDK } from "thunder-sdk"

/** The fields the servers pages read; also their projection. */
export const serverSchema = z.object({
  _id: z.string(),
  name: z.string(),
  status: z.enum(["pending", "active", "rejected"]),
  pairingExpiresAt: z.coerce.date().optional(),
  inventory: z.object({
    hostname: z.string(),
    os: z.string(),
    arch: z.string(),
    cpuCores: z.number(),
    memory: z.number(),
    disk: z.number(),
    agentVersion: z.string(),
  }),
  resources: z
    .object({ cpu: z.number(), memFree: z.number(), diskFree: z.number() })
    .optional(),
  setup: z
    .object({
      status: z.enum(["pending", "ready", "failed"]),
      dockerVersion: z.string().optional(),
      checks: z
        .array(
          z.object({ name: z.string(), ok: z.boolean(), detail: z.string() })
        )
        .optional(),
      error: z.string().optional(),
    })
    .optional(),
})

export type TServer = z.infer<typeof serverSchema>
export type TLiveness = Awaited<
  ReturnType<typeof ThunderSDK.servers.liveness>
>[number]
export type TServerState = "pending" | "online" | "offline" | "rejected"

export const gib = (bytes: number) => `${(bytes / 2 ** 30).toFixed(1)} GiB`

export const stateOf = (server: TServer, live?: TLiveness): TServerState =>
  server.status === "active"
    ? live?.online
      ? "online"
      : "offline"
    : server.status

export const STATE_STYLE: Record<
  TServerState,
  { dot: string; pill: string; tile: string }
> = {
  online: {
    dot: "bg-success",
    pill: "bg-success/10 text-success",
    tile: "bg-primary/10 text-primary",
  },
  offline: {
    dot: "bg-muted-foreground",
    pill: "bg-muted text-muted-foreground",
    tile: "bg-muted text-muted-foreground",
  },
  pending: {
    dot: "bg-warning",
    pill: "bg-warning/15 text-foreground",
    tile: "bg-warning/15 text-foreground",
  },
  rejected: {
    dot: "bg-destructive",
    pill: "bg-destructive/10 text-destructive",
    tile: "bg-destructive/10 text-destructive",
  },
}
