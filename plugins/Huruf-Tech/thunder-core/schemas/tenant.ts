import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

export const tenantInputSchema = z.object({
  name: z.string(),
  logo: z.url().optional(),
});

export const tenantSchema = tenantInputSchema.extend({
  createdBy: $objectId,
  createdAt: z.date().optional().default(() => new Date()),
});

export const tenantModel = mongodb.db().collection<
  z.infer<typeof tenantSchema>
>("tenants");
