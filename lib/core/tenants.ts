import type { ObjectId } from "mongodb";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";

/** The user who created the tenant: whose variables a deploy resolves as. */
export const tenantCreator = async (tenant: ObjectId) =>
  (await tenantModel.findOne({ _id: tenant }, {
    projection: { createdBy: 1 },
  }))!
    .createdBy;
