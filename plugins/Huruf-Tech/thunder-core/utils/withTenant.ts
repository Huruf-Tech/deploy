// deno-lint-ignore-file no-explicit-any
import z from "zod";
import { WithId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { withCachedOnRequest } from "./withCachedOnRequest.ts";
import { withAuthSession } from "./withAuthSession.ts";
import {
  isMembershipExpired,
  tenantMemberModel,
  type tenantMemberSchema,
} from "../schemas/tenantMember.ts";
import { tenantModel, type tenantSchema } from "@/schemas/tenant.ts";
import { userModel, userSchema } from "../schemas/user.ts";

export type TTenantDetails = {
  tenant: WithId<z.output<typeof tenantSchema>>;
  member: WithId<z.output<typeof tenantMemberSchema>>;
  user: WithId<z.infer<typeof userSchema>>;
  owner: WithId<z.infer<typeof userSchema>>;
  getParentMember?: () => Promise<
    WithId<
      z.output<typeof tenantMemberSchema>
    > | null
  >;
};

export type TWithTenant = {
  (req: Request, silent: true): Promise<TTenantDetails | undefined>;
  (req: Request, silent?: false | undefined): Promise<TTenantDetails>;
};

// @ts-expect-error overrides
const _withTenant: TWithTenant = async (req, silent) => {
  const auth = await withAuthSession(req, silent as true);

  if (!auth?.tenantId) {
    if (silent) return;

    throw new Error("You must pass X-TENANT-ID in the headers!");
  }

  const user = auth.user;
  const member = await tenantMemberModel.findOne({
    tenant: auth.tenantId,
    user: user._id,
  });

  if (!member) throw Response.forbidden("You are not a member of this tenant!");

  if (isMembershipExpired(member)) {
    throw Response.forbidden("Your membership of this tenant has expired!");
  }

  const tenant = await tenantModel.findOne({
    _id: auth.tenantId,
  });

  if (!tenant) throw Response.forbidden("Tenant not found!");

  const isOwner = user._id.equals(tenant.createdBy) && member.isOwner;

  if (!isOwner) {
    const owner = await userModel.findOne(tenant.createdBy);

    if (!owner) throw Response.forbidden("Tenant owner not found!");

    return {
      tenant,
      member,
      user,
      owner,
      getParentMember: () =>
        withCachedOnRequest(
          req,
          "parentMember",
          () =>
            tenantMemberModel.findOne({
              tenant: tenant._id,
              user: member.createdBy,
            }),
        ),
    };
  }

  return {
    tenant,
    member,
    user,
    owner: user,
  };
};

export const withTenant: TWithTenant = (req, silent) => {
  return withCachedOnRequest(
    req,
    "tenant:" + silent,
    (req) => _withTenant(req, silent as true) as any,
  );
};
