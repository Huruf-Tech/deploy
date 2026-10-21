import z from "zod";
import { Router } from "@/core/http/router.ts";
import { $objectId, createCRUD } from "@/core/utils/createCRUD.ts";
import {
  tenantMemberModel,
  tenantMemberSchema,
} from "@/schemas/tenantMember.ts";
import { bodyAsJson } from "@/core/http/utils.ts";
import { withAuthSession } from "../utils/withAuthSession.ts";
import { mongodb } from "@/database.ts";
import { tenantInviteModel } from "../schemas/tenantInvite.ts";
import { withTenant } from "../utils/withTenant.ts";

export default new Router("/api", function tenantMembers(router) {
  const tenantMemberInputSchema = z.object({
    invite: $objectId,
  });

  createCRUD({
    router,
    schema: tenantMemberSchema,
    insertSchema: tenantMemberInputSchema,
    updateSchema: tenantMemberSchema.pick({
      role: true,
      expiresAt: true,
    }),
    model: tenantMemberModel,
  }, {
    disable: {
      create: true,
    },
    isolationFields: async (req) => {
      const { tenant, user } = await withTenant(req);

      if (["patch", "delete"].includes(req.method.toLowerCase())) {
        return { tenant: tenant._id, createdBy: user._id };
      }

      return { tenant: tenant._id };
    },
  });

  router.post("/", function create() {
    const $body = tenantMemberInputSchema;
    const $return = z.object({
      _id: $objectId,
    });

    return {
      shape: () => ({
        body: $body,
        return: $return,
      }),
      handler: async (req: Request) => {
        const { user } = await withAuthSession(req);

        const body = $body.parse(await bodyAsJson(req));

        return Response.json(
          (await mongodb.withSession((_) =>
            _.withTransaction(async (session) => {
              const invite = await tenantInviteModel.findOneAndDelete({
                _id: body.invite,
                email: user.email,
              }, { session });

              if (!invite) {
                throw new Error("Invite not found");
              }

              const { insertedId } = await tenantMemberModel.insertOne(
                tenantMemberSchema.strictParse({
                  user: user._id,
                  email: invite.email,
                  role: invite.role,
                  tenant: invite.tenant,
                  isOwner: false,
                  ...(invite.membershipExpiresAt
                    ? { expiresAt: invite.membershipExpiresAt }
                    : {}),
                  createdBy: invite.createdBy,
                }),
                { session },
              );

              return { _id: insertedId };
            })
          )) satisfies z.output<
            typeof $return
          >,
        );
      },
    };
  });
}).group("IAM");
