import z from "zod";
import { mongodb } from "@/database.ts";

export const referenceSchema = z.object({
  label: z.string().min(2).toLowerCase(),
  count: z.number(),
});

export const referenceModel = mongodb.db().collection<
  z.infer<typeof referenceSchema>
>("references");
