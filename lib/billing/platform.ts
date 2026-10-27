import { ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { readTextSetting } from "@/lib/core/settings.ts";

export const NOT_SET_UP = "Payments aren't set up yet";

/**
 * The platform's own tenant (PLAN §22, §28): payments land in its wallet,
 * and its machines are the ones for rent. Undefined until it's set.
 */
export async function platformTenantId() {
  const id = await readTextSetting("PLATFORM_TENANT", "");
  return ObjectId.isValid(id) ? new ObjectId(id) : undefined;
}

/** The platform's tenant, or a 400 while payments aren't set up. */
export async function platformTenant() {
  const id = await platformTenantId();
  if (!id) throw Response.badRequest(NOT_SET_UP);
  return id;
}
