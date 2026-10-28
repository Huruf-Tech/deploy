import z from "zod";
import type { ObjectId } from "mongodb";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { tenantOwner } from "@/lib/billing/owner.ts";
import { rentals } from "@/lib/services.ts";
import { $machineView, machineView } from "@/lib/market/machineView.ts";
import { planModel } from "@/schemas/billing/plan.ts";
import { $rentPrices, serverModel } from "@/schemas/infrastructure/server.ts";

const $size = z.object({
  cpus: z.number(),
  memMb: z.number(),
  diskGb: z.number(),
});

/**
 * Renting machines out (PLAN §30), the owner's side: a machine's prices and
 * switches, requests and resizes to accept, ending a rental, proposing a
 * move, and revenue against cost. The workspace owner decides; members look.
 */
export default new Router("/api", function hosting(router) {
  const owner = (req: Request) => tenantOwner(req, "rent machines out");
  const $params = z.object({ id: $objectId });

  /** One of the tenant's machines, set up for partitions. */
  const machineOf = async (tenant: ObjectId, id: ObjectId) => {
    const doc = await serverModel.findOne({
      _id: id,
      tenant,
      "provider.kind": "machine",
    }, { projection: { name: 1, pool: 1 } });
    if (!doc?.pool) {
      throw Response.notFound("No machine set up for partitions with this id");
    }
    return doc;
  };

  router.get("/machines/:id", function machine() {
    const $return = $machineView;

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        const doc = await machineOf(tenant._id, id);
        return Response.json(await machineView({ ...doc, tenant: tenant._id }));
      },
    };
  });

  // Prices and switches (PLAN §30.3): for rent in the market, auto-accept,
  // taking new rentals, and what the machine costs its owner.
  router.patch("/machines/:id", function updateMachine() {
    const $body = z.object({
      rent: z.object({
        enabled: z.boolean(),
        autoAccept: z.boolean(),
        prices: $rentPrices,
      }).optional(),
      accepting: z.boolean().optional(),
      monthlyCost: z.number().int().min(0).optional(),
    });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const body = $body.parse(await bodyAsJson(req));
        const { tenant } = await owner(req);
        const doc = await machineOf(tenant._id, id);
        if (body.rent?.enabled && doc.pool!.status !== "ready") {
          throw Response.badRequest(
            "The machine isn't set up for partitions yet",
          );
        }
        await serverModel.updateOne({ _id: id, tenant: tenant._id }, {
          $set: Object.fromEntries(
            Object.entries(body).map(([k, v]) => [`pool.${k}`, v]),
          ),
        });
        return Response.json({ ok: true });
      },
    };
  });

  // Requests and resizes waiting for this workspace's machines (PLAN §30.5).
  router.get("/requests", function requests() {
    const $return = z.array(z.object({
      _id: z.string(),
      tenantName: z.string().optional(),
      status: z.string(),
      machine: z.string().optional(),
      machineName: z.string().optional(),
      plan: z.string().optional(),
      price: z.number().describe("Cents per month"),
      size: $size,
      whole: z.boolean().optional(),
      termMonths: z.number().optional(),
      resizeTo: z.object({
        plan: z.string(),
        price: z.number(),
      }).optional().describe("A resize asks for this"),
      requestedAt: z.date(),
    }));

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        const subs = await rentals.queue(tenant._id);
        const [tenants, plans, machines] = await Promise.all([
          tenantModel.find({ _id: { $in: subs.map((s) => s.tenant) } }, {
            projection: { name: 1 },
          }).toArray(),
          planModel.find({
            _id: {
              $in: subs.flatMap((s) => [s.plan, s.rental?.pendingChange?.plan])
                .filter((x) => !!x),
            },
          }, { projection: { name: 1, price: 1 } }).toArray(),
          serverModel.find({
            _id: { $in: subs.flatMap((s) => s.rental?.host ?? []) },
          }, { projection: { name: 1 } }).toArray(),
        ]);
        const plan = (id?: ObjectId) =>
          id && plans.find((p) => p._id.equals(id));
        return Response.json(subs.map((s) => {
          const r = s.rental!;
          const next = plan(r.pendingChange?.plan);
          return {
            _id: s._id,
            tenantName: tenants.find((t) => t._id.equals(s.tenant))?.name,
            status: s.status,
            machine: r.host,
            machineName: machines.find((m) => r.host?.equals(m._id))?.name,
            plan: plan(s.plan)?.name,
            price: plan(s.plan)?.price.amount ?? 0,
            size: r.size,
            ...(r.whole ? { whole: true } : {}),
            termMonths: r.term?.months,
            ...(next
              ? { resizeTo: { plan: next.name, price: next.price.amount } }
              : {}),
            requestedAt: r.pendingChange?.requestedAt ?? s.startedAt,
          };
        }));
      },
    };
  });

  const $reason = z.object({ reason: z.string().min(1).max(500) });

  router.post("/:id/accept", function accept() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant, user } = await owner(req);
        await rentals.approve(id, user._id, tenant._id);
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/decline", function decline() {
    return {
      shape: () => ({ params: $params, body: $reason }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { reason } = $reason.parse(await bodyAsJson(req));
        const { tenant } = await owner(req);
        await rentals.reject(id, reason, tenant._id);
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/resize/accept", function acceptResize() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant, user } = await owner(req);
        await rentals.approveResize(id, user._id, tenant._id);
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/resize/decline", function declineResize() {
    return {
      shape: () => ({ params: $params, body: $reason }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { reason } = $reason.parse(await bodyAsJson(req));
        const { tenant } = await owner(req);
        await rentals.rejectResize(id, reason, tenant._id);
        return Response.json({ ok: true });
      },
    };
  });

  // Stops renting one rental out: it ends after its term and paid month.
  router.post("/:id/end", function end() {
    const $return = z.object({ endAt: z.date() });

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await owner(req);
        return Response.json(await rentals.end(tenant._id, id));
      },
    };
  });

  // Where a rental could move to: the owner's machines, or ones accepting at once.
  router.get("/:id/move", function moveTargets() {
    const $return = z.object({
      from: z.string().optional(),
      moving: z.boolean(),
      downtimeSec: z.number(),
      targets: z.array(z.object({
        server: z.string(),
        name: z.string(),
        fits: z.boolean(),
        price: z.number().describe("Cents per month there"),
        own: z.boolean(),
        reachable: z.boolean(),
      })),
    });

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        await rentals.ownedRental(tenant._id, id);
        const out = await rentals.moveTargets(id, tenant._id);
        return Response.json({
          ...out,
          targets: out.targets.map((t) => ({
            server: t.server,
            name: t.name,
            fits: t.fits,
            price: t.price,
            own: t.own,
            reachable: t.reachable,
          })),
        });
      },
    };
  });

  // Asks the customer to move (PLAN §30.8); they answer within 72 hours.
  router.post("/:id/propose", function propose() {
    const $body = z.object({
      to: $objectId,
      reason: z.string().max(500).optional(),
    });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { to, reason } = $body.parse(await bodyAsJson(req));
        const { tenant } = await owner(req);
        await rentals.propose(tenant._id, id, to, reason);
        return Response.json({ ok: true });
      },
    };
  });

  // The workspace's machines for rent: capacity, revenue and cost.
  router.get("/capacity", function capacity() {
    const $return = z.object({
      machines: z.array(z.object({
        _id: z.string(),
        name: z.string(),
        forRent: z.boolean(),
        accepting: z.boolean(),
        allocatable: $size,
        rentedMemMb: z.number(),
        ownMemMb: z.number(),
        freeMemMb: z.number(),
        rentals: z.number(),
        revenue: z.number(),
        cost: z.number(),
      })),
    });

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        const out = await rentals.capacity(tenant._id);
        return Response.json({
          machines: out.machines.map(({ tenant: _, ...m }) => m),
        });
      },
    };
  });
}).group("Billing");
