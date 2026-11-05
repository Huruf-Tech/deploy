import z from "zod";
import { mongodb } from "@/database.ts";

export const jwkSchema = z.object({
  kid: z.string(),
  publicJwk: z.record(z.string(), z.any()),
  privateJwk: z.record(z.string(), z.any()),

  /**
   * Always true. Exists only to carry a unique index, so that concurrent
   * cold starts contend for one document instead of each inserting its own
   * signing key.
   */
  singleton: z.literal(true).default(true),

  createdAt: z.date().default(() => new Date()),
});

export const jwkModel = mongodb.db().collection<
  z.infer<typeof jwkSchema>
>("jwks");
