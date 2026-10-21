import { Router } from "@/core/http/router.ts";
import { createCRUD } from "@/core/utils/createCRUD.ts";
import {
  apiKeyInputSchema,
  apiKeyModel,
  apiKeySchema,
} from "@/schemas/apiKey.ts";
import { withAuthSession } from "@/utils/withAuthSession.ts";

export default new Router("/api", function apiKeys(router) {
  createCRUD({
    router,
    schema: apiKeySchema,
    insertSchema: apiKeyInputSchema,
    model: apiKeyModel,
  }, {
    projection: {
      secret: 0,
    },
    isolationFields: async (req) => {
      const { user } = await withAuthSession(req);

      return {
        createdBy: user._id,
      };
    },
  });
}).group("Developer");
