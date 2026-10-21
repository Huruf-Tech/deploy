import z from "zod";
import { mongodb } from "@/database.ts";

export const accessControlPolicyInputSchema = z.object({
  name: z.string().max(100).describe("The name of the access control policy"),
  permissions: z.array(z.string()).describe(
    "The permissions associated with the access control policy",
  ),
});

export const accessControlPolicySchema = accessControlPolicyInputSchema.extend({
  createdAt: z.date().optional().default(() => new Date()),
  updatedAt: z.date().optional().default(() => new Date()),
});

export const accessControlPolicyModel = mongodb.db().collection<
  z.infer<typeof accessControlPolicySchema>
>("accessControlPolicies");
