import { Router } from "@/core/http/router.ts";
import { createCRUD } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import {
  $projectGroup,
  projectGroupModel,
} from "@/schemas/applications/project.ts";

/** Organizational grouping of projects (PLAN §5). */
export default new Router("/api", function projectGroups(router) {
  createCRUD({
    router,
    schema: $projectGroup,
    insertSchema: $projectGroup.omit({ tenant: true }),
    model: projectGroupModel,
  }, {
    isolationFields: async (req) => ({
      tenant: (await withTenant(req)).tenant._id,
    }),
  });
}).group("Applications");
