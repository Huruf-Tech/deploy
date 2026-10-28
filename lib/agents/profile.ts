import type { ObjectId } from "mongodb";
import { bootstrapSessionModel } from "@/schemas/infrastructure/bootstrapSession.ts";
import { uptimesOf } from "@/lib/monitoring/uptime.ts";
import type { TServer } from "@/schemas/infrastructure/server.ts";
import type { $benchmark } from "@/schemas/protocol/agent.ts";
import type z from "zod";

type TBenchmark = z.output<typeof $benchmark>;

/**
 * One measurement's score, 0..1: log-scaled between what counts as poor
 * (`low`) and excellent (`high`); for times, lower is better (`low` > `high`).
 * Calibrated on 2026-10 hardware: a recent desktop scores about 68.
 */
const scale = (value: number, low: number, high: number) => {
  if (!(value > 0)) return 0;
  const at = (Math.log(value) - Math.log(low)) /
    (Math.log(high) - Math.log(low));
  return Math.min(1, Math.max(0, at));
};

const WEIGHTS: [keyof TBenchmark, number, number, number][] = [
  // [measurement, poor, excellent, weight]
  ["cpuSingle", 40, 250, 0.30],
  ["cpuMulti", 100, 4_000, 0.25],
  ["memory", 2_000, 20_000, 0.10],
  ["diskWrite", 50, 2_000, 0.15],
  ["diskSync", 20, 0.05, 0.20],
];

/** A machine's rating, 0..100, from its latest benchmark (PLAN §29). */
export const ratingOf = (b?: TBenchmark) =>
  b
    ? Math.round(
      100 *
        WEIGHTS.reduce(
          (sum, [key, low, high, weight]) =>
            sum + weight * scale(b[key] as number, low, high),
          0,
        ),
    )
    : undefined;

/** The speed class a rating falls in. */
export const tierOf = (rating?: number) =>
  rating === undefined
    ? undefined
    : rating >= 70
    ? "Performance" as const
    : rating >= 40
    ? "Standard" as const
    : "Basic" as const;

/** The disk kind, from how fast a small write is made durable. */
export const diskKindOf = (b?: TBenchmark) =>
  !b
    ? undefined
    : b.rotational || b.diskSync > 5
    ? "HDD" as const
    : b.diskSync < 0.3
    ? "NVMe" as const
    : "SSD" as const;

/** Busier than this outside its partitions, a machine isn't offered whole. */
export const DEDICATED_HOST_CPU = 0.15;
/** A summary older than this: the machine isn't reporting. */
const FRESH_MS = 5 * 60_000;

/** A server's profile; the rating, class and dedicated parts are machines'. */
export type TProfile = {
  rttMs?: number;
  uptime30d?: number;
  uptime90d?: number;
  steal?: number;
  virtualization?: string;
  rating?: number;
  tier?: ReturnType<typeof tierOf>;
  disk?: ReturnType<typeof diskKindOf>;
  benchmarkAt?: string;
  hostCpu?: number;
  dedicated?: boolean;
  notDedicated?: string;
};

type TMachine =
  & Pick<
    TServer,
    "provider" | "pool" | "resources" | "inventory" | "createdAt"
  >
  & { _id: ObjectId };

/**
 * What the market will show of servers (PLAN §29): measured latency to the
 * control plane and uptime for any server; for machines also the rating,
 * class, disk kind, CPU used outside partitions, steal, and whether it can
 * be rented whole as dedicated: a machine nothing else runs on (no
 * partitions, its own or rented, and little else using its CPU).
 */
export async function profilesOf(servers: TMachine[], now = new Date()) {
  const machines = servers.filter((s) => s.provider?.kind === "machine");
  const [uptime30, uptime90, creating] = await Promise.all([
    uptimesOf(servers, 30, now),
    uptimesOf(servers, 90, now),
    bootstrapSessionModel.find({
      "partition.host": { $in: machines.map((m) => m._id) },
      status: "installing",
      expiresAt: { $gt: now },
    }, { projection: { "partition.host": 1 } }).toArray(),
  ]);
  return new Map<string, TProfile>(servers.map((s): [string, TProfile] => {
    const r = s.resources;
    const id = String(s._id);
    const base = {
      rttMs: r?.rttMs,
      uptime30d: uptime30.get(id),
      uptime90d: uptime90.get(id),
      steal: r?.steal,
      virtualization: s.inventory?.virtualization,
    };
    if (s.provider?.kind !== "machine") return [id, base];
    const rating = ratingOf(r?.benchmark);
    const fresh = !!r?.reportedAt &&
      now.getTime() - r.reportedAt.getTime() < FRESH_MS;
    const partitions = (r?.partitions?.length ?? 0) +
      creating.filter((c) => c.partition!.host.equals(s._id)).length;
    const notDedicated = s.pool?.status !== "ready"
      ? "Not set up for partitions"
      : !fresh
      ? "Not reporting"
      : partitions > 0
      ? "Has partitions"
      : r?.hostCpu === undefined
      ? "Not measured yet"
      : r.hostCpu >= DEDICATED_HOST_CPU
      ? "Busy outside partitions"
      : undefined;
    return [id, {
      ...base,
      rating,
      tier: tierOf(rating),
      disk: diskKindOf(r?.benchmark),
      benchmarkAt: r?.benchmark?.at,
      hostCpu: r?.hostCpu,
      dedicated: !notDedicated,
      ...(notDedicated ? { notDedicated } : {}),
    }];
  }));
}
