import { Router } from "@/core/http/router.ts";
import { createCRUD } from "@/core/utils/createCRUD.ts";
import {
  oauthClientInputSchema,
  oauthClientModel,
  oauthClientSchema,
} from "@/schemas/oauthClient.ts";
import { ObjectId } from "mongodb";
import { withAuthSession } from "../utils/withAuthSession.ts";

export default new Router("/api", function oauthClients(router) {
  createCRUD({
    router,
    schema: oauthClientSchema,
    insertSchema: oauthClientInputSchema,
    model: oauthClientModel,
  }, {
    projection: {
      secret: 0,
    },
    isolationFields: async (req) => {
      const { user } = await withAuthSession(req);

      return {
        createdBy: new ObjectId(user._id),
      };
    },
  });
}).group("OAuth");
