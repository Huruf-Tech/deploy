import z from "zod";
import { mongodb } from "@/database.ts";

export const jwkSchema = z.object({
  kid: z.string(),
  publicJwk: z.record(z.string(), z.any()),
  privateJwk: z.record(z.string(), z.any()),
  createdAt: z.date().default(() => new Date()),
});

export const jwkModel = mongodb.db().collection<
  z.infer<typeof jwkSchema>
>("jwks");
