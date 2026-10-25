import { ACManager } from "@/plugins/Huruf-Tech/thunder-core/lib/accessControlManager.ts";

/**
 * Huruf Deploy permissions (PLAN §16 Phase 0). Idempotent: ACManager upserts
 * and $addToSet's. Each phase appends the scopes of the routers it adds.
 *
 * Invited members get the intersection of their inviter's policies and their
 * own role's, so the owner decides who gets shells by the role they invite with.
 */
export const syncDeployAccessControl = async () => {
  // Agents authenticate by signature inside the handlers, so the router is open to guests.
  await ACManager.resolvePolicy("public", ["agents"]);
  // GitHub's redirects and webhooks: authorized by signed state / HMAC inside the handlers.
  await ACManager.resolvePolicy("public", ["githubHooks"]);
  // Let's Encrypt and Traefik: challenges are public, the config needs a token.
  await ACManager.resolvePolicy("public", ["ingress"]);

  const deploy = await ACManager.resolvePolicy("deploy", [
    "servers",
    "variables",
    "gitIntegrations",
    "templates",
    // The AI assistant; the plan decides whether it answers.
    "ai",
    "streams.openLogs",
    "streams.openMetrics",
    "streams.input",
    "streams.read",
    "streams.close",
    "streams.openBuild",
    "streams.openCapacity",
    "projects",
    "projectGroups",
    "registries",
    "domains",
    "storages",
    // Everyone sees plan & usage; subscribe/cancel check for the owner.
    "billing",
    "networks",
    "alertRules",
    "alertEvents",
    // The workspace's wallet, read-only: plan payments come out of it.
    // Transfers and overdraft limits stay with admins.
    "wallets.get",
    "wallets.metadata",
    "walletLedgers.get",
  ]);
  // Older setups granted every stream handler through `deploy`.
  await ACManager.denyFromPolicy("deploy", ["streams"]);

  // Shells run arbitrary commands on servers and in containers: granted separately.
  const shell = await ACManager.resolvePolicy("shell", [
    "streams.openExec",
    "streams.openTerminal",
    "streams.openHostTerminal",
  ]);
  // Give an API key the scope ["variableApi"] to let it read resolved variables only.
  const variableApi = await ACManager.resolvePolicy("variableApi", [
    "variables.resolve",
  ]);
  await ACManager.resolveRole("user", [deploy, shell, variableApi]);

  // Roles a workspace owner can invite members with.
  const member = ["public", "developer", "iam", "media", deploy, variableApi];
  await ACManager.resolveRole("operator", [...member, shell]);
  await ACManager.resolveRole("deployer", member);
  await ACManager.setSubRole("user", ["operator", "deployer"]);
};

if (import.meta.main) {
  await syncDeployAccessControl();
  Deno.exit();
}
