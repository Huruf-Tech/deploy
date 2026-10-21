import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { APIKey } from "@/lib/apiKey.ts";
import { resourceGrantSchema } from "@/schemas/oauthConsent.ts";

export const apiKeySecretSchema = z.string().transform(APIKey.hash);

export const apiKeyInputSchema = z.object({
  name: z.string().min(2).max(100),
  resourceGrant: resourceGrantSchema,
  secret: z.string().min(8).max(100),
  scopes: z.array(z.string().max(100)).optional(),
  expiresAt: z.coerce.date().optional(),
});

export const apiKeySchema = apiKeyInputSchema.extend({
  secret: apiKeySecretSchema,
  lastAccessAt: z.date().optional(),
  accessCount: z.number().default(0),
  createdBy: $objectId,
  createdAt: z.date().optional().default(() => new Date()),
  updatedAt: z.date().optional().default(() => new Date()),
});

export const apiKeyModel = mongodb.db().collection<
  z.infer<typeof apiKeySchema>
>("apiKeys");
