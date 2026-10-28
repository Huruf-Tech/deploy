import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import { tenantOwner } from "@/lib/billing/owner.ts";
import {
  disputes,
  payments,
  rentals as rentalService,
} from "@/lib/services.ts";
import { rate, reportAbuse } from "@/lib/market/market.ts";
import { rentalPlanModel } from "@/schemas/billing/plan.ts";
import { $subscription } from "@/schemas/billing/subscription.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import { disputeModel, machineRatingModel } from "@/schemas/billing/market.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";

/** A size on a machine (PLAN §30.5): an amount, or the whole machine. */
export const $size = z.object({
  vcpu: z.number().min(0.25).max(256),
  memMb: z.number().int().min(512),
  diskGb: z.number().int().min(5),
});

/**
 * Rented servers, the customer's side (PLAN §26, §30): requests from the
 * market, resizes, cancellation, an owner's move proposals, disputes,
 * ratings and abuse reports. Everyone in the workspace can look; only the
 * owner rents.
 */
export default new Router("/api", function rentals(router) {
  const owner = (req: Request) => tenantOwner(req, "rent servers");
  const $params = z.object({ id: $objectId });

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
        plan: z.object({
          _id: z.string(),
          name: z.string(),
          price: z.number().describe("Cents per month"),
        }).optional(),
        size: z.object({
          cpus: z.number(),
          memMb: z.number(),
          diskGb: z.number(),
        }),
        machine: z.object({
          _id: z.string(),
          name: z.string(),
        }).optional(),
        whole: z.boolean().optional(),
        term: z.object({
          months: z.number(),
          until: z.date().optional(),
        }).optional(),
        endAt: z.date().optional().describe("Its owner stops renting it then"),
        lostAt: z.date().optional().describe("Its machine left"),
        pendingChange: z.string().optional().describe(
          "The plan a resize waits for",
        ),
        rejectedReason: z.string().optional(),
        suspendedAt: z.date().optional(),
        held: z.boolean().optional().describe("Stopped by Huruf, not unpaid"),
        uptime: z.number().optional().describe("This period so far, percent"),
        moving: z.boolean().optional(),
        proposal: z.object({
          to: z.string(),
          toName: z.string().optional(),
          price: z.number(),
          expiresAt: z.date(),
          reason: z.string().optional(),
        }).optional().describe("A move its owner asks for (PLAN §30.8)"),
        dispute: z.boolean().optional().describe("A dispute is open"),
        matured: z.boolean().optional().describe(
          "A paid month has ended: it can be rated or disputed",
        ),
        stars: z.number().optional().describe("The rating given"),
      }),
    );

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        const subs = await rentalService.list(tenant._id);
        const ids = subs.map((s) => s._id);
        const [plans, uptimes, machines, open, stars, ended] = await Promise
          .all([
            rentalPlanModel.find({ _id: { $in: subs.map((s) => s.plan) } }, {
              projection: { name: 1, resources: 1, price: 1 },
            }).toArray(),
            rentalService.uptimes(subs),
            serverModel.find({
              _id: {
                $in: subs.flatMap((
                  s,
                ) => [s.rental?.host, s.rental?.proposal?.to])
                  .filter((x) => !!x),
              },
            }, { projection: { name: 1 } }).toArray(),
            disputeModel.find({ subscription: { $in: ids }, status: "open" }, {
              projection: { subscription: 1 },
            }).toArray(),
            machineRatingModel.find({ subscription: { $in: ids } }, {
              projection: { subscription: 1, stars: 1 },
            }).toArray(),
            subscriptionPeriodModel.distinct("subscription", {
              subscription: { $in: ids },
              kind: "paid",
              settled: { $exists: true },
            }),
          ]);
        const name = (id?: { equals(x: unknown): boolean }) =>
          id && machines.find((m) => id.equals(m._id))?.name;
        return Response.json(subs.map((s) => {
          const plan = plans.find((p) => p._id.equals(s.plan));
          const r = s.rental!;
          const live = !r.proposal || r.proposal.expiresAt > new Date();
          return {
            _id: s._id,
            status: s.status,
            cancelAtPeriodEnd: s.cancelAtPeriodEnd,
            currentPeriodEnd: s.currentPeriodEnd,
            lastError: s.lastError,
            startedAt: s.startedAt,
            server: s.server,
            plan: plan &&
              { _id: plan._id, name: plan.name, price: plan.price.amount },
            // What they bought; the partition adds its overhead on top.
            size: plan?.resources
              ? {
                cpus: plan.resources.vcpu,
                memMb: plan.resources.memMb,
                diskGb: plan.resources.diskGb,
              }
              : r.size,
            machine: r.host && { _id: r.host, name: name(r.host) ?? "Machine" },
            ...(r.whole ? { whole: true } : {}),
            term: r.term,
            endAt: r.endAt,
            lostAt: r.lostAt,
            pendingChange: r.pendingChange?.plan,
            rejectedReason: r.rejectedReason,
            suspendedAt: r.suspendedAt,
            ...(r.held ? { held: true } : {}),
            uptime: uptimes.get(String(s._id)),
            ...(r.move ? { moving: true } : {}),
            ...(r.proposal && live
              ? {
                proposal: {
                  to: r.proposal.to,
                  toName: name(r.proposal.to),
                  price: r.proposal.price,
                  expiresAt: r.proposal.expiresAt,
                  reason: r.proposal.reason,
                },
              }
              : {}),
            ...(open.some((d) => d.subscription.equals(s._id))
              ? { dispute: true }
              : {}),
            stars: stars.find((x) => x.subscription.equals(s._id))?.stars,
            ...(ended.some((x) => x.equals(s._id)) ? { matured: true } : {}),
          };
        }));
      },
    };
  });

  router.post("/request", function request() {
    const $body = $size.partial().extend({
      machine: $objectId,
      whole: z.boolean().optional(),
      termMonths: z.union([
        z.literal(1),
        z.literal(3),
        z.literal(6),
        z.literal(12),
      ]),
      waiveWithdrawal: z.boolean().describe(
        "Agrees it starts at once, so the paid month isn't refundable",
      ),
    }).refine(
      (b) => b.whole || (b.vcpu && b.memMb && b.diskGb),
      "Choose a size or the whole machine",
    );
    const $return = z.object({
      result: z.enum(["requested", "active", "pending"]),
      rental: z.string(),
      /** `pending`: the first month's top-up waits on the bank (3-D Secure). */
      topup: z.string().optional(),
      clientSecret: z.string().optional(),
    });

    return {
      shape: () => ({ body: $body, return: $return }),
      handler: async (req) => {
        const body = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await owner(req);
        await payments.requireCard(tenant._id);
        return Response.json(
          await rentalService.request(tenant._id, user._id, body),
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
      shape: () => ({ params: $params, body: $size }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const size = $size.parse(await bodyAsJson(req));
        const { tenant } = await owner(req);
        await rentalService.requestResize(tenant._id, id, size);
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

  // An owner's move proposal (PLAN §30.8): accept (to it, or to another
  // machine that accepts at once) or decline.
  router.post("/:id/proposal/accept", function acceptProposal() {
    const $body = z.object({ to: $objectId.optional() });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { to } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await owner(req);
        await rentalService.acceptProposal(tenant._id, user._id, id, to);
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/proposal/decline", function declineProposal() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await owner(req);
        await rentalService.declineProposal(tenant._id, id);
        return Response.json({ ok: true });
      },
    };
  });

  // Where an accepted proposal can go instead: the owner's choices.
  router.get("/:id/proposal/targets", function proposalTargets() {
    const $return = z.array(z.object({
      server: z.string(),
      name: z.string(),
      price: z.number().describe("Cents per month, from the renewal"),
    }));

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        const sub = await rentalService.list(tenant._id)
          .then((all) => all.find((s) => s._id.equals(id)));
        if (!sub?.rental?.proposal) throw Response.notFound("No move waiting");
        const { targets } = await rentalService.moveTargets(
          id,
          sub.rental.owner,
        );
        return Response.json(
          targets.filter((t) => t.fits).map(({ server, name, price }) => ({
            server,
            name,
            price,
          })),
        );
      },
    };
  });

  router.post("/:id/dispute", function dispute() {
    const $body = z.object({ reason: z.string().min(10).max(2_000) });
    const $return = z.object({ dispute: z.string() });

    return {
      shape: () => ({ params: $params, body: $body, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { reason } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await owner(req);
        return Response.json(
          await disputes.open(tenant._id, user._id, id, reason),
        );
      },
    };
  });

  router.post("/:id/rate", function rateMachine() {
    const $body = z.object({
      stars: z.number().int().min(1).max(5),
      comment: z.string().max(500).optional(),
    });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { stars, comment } = $body.parse(await bodyAsJson(req));
        const { tenant } = await owner(req);
        await rate(tenant._id, id, stars, comment);
        return Response.json({ ok: true });
      },
    };
  });

  // Abuse on a machine or rental (PLAN §30.10), from either side.
  router.post("/report", function report() {
    const $body = z.object({
      machine: $objectId.optional(),
      subscription: $objectId.optional(),
      text: z.string().min(10).max(2_000),
    }).refine((b) => b.machine || b.subscription, "Name a machine or rental");

    return {
      shape: () => ({ body: $body }),
      handler: async (req) => {
        const body = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        await reportAbuse({ ...body, tenant: tenant._id, by: user._id });
        return Response.json({ ok: true });
      },
    };
  });
}).group("Billing");
