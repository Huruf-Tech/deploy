import { ObjectId, WithId } from "mongodb";
import z from "zod";
import { cache } from "@/core/utils/cache.ts";
import { Env } from "@/core/utils/env.ts";

import { withTenant } from "./withTenant.ts";
import { withAuthSession } from "./withAuthSession.ts";
import { withCachedOnRequest } from "./withCachedOnRequest.ts";
import { accessControlModel } from "../schemas/accessControl.ts";
import {
  accessControlPolicyModel,
  accessControlPolicySchema,
} from "../schemas/accessControlPolicy.ts";

export type TPermitFunction = (scope: string, action?: string) => boolean;

export type TAuthGuard = {
  role: string;
  subRoles: string[];
  policies: WithId<z.output<typeof accessControlPolicySchema>>[];
  allow: TPermitFunction;
};

export type TWithAuthGuard = (req: Request) => Promise<TAuthGuard>;

const getACS = cache(async () => {
  const acs = await accessControlModel.find().toArray();

  const policyIds = new Set<string>();

  acs.forEach((ac) => {
    ac.policies.forEach((policyId) => policyIds.add(policyId.toString()));
  });

  const policies = await accessControlPolicyModel.find({
    _id: {
      $in: Array.from(policyIds).map((id) => new ObjectId(id)),
    },
  }).toArray();

  const policyByName = new Map<
    string,
    WithId<z.output<typeof accessControlPolicySchema>>
  >();
  const policyById = new Map<
    string,
    WithId<z.output<typeof accessControlPolicySchema>>
  >();

  policies.forEach((policy) => {
    policyByName.set(policy.name, policy);
    policyById.set(policy._id.toString(), policy);
  });

  return {
    acs: acs.map((ac) => ({
      ...ac,
      policies: ac.policies.map((policyId) =>
        policyById.get(policyId.toString())!
      )
        .filter(Boolean),
    })),
    policyById,
    policyByName,
  };
}, 30000);

const _withAuthGuard: TWithAuthGuard = async (req) => {
  let role = "guest";
  let childRole: string | undefined;
  let policyNames: string[] | undefined;

  const auth = await withAuthSession(req, true);

  getChildRole: if (auth) {
    role = auth.user.role;
    policyNames = auth.scopes;

    const tenant = await withTenant(req, true);

    if (!tenant) break getChildRole;

    rbacCascade: if (tenant.getParentMember) {
      if (await Env.enabled("RBAC_NO_CASCADE")) {
        role = tenant.owner.role;
        childRole = tenant.member.role;

        break rbacCascade;
      }

      const parentMember = await tenant.getParentMember();

      role = parentMember?.role ?? tenant.owner.role;
      childRole = tenant.member.role;
    }
  }

  const { acs, policyById, policyByName } = await getACS();

  const acForRoles = acs.filter((ac) => [role, childRole].includes(ac.role));
  const acForIntersection = acForRoles.length > 1
    ? acForRoles.filter((ac) => !ac.skipIntersection)
    : acForRoles;

  const policyIds = acForIntersection.reduce<
    undefined | Set<string>
  >((source, ac) => {
    const target = new Set(ac.policies.map((policy) => policy._id.toString()));

    if (!source) return target;

    return source.intersection(target);
  }, undefined);

  const resolvedRole = childRole ?? role;

  if (!policyIds?.size) {
    return {
      role: resolvedRole,
      subRoles: [],
      policies: [],
      allow() {
        return false;
      },
    };
  }

  const targetPolicies = Array.from(policyIds).map((id) => policyById.get(id)!);
  const hasRootPolicy = targetPolicies.some((policy) => policy.name === "root");
  const limitPolicies = policyNames && !policyNames.includes("*") &&
    !policyNames.includes("full_access");

  const policies = limitPolicies
    ? hasRootPolicy
      ? (policyNames ?? []).map((name) => policyByName.get(name)).filter((
        policy,
      ) => policy !== undefined)
      : targetPolicies.filter((policy) => policyNames?.includes(policy.name))
    : targetPolicies;

  return {
    role: resolvedRole,
    subRoles: acs.find((ac) => ac.role === resolvedRole)?.subRoles ?? [],
    policies,
    allow(scope, action) {
      return policies.some((policy) =>
        policy.permissions.includes("*") ||
        policy.permissions.includes(`${scope}.${action}`) ||
        policy.permissions.includes(scope)
      );
    },
  };
};

export const withAuthGuard: TWithAuthGuard = (req) => {
  return withCachedOnRequest(req, "authGuard", _withAuthGuard);
};
