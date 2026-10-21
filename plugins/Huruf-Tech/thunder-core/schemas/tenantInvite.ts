import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

export const tenantInviteInputSchema = z.object({
  email: z.email(),
  role: z.string(),
  url: z.url(),
  /** Optional expiry for the membership this invite creates. */
  membershipExpiresAt: z.coerce.date().optional(),
});

export const tenantInviteSchema = tenantInviteInputSchema.extend({
  tenant: $objectId,
  createdBy: $objectId,
  createdAt: z.date().optional().default(() => new Date()),
});

export const tenantInviteModel = mongodb.db().collection<
  z.infer<typeof tenantInviteSchema>
>("tenantInvites");
