import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import z from "zod";
import { ObjectId } from "mongodb";
import { mongodb } from "@/database.ts";
import { createCRUD } from "@/core/utils/createCRUD.ts";
import { Response } from "@/core/http/response.ts";
import {
  tenantInputSchema,
  tenantModel,
  tenantSchema,
} from "@/schemas/tenant.ts";
import {
  tenantMemberModel,
  tenantMemberSchema,
} from "../schemas/tenantMember.ts";
import { withAuthSession } from "../utils/withAuthSession.ts";

export default new Router("/api", function tenants(router) {
  createCRUD({
    router,
    schema: tenantSchema,
    insertSchema: tenantInputSchema,
    model: tenantModel,
  }, {
    disable: {
      create: true,
      del: true,
    },
    isolationFields: async (req) => {
      const { user } = await withAuthSession(req);

      return {
        createdBy: user._id,
      };
    },
  });

  router.post("/", function create() {
    const $body = tenantInputSchema;
    const $return = z.object({
      tenantId: z.instanceof(ObjectId),
      memberId: z.instanceof(ObjectId),
    });

    return {
      shape: () => ({
        body: $body,
        return: $return,
      }),
      handler: async (req: Request) => {
        const body = $body.parse(await bodyAsJson(req));

        const { user } = await withAuthSession(req);

        const results = await mongodb.withSession((session) =>
          session.withTransaction(async () => {
            const { insertedId: tenantId } = await tenantModel.insertOne(
              tenantSchema.strictParse({
                ...body,
                createdBy: user._id,
              }),
              { session },
            );

            const { insertedId: memberId } = await tenantMemberModel.insertOne(
              tenantMemberSchema.strictParse({
                tenant: tenantId,
                user: user._id,
                isOwner: true,
                createdBy: user._id,
              }),
              { session },
            );

            return {
              tenantId,
              memberId,
            };
          })
        );

        return Response.json(results satisfies z.output<typeof $return>);
      },
    };
  });

  router.del("/:id", function del() {
    const $params = z.object({
      id: z.string(),
    });

    return {
      shape: () => ({
        params: $params,
      }),
      handler: async (req: Request) => {
        const params = $params.parse(paramsAsJson(req));

        const tenantId = new ObjectId(params.id);

        await mongodb.withSession(async (session) => {
          await tenantModel.deleteOne({ _id: tenantId }, {
            session,
          });

          await tenantMemberModel.deleteOne({ tenant: tenantId }, {
            session,
          });
        });

        return Response.ok();
      },
    };
  });
}).group("IAM");
