import type { ObjectId } from "mongodb";
import { cache } from "@/core/utils/cache.ts";
import { Response } from "@/core/http/response.ts";
import { readTextSetting } from "@/lib/core/settings.ts";
import { agentEndpoints } from "@/lib/agents/bootstrap.ts";
import { issueCommand } from "@/lib/agents/commands.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";

const BINARY = (arch: string) => `huruf-deploy-agent-linux-${arch}`;

/**
 * The published agent binaries' SHA-256 by architecture, from the same
 * SHA256SUMS the installer verifies against. Cached for 5 minutes.
 */
export const latestAgent = cache(async () => {
  const { downloadBase } = await agentEndpoints();
  // Where this control plane reads the same checksums, when it can't use the
  // servers' address for the download host (e.g. a private network).
  const checksumsBase = await readTextSetting(
    "AGENT_CHECKSUMS_BASE",
    downloadBase,
  );
  const res = await fetch(`${checksumsBase}/SHA256SUMS`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`SHA256SUMS: HTTP ${res.status}`);
  const sums: Record<string, string> = {};
  for (const line of (await res.text()).split("\n")) {
    const [sum, name] = line.trim().split(/\s+\*?/);
    const arch = name?.match(/^huruf-deploy-agent-linux-(\w+)$/)?.[1];
    if (arch && /^[a-f0-9]{64}$/.test(sum)) sums[arch] = sum;
  }
  return { downloadBase, sums };
}, 5 * 60_000);

/** Whether a server runs the published agent; null when unknown. */
export const agentUpToDate = (
  inventory: { arch: string; agentSha256?: string },
  sums: Record<string, string>,
) =>
  inventory.agentSha256 && sums[inventory.arch]
    ? inventory.agentSha256 === sums[inventory.arch]
    : null;

/**
 * Updates a server's agent (PLAN §16 Phase 12): the agent downloads and
 * verifies the published binary, then restarts. Its next hello reports the
 * new binary, which re-runs host setup with the new agent.
 */
export async function requestAgentUpdate(opts: {
  tenant: ObjectId;
  server: ObjectId;
  user: ObjectId;
}) {
  const server = await serverModel.findOne(
    { _id: opts.server, tenant: opts.tenant, status: "active" },
    { projection: { inventory: 1 } },
  );
  if (!server) throw Response.notFound("Server not found");
  const { downloadBase, sums } = await latestAgent().catch(() => {
    throw Response.badRequest("The published agent can't be reached");
  });
  const sha256 = sums[server.inventory.arch];
  if (!sha256) {
    throw Response.badRequest(
      `No published agent for ${server.inventory.arch}`,
    );
  }
  if (agentUpToDate(server.inventory, sums)) {
    throw Response.badRequest("The agent is up to date");
  }
  return await issueCommand({
    server: opts.server,
    tenant: opts.tenant,
    type: "agent.update",
    createdBy: opts.user,
    payload: {
      url: `${downloadBase}/${BINARY(server.inventory.arch)}`,
      sha256,
    },
  });
}
