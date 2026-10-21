import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

export enum OAuthClientType {
  Confidential = "confidential",
  Public = "public",
}

export const oauthClientInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  logo: z.url().optional(),
  type: z.enum(OAuthClientType),
  secret: z.string().optional().meta({ type: "hidden" }),
  allowedScopes: z.array(z.string().min(1).max(255)).optional().default([]),
  redirectUris: z.array(z.url()).optional().default([]),
  disabled: z.boolean().optional(),
});

export const oauthClientSchema = oauthClientInputSchema.extend({
  createdBy: $objectId,
  createdAt: z.date().optional().default(() => new Date()),
  updatedAt: z.date().optional().default(() => new Date()),
});

export const oauthClientModel = mongodb.db().collection<
  z.infer<typeof oauthClientSchema>
>("oauthClients");
