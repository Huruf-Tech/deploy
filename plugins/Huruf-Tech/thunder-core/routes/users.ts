// deno-lint-ignore-file no-explicit-any
import z from "zod";
import { Router } from "@/core/http/router.ts";
import { $objectId, createCRUD } from "@/core/utils/createCRUD.ts";
import { userModel, userSchema } from "@/schemas/user.ts";
import { auth } from "@/lib/auth.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { withAuthSession } from "@/utils/withAuthSession.ts";
import { tenantModel } from "@/schemas/tenant.ts";
import { tenantMemberModel } from "@/schemas/tenantMember.ts";

export default new Router("/api", function users(router) {
  const userInputSchema = z.object({
    email: z.email(),
    password: z.string().optional(),
    name: z.string(),
    role: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  });

  router.post("/", function create() {
    const $body = userInputSchema;
    const $return = z.object({
      _id: z.string(),
    });

    return {
      shape: () => ({
        body: $body,
        return: $return,
      }),
      handler: async (req: Request) => {
        const body = $body.parse(await bodyAsJson(req));

        const newUser = await auth.api.createUser({
          body: {
            email: body.email,
            password: body.password,
            name: body.name,
            role: body.role as any,
            data: body.metadata,
          },
        });

        return Response.json(
          { _id: newUser.user.id } satisfies z.output<typeof $return>,
        );
      },
    };
  });

  router.patch("/:id", function update() {
    const $params = z.object({
      id: $objectId,
    });
    const $body = userInputSchema.omit({
      password: true,
    });

    return {
      shape: () => ({
        params: $params,
        body: $body,
      }),
      handler: async (req: Request) => {
        const params = $params.parse(paramsAsJson(req));
        const body = $body.parse(await bodyAsJson(req));

        await auth.api.adminUpdateUser({
          body: {
            userId: params.id.toString(),
            data: body,
          },
          // This endpoint requires session cookies.
          headers: req.headers,
        });

        return Response.ok();
      },
    };
  });

  router.post("/ban/:id", function ban() {
    const $params = z.object({
      id: $objectId,
    });
    const $body = z.object({
      reason: z.string(),
      banExpiresInSeconds: z.number().optional(),
    });

    return {
      shape: () => ({
        params: $params,
        body: $body,
      }),
      handler: async (req: Request) => {
        const params = $params.parse(paramsAsJson(req));
        const body = $body.parse(await bodyAsJson(req));

        await auth.api.banUser({
          body: {
            userId: params.id,
            banReason: body.reason,
            banExpiresIn: body.banExpiresInSeconds,
          },
          // This endpoint requires session cookies.
          headers: req.headers,
        });

        return Response.ok();
      },
    };
  });

  router.post("/add/fcm-token", function addFcmToken() {
    const $body = z.object({
      token: z.string(),
    });
    
    const $return = z.object({
      id: $objectId,
    });

    return {
      shape: () => ({
        body: $body,
        return: $return,
      }),
      handler: async (req: Request) => {
        const body = $body.parse(await bodyAsJson(req));
        const { user } = await withAuthSession(req);

        await userModel.updateOne(
          { _id: user._id },
          { $addToSet: { fcmTokens: body.token } },
        );

        return Response.json(
          { id: user._id } satisfies z.output<typeof $return>,
        );
      },
    };
  });

  router.get("/:id/tenants", function getUserTenants() {
    const $params = z.object({
      id: $objectId,
    });
    const $return = z.array(z.object({
      _id: z.string(),
      name: z.string(),
    }));

    return {
      shape: () => ({
        params: $params,
        return: $return,
      }),
      handler: async (req: Request) => {
        const params = $params.parse(paramsAsJson(req));
        await withAuthSession(req);
        
        // Find all memberships for this user
        const memberships = await tenantMemberModel.find({ user: params.id }).toArray();
        const tenantIds = memberships.map(m => m.tenant);
        
        // Find all tenants corresponding to those memberships
        const tenants = await tenantModel.find({ _id: { $in: tenantIds } }).toArray();
        
        return Response.json(
          tenants.map(t => ({ _id: t._id.toString(), name: t.name })) satisfies z.output<typeof $return>
        );
      },
    };
  });

  createCRUD({
    router,
    schema: userSchema,
    insertSchema: userInputSchema,
    model: userModel,
  }, {
    disable: {
      create: true,
      del: true,
      update: true,
    },
  });
}).group("Admin");
