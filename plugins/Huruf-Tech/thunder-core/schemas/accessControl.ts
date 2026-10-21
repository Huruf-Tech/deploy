import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

export const accessControlInputSchema = z.object({
  role: z.string().max(100).describe("The name of the role"),
  skipIntersection: z.boolean().optional(),
  policies: z
    .array(
      $objectId.meta({
        ref: "accessControlPolicies",
      }),
    )
    .describe("The policies associated with the role"),
  subRoles: z.array(z.string().max(100)).optional(),
});

export const accessControlSchema = accessControlInputSchema.extend({
  createdAt: z
    .date()
    .optional()
    .default(() => new Date()),
  updatedAt: z
    .date()
    .optional()
    .default(() => new Date()),
});

export const accessControlModel = mongodb
  .db()
  .collection<z.infer<typeof accessControlSchema>>("accessControls");
