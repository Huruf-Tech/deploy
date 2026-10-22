import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/**
 * S3-compatible storage (PLAN §11): mounted as `s3` volumes through rclone.
 * The secret key is stored encrypted and only ever reaches agents sealed.
 */
export const $storage = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  name: z.string().min(1).max(80),
  provider: z.enum(["aws", "cloudflare", "minio", "other"]),
  endpoint: z.url({ protocol: /^https?$/ }).max(300).optional().describe(
    "e.g. https://<account>.r2.cloudflarestorage.com; AWS needs none",
  ),
  region: z.string().max(50).default("us-east-1"),
  bucket: z.string().regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/),
  accessKeyId: z.string().min(1).max(200),
  secretEnc: z.string(),
  createdBy: $objectId.meta({ ref: "users" }),
  createdAt: z.date(),
});

export type TStorage = z.output<typeof $storage>;

export const storageModel = mongodb.db().collection<TStorage>("storages");
