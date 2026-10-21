import { Router } from "@/core/http/router.ts";
import { createCRUD } from "@/core/utils/createCRUD.ts";
import {
  walletLedgerModel,
  walletLedgerSchema,
} from "@/schemas/walletLedger.ts";
import { withTenant } from "@/utils/withTenant.ts";

export default new Router("/api", function walletLedgers(router) {
  createCRUD({
    router,
    schema: walletLedgerSchema,
    model: walletLedgerModel,
  }, {
    disable: {
      create: true,
      update: true,
      del: true,
    },
    isolationFields: async (req) => {
      // Remove this function or return isolation fields
      const { tenant } = await withTenant(req);

      return {
        tenant: tenant._id,
      };
    },
  });
});
