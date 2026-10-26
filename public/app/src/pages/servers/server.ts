import z from "zod"
import { ThunderSDK } from "thunder-sdk"

/**
 * The fields the servers pages read; also their projection. Optional fields
 * are nullish: documents can hold `null` where a value is absent.
 */
export const serverSchema = z.object({
  _id: z.string(),
  name: z.string(),
  status: z.enum(["pending", "active", "rejected"]),
  pairingExpiresAt: z.coerce.date().nullish(),
  inventory: z.object({
    hostname: z.string(),
    os: z.string(),
    arch: z.string(),
    cpuCores: z.number(),
    memory: z.number(),
    disk: z.number(),
    agentVersion: z.string(),
    agentSha256: z.string().nullish(),
  }),
  labels: z.record(z.string(), z.string()).nullish(),
  /** `rented`: a partition of one of Huruf's pool machines (PLAN §26). */
  provider: z
    .object({
      kind: z.enum(["byo", "rented"]),
      host: z.string().nullish(),
      subscription: z.string().nullish(),
    })
    .nullish(),
  resources: z
    .object({
      cpu: z.number(),
      memFree: z.number(),
      diskFree: z.number(),
      /** Pool machines: their partitions (PLAN §26.5). */
      partitions: z
        .array(
          z.object({
            name: z.string(),
            remainder: z.boolean(),
            state: z.string(),
            size: z.object({
              cpus: z.number(),
              memMb: z.number(),
              diskGb: z.number(),
            }),
            memUsed: z.number(),
            diskUsed: z.number(),
            rxBytes: z.number(),
            txBytes: z.number(),
          })
        )
        .nullish(),
    })
    .nullish(),
  /** Pool machines (PLAN §26.5). */
  pool: z
    .object({
      status: z.enum(["pending", "ready", "failed"]),
      allocatable: z
        .object({ cpus: z.number(), memMb: z.number(), diskGb: z.number() })
        .nullish(),
      sysbox: z.string().nullish(),
      error: z.string().nullish(),
      class: z.string().nullish(),
      accepting: z.boolean().nullish(),
      monthlyCost: z.number().nullish(),
    })
    .nullish(),
  setup: z
    .object({
      status: z.enum(["pending", "ready", "failed"]),
      dockerVersion: z.string().nullish(),
      checks: z
        .array(
          z.object({ name: z.string(), ok: z.boolean(), detail: z.string() })
        )
        .nullish(),
      notes: z.array(z.string()).nullish(),
      error: z.string().nullish(),
      // When setup started (pending) or finished.
      updatedAt: z.coerce.date().nullish(),
    })
    .nullish(),
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
