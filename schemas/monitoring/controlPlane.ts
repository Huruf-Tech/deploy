import z from "zod";
import { mongodb } from "@/database.ts";

/**
 * Latency histogram upper bounds (ms); the last bucket is everything slower.
 * Counts add up across instances and minutes, so percentiles stay exact to a bucket.
 */
export const LATENCY_BUCKETS = [5, 10, 15, 25, 40, 60, 100, 250, 500, 1000];

const $histogram = z.array(z.number().int().min(0));

/**
 * One control plane instance's minute (or so): requests, database and
 * resources. Each instance writes its own, so several replicas (or a
 * serverless fleet) all show up. Kept 8 days.
 */
export const $controlPlaneSample = z.object({
  instance: z.string(),
  host: z.string(),
  at: z.date(),
  windowS: z.number(),
  requests: z.number().int(),
  errors: z.number().int(),
  latency: $histogram,
  polls: z.number().int(),
  pollLatency: $histogram,
  routes: z.array(z.object({
    route: z.string(),
    count: z.number().int(),
    errors: z.number().int(),
    totalMs: z.number(),
    maxMs: z.number(),
  })),
  db: z.object({
    ops: z.number().int(),
    failed: z.number().int(),
    totalMs: z.number(),
    latency: $histogram,
    poolCheckouts: z.number().int(),
    poolWaitMaxMs: z.number(),
    poolSize: z.number().int(),
    slow: z.array(z.object({
      command: z.string(),
      collection: z.string().optional(),
      ms: z.number(),
    })),
  }),
  process: z.object({
    rssMb: z.number(),
    heapUsedMb: z.number(),
    heapTotalMb: z.number(),
    cpuPct: z.number(),
    uptimeS: z.number(),
  }),
  /** Missing where the platform hides it (e.g. serverless). */
  system: z.object({
    cpus: z.number().int(),
    cpuPct: z.number(),
    memTotalMb: z.number(),
    memAvailableMb: z.number(),
    load1: z.number(),
    load5: z.number(),
    load15: z.number(),
  }).optional(),
  expiresAt: z.date(),
});

export type TControlPlaneSample = z.output<typeof $controlPlaneSample>;

export const controlPlaneSampleModel = mongodb.db().collection<
  TControlPlaneSample
>("controlPlaneSamples");
