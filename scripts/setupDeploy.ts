/**
 * One-shot setup for an environment: thunder-core's indexes and RBAC seed,
 * then Huruf Deploy's. Idempotent. Run via `deno task setup:dev` / `setup:prod`.
 */
import { syncDBIndexes } from "@/plugins/Huruf-Tech/thunder-core/scripts/syncDBIndexes.ts";
import { syncAccessControl } from "@/plugins/Huruf-Tech/thunder-core/scripts/syncAccessControl.ts";
import { syncDeployIndexes } from "@/scripts/syncDeployIndexes.ts";
import { syncDeployAccessControl } from "@/scripts/syncDeployAccessControl.ts";
import { seedPlans } from "@/scripts/seedPlans.ts";
import { seedTemplates } from "@/scripts/seedTemplates.ts";

await syncDBIndexes();
await syncAccessControl();
await syncDeployIndexes();
await syncDeployAccessControl();
await seedPlans();
console.log("System templates:", await seedTemplates());

console.log("Setup complete.");
Deno.exit();
