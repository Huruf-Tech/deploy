import z from "zod";
import { mongodb } from "@/database.ts";

export const userSchema = z.object({
  name: z.string().meta({ canFilter: true, label: "Name" }),
  image: z.url().optional(),
  email: z.email().meta({ canFilter: true, label: "Email" }),
  fcmTokens: z.array(z.string()).optional(),
  emailVerified: z.boolean().meta({ canFilter: true, label: "Email Verified" }),
  phoneNumber: z.e164().optional().meta({ canFilter: true, label: "Phone Number" }),
  phoneNumberVerified: z.boolean().optional(),
  phoneNumberVerificationCode: z.string().optional(),
  phoneNumberVerificationRequestAt: z.date().optional(),
  role: z.string().meta({ canFilter: true, label: "Role" }),
  createdAt: z.date().meta({ canFilter: true, label: "Created At" }),
  updatedAt: z.date(),
});

export const userModel = mongodb.db().collection<
  z.infer<typeof userSchema>
>("users");
