import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

/** Mesh addresses: 10.209.0.N per server (WireGuard). */
export const MESH_PREFIX = "10.209.0";
export const MESH_CIDR = "10.209.0.0/16";
/** Container subnets: 10.210.N.0/24 per server, routed over the mesh. */
export const SUBNET_PREFIX = "10.210";
export const MESH_PORT = 51820;
/** One /24 per server and one mesh address each: 254 servers per tenant. */
export const MAX_MESH_INDEX = 254;

export const meshIpOf = (index: number) => `${MESH_PREFIX}.${index}`;
export const subnetOf = (index: number) => `${SUBNET_PREFIX}.${index}.0/24`;

/** A tenant's private network (PLAN §6 `networks`, §8.2–8.4). */
export const $network = z.object({
  tenant: $objectId.meta({ ref: "tenants" }),
  /** Next server index to hand out (1-based). */
  nextIndex: z.number().int(),
  /** Hosts the built-in registry. */
  primaryServer: $objectId.meta({ ref: "servers" }).optional(),
  registry: z.object({
    username: z.string(),
    passwordEnc: z.string(),
  }).optional(),
});

export type TNetwork = z.output<typeof $network>;

export const networkModel = mongodb.db().collection<TNetwork>("networks");
