import type { ObjectId } from "mongodb";
import { releaseServer } from "@/lib/agents/servers.ts";
import { detachServer } from "@/lib/deploy/projects.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";

/**
 * A server is gone for good (PLAN §27.4): its projects go with it (or drop
 * it), its plan slot and lease are freed, and its record is deleted.
 */
export async function retireServer(tenant: ObjectId, server: ObjectId) {
  await detachServer(tenant, server);
  await releaseServer(server, tenant);
  await serverModel.deleteOne({ _id: server, tenant });
}
