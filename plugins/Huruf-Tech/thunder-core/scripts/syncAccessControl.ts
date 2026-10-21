import { ACManager } from "@/lib/accessControlManager.ts";

export const syncAccessControl = async () => {
  // Create access control policies
  const publicPolicy = await ACManager.resolvePolicy("public", [
    "index",
    "home",
    "wellKnown",
    "auth",
    "oauth",
    "me.get",
  ]);
  const developerPolicy = await ACManager.resolvePolicy("developer", [
    "oauthClients",
    "apiKeys",
  ]);
  const iamPolicy = await ACManager.resolvePolicy("iam", [
    "tenants",
    "tenantMembers",
    "tenantInvites",
    "tenantMemberships.get",
    "accessControlPolicies.myPolicies",
    "accessControlPolicies.get",
  ]);
  const mediaPolicy = await ACManager.resolvePolicy("media", ["imageKit.auth"]);
  const rootPolicy = await ACManager.resolvePolicy("root", ["*"]);

  // Attach access control policies with roles
  await ACManager.resolveRole("guest", [publicPolicy]);
  await ACManager.resolveRole("user", [
    publicPolicy,
    developerPolicy,
    iamPolicy,
    mediaPolicy,
  ]);
  await ACManager.resolveRole("admin", [rootPolicy], {
    skipIntersection: true, // If Admin invites a member, the member should get Admin's policies (Limited) instead of intersected policies
  });
};

if (import.meta.main) {
  await syncAccessControl();

  Deno.exit();
}
