import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { $inventory, $resourceSummary } from "@/schemas/protocol/agent.ts";

/** Cold server document (PLAN §6): agent polls never write it. */
export const $serverUpdate = z.object({
  name: z.string().min(1).max(60).meta({ canFilter: true }),
  labels: z.record(z.string().max(40), z.string().max(80)).default({}).meta({
    description: "Free-form key/value tags, e.g. region=eu, builder=true",
  }),
});

export const $server = $serverUpdate.extend({
  tenant: $objectId.meta({ ref: "tenants" }),
  status: z.enum(["pending", "active", "rejected"]).meta({ canFilter: true }),
  identity: z.object({
    signPublicKey: z.string(),
    boxPublicKey: z.string(),
    fingerprint: z.string(),
  }),
  pairingCode: z.string().optional(),
  pairingExpiresAt: z.date().optional(),
  installMethod: z.enum(["manual", "ssh"]).default("manual"),
  provider: z.object({ kind: z.enum(["byo", "managed"]) }).default({
    kind: "byo",
  }),
  inventory: $inventory,
  resources: $resourceSummary.extend({ reportedAt: z.date() }).optional(),
  acceptedBy: $objectId.meta({ ref: "users" }).optional(),
  acceptedAt: z.date().optional(),
  createdAt: z.date(),
});

export type TServer = z.output<typeof $server>;

export const serverModel = mongodb.db().collection<TServer>("servers");
