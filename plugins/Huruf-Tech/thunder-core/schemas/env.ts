import z from "zod";
import { mongodb } from "@/database.ts";

export const envSchema = z.object({
  key: z.string().max(100).describe("The key of the environment variable"),
  value: z.string().max(3000).describe("The value of the environment variable"),
});

export const envModel = mongodb.db().collection<
  z.infer<typeof envSchema>
>("envs");
