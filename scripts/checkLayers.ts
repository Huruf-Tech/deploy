/**
 * Dependency-direction check (PLAN §23.1): routes → lib/<domain> → lib/core → schemas.
 * Exits non-zero on any import that points upward.
 */
import { walk } from "@std/fs/walk";

const RULES: Array<{ from: RegExp; forbid: RegExp; why: string }> = [
  {
    from: /^lib\/core\//,
    forbid: /^@\/(lib\/(?!core\/)|routes\/|scripts\/)/,
    why: "building blocks never import domains, routes or scripts",
  },
  {
    from: /^lib\//,
    forbid: /^@\/(routes|scripts)\//,
    why: "services never import routes or scripts",
  },
  {
    from: /^schemas\//,
    forbid: /^@\/(lib|routes|scripts)\//,
    why: "schemas are the bottom layer",
  },
];

const violations: string[] = [];

for (const dir of ["lib", "schemas"]) {
  for await (const entry of walk(dir, { exts: [".ts", ".tsx"] })) {
    const path = entry.path.replaceAll("\\", "/");
    const source = await Deno.readTextFile(entry.path);

    for (const [, specifier] of source.matchAll(/from\s+["']([^"']+)["']/g)) {
      for (const rule of RULES) {
        if (rule.from.test(path) && rule.forbid.test(specifier)) {
          violations.push(`${path} imports ${specifier} (${rule.why})`);
        }
      }
    }
  }
}

if (violations.length) {
  console.error(violations.join("\n"));
  Deno.exit(1);
}

console.log("Layer check passed.");
