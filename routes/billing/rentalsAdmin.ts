import z from "zod";
import type { ObjectId } from "mongodb";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson, queryAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withAuthSession } from "@/plugins/Huruf-Tech/thunder-core/utils/withAuthSession.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { walletLedgerModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/walletLedger.ts";
import {
  disputes,
  earnings,
  rentals as rentalService,
} from "@/lib/services.ts";
import { planModel } from "@/schemas/billing/plan.ts";
import {
  abuseReportModel,
  claimRevertModel,
  earningModel,
} from "@/schemas/billing/market.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { $machineView, machineView } from "@/lib/market/machineView.ts";

/**
 * Admin oversight of the market (PLAN §30.2): suspend, resume, delete, move
 * and refund rentals, rentals that didn't arrive, the market's machines,
 * disputes, claims taken back and abuse reports. Owners accept requests.
 * Root only: no member policy grants this router.
 */
export default new Router("/api", function rentalsAdmin(router) {
  const $params = z.object({ id: $objectId });
  const admin = async (req: Request) => (await withAuthSession(req)).user._id;

  // An admin's hand on a rental: stop it (not renewed meanwhile), start it
  // again, or delete it now with its data (nothing refunded).
  const $reason = z.object({ reason: z.string().max(500).optional() });

  router.post("/:id/suspend", function suspend() {
    return {
      shape: () => ({ params: $params, body: $reason }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { reason } = $reason.parse(await bodyAsJson(req));
        await rentalService.hold(id, await admin(req), reason);
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/resume", function resume() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        await rentalService.resume(id);
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/terminate", function terminate() {
    return {
      shape: () => ({ params: $params, body: $reason }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { reason } = $reason.parse(await bodyAsJson(req));
        await rentalService.terminate(id, reason);
        return Response.json({ ok: true });
      },
    };
  });

  // Moving a rental to another machine (PLAN §26.10).
  router.get("/:id/move", function moveTargets() {
    const $return = z.object({
      from: z.string().optional(),
      moving: z.boolean(),
      downtimeSec: z.number().describe("Rough: a minute plus copying"),
      targets: z.array(z.object({
        server: z.string(),
        name: z.string(),
        free: z.object({ memMb: z.number(), diskGb: z.number() }),
        cpuRoom: z.number(),
        fits: z.boolean(),
        reachable: z.boolean().describe(
          "The source machine can be reached: its address, or the tunnel server",
        ),
      })),
    });

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        return Response.json(await rentalService.moveTargets(id));
      },
    };
  });

  router.post("/:id/move", function move() {
    const $body = z.object({ to: $objectId });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { to } = $body.parse(await bodyAsJson(req));
        await rentalService.move(id, to, await admin(req));
        return Response.json({ ok: true });
      },
    };
  });

  // For a move that never reports back: it starts again where it was.
  router.post("/:id/move/cancel", function cancelMove() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        await rentalService.cancelMove(id);
        return Response.json({ ok: true });
      },
    };
  });

  // Per machine for rent: capacity, revenue and cost (PLAN §26.7, §28).
  router.get("/capacity", function capacity() {
    const $return = z.object({
      machines: z.array(z.object({
        _id: z.string(),
        name: z.string(),
        tenant: z.string().describe("The owner's workspace"),
        forRent: z.boolean(),
        accepting: z.boolean(),
        allocatable: z.object({
          cpus: z.number(),
          memMb: z.number(),
          diskGb: z.number(),
        }),
        rentedMemMb: z.number(),
        ownMemMb: z.number().describe("The owner's own partitions"),
        freeMemMb: z.number(),
        rentals: z.number(),
        revenue: z.number().describe("Cents per month"),
        cost: z.number().describe("Cents per month"),
      })),
    });

    return {
      shape: () => ({ return: $return }),
      handler: async () => Response.json(await rentalService.capacity()),
    };
  });

  // Approved rentals still without a server, and why (PLAN §26.9).
  router.get("/waiting", function waiting() {
    const $return = z.array(z.object({
      _id: z.string(),
      tenantName: z.string().optional(),
      plan: z.string().optional(),
      size: z.object({
        cpus: z.number(),
        memMb: z.number(),
        diskGb: z.number(),
      }),
      host: z.string().optional().describe("The machine's name"),
      since: z.date(),
      error: z.string().optional().describe(
        "Why it's stuck; absent while it's being set up",
      ),
    }));

    return {
      shape: () => ({ return: $return }),
      handler: async () => {
        const rows = await rentalService.waiting();
        const [tenants, plans] = await Promise.all([
          tenantModel.find({ _id: { $in: rows.map((r) => r.sub.tenant) } }, {
            projection: { name: 1 },
          }).toArray(),
          planModel.find({ _id: { $in: rows.map((r) => r.sub.plan) } }, {
            projection: { name: 1 },
          }).toArray(),
        ]);
        return Response.json(rows.map(({ sub, ...r }) => ({
          _id: sub._id,
          tenantName: tenants.find((t) => t._id.equals(sub.tenant))?.name,
          plan: plans.find((p) => p._id.equals(sub.plan))?.name,
          size: sub.rental!.size,
          ...r,
        })));
      },
    };
  });

  // Creates a stuck rental's partition again, there or on another machine.
  router.post("/:id/partition", function recreatePartition() {
    const $body = z.object({ host: $objectId.optional() });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { host } = $body.parse(await bodyAsJson(req));
        await rentalService.recreate(id, await admin(req), host);
        return Response.json({ ok: true });
      },
    };
  });

  // The running period back to the wallet, and the rental removed.
  router.post("/:id/refund", function refund() {
    const $return = z.object({ amount: z.number().describe("Cents refunded") });

    return {
      shape: () => ({ params: $params, body: $reason, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { reason } = $reason.parse(await bodyAsJson(req));
        return Response.json(
          await rentalService.refund(id, await admin(req), reason),
        );
      },
    };
  });

  // Any machine for rent with its rentals, community ones included.
  router.get("/machines/:id", function machine() {
    return {
      shape: () => ({ params: $params, return: $machineView }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const doc = await serverModel.findOne({ _id: id }, {
          projection: { tenant: 1, pool: 1 },
        });
        if (!doc?.pool) throw Response.notFound("Machine not found");
        return Response.json(await machineView(doc));
      },
    };
  });

  // Disputes (PLAN §30.9): open ones with their evidence; a decision pays
  // the refund from the machine's money.
  router.get("/disputes", function listDisputes() {
    const $query = z.object({
      status: z.enum(["open", "resolved"]).optional(),
    });
    const $return = z.array(z.object({
      _id: z.string(),
      subscription: z.string(),
      tenantName: z.string().optional(),
      ownerName: z.string().optional(),
      machine: z.string(),
      machineName: z.string().optional(),
      reason: z.string(),
      status: z.string(),
      evidence: z.record(z.string(), z.unknown()),
      held: z.number().describe("Cents the machine's money can pay"),
      decision: z.object({
        refund: z.number(),
        note: z.string().optional(),
        at: z.date(),
      }).optional(),
      createdAt: z.date(),
    }));

    return {
      shape: () => ({ query: $query, return: $return }),
      handler: async (req) => {
        const { status } = $query.parse(queryAsJson(req));
        const rows = await disputes.list(status);
        const [tenants, machines, held] = await Promise.all([
          tenantModel.find({
            _id: { $in: rows.flatMap((d) => [d.tenant, d.owner]) },
          }, { projection: { name: 1 } }).toArray(),
          serverModel.find({ _id: { $in: rows.map((d) => d.machine) } }, {
            projection: { name: 1 },
          }).toArray(),
          Promise.all(rows.map((d) => earnings.frozenOf(d.machine))),
        ]);
        const name = (id: ObjectId) =>
          tenants.find((t) => t._id.equals(id))?.name;
        return Response.json(rows.map((d, i) => ({
          _id: d._id,
          subscription: d.subscription,
          tenantName: name(d.tenant),
          ownerName: name(d.owner),
          machine: d.machine,
          machineName: machines.find((m) => m._id.equals(d.machine))?.name,
          reason: d.reason,
          status: d.status,
          evidence: d.evidence,
          held: held[i].total,
          decision: d.decision && {
            refund: d.decision.refund,
            note: d.decision.note,
            at: d.decision.at,
          },
          createdAt: d.createdAt,
        })));
      },
    };
  });

  router.post("/disputes/:id/resolve", function resolveDispute() {
    const $body = z.object({
      refund: z.number().int().min(0),
      note: z.string().max(1_000).optional(),
    });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const body = $body.parse(await bodyAsJson(req));
        await disputes.resolve(id, await admin(req), body);
        return Response.json({ ok: true });
      },
    };
  });

  // Claims an owner wants back from a wallet that moved since (PLAN §30.7).
  router.get("/reverts", function listReverts() {
    const $return = z.array(z.object({
      _id: z.string(),
      ownerName: z.string().optional(),
      amount: z.number(),
      max: z.number().describe("The claim minus what was charged since"),
      claimedAt: z.date().optional(),
      transactions: z.array(z.object({
        type: z.string(),
        amount: z.number(),
        description: z.unknown().optional(),
        createdAt: z.date().optional(),
      })).describe("The wallet's movements since the claim"),
      createdAt: z.date(),
    }));

    return {
      shape: () => ({ return: $return }),
      handler: async () => {
        const rows = await claimRevertModel.find({ status: "pending" }, {
          sort: { createdAt: 1 },
          limit: 100,
        }).toArray();
        const [tenants, claims] = await Promise.all([
          tenantModel.find({ _id: { $in: rows.map((r) => r.owner) } }, {
            projection: { name: 1 },
          }).toArray(),
          earningModel.find({ _id: { $in: rows.map((r) => r.claim) } }, {
            projection: { createdAt: 1, walletReference: 1 },
          }).toArray(),
        ]);
        return Response.json(
          await Promise.all(rows.map(async (r) => {
            const claim = claims.find((c) => c._id.equals(r.claim));
            const since = claim
              ? await walletLedgerModel.find({
                tenant: r.owner,
                createdAt: { $gt: claim.createdAt },
                reference: { $ne: claim.walletReference },
              }, {
                projection: {
                  type: 1,
                  amount: 1,
                  description: 1,
                  createdAt: 1,
                },
                sort: { createdAt: 1 },
                limit: 100,
              }).toArray()
              : [];
            return {
              _id: r._id,
              ownerName: tenants.find((t) => t._id.equals(r.owner))?.name,
              amount: r.amount,
              max: r.max,
              claimedAt: claim?.createdAt,
              transactions: since.map((t) => ({
                type: String(t.type),
                amount: Number(t.amount),
                description: t.description,
                createdAt: t.createdAt,
              })),
              createdAt: r.createdAt,
            };
          })),
        );
      },
    };
  });

  router.post("/reverts/:id/decide", function decideRevert() {
    const $body = z.object({
      amount: z.number().int().min(0).describe("0 refuses"),
      note: z.string().max(500).optional(),
    });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const body = $body.parse(await bodyAsJson(req));
        await earnings.decideRevert(id, await admin(req), body);
        return Response.json({ ok: true });
      },
    };
  });

  // Abuse reports (PLAN §30.10).
  router.get("/reports", function listReports() {
    const $return = z.array(z.object({
      _id: z.string(),
      tenantName: z.string().optional(),
      machine: z.string().optional(),
      subscription: z.string().optional(),
      text: z.string(),
      createdAt: z.date(),
    }));

    return {
      shape: () => ({ return: $return }),
      handler: async () => {
        const rows = await abuseReportModel.find({ status: "open" }, {
          sort: { createdAt: 1 },
          limit: 200,
        }).toArray();
        const tenants = await tenantModel.find({
          _id: { $in: rows.map((r) => r.tenant) },
        }, { projection: { name: 1 } }).toArray();
        return Response.json(rows.map((r) => ({
          _id: r._id,
          tenantName: tenants.find((t) => t._id.equals(r.tenant))?.name,
          machine: r.machine,
          subscription: r.subscription,
          text: r.text,
          createdAt: r.createdAt,
        })));
      },
    };
  });

  router.post("/reports/:id/close", function closeReport() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        await abuseReportModel.updateOne({ _id: id }, {
          $set: { status: "closed" },
        });
        return Response.json({ ok: true });
      },
    };
  });
}).group("Admin");
