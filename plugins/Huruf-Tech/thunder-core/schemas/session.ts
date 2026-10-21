import z from "zod";
import { mongodb } from "@/database.ts";
import { ObjectId } from "mongodb";

export const sessionSchema = z.object({
  userId: z.instanceof(ObjectId),
  expiresAt: z.date(),
  token: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const sessionModel = mongodb.db().collection<
  z.infer<typeof sessionSchema>
>(
  "sessions",
);
