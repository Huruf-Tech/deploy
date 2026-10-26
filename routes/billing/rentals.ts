import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson, queryAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import { tenantOwner } from "@/lib/billing/owner.ts";
import { payments, rentals as rentalService } from "@/lib/services.ts";
import { planModel } from "@/schemas/billing/plan.ts";
import { $serverClass } from "@/schemas/billing/serverClass.ts";
import { $subscription } from "@/schemas/billing/subscription.ts";

/** A size, or a custom amount in a class (PLAN §26.8). */
export const $rentalChoice = z.object({
  plan: $objectId.optional(),
  custom: z.object({
    class: $objectId,
    vcpu: z.number().min(0.5),
    memMb: z.number().int().min(512),
    diskGb: z.number().int().min(5),
  }).optional(),
}).refine((c) => !!c.plan !== !!c.custom, "Choose a size or a custom amount");

/**
 * Rented servers (PLAN §26): what can be rented, requests, resizes and
 * cancellation. Everyone in the workspace can look; only the owner rents.
 */
export default new Router("/api", function rentals(router) {
  const owner = (req: Request) => tenantOwner(req, "rent servers");
  const $params = z.object({ id: $objectId });

  router.get("/catalog", function catalog() {
    const $return = z.object({
      classes: z.array(
        $serverClass.omit({ family: true }).extend({ _id: z.string() }),
      ),
      sizes: z.array(z.object({
        _id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        class: z.string(),
        resources: z.object({
          vcpu: z.number(),
          memMb: z.number(),
          diskGb: z.number(),
          trafficGb: z.number(),
        }),
        price: z.object({
          amount: z.number(),
          currency: z.string(),
          interval: z.string(),
        }),
      })),
      overheadMb: z.number().describe(
        "Added to every partition, at the memory rate",
      ),
    });

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        const { classes, sizes, overheadMb } = await rentalService.catalog(
          tenant._id,
        );
        return Response.json({
          classes: classes.map(({ family: _, ...c }) => c),
          sizes: sizes.map((p) => ({
            _id: p._id,
            name: p.name,
            description: p.description,
            class: p.class,
            resources: p.resources,
            price: p.price,
          })),
          overheadMb,
        });
      },
    };
  });

  router.get("/quote", function quote() {
    const $query = z.object({
      class: $objectId,
      vcpu: z.coerce.number(),
      memMb: z.coerce.number().int(),
      diskGb: z.coerce.number().int(),
    });
    const $return = z.object({
      price: z.number().describe("Cents per month"),
      trafficGb: z.number().describe("Included per month"),
      overheadMb: z.number(),
    });

    return {
      shape: () => ({ query: $query, return: $return }),
      handler: async (req) => {
        const { class: cls, ...size } = $query.parse(queryAsJson(req));
        await withTenant(req);
        const { price, trafficGb, overheadMb } = await rentalService.quote(
          cls,
          size,
        );
        return Response.json({ price, trafficGb, overheadMb });
      },
    };
  });

  router.get("/", function list() {
    const $return = z.array(
      $subscription.pick({
        status: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
        lastError: true,
        startedAt: true,
      }).extend({
        _id: z.string(),
        server: z.string().optional(),
        plan: z.object({ _id: z.string(), name: z.string() }).optional(),
        size: z.object({
          cpus: z.number(),
          memMb: z.number(),
          diskGb: z.number(),
        }),
        pendingChange: z.string().optional().describe(
          "The plan a resize waits for",
        ),
        rejectedReason: z.string().optional(),
        suspendedAt: z.date().optional(),
      }),
    );

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        const subs = await rentalService.list(tenant._id);
        const plans = await planModel.find({
          _id: { $in: subs.map((s) => s.plan) },
        }, {
          projection: { name: 1 },
        }).toArray();
        return Response.json(subs.map((s) => {
          const plan = plans.find((p) => p._id.equals(s.plan));
          return {
            _id: s._id,
            status: s.status,
            cancelAtPeriodEnd: s.cancelAtPeriodEnd,
            currentPeriodEnd: s.currentPeriodEnd,
            lastError: s.lastError,
            startedAt: s.startedAt,
            server: s.server,
            plan: plan && { _id: plan._id, name: plan.name },
            size: s.rental!.size,
            pendingChange: s.rental!.pendingChange?.plan,
            rejectedReason: s.rental!.rejectedReason,
            suspendedAt: s.rental!.suspendedAt,
          };
        }));
      },
    };
  });

  router.post("/request", function request() {
    const $return = z.object({
      result: z.enum(["requested", "pending"]),
      rental: z.string(),
      /** `pending`: the first month's top-up waits on the bank (3-D Secure). */
      topup: z.string().optional(),
      clientSecret: z.string().optional(),
    });

    return {
      shape: () => ({ body: $rentalChoice, return: $return }),
      handler: async (req) => {
        const choice = $rentalChoice.parse(await bodyAsJson(req));
        const { tenant, user } = await owner(req);
        await payments.requireCard(tenant._id);
        return Response.json(
          await rentalService.request(tenant._id, user._id, choice),
        );
      },
    };
  });

  router.post("/:id/withdraw", function withdraw() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await owner(req);
        await rentalService.withdraw(tenant._id, id);
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/resize", function resize() {
    return {
      shape: () => ({ params: $params, body: $rentalChoice }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const choice = $rentalChoice.parse(await bodyAsJson(req));
        const { tenant } = await owner(req);
        await rentalService.requestResize(tenant._id, id, choice);
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/cancel", function cancel() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await owner(req);
        await rentalService.cancel(tenant._id, id);
        return Response.json({ ok: true });
      },
    };
  });
}).group("Billing");
