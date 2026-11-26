import { Router } from "@/core/http/router.ts";
import { createCRUD } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import {
  $serverGroup,
  serverGroupModel,
  serverModel,
} from "@/schemas/infrastructure/server.ts";

/** Folders on the Servers page (PLAN §5), as projects have. */
export default new Router("/api", function serverGroups(router) {
  createCRUD({
    router,
    schema: $serverGroup,
    insertSchema: $serverGroup.omit({ tenant: true }),
    model: serverGroupModel,
  }, {
    isolationFields: async (req) => ({
      tenant: (await withTenant(req)).tenant._id,
    }),
    hooks: {
      // The folder goes; its servers stay, outside any folder.
      beforeDel: async ({ _id, session }, req) => {
        await serverModel.updateMany(
          { tenant: (await withTenant(req)).tenant._id, group: _id },
          { $unset: { group: "" } },
          { session },
        );
      },
    },
  });
}).group("Infrastructure");
