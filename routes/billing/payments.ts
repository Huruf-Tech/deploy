import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import { tenantOwner } from "@/lib/billing/owner.ts";
import { payments as paymentService } from "@/lib/services.ts";
import { $gatewayId, $paymentCard } from "@/schemas/billing/payment.ts";
import { cardIsValid } from "@/lib/payments/payments.ts";

/**
 * Saved cards and the gateway webhooks (PLAN §25.5). Card data never comes
 * through here: the browser hands it to the gateway's own form, and we keep
 * the gateway's ids, brand, last 4 and expiry.
 */
export default new Router("/api", function payments(router) {
  const owner = (req: Request) => tenantOwner(req, "manage payment methods");

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

  const $params = z.object({ id: $objectId });

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
