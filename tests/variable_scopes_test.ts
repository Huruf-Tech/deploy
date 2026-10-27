import { assertEquals } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import "@/serve.base.ts";
import { ObjectId } from "mongodb";
import { mongodb } from "@/database.ts";
import {
  createVariable,
  resolveVariableSet,
} from "@/lib/variables/variables.ts";

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

Deno.test({
  name: "variables: references reach through other projects",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const tenant = new ObjectId();
    const user = new ObjectId();
    const ids = {
      web: new ObjectId(),
      db: new ObjectId(),
      cache: new ObjectId(),
    };
    const d = mongodb.db();
    const add = (project: keyof typeof ids, key: string, value: string) =>
      createVariable({
        viewer: { user, tenant, project: ids[project] },
        owner: { scope: "project", tenant, project: ids[project] },
        key,
        value,
        settings: { isSecret: false, kind: "env", stage: "runtime" },
      });
    try {
      await d.collection("projects").insertMany(
        Object.entries(ids).map(([slug, _id]) => ({ _id, tenant, slug })),
      );
      await add("cache", "HOST", "redis");
      await add("db", "URL", "${{cache.HOST}}:6379");
      await add("web", "DB", "${{db.URL}}");
      const resolved = await resolveVariableSet({
        user,
        tenant,
        project: ids.web,
      });
      assertEquals(
        resolved.find((v) => v.key === "DB")?.value,
        "redis:6379",
      );
    } finally {
      await d.collection("projects").deleteMany({ tenant });
      await d.collection("variables").deleteMany({ tenant });
      await d.collection("keyring").deleteMany({ "owner.ref": tenant });
    }
  },
});
