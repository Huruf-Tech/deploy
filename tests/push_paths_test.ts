import { assert, assertEquals, assertFalse } from "@std/assert";
import { changedFiles, touches } from "@/lib/github/push.ts";

// Monorepo projects (PLAN §17): which pushes deploy them.

Deno.test("push: watched paths", () => {
  const files = ["apps/web/src/index.ts", "packages/ui/button.tsx"];
  assert(touches(files, ["apps/web"]));
  assert(touches(files, ["./apps/web/"]));
  assert(touches(files, ["apps/*/src/**"]));
  assert(touches(files, ["packages/**"]));
  assert(touches(["README.md"], ["*.md"]));
  assertFalse(touches(files, ["apps/api"]));
  assertFalse(touches(files, ["apps/we"]), "a folder, not a prefix");
  assertFalse(touches(["docs/a/README.md"], ["*.md"]), "* stays in a folder");
});

Deno.test("push: an incomplete file list deploys everything", () => {
  const commit = { added: ["a"], modified: ["b"], removed: ["a"] };
  assertEquals(changedFiles({ commits: [commit] }), ["a", "b"]);
  assertEquals(changedFiles({ commits: [] }), undefined);
  assertEquals(changedFiles({}), undefined);
  assertEquals(changedFiles({ commits: [commit], forced: true }), undefined);
  assertEquals(changedFiles({ commits: [commit], created: true }), undefined);
  assertEquals(changedFiles({ commits: [{ added: ["a"] }] }), undefined);
  assertEquals(
    changedFiles({ commits: Array.from({ length: 2048 }, () => commit) }),
    undefined,
  );
});
