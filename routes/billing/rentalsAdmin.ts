import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withAuthSession } from "@/plugins/Huruf-Tech/thunder-core/utils/withAuthSession.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { rentals as rentalService } from "@/lib/services.ts";
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

  // Moving a rental to another pool machine (PLAN §26.10).
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
        remainderShort: z.boolean(),
        remainderUsesMb: z.number().optional(),
        reachable: z.boolean().describe("Over the private network"),
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
        class: z.string().optional(),
        accepting: z.boolean(),
        allocatable: z.object({
          cpus: z.number(),
          memMb: z.number(),
          diskGb: z.number(),
        }),
        rentedMemMb: z.number(),
        ownMemMb: z.number().describe("The platform's own partitions"),
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

  // A server's pool state for its page (PLAN §26.8): whether it can be one
  // (the platform's servers only), and the rentals on it with their prices.
  router.get("/pool/:id", function pool() {
    const $return = z.object({
      platform: z.boolean(),
      rentals: z.array(z.object({
        _id: z.string(),
        partition: z.string().optional(),
        tenantName: z.string().optional(),
        plan: z.string().optional(),
        price: z.number().describe("Cents per month"),
        status: z.string(),
        uptime: z.number().optional().describe("This period so far, percent"),
        overDisk: z.number().optional().describe(
          "Bytes used, when more than its size",
        ),
        moving: z.object({
          to: z.string(),
          toName: z.string().optional(),
          startedAt: z.date(),
        }).optional(),
        lastMove: z.object({
          from: z.string(),
          to: z.string(),
          at: z.date(),
          error: z.string().optional(),
        }).optional(),
      })),
      revenue: z.number().describe("Cents per month from live rentals"),
    });

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const server = await serverModel.findOne({ _id: id }, {
          projection: { tenant: 1 },
        });
        if (!server) throw Response.notFound("Server not found");
        const platform = server.tenant.toHexString() ===
          await readTextSetting("PLATFORM_TENANT", "");
        const subs = platform
          ? await subscriptionModel.find({
            kind: "server",
            "rental.host": id,
            status: { $in: ["active", "pastDue", "suspended"] },
          }, { limit: 200 }).toArray()
          : [];
        const [tenants, plans, uptimes, targets] = await Promise.all([
          tenantModel.find({ _id: { $in: subs.map((s) => s.tenant) } }, {
            projection: { name: 1 },
          }).toArray(),
          planModel.find({ _id: { $in: subs.map((s) => s.plan) } }, {
            projection: { name: 1, price: 1 },
          }).toArray(),
          rentalService.uptimes(subs),
          serverModel.find({
            _id: { $in: subs.flatMap((s) => s.rental?.move?.to ?? []) },
          }, { projection: { name: 1 } }).toArray(),
        ]);
        const rows = subs.map((s) => {
          const plan = plans.find((p) => p._id.equals(s.plan));
          const move = s.rental?.move;
          return {
            _id: s._id,
            partition: s.rental?.partition,
            tenantName: tenants.find((t) => t._id.equals(s.tenant))?.name,
            plan: plan?.name,
            price: plan?.price.amount ?? 0,
            status: s.status,
            uptime: uptimes.get(String(s._id)),
            ...(s.rental?.overDisk
              ? { overDisk: s.rental.overDisk.bytes }
              : {}),
            ...(move
              ? {
                moving: {
                  to: String(move.to),
                  toName: targets.find((m) => m._id.equals(move.to))?.name,
                  startedAt: move.startedAt,
                },
              }
              : {}),
            ...(s.rental?.lastMove ? { lastMove: s.rental.lastMove } : {}),
          };
        });
        return Response.json({
          platform,
          rentals: rows,
          revenue: rows.filter((r) => r.status !== "suspended")
            .reduce((sum, r) => sum + r.price, 0),
        });
      },
    };
  });

  // A platform machine is for rent once it has a class (PLAN §28): its
  // class, whether it takes new rentals (draining), and its cost.
  router.patch("/pool/:id", function updatePool() {
    const $body = z.object({
      class: $objectId.nullable().optional().describe("null: not for rent"),
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
        const { class: cls, ...rest } = body;
        const { matchedCount } = await serverModel.updateOne(
          {
            _id: id,
            tenant: new ObjectId(await readTextSetting("PLATFORM_TENANT", "")),
            "pool.status": { $exists: true },
          },
          {
            $set: Object.fromEntries(
              Object.entries({
                ...rest,
                ...(cls ? { class: cls } : {}),
              }).map(([k, v]) => [`pool.${k}`, v]),
            ),
            ...(cls === null ? { $unset: { "pool.class": "" } } : {}),
          },
        );
        if (!matchedCount) {
          throw Response.notFound("No machine of the platform with this id");
        }
        return Response.json({ ok: true });
      },
    };
  });
}).group("Admin");
