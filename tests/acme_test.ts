import {
  assert,
  assertEquals,
  assertMatch,
  assertNotEquals,
} from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import handler from "@/serve.base.ts";
import { ObjectId } from "mongodb";
import { Env } from "@/core/utils/env.ts";
import { keyring } from "@/lib/services.ts";
import { acmeOptions } from "@/lib/domains/acme.ts";
import { issueDue } from "@/lib/domains/domains.ts";
import {
  acmeChallengeModel,
  domainJobSlotModel,
  domainModel,
} from "@/schemas/applications/domain.ts";

// Let's Encrypt issuance (PLAN §14, Phase 11) against Pebble, its test server:
//   docker run -d --rm -p 14000:14000 -e PEBBLE_VA_ALWAYS_VALID=1 ghcr.io/letsencrypt/pebble
//   ACME_TEST_DIRECTORY=https://localhost:14000/dir DENO_CERT=pebble.minica.pem deno task test
const DIRECTORY = Deno.env.get("ACME_TEST_DIRECTORY");

Deno.test("acme: any instance answers a stored challenge", async () => {
  const token = `tok-${Date.now()}`;
  await acmeChallengeModel.insertOne({
    _id: token,
    keyAuthorization: `${token}.thumb`,
    expiresAt: new Date(Date.now() + 60_000),
  });
  try {
    const get = (t: string) =>
      handler(
        new Request(`http://localhost/ingress/api/acme-challenge/${t}`),
      );
    const res = await get(token);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), `${token}.thumb`);
    const missing = await get("nope");
    assertEquals(missing.status, 404);
    await missing.body?.cancel();
  } finally {
    await acmeChallengeModel.deleteOne({ _id: token });
  }
});

Deno.test({
  name: "acme: issue, renew, hourly cap, backoff",
  ignore: !DIRECTORY,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const config = Env.getAll<Record<string, string>>();
    config.ACME_DIRECTORY = DIRECTORY!;
    acmeOptions.selfCheck = false;
    // Keep request-carried ticks away from these domains.
    const slot = await domainJobSlotModel.findOne({ _id: 0 });
    await domainJobSlotModel.updateOne({ _id: 0 }, {
      $set: { nextRunAt: new Date(Date.now() + 60 * 60_000) },
    }, { upsert: true });

    const tenant = new ObjectId();
    const now = new Date();
    const insert = async (hostname: string) => {
      const _id = new ObjectId();
      await domainModel.insertOne({
        _id,
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
      });
      return _id;
    };
    const host = `app-${Date.now()}.example.test`;
    const id = await insert(host);
    const read = async (_id = id) => (await domainModel.findOne({ _id }))!;

    try {
      await t.step("first order: active, key sealed", async () => {
        await issueDue();
        const d = await read();
        assertEquals(d.status, "active", d.error);
        assertMatch(d.certificate!.pem, /BEGIN CERTIFICATE/);
        assert(!d.certificate!.keyEnc.includes("PRIVATE KEY"));
        assertMatch(
          await keyring.decrypt(
            { kind: "tenant", ref: tenant },
            d.certificate!.keyEnc,
            `certificate:${host}`,
          ),
          /BEGIN PRIVATE KEY/,
        );
        // Pebble's certificates last days: renewal at two thirds of that.
        const { issuedAt, notAfter } = d.certificate!;
        const third = (notAfter.getTime() - issuedAt.getTime()) / 3;
        assertEquals(d.issueAt!.getTime(), notAfter.getTime() - third);
        assertEquals(d.issueLockedUntil, undefined);
      });

      await t.step("due for renewal: a new certificate", async () => {
        const before = await read();
        await domainModel.updateOne({ _id: id }, {
          $set: { issueAt: new Date() },
        });
        await issueDue();
        const d = await read();
        assertEquals(d.status, "active");
        assertNotEquals(d.certificate!.pem, before.certificate!.pem);
        assertEquals(d.issueOrders!.length, 2);
      });

      await t.step("3 orders in an hour: waits", async () => {
        await domainModel.updateOne({ _id: id }, {
          $set: { issueAt: new Date() },
          $push: { issueOrders: new Date() },
        });
        const before = await read();
        await issueDue();
        const d = await read();
        assertEquals(d.certificate!.pem, before.certificate!.pem);
        assert(d.issueAt!.getTime() > Date.now() + 50 * 60_000);
      });

      await t.step("a refused order backs off with the error", async () => {
        const bad = await insert(`bad_name-${Date.now()}.example.test`);
        await issueDue();
        const d = await read(bad);
        assertEquals(d.status, "issuing");
        assertEquals(d.issueFailures, 1);
        assert(d.error, "the error is kept");
        assert(d.issueAt!.getTime() > Date.now() + 60_000);
      });
    } finally {
      await domainModel.deleteMany({ tenant });
      await domainJobSlotModel.updateOne({ _id: 0 }, {
        $set: { nextRunAt: slot?.nextRunAt ?? new Date(0) },
      });
      acmeOptions.selfCheck = true;
    }
  },
});
