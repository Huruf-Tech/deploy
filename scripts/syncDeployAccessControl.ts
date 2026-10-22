import { ACManager } from "@/plugins/Huruf-Tech/thunder-core/lib/accessControlManager.ts";

/**
 * Huruf Deploy permissions (PLAN §16 Phase 0). Idempotent: ACManager upserts
 * and $addToSet's. Each phase appends the scopes of the routers it adds.
 */
export const syncDeployAccessControl = async () => {
  // Agents authenticate by signature inside the handlers, so the router is open to guests.
  await ACManager.resolvePolicy("public", ["agents"]);
  // GitHub's redirects and webhooks: authorized by signed state / HMAC inside the handlers.
  await ACManager.resolvePolicy("public", ["githubHooks"]);

  const deploy = await ACManager.resolvePolicy("deploy", [
    "servers",
    "streams",
    "variables",
    "gitIntegrations",
    "templates",
  ]);
  // Give an API key the scope ["variableApi"] to let it read resolved variables only.
  const variableApi = await ACManager.resolvePolicy("variableApi", [
    "variables.resolve",
  ]);
  await ACManager.resolveRole("user", [deploy, variableApi]);
};

if (import.meta.main) {
  await syncDeployAccessControl();
  Deno.exit();
}
