import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import { tenantOwner } from "@/lib/billing/owner.ts";
import { payments as paymentService } from "@/lib/services.ts";
import { $gatewayId, $paymentCard } from "@/schemas/billing/payment.ts";
import { cardIsValid, PAYMENTS_CURRENCY } from "@/lib/payments/payments.ts";

/**
 * Saved cards and the gateway webhooks (PLAN §25.5). Card data never comes
 * through here: the browser hands it to the gateway's own form, and we keep
 * the gateway's ids, brand, last 4 and expiry.
 */
export default new Router("/api", function payments(router) {
  const owner = (req: Request) => tenantOwner(req, "manage payment methods");
  const $params = z.object({ id: $objectId });

  const $card = $paymentCard.pick({
    brand: true,
    last4: true,
    expMonth: true,
    expYear: true,
    isDefault: true,
  }).extend({ _id: z.string(), expired: z.boolean() });

  const cardOut = (card: z.input<typeof $paymentCard> & { _id: unknown }) => ({
    _id: String(card._id),
    brand: card.brand,
    last4: card.last4,
    expMonth: card.expMonth,
    expYear: card.expYear,
    isDefault: card.isDefault,
    expired: !cardIsValid(card),
  });

  router.get("/config", function config() {
    const $return = z.object({
      configured: z.boolean(),
      gateway: $gatewayId,
      publishableKey: z.string(),
    });

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        await withTenant(req);
        const gateway = paymentService.primary;
        const configured = await gateway.isConfigured();
        return Response.json({
          configured,
          gateway: gateway.id,
          publishableKey: configured
            ? (await gateway.publicConfig()).publishableKey
            : "",
        });
      },
    };
  });

  // Every member: the balance and whether the tenant can use the platform.
  router.get("/summary", function summary() {
    const $return = z.object({
      balance: z.number(),
      currency: z.string(),
      hasCard: z.boolean(),
      /** The card gate applies: no valid card and not exempt. */
      cardRequired: z.boolean(),
      isOwner: z.boolean(),
    });

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant, user, owner } = await withTenant(req);
        const [balance, hasCard, cardRequired] = await Promise.all([
          paymentService.balance(tenant._id),
          paymentService.hasValidCard(tenant._id),
          paymentService.needsCard(tenant._id),
        ]);
        return Response.json({
          balance,
          currency: PAYMENTS_CURRENCY,
          hasCard,
          cardRequired,
          isOwner: user._id.equals(owner._id),
        });
      },
    };
  });

  router.get("/statement", function statement() {
    const $return = z.object({
      balance: z.number(),
      entries: z.array(z.object({
        _id: z.string(),
        type: z.string(),
        amount: z.number(),
        description: z.string().optional(),
        purpose: z.string().optional(),
        reference: z.string(),
        createdAt: z.date().optional(),
      })),
    });

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant } = await owner(req);
        const { balance, entries } = await paymentService.statement(
          tenant._id,
        );
        return Response.json({
          balance,
          entries: entries.map((e) => ({
            _id: String(e._id),
            type: e.type,
            amount: e.amount,
            // Descriptions can be per-language maps; English for now.
            description: typeof e.description === "string"
              ? e.description
              : e.description?.en ?? Object.values(e.description ?? {})[0],
            purpose: e.purpose,
            reference: e.reference,
            createdAt: e.createdAt,
          })),
        });
      },
    };
  });

  router.post("/add-funds", function addFunds() {
    const $body = z.object({
      amount: z.number().int().positive().describe("Cents"),
      // A fresh value per click; a repeat reuses the same charge.
      nonce: z.string().min(8).max(64),
    });
    const $return = z.object({
      status: z.enum(["completed", "pending"]),
      topup: z.string(),
      clientSecret: z.string().optional(),
    });

    return {
      shape: () => ({ body: $body, return: $return }),
      handler: async (req) => {
        const { amount, nonce } = $body.parse(await bodyAsJson(req));
        const { tenant } = await owner(req);
        return Response.json(
          await paymentService.addFunds(tenant._id, amount, nonce),
        );
      },
    };
  });

  router.get("/topups/:id", function topupStatus() {
    const $return = z.object({
      status: z.string(),
      amount: z.number(),
      error: z.string().optional(),
    });

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await owner(req);
        const row = await paymentService.topupStatus(tenant._id, id);
        if (!row) throw Response.notFound("Top-up not found");
        return Response.json({
          status: row.status,
          amount: row.amount,
          error: row.error,
        });
      },
    };
  });

  // The payment the bank wants confirmed (an off-session renewal).
  router.get("/flagged", function flaggedCharge() {
    const $return = z.object({
      charge: z.object({
        topup: z.string(),
        amount: z.number(),
        clientSecret: z.string(),
        cardRef: z.string(),
      }).nullable(),
    });

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant } = await owner(req);
        return Response.json({
          charge: await paymentService.flaggedCharge(tenant._id),
        });
      },
    };
  });

  router.get("/cards", function cards() {
    const $return = z.object({
      autoPay: z.boolean(),
      actionRequired: z.object({
        message: z.string(),
        at: z.date(),
      }).optional(),
      cards: z.array($card),
    });

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant } = await owner(req);
        const [account, cards] = await Promise.all([
          paymentService.account(tenant._id),
          paymentService.cards(tenant._id),
        ]);
        return Response.json({
          autoPay: account?.autoPay ?? true,
          actionRequired: account?.actionRequired
            ? {
              message: account.actionRequired.message,
              at: account.actionRequired.at,
            }
            : undefined,
          cards: cards.map(cardOut),
        });
      },
    };
  });

  router.post("/cards/setup", function setupCard() {
    const $return = z.object({
      clientSecret: z.string(),
      setupRef: z.string(),
    });

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant, user } = await owner(req);
        // As with servers (PLAN §20.3): an address we can reach first.
        if (!user.emailVerified) {
          throw Response.forbidden(
            "Verify your email address before adding a card",
          );
        }
        return Response.json(
          await paymentService.startCardSetup(tenant._id, {
            email: user.email,
            name: tenant.name,
          }),
        );
      },
    };
  });

  router.post("/cards/finish", function finishCard() {
    const $body = z.object({ setupRef: z.string().min(1).max(200) });

    return {
      shape: () => ({ body: $body, return: $card }),
      handler: async (req) => {
        const { setupRef } = $body.parse(await bodyAsJson(req));
        const { tenant } = await owner(req);
        return Response.json(
          cardOut(await paymentService.finishCardSetup(tenant._id, setupRef)),
        );
      },
    };
  });

  router.post("/cards/:id/default", function setDefaultCard() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await owner(req);
        await paymentService.setDefaultCard(tenant._id, id);
        return Response.json({ ok: true });
      },
    };
  });

  router.del("/cards/:id", function removeCard() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await owner(req);
        await paymentService.removeCard(tenant._id, id);
        return Response.json({ ok: true });
      },
    };
  });

  router.patch("/account", function updateAccount() {
    const $body = z.object({ autoPay: z.boolean() });

    return {
      shape: () => ({ body: $body }),
      handler: async (req) => {
        const { autoPay } = $body.parse(await bodyAsJson(req));
        const { tenant } = await owner(req);
        await paymentService.setAutoPay(tenant._id, autoPay);
        return Response.json({ ok: true });
      },
    };
  });

  // Public, signature-verified inside (PLAN §25.6). No shape: the raw body
  // must stay unread for the signature.
  router.post("/webhook/:gateway", function webhook() {
    const $webhookParams = z.object({ gateway: $gatewayId });

    return async (req) => {
      const { gateway } = $webhookParams.parse(paramsAsJson(req));
      await paymentService.handleWebhook(gateway, req);
      return Response.json({ received: true });
    };
  });
}).group("Billing");
