import z from "zod";
import { Router } from "@/core/http/router.ts";
import { createCRUD } from "@/core/utils/createCRUD.ts";
import {
  accessControlPolicyInputSchema,
  accessControlPolicyModel,
  accessControlPolicySchema,
} from "@/schemas/accessControlPolicy.ts";
import { withAuthGuard } from "../utils/withAuthGuard.ts";

export default new Router("/api", function accessControlPolicies(router) {
  router.get("/me", function myPolicies() {
    const $return = z.object({
      role: z.string(),
      subRoles: z.array(z.string()),
      policies: z.array(accessControlPolicySchema),
    });

    return {
      shape: () => ({
        return: $return,
      }),
      handler: async (req: Request) => {
        const { role, subRoles, policies } = await withAuthGuard(req);

        return Response.json(
          { role, subRoles, policies } satisfies z.output<typeof $return>,
        );
      },
    };
  });

  createCRUD({
    router,
    schema: accessControlPolicySchema,
    insertSchema: accessControlPolicyInputSchema,
    model: accessControlPolicyModel,
  });
}).group("IAM");
