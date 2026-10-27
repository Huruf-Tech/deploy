import { assert, assertEquals } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import "@/serve.base.ts";
import { ObjectId } from "mongodb";
import {
  issueOnce,
  liveCheck,
  removeDomain,
  verifyOnce,
} from "@/lib/domains/domains.ts";
import {
  certificateArchiveModel,
  domainJobSlotModel,
  domainModel,
} from "@/schemas/applications/domain.ts";

// A removed domain's certificate comes back to its tenant instead of a new
// order, and a first certificate goes live once it answers over HTTPS
// (PLAN §14).

const DAY = 86_400_000;

Deno.test({
  name: "domains: certificates are reused, then verified live",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    // Keep request-carried ticks away from these domains.
    const slot = await domainJobSlotModel.findOne({ _id: 0 });
    await domainJobSlotModel.updateOne({ _id: 0 }, {
      $set: { nextRunAt: new Date(Date.now() + 60 * 60_000) },
    }, { upsert: true });
    const answers = liveCheck.answers;
    const tenant = new ObjectId();
    const hostname = `shop-${Date.now()}.example.test`;
    const certificate = {
      pem: "-----BEGIN CERTIFICATE-----kept",
      keyEnc: "sealed",
      issuedAt: new Date(Date.now() - DAY),
      notAfter: new Date(Date.now() + 89 * DAY),
    };
    const insert = async (extra: object) => {
      const now = new Date();
      const { insertedId } = await domainModel.insertOne({
        tenant,
        project: new ObjectId(),
        hostname,
        token: "t",
        status: "issuing",
        verifiedAt: now,
        issueAt: now,
        createdBy: new ObjectId(),
        createdAt: now,
        updatedAt: now,
        ...extra,
      });
      return insertedId;
    };
    const read = async (id: ObjectId) =>
      (await domainModel.findOne({ _id: id }))!;

    try {
      await t.step("removing a domain keeps its certificate", async () => {
        const old = await insert({ status: "active", certificate });
        await removeDomain(tenant, old);
        const kept = await certificateArchiveModel.findOne({ _id: hostname });
        assertEquals(kept?.certificate.pem, certificate.pem);
      });

      await t.step(
        "added again: the kept certificate, no order, then verified",
        async () => {
          const id = await insert({});
          await issueOnce(id);
          let d = await read(id);
          assertEquals(d.status, "verifying", d.error);
          assertEquals(d.certificate?.pem, certificate.pem);
          assertEquals(d.issueOrders ?? [], [], "nothing ordered");
          assertEquals(
            await certificateArchiveModel.countDocuments({ _id: hostname }),
            0,
          );

          // Not answering yet: checked again later, then failed with why.
          liveCheck.answers = () => Promise.reject(new Error("timed out"));
          await verifyOnce(d);
          d = await read(id);
          assertEquals(d.status, "verifying");
          assert(d.nextCheckAt! > new Date());
          await verifyOnce({ ...d, checkUntil: new Date(Date.now() - 1) });
          d = await read(id);
          assertEquals(d.status, "failed");
          assert(d.error?.includes("doesn't answer"), d.error);

          // "Check now" again: its own certificate, still no order; live.
          await domainModel.updateOne({ _id: id }, {
            $set: { status: "issuing", issueAt: new Date() },
          });
          await issueOnce(id);
          liveCheck.answers = () => Promise.resolve();
          await verifyOnce(await read(id));
          d = await read(id);
          assertEquals([d.status, d.issueOrders ?? []], ["active", []]);
        },
      );
    } finally {
      liveCheck.answers = answers;
      await domainModel.deleteMany({ tenant });
      await certificateArchiveModel.deleteMany({ tenant });
      await domainJobSlotModel.updateOne({ _id: 0 }, {
        $set: { nextRunAt: slot?.nextRunAt ?? new Date(0) },
      });
    }
  },
});
