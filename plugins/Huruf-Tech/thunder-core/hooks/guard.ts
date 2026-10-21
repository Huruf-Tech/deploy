import { THook } from "@/core/http/hooks.ts";
import { withAuthGuard } from "../utils/withAuthGuard.ts";
import { Response } from "@/core/http/response.ts";

export default {
  priority: 100000,
  pre: async (
    { req, scope, name },
  ) => {
    const { allow, role, subRoles } = await withAuthGuard(req);

    if (!allow(scope, name)) {
      throw Response.forbidden(
        `missing permission ${
          [scope, name].filter(Boolean).join(".")
        } for role ${role} and subRoles ${subRoles.join(", ")}`,
      );
    }
  },
} satisfies THook;
