import { Router } from "@/core/http/router.ts";
import { Response } from "@/core/http/response.ts";
import { createCRUD } from "@/core/utils/createCRUD.ts";
import { Wallet } from "@/lib/wallet.ts";
import { walletTopupModel, walletTopupSchema } from "@/schemas/walletTopup.ts";
import { withTenant } from "@/utils/withTenant.ts";

export default new Router("/api", function walletTopups(router) {
  router.post("/webhook", function webhook() {
    return {
      // No shape: the raw body must stay unread so `onTopupWebhook` can verify
      // the gateway's signature over the exact bytes it sent.
      handler: async (req: Request) => {
        if (!Wallet.onTopupWebhook) {
          throw Response.notFound(
            "No wallet top-up webhook handler is configured!",
          );
        }

        const settlement = await Wallet.onTopupWebhook(req);

        // Nothing returned: an event this app does not care about. Acknowledge
        // it so the gateway stops redelivering.
        if (!settlement) return Response.ok();

        const { topup } = await Wallet.settleTopup(settlement);

        return Response.json({ status: topup.status });
      },
    };
  });

  createCRUD({
    router,
    schema: walletTopupSchema,
    model: walletTopupModel,
  }, {
    disable: {
      create: true,
      update: true,
      del: true,
    },
    isolationFields: async (req) => {
      const { tenant } = await withTenant(req);

      return {
        tenant: tenant._id,
      };
    },
  });
});
