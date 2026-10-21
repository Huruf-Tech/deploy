import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

export const tenantMemberSchema = z.object({
  tenant: $objectId,
  user: $objectId,
  email: z.string().optional(),
  role: z.string().optional(),
  isOwner: z.boolean(),
  /** When set, the membership stops granting access at this time. */
  expiresAt: z.coerce.date().optional(),
  createdBy: $objectId,
  createdAt: z.date().optional().default(() => new Date()),
});

/**
 * A membership grants access until `expiresAt`. Missing/null means it never
 * expires. Enforced in `utils/withTenant.ts`, the gate every tenant-scoped
 * request passes through.
 */
export const isMembershipExpired = (
  member: { expiresAt?: Date | null },
  now = Date.now(),
) => !!member.expiresAt && member.expiresAt.getTime() <= now;

export const tenantMemberModel = mongodb.db().collection<
  z.infer<typeof tenantMemberSchema>
>("tenantMembers");
