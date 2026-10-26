import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withAuthSession } from "@/plugins/Huruf-Tech/thunder-core/utils/withAuthSession.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { rentals as rentalService } from "@/lib/services.ts";
import { createPartition, makePoolMachine } from "@/lib/pool/pool.ts";
import { readTextSetting } from "@/lib/core/settings.ts";
import { planModel } from "@/schemas/billing/plan.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import { serverClassModel } from "@/schemas/billing/serverClass.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { ObjectId } from "mongodb";

/**
 * Admin side of rentals (PLAN §26.8): the queue of requests and resizes,
 * placement on pool machines, approval, and the pool machines themselves.
 * Root only: no member policy grants this router.
 */
export default new Router("/api", function rentalsAdmin(router) {
  const $params = z.object({ id: $objectId });
  const admin = async (req: Request) => (await withAuthSession(req)).user._id;

  router.get("/queue", function queue() {
    const $return = z.array(z.object({
      _id: z.string(),
      tenant: z.string(),
      tenantName: z.string().optional(),
      status: z.string(),
      plan: z.string().optional().describe("Plan name"),
      size: z.object({
        cpus: z.number(),
        memMb: z.number(),
        diskGb: z.number(),
      }),
      resizeTo: z.string().optional().describe("The size a resize asks for"),
      requestedAt: z.date(),
    }));

    return {
      shape: () => ({ return: $return }),
      handler: async () => {
        const subs = await rentalService.queue();
        const [tenants, plans] = await Promise.all([
          tenantModel.find({ _id: { $in: subs.map((s) => s.tenant) } }, {
            projection: { name: 1 },
          }).toArray(),
          planModel.find({
            _id: {
              $in: subs.flatMap((s) => [s.plan, s.rental?.pendingChange?.plan])
                .filter((x) => !!x),
            },
          }, { projection: { name: 1 } }).toArray(),
        ]);
        const name = (id?: ObjectId) =>
          id && plans.find((p) => p._id.equals(id))?.name;
        return Response.json(subs.map((s) => ({
          _id: s._id,
          tenant: s.tenant,
          tenantName: tenants.find((t) => t._id.equals(s.tenant))?.name,
          status: s.status,
          plan: name(s.plan),
          size: s.rental!.size,
          resizeTo: name(s.rental!.pendingChange?.plan),
          requestedAt: s.rental!.pendingChange?.requestedAt ?? s.updatedAt,
        })));
      },
    };
  });

  router.get("/:id/placement", function placement() {
    const $return = z.array(z.object({
      server: z.string(),
      name: z.string(),
      free: z.object({ memMb: z.number(), diskGb: z.number() }),
      cpuRoom: z.number(),
      fits: z.boolean(),
      remainderShort: z.boolean(),
      remainderUsesMb: z.number().optional(),
    }));

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        return Response.json(await rentalService.placement(id));
      },
    };
  });

  router.post("/:id/approve", function approve() {
    const $body = z.object({ host: $objectId });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { host } = $body.parse(await bodyAsJson(req));
        await rentalService.approve(id, host, await admin(req));
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/reject", function reject() {
    const $body = z.object({ reason: z.string().min(1).max(500) });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { reason } = $body.parse(await bodyAsJson(req));
        await rentalService.reject(id, reason);
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/resize/approve", function approveResize() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        await rentalService.approveResize(id, await admin(req));
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/resize/reject", function rejectResize() {
    const $body = z.object({ reason: z.string().min(1).max(500) });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { reason } = $body.parse(await bodyAsJson(req));
        await rentalService.rejectResize(id, reason);
        return Response.json({ ok: true });
      },
    };
  });

  // Re-creates an approved rental's partition (e.g. its create failed).
  router.post("/:id/partition", function recreatePartition() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const sub = await subscriptionModel.findOne({
          _id: id,
          kind: "server",
          status: { $in: ["active", "pastDue"] },
          server: { $exists: false },
        });
        if (!sub?.rental) {
          throw Response.badRequest("No approved rental without a server");
        }
        await rentalService.createPartitionFor(
          { ...sub, rental: sub.rental },
          await admin(req),
        );
        return Response.json({ ok: true });
      },
    };
  });

  // Pool machines (PLAN §26.5): prepare one, set its class, add Huruf's partition.
  router.post("/pool/:id/ensure", function ensurePool() {
    const $body = z.object({
      device: z.string().max(100).optional(),
      loopSizeGb: z.number().int().min(10).optional(),
    }).refine((v) => !!v.device !== !!v.loopSizeGb, "A device or a loop size");

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const volume = $body.parse(await bodyAsJson(req));
        await makePoolMachine({
          server: id,
          volume,
          createdBy: await admin(req),
        });
        return Response.json({ ok: true });
      },
    };
  });

  router.patch("/pool/:id", function updatePool() {
    const $body = z.object({
      class: $objectId.optional(),
      accepting: z.boolean().optional(),
      monthlyCost: z.number().int().min(0).optional(),
    });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const body = $body.parse(await bodyAsJson(req));
        if (
          body.class &&
          !await serverClassModel.countDocuments({ _id: body.class })
        ) {
          throw Response.notFound("Server class not found");
        }
        const { matchedCount } = await serverModel.updateOne(
          { _id: id, "pool.status": { $exists: true } },
          {
            $set: Object.fromEntries(
              Object.entries(body).map(([k, v]) => [`pool.${k}`, v]),
            ),
          },
        );
        if (!matchedCount) {
          throw Response.notFound("No pool machine with this id");
        }
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/pool/:id/remainder", function createRemainder() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const platform = await readTextSetting("PLATFORM_TENANT", "");
        await createPartition({
          host: id,
          name: "huruf",
          tenant: new ObjectId(platform),
          remainder: true,
          createdBy: await admin(req),
        });
        return Response.json({ ok: true });
      },
    };
  });
}).group("Admin");
