import { assertEquals } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import "@/serve.base.ts";
import { ObjectId } from "mongodb";
import {
  diskKindOf,
  profilesOf,
  ratingOf,
  tierOf,
} from "@/lib/agents/profile.ts";
import { recordOutage, uptimesOf } from "@/lib/monitoring/uptime.ts";
import { serverOutageModel } from "@/schemas/infrastructure/serverOutage.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";

// What's measured of servers for the market (PLAN §29): a machine's rating
// and class from its benchmark, uptime from outages, and whether it can be
// rented whole.

const DAY = 86_400_000;
// Measured on a 2026 desktop (12 threads, SSD) while calibrating.
const desktop = {
  at: "2026-10-28T08:22:43Z",
  cpuSingle: 186.99,
  cpuMulti: 959.41,
  threads: 12,
  memory: 11_900.33,
  diskWrite: 669.27,
  diskSync: 1.03,
};

Deno.test("profile: rating, class and disk from a benchmark", () => {
  const rating = ratingOf(desktop)!;
  assertEquals(rating >= 60 && rating <= 75, true, String(rating));
  assertEquals(tierOf(rating), rating >= 70 ? "Performance" : "Standard");
  assertEquals(diskKindOf(desktop), "SSD");
  assertEquals(diskKindOf({ ...desktop, diskSync: 0.1 }), "NVMe");
  assertEquals(diskKindOf({ ...desktop, rotational: true }), "HDD");
  // A slow little machine is Basic; a strong one Performance.
  const slow = ratingOf({
    ...desktop,
    cpuSingle: 35,
    cpuMulti: 60,
    memory: 1_500,
    diskWrite: 40,
    diskSync: 25,
  })!;
  assertEquals([slow, tierOf(slow)], [0, "Basic"]);
  const fast = ratingOf({
    ...desktop,
    cpuSingle: 260,
    cpuMulti: 5_000,
    memory: 25_000,
    diskWrite: 2_500,
    diskSync: 0.04,
  })!;
  assertEquals([fast, tierOf(fast)], [100, "Performance"]);
  assertEquals(ratingOf(undefined), undefined);
});

Deno.test({
  name: "profile: uptime from outages, and when a machine is dedicated",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const tenant = new ObjectId();
    const now = new Date();
    const [up, down, fresh] = [new ObjectId(), new ObjectId(), new ObjectId()];
    try {
      // 3 hours down in the last 30 days, and an old outage outside it.
      await recordOutage(
        up,
        tenant,
        new Date(now.getTime() - 5 * DAY),
        new Date(now.getTime() - 5 * DAY + 3 * 3_600_000),
      );
      await recordOutage(
        up,
        tenant,
        new Date(now.getTime() - 40 * DAY),
        new Date(now.getTime() - 39 * DAY),
      );
      // Down for the last day, still: its lease ran out a day ago.
      await serverLeaseModel.insertOne({
        _id: down,
        tenant,
        status: "active",
        aliveUntil: new Date(now.getTime() - DAY),
        offline: true,
        shard: 0,
        desiredVersion: 0,
        commandSeq: 0,
        deliveredSeq: 0,
      });
      const uptime = await uptimesOf(
        [
          { _id: up, createdAt: new Date(now.getTime() - 100 * DAY) },
          { _id: down, createdAt: new Date(now.getTime() - 100 * DAY) },
          // Added 10 days ago and never down: its window starts then.
          { _id: fresh, createdAt: new Date(now.getTime() - 10 * DAY) },
        ],
        30,
        now,
      );
      const round = (n?: number) => Math.round((n ?? 0) * 100) / 100;
      assertEquals(
        round(uptime.get(String(up))),
        round(100 * (1 - 3 / (30 * 24))),
      );
      assertEquals(round(uptime.get(String(down))), round(100 * (1 - 1 / 30)));
      assertEquals(uptime.get(String(fresh)), 100);

      const machine = (extra: object) => ({
        _id: new ObjectId(),
        provider: { kind: "machine" as const },
        pool: { status: "ready" as const, updatedAt: now },
        createdAt: now,
        inventory: {
          hostname: "m",
          os: "Ubuntu",
          arch: "amd64" as const,
          cpuCores: 12,
          memory: 1,
          disk: 1,
          agentVersion: "t",
          virtualization: "none",
        },
        resources: {
          cpu: 0.1,
          memFree: 1,
          diskFree: 1,
          rttMs: 42,
          hostCpu: 0.05,
          benchmark: desktop,
          reportedAt: now,
        },
        ...extra,
      });
      const idle = machine({});
      const busy = machine({ resources: { ...idle.resources, hostCpu: 0.4 } });
      const shared = machine({
        resources: {
          ...idle.resources,
          partitions: [{
            name: "p1",
            state: "running",
            size: { cpus: 1, memMb: 1024, diskGb: 10 },
            cpuMicros: 0,
            memUsed: 0,
            diskUsed: 0,
            rxBytes: 0,
            txBytes: 0,
          }],
        },
      });
      const profiles = await profilesOf([idle, busy, shared], now);
      const p = profiles.get(String(idle._id))!;
      assertEquals(
        [p.dedicated, p.rttMs, p.tier, p.disk, p.virtualization],
        [true, 42, tierOf(ratingOf(desktop)), "SSD", "none"],
      );
      assertEquals(
        profiles.get(String(busy._id))!.notDedicated,
        "Busy outside partitions",
      );
      assertEquals(
        profiles.get(String(shared._id))!.notDedicated,
        "Has partitions",
      );
    } finally {
      await serverOutageModel.deleteMany({ tenant });
      await serverLeaseModel.deleteMany({ tenant });
    }
  },
});
