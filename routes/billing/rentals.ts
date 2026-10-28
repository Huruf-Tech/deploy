import z from "zod";
import type { ObjectId } from "mongodb";
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
import { platformTenantId } from "@/lib/billing/platform.ts";
import { readNumberSetting } from "@/lib/core/settings.ts";
import { rentalPlanModel } from "@/schemas/billing/plan.ts";
import { $subscription } from "@/schemas/billing/subscription.ts";
import { subscriptionPeriodModel } from "@/schemas/billing/subscriptionPeriod.ts";
import { disputeModel, machineRatingModel } from "@/schemas/billing/market.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";

/** What starts at a rental's renewal: a smaller size, or a move's price. */
const nextOf = (
  s: { nextPlan?: ObjectId; currentPeriodEnd?: Date },
  plans: { _id: ObjectId; name: string; price: { amount: number } }[],
) => {
  const next = s.nextPlan && plans.find((p) => p._id.equals(s.nextPlan!));
  return next && s.currentPeriodEnd
    ? {
      nextSize: {
        plan: next.name,
        price: next.price.amount,
        at: s.currentPeriodEnd,
      },
    }
    : {};
};

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
        resizeTo: z.string().optional().describe(
          "The size a waiting resize asks for",
        ),
        nextSize: z.object({
          plan: z.string(),
          price: z.number(),
          at: z.date(),
        }).optional().describe(
          "A smaller size (or a move's price) that starts at the renewal",
        ),
        rejectedReason: z.string().optional(),
        resizing: z.boolean().optional().describe(
          "A resize is applying on its machine",
        ),
        resizeError: z.string().optional().describe(
          "Its machine couldn't apply the latest resize",
        ),
        amountDue: z.number().optional().describe(
          "Cents its renewal needs, when it couldn't be charged",
        ),
        pastDueSince: z.date().optional(),
        stopsAt: z.date().optional().describe(
          "Unpaid: when it's stopped (suspended)",
        ),
        deletedAt: z.date().optional().describe(
          "Suspended for non-payment: when it's deleted with its data",
        ),
        suspendedAt: z.date().optional(),
        held: z.boolean().optional().describe("Stopped by Huruf, not unpaid"),
        uptime: z.number().optional().describe("This period so far, percent"),
        moving: z.boolean().optional(),
        consentVersion: z.string().optional().describe(
          "The community consent's version the renter accepted",
        ),
        proposal: z.object({
          to: z.string(),
          toName: z.string().optional(),
          community: z.boolean(),
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
        const [plans, uptimes, machines, open, stars, ended, resizes] =
          await Promise.all([
            rentalPlanModel.find({
              _id: {
                $in: subs.flatMap((
                  s,
                ) => [s.plan, s.rental?.pendingChange?.plan, s.nextPlan])
                  .filter((x) => !!x),
              },
            }, {
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
            }, { projection: { name: 1, tenant: 1 } }).toArray(),
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
            rentalService.resizeStates(subs),
          ]);
        const platform = await platformTenantId();
        const communityOwners = new Set(
          machines.filter((m) => !platform || !m.tenant.equals(platform))
            .map((m) => String(m.tenant)),
        );
        const name = (id?: { equals(x: unknown): boolean }) =>
          id && machines.find((m) => id.equals(m._id))?.name;
        const [graceDays, retentionDays] = await Promise.all([
          readNumberSetting("SHARED_GRACE_DAYS", 3),
          readNumberSetting("SHARED_RETENTION_DAYS", 14),
        ]);
        const later = (d: Date | undefined, days: number) =>
          d && new Date(d.getTime() + days * 86_400_000);
        // What each unpaid renewal needs, for its Pay now.
        const due = new Map(
          await Promise.all(
            subs.filter((s) =>
              (s.status === "pastDue" || s.status === "suspended") &&
              !s.rental?.held
            ).map(async (s) =>
              [String(s._id), await rentalService.amountDue(s)] as const
            ),
          ),
        );
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
            resizeTo: r.pendingChange &&
              plans.find((p) => r.pendingChange!.plan.equals(p._id))?.name,
            ...nextOf(s, plans),
            rejectedReason: r.rejectedReason,
            ...resizes.get(String(s._id)),
            amountDue: due.get(String(s._id)),
            pastDueSince: s.pastDueSince,
            ...(s.status === "pastDue"
              ? { stopsAt: later(s.pastDueSince, graceDays) }
              : {}),
            ...(s.status === "suspended" && !r.held
              ? { deletedAt: later(r.suspendedAt, retentionDays) }
              : {}),
            suspendedAt: r.suspendedAt,
            ...(r.held ? { held: true } : {}),
            uptime: uptimes.get(String(s._id)),
            ...(r.move ? { moving: true } : {}),
            ...(r.proposal && live && !r.move
              ? {
                proposal: {
                  to: r.proposal.to,
                  toName: name(r.proposal.to),
                  community: communityOwners.has(
                    String(
                      machines.find((m) => r.proposal!.to.equals(m._id))
                        ?.tenant,
                    ),
                  ),
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
            consentVersion: r.communityConsent?.version,
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
      communityConsent: z.string().optional().describe(
        "A community machine: the version of the consent accepted (its owner can access the data; the renter answers for its leak or loss)",
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

  // Pays a renewal that couldn't be charged, the customer present.
  router.post("/:id/pay", function pay() {
    const $return = z.object({
      result: z.enum(["active", "pending"]),
      /** `pending`: the bank wants the customer to confirm (3-D Secure). */
      topup: z.string().optional(),
      clientSecret: z.string().optional(),
    });

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await owner(req);
        return Response.json(await rentalService.payNow(tenant._id, id));
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

  // Takes back a resize its owner hasn't accepted yet.
  router.post("/:id/resize/withdraw", function withdrawResize() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await owner(req);
        await rentalService.withdrawResize(tenant._id, id);
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
    const $body = z.object({
      to: $objectId.optional(),
      communityConsent: z.string().optional().describe(
        "Moving onto a community machine: the consent's version accepted",
      ),
    });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { to, communityConsent } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await owner(req);
        await rentalService.acceptProposal(
          tenant._id,
          user._id,
          id,
          to,
          communityConsent,
        );
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
      community: z.boolean().describe("A community machine, not Huruf's"),
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
          targets.flatMap((t) =>
            t.fits
              ? [{
                server: t.server,
                name: t.name,
                price: t.price,
                community: t.community,
              }]
              : []
          ),
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
