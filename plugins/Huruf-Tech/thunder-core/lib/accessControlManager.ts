import { ObjectId } from "mongodb";

import { accessControlPolicyModel } from "@/schemas/accessControlPolicy.ts";
import { accessControlModel } from "@/schemas/accessControl.ts";

export class ACManager {
  static async resolvePolicy(name: string, permissions?: string[]) {
    const now = new Date();

    if (!permissions?.length) {
      return await accessControlPolicyModel.findOne({ name });
    }

    const policy = await accessControlPolicyModel.findOneAndUpdate({
      name,
    }, {
      $setOnInsert: {
        createdAt: now,
      },
      $set: {
        updatedAt: now,
      },
      $addToSet: {
        permissions: {
          $each: permissions,
        },
      },
    }, {
      upsert: true,
      returnDocument: "after",
    }).catch(() => null);

    return policy;
  }

  static async denyFromPolicy(name: string, permissions?: string[]) {
    const now = new Date();

    if (!permissions?.length) {
      return await accessControlPolicyModel.findOne({ name });
    }

    await accessControlPolicyModel.updateOne({
      name,
    }, {
      $set: {
        updatedAt: now,
      },
      $pullAll: {
        permissions,
      },
    });
  }

  static async resolveRole(
    role: string,
    policies?: Array<{ _id: ObjectId } | null | string>,
    opts?: { skipIntersection?: boolean },
  ) {
    const filteredPolicies = policies?.filter((_) => _ !== null) ?? [];
    const purePolicies = filteredPolicies.filter((_) => typeof _ !== "string");
    const refPolicies = filteredPolicies.filter((_) => typeof _ === "string");

    const otherPolicies = !refPolicies.length
      ? []
      : await accessControlPolicyModel.find(
        refPolicies.includes("*") ? {} : {
          name: { $in: refPolicies },
        },
      )
        .project({ _id: 1 })
        .toArray() as Array<{ _id: ObjectId }>;

    const $each = [
      ...purePolicies.map((_) => _._id),
      ...otherPolicies.map((_) => _._id),
    ];

    if (!$each?.length) return await accessControlModel.findOne({ role });

    const now = new Date();

    const ac = await accessControlModel.findOneAndUpdate({
      role,
    }, {
      $setOnInsert: {
        ...opts,
        createdAt: now,
      },
      $set: {
        updatedAt: now,
      },
      $addToSet: {
        policies: {
          $each,
        },
      },
    }, {
      upsert: true,
      returnDocument: "after",
    }).catch(() => null);

    return ac;
  }

  static async setSubRole(role: string, subRoles: string[]) {
    await accessControlModel.updateOne({ role }, {
      $addToSet: {
        subRoles: {
          $each: subRoles,
        },
      },
    }).catch(() => null);
  }
}
