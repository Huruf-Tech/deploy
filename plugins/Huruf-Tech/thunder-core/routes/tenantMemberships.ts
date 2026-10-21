// deno-lint-ignore-file no-explicit-any
import { Router } from "@/core/http/router.ts";
import z from "zod";
import {
  tenantMemberModel,
  tenantMemberSchema,
} from "@/schemas/tenantMember.ts";
import { tenantSchema } from "@/schemas/tenant.ts";
import { ObjectId, WithId } from "mongodb";
import {
  $objectId,
  normalizeFilters,
  paginationSchema,
} from "@/core/utils/createCRUD.ts";
import { withAuthSession } from "@/utils/withAuthSession.ts";
import { paramsAsJson, queryAsJson } from "@/core/http/utils.ts";

export default new Router("/api", function tenantMemberships(router) {
  router.get("/", function get() {
    const $params = z.object({
      id: z.string().optional(),
    });
    const $query = paginationSchema;

    const $membership = tenantMemberSchema.omit({ tenant: true }).extend({
      tenant: tenantSchema.extend({
        _id: $objectId,
      }),
    }).extend({
      _id: $objectId,
    });

    const $return = z.object({
      results: $membership.array(),
    });

    return {
      shape: () => ({
        params: $params,
        query: $query,
        return: $return,
      }),
      handler: async (req: Request) => {
        const { user } = await withAuthSession(req);

        const params = $params.parse(paramsAsJson(req));
        const query = $query.parse(queryAsJson(req));

        const emptyArray: any[] = [];

        const results = await tenantMemberModel.aggregate<
          WithId<z.infer<typeof $membership>>
        >([
          {
            $match: {
              ...(params.id ? { _id: new ObjectId(params.id) } : {}),
              user: user._id,
            },
          },
          ...(query.filters
            ? [{
              $match: normalizeFilters(query.filters),
            }]
            : emptyArray),
          ...(query.sort ? [{ $sort: query.sort }] : emptyArray),
          ...(query.offset ? [{ $skip: query.offset }] : emptyArray),
          ...(query.limit ? [{ $limit: query.limit }] : emptyArray),
          ...(query.project ? [{ $project: query.project }] : emptyArray),
          {
            $lookup: {
              from: "tenants",
              localField: "tenant",
              foreignField: "_id",
              as: "tenant",
            },
          },
          {
            $unwind: {
              path: "$tenant",
              preserveNullAndEmptyArrays: true,
            },
          },
        ]).toArray();

        return Response.json(
          {
            results,
          } satisfies z.output<typeof $return>,
        );
      },
    };
  });
});
