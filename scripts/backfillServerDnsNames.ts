import { refreshSpecs } from "@/lib/deploy/specs.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";

/**
 * Servers made before `.internal` server names (PLAN §8.3): making their
 * specs gives each its name, and their agents learn
 * `<project>.<dnsName>.srv.internal`. Idempotent: a server that has one is
 * left alone, and an unchanged spec isn't sent again.
 */
export async function backfillServerDnsNames() {
  let done = 0;
  for (;;) {
    const batch = await serverModel.find(
      { status: "active", dnsName: { $exists: false } },
      { projection: { _id: 1 }, limit: 100 },
    ).toArray();
    if (!batch.length) break;
    await refreshSpecs(batch.map((s) => s._id));
    // A server whose spec couldn't be made (no key yet) still has none: stop.
    const left = await serverModel.countDocuments({
      _id: { $in: batch.map((s) => s._id) },
      dnsName: { $exists: false },
    });
    done += batch.length - left;
    if (left) break;
  }
  return done;
}

if (import.meta.main) {
  console.log("Servers named:", await backfillServerDnsNames());
  Deno.exit();
}
