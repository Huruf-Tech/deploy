import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

export const resourceGrantSchema = z.record(z.string(), z.array(z.string()));

export const oauthConsentSchema = z.object({
  client: $objectId,
  scopes: z.array(z.string().min(1).max(255)),
  resourceGrant: resourceGrantSchema,
  version: z.number().default(1),
  createdBy: $objectId,
  createdAt: z.date().optional().default(() => new Date()),
});

export const oauthConsentModel = mongodb.db().collection<
  z.infer<typeof oauthConsentSchema>
>("oauthConsents");
