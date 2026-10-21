import { Router } from "@/core/http/router.ts";
import { createCRUD } from "@/core/utils/createCRUD.ts";
import {
  tenantInviteInputSchema,
  tenantInviteModel,
  tenantInviteSchema,
} from "@/schemas/tenantInvite.ts";
import { withTenant } from "../utils/withTenant.ts";
import { withAuthGuard } from "../utils/withAuthGuard.ts";
import { Mailer } from "../lib/mailer.ts";
import { ObjectId } from "mongodb";
import { handlebarsRender } from "@/core/utils/textRender.ts";

export default new Router("/api", function tenantInvites(router) {
  createCRUD({
    router,
    schema: tenantInviteSchema,
    insertSchema: tenantInviteInputSchema,
    model: tenantInviteModel,
  }, {
    isolationFields: async (req) => {
      const { tenant, user } = await withTenant(req);

      return {
        tenant: tenant._id,
        createdBy: user._id,
      };
    },
    hooks: {
      async beforeCreate({ data }, req) {
        const { subRoles } = await withAuthGuard(req);

        if (!subRoles.includes(data.role)) {
          throw new Error("Invalid sub-role selected");
        }

        if (
          data.membershipExpiresAt &&
          data.membershipExpiresAt.getTime() <= Date.now()
        ) {
          throw new Error("Membership expiry must be in the future");
        }

        data._id = new ObjectId();
        data.url = handlebarsRender(decodeURIComponent(data.url), data); // https://app.com/invite/{{_id}}
      },
      async afterCreate({ data }) {
        await Mailer.send({
          template: "tenantInvite",
          to: data.email,
          subject: "You got an invite!",
          html: `
          <p>Click the following link to accept the invite:</p>
          <a href="${data.url}">Accept</a>
          `,
          url: data.url,
        }).catch(() => {
          // Ignore smtp errors
        });
      },
    },
  });
}).group("IAM");
