import z from "zod";
import { Router } from "@/core/http/router.ts";
import { paramsAsJson, queryAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withAuthSession } from "@/plugins/Huruf-Tech/thunder-core/utils/withAuthSession.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import {
  TopupStatus,
  walletTopupModel,
} from "@/plugins/Huruf-Tech/thunder-core/schemas/walletTopup.ts";
import { payments } from "@/lib/services.ts";
import { stuckTopups } from "@/lib/payments/payments.ts";
import { paymentEventModel } from "@/schemas/billing/payment.ts";

const names = async (ids: (z.infer<typeof $objectId> | undefined)[]) => {
  const tenants = await tenantModel.find(
    { _id: { $in: ids.filter((id) => !!id) } },
    { projection: { name: 1 } },
  ).toArray();
  return (id?: z.infer<typeof $objectId>) =>
    id ? tenants.find((t) => t._id.equals(id))?.name : undefined;
};

/**
 * Admin → Payments (PLAN §25.5, Phase 15d): top-ups across tenants with
 * Settle and Abandon for stuck ones, and refunds and disputes to act on in the
 * gateway. Root only: no member policy grants this router.
 */
export default new Router("/api", function paymentsAdmin(router) {
  const $params = z.object({ id: $objectId });

  router.get("/topups", function topups() {
    const $query = z.object({
      status: z.enum([...Object.values(TopupStatus), "stuck"]).optional()
        .describe("A status, or `stuck` for the rows Settle/Abandon apply to"),
      limit: z.coerce.number().int().min(1).max(200).default(100),
    });
    const $return = z.array(z.object({
      _id: z.string(),
      tenant: z.string(),
      tenantName: z.string().optional(),
      status: z.enum(TopupStatus),
      amount: z.number(),
      currency: z.string(),
      provider: z.string().optional(),
      providerRef: z.string().optional(),
      purpose: z.string().optional(),
      error: z.string().optional(),
      stuck: z.boolean(),
      createdAt: z.date().optional(),
      updatedAt: z.date().optional(),
    }));

    return {
      shape: () => ({ query: $query, return: $return }),
      handler: async (req) => {
        const { status, limit } = $query.parse(queryAsJson(req));
        const stuck = stuckTopups();
        const rows = await walletTopupModel.find(
          status === "stuck" ? stuck : status ? { status } : {},
          { sort: { createdAt: -1 }, limit },
        ).toArray();
        const stuckIds = new Set(
          (await walletTopupModel.find(
            { _id: { $in: rows.map((r) => r._id) }, ...stuck },
            { projection: { _id: 1 } },
          ).toArray()).map((r) => String(r._id)),
        );
        const tenantName = await names(rows.map((r) => r.tenant));
        return Response.json(rows.map((r) => ({
          _id: r._id,
          tenant: r.tenant,
          tenantName: tenantName(r.tenant),
          status: r.status,
          amount: r.amount,
          currency: r.currency,
          provider: r.provider,
          providerRef: r.providerRef,
          // What it paid for: Add funds, a plan, a renewal.
          purpose: r.idempotencyKey?.split(":")[0],
          error: r.error,
          stuck: stuckIds.has(String(r._id)),
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })));
      },
    };
  });

  router.post("/topups/:id/settle", function settle() {
    const $return = z.object({
      outcome: z.enum(["settled", "waiting", "owner", "no_charge"]),
      status: z.string(),
      error: z.string().optional(),
    });

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        return Response.json(await payments.settleStuck(id));
      },
    };
  });

  router.post("/topups/:id/abandon", function abandon() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        await payments.abandonStuck(id);
        return Response.json({ ok: true });
      },
    };
  });

  router.get("/events", function events() {
    const $query = z.object({
      limit: z.coerce.number().int().min(1).max(200).default(100),
    });
    const $return = z.array(z.object({
      _id: z.string(),
      kind: z.enum(["refund", "dispute"]),
      tenant: z.string().optional(),
      tenantName: z.string().optional(),
      gateway: z.string(),
      providerRef: z.string().optional(),
      amount: z.number().optional(),
      currency: z.string().optional(),
      processedAt: z.date(),
      handledAt: z.date().optional(),
    }));

    return {
      shape: () => ({ query: $query, return: $return }),
      handler: async (req) => {
        const { limit } = $query.parse(queryAsJson(req));
        const rows = await paymentEventModel.find(
          { kept: true },
          { sort: { processedAt: -1 }, limit },
        ).toArray();
        const tenantName = await names(rows.map((r) => r.tenant));
        return Response.json(rows.map((r) => ({
          _id: r._id,
          kind: r.type.includes("dispute") ? "dispute" : "refund",
          tenant: r.tenant,
          tenantName: tenantName(r.tenant),
          gateway: r.gateway,
          providerRef: r.providerRef,
          amount: r.amount,
          currency: r.currency,
          processedAt: r.processedAt,
          handledAt: r.handledAt,
        })));
      },
    };
  });

  router.post("/events/:id/handled", function markHandled() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { user } = await withAuthSession(req);
        await payments.markHandled(id, user._id);
        return Response.json({ ok: true });
      },
    };
  });
}).group("Admin");
