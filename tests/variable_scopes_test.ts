import { assertEquals } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import "@/serve.base.ts";
import { ObjectId } from "mongodb";
import { mongodb } from "@/database.ts";
import { createVariable } from "@/lib/variables/variables.ts";

// Two projects of one tenant may use the same variable name (e.g. two Redis
// services, each with a generated PASSWORD); one project may not twice.

Deno.test({
  name: "variables: each project is its own scope",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const tenant = new ObjectId();
    const user = new ObjectId();
    const [a, b] = [new ObjectId(), new ObjectId()];
    const settings = {
      isSecret: true,
      kind: "env" as const,
      stage: "runtime" as const,
    };
    const add = (project: ObjectId) =>
      createVariable({
        viewer: { user, tenant, project },
        owner: { scope: "project", tenant, project },
        key: "PASSWORD",
        value: "s3cret",
        settings,
      });
    try {
      await add(a);
      await add(b);
      const again = await add(a).then(() => 200, (e: Response) => e.status);
      assertEquals(again, 400);
    } finally {
      await mongodb.db().collection("variables").deleteMany({ tenant });
      await mongodb.db().collection("keyring").deleteMany({
        "owner.ref": tenant,
      });
    }
  },
});
