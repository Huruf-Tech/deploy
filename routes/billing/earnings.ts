import z from "zod";
import { ObjectId } from "mongodb";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import { tenantOwner } from "@/lib/billing/owner.ts";
import { earnings as earningService } from "@/lib/services.ts";
import { claimRevertModel, earningModel } from "@/schemas/billing/market.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";

/**
 * A machine owner's earnings (PLAN §30.7): balances, the ledger, claiming
 * into the wallet and taking a claim back. The workspace owner claims.
 */
export default new Router("/api", function earnings(router) {
  const owner = (req: Request) => tenantOwner(req, "claim earnings");
  const $params = z.object({ id: $objectId });

  router.get("/", function summary() {
    const $return = z.object({
      available: z.number().describe("Cents claimable now"),
      frozen: z.number().describe("Released but frozen by an open dispute"),
      held: z.number().describe("Waiting its 14 days"),
      pending: z.number().describe("Expected from the running months"),
      security: z.array(z.object({
        machine: z.string(),
        name: z.string().optional(),
        amount: z.number(),
      })),
      entries: z.array(z.object({
        _id: z.string(),
        type: z.string(),
        bucket: z.string(),
        amount: z.number(),
        machine: z.string().optional(),
        availableAt: z.date(),
        createdAt: z.date(),
        /** Claims: whether it was taken back, or waits for an admin. */
        revert: z.enum(["done", "pending", "rejected"]).optional(),
      })),
    });

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        const sum = await earningService.summary(tenant._id);
        const [entries, reverts] = await Promise.all([
          earningModel.find({ owner: tenant._id }, {
            sort: { createdAt: -1 },
            limit: 100,
          }).toArray(),
          claimRevertModel.find({ owner: tenant._id }, {
            projection: { claim: 1, status: 1 },
            limit: 200,
          }).toArray(),
        ]);
        const machines = await serverModel.find({
          _id: { $in: sum.security.map((s) => new ObjectId(s.machine)) },
        }, { projection: { name: 1 } }).toArray();
        const reverted = new Set(
          entries.filter((e) => e.type === "revert").map((e) => e.key),
        );
        return Response.json({
          ...sum,
          security: sum.security.map((s) => ({
            ...s,
            name: machines.find((m) => String(m._id) === s.machine)?.name,
          })),
          entries: entries.map((e) => {
            const request = reverts.find((r) => r.claim.equals(e._id));
            const revert = e.type !== "claim"
              ? undefined
              : reverted.has(`revert:${e._id}`) ||
                  request?.status === "approved"
              ? "done" as const
              : request?.status;
            return {
              _id: e._id,
              type: e.type,
              bucket: e.bucket,
              amount: e.amount,
              machine: e.machine,
              availableAt: e.availableAt,
              createdAt: e.createdAt,
              ...(revert ? { revert } : {}),
            };
          }),
        });
      },
    };
  });

  router.post("/claim", function claim() {
    const $body = z.object({ amount: z.number().int().min(1) });
    const $return = z.object({ claim: z.string() });

    return {
      shape: () => ({ body: $body, return: $return }),
      handler: async (req) => {
        const { amount } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await owner(req);
        return Response.json(
          await earningService.claim(tenant._id, user._id, amount),
        );
      },
    };
  });

  router.post("/claims/:id/revert", function revert() {
    const $return = z.object({
      result: z.enum(["reverted", "requested"]),
      amount: z.number().describe(
        "Cents: taken back, or the most an admin can",
      ),
    });

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant, user } = await owner(req);
        return Response.json(
          await earningService.revert(tenant._id, user._id, id),
        );
      },
    };
  });
}).group("Billing");
