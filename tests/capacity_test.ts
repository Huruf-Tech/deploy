import { assert, assertEquals } from "@std/assert";
import {
  classFootprints,
  daysUntil,
  fitsIn,
  growingWorkloads,
  roomOf,
  type TCapacityReport,
} from "../public/app/src/lib/capacity.ts";

// The dashboard's capacity math (PLAN §7.1), run here since the app has no test runner.

const MiB = 1024 * 1024;
const fp = (cpu: number, memMb: number) => ({
  cpuP95: cpu,
  cpuPeak: cpu * 2,
  memP95: memMb * MiB,
  memPeak: memMb * 2 * MiB,
});

const report: TCapacityReport = {
  at: 0,
  host: {
    cpuCores: 2,
    memTotal: 4096 * MiB,
    diskTotal: 40_960 * MiB,
    headroomPercent: 15,
    day: { ...fp(0.6, 1500), diskPeak: 10_240 * MiB },
  },
  workloads: [
    {
      project: "a",
      workload: "shop",
      replicas: 2,
      maxReplicas: 2,
      reserve: { cpu: 0.1, memMb: 128 },
      disk: 200 * MiB,
      week: fp(0.08, 180),
    },
    {
      project: "b",
      workload: "blog",
      replicas: 1,
      maxReplicas: 1,
      reserve: { cpu: 0.1, memMb: 128 },
      disk: 100 * MiB,
      week: fp(0.05, 140),
    },
  ],
  // A leaking app: +30 MiB a day; a steady one alongside.
  daily: Array.from({ length: 10 }, (_, i) => ({
    day: `2026-10-${String(10 + i).padStart(2, "0")}`,
    memPeak: (1500 + 30 * i) * MiB,
    cpuP95: 0.5,
    diskPeak: 10_240 * MiB,
    workloads: { shop: (200 + 30 * i) * MiB, blog: (150 + (i % 2)) * MiB },
  })),
};

Deno.test("capacity: room, class footprints and fit", () => {
  const room = roomOf(report);
  // 4096 × 0.85 − max(384 reserved, 1500 used at p95)
  assertEquals(Math.round(room.memMb), 1982);
  const classes = classFootprints([report], [
    {
      _id: "a",
      name: "Shop",
      template: { _id: "t1", name: "Thunder" },
      runtime: { cpuReserve: 0.1, memReserveMb: 128 },
    },
    {
      _id: "b",
      name: "Blog",
      template: { _id: "t1", name: "Thunder" },
      runtime: { cpuReserve: 0.1, memReserveMb: 128 },
    },
    {
      _id: "c",
      name: "New",
      template: { _id: "t2", name: "Postgres" },
      runtime: { cpuReserve: 0.25, memReserveMb: 256 },
    },
  ]);
  const thunder = classes.find((c) => c.key === "t1")!;
  assertEquals([thunder.memMb, thunder.samples], [160, 2]);
  const postgres = classes.find((c) => c.key === "t2")!;
  assertEquals([postgres.memMb, postgres.samples], [256, 0], "declared only");

  assertEquals(fitsIn(room, thunder).fits, 12); // 1982 / 160
  assertEquals(fitsIn(room, postgres).fits, 7);
  // CPU is overcommittable: a 0.5-core app fits 2 by CPU, 198 by memory.
  assert(fitsIn(room, { ...thunder, memMb: 10, cpu: 0.5 }).cpuOvercommitted);
});

Deno.test("capacity: the forecast flags a leaking app", () => {
  const growing = growingWorkloads(report);
  assertEquals(growing.map((g) => g.workload), ["shop"]);
  assertEquals(Math.round(growing[0].mbPerDay), 30);
  // Pool memory 1770 MiB today, +30/day, limit 4096 × 0.85 = 3482: ~57 days.
  const days = daysUntil(report.daily.map((d) => d.memPeak), 3482 * MiB);
  assertEquals(days, 57);
  assertEquals(daysUntil([5, 5, 5, 5].map((v) => v * MiB), 100 * MiB), null);
});
