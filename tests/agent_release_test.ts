import { assertEquals } from "@std/assert";
import { bump } from "@/scripts/agent.ts";

Deno.test("agent release: versions bump as semver", () => {
  assertEquals(bump([0, 0, 0], "patch"), "0.0.1");
  assertEquals(bump([1, 4, 9], "patch"), "1.4.10");
  assertEquals(bump([1, 4, 9], "minor"), "1.5.0");
  assertEquals(bump([1, 4, 9], "major"), "2.0.0");
});
