/**
 * If you are building a plugin for thunder this script will allow you to execute lifecycle (setup) code on the actual project.
 * Write your logic below to setup stuff like database migrations, seeding or any other setup stuff when the plugin is installed on a thunder project.
 *
 * You can freely delete this file if you don't need it
 */

import { syncDBIndexes } from "./syncDBIndexes.ts";
import { syncAccessControl } from "./syncAccessControl.ts";

await syncDBIndexes().catch(console.warn);
await syncAccessControl().catch(console.warn);

Deno.exit();
