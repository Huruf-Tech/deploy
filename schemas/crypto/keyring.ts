import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

export const $keyringOwner = z.object({
  kind: z.enum(["user", "tenant"]),
  ref: $objectId,
});

export const $keyring = z.object({
  owner: $keyringOwner,
  dataKeyEnc: z.string(),
  keyVersion: z.number().int(),
  createdAt: z.date(),
});

export type TKeyringOwner = z.output<typeof $keyringOwner>;
export type TKeyring = z.output<typeof $keyring>;

export const keyringModel = mongodb.db().collection<TKeyring>("keyring");
