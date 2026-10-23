import { assertEquals } from "@std/assert";
import { looksSecret, parseEnv } from "../public/app/src/lib/dotenv.ts";

// The dashboard's .env parser (pasted or uploaded files), run here since the app has no test runner.

Deno.test("dotenv: quotes, comments, export, multi-line, escapes", () => {
  const { entries, invalid } = parseEnv([
    "# a comment",
    "",
    "PLAIN=hello world # trailing comment",
    "export EXPORTED=yes",
    "EMPTY=",
    'DOUBLE="line1\\nline2 \\"quoted\\""',
    "SINGLE='no $escapes \\n here'",
    'MULTI="-----BEGIN KEY-----',
    "abc",
    '-----END KEY-----"',
    "SPACED = around ",
    "HASH=pass#word",
    "1BAD=x",
    "not a line",
    "PLAIN=last wins",
  ].join("\r\n"));

  assertEquals(Object.fromEntries(entries.map((e) => [e.key, e.value])), {
    EXPORTED: "yes",
    EMPTY: "",
    DOUBLE: 'line1\nline2 "quoted"',
    SINGLE: "no $escapes \\n here",
    MULTI: "-----BEGIN KEY-----\nabc\n-----END KEY-----",
    SPACED: "around",
    HASH: "pass#word",
    PLAIN: "last wins",
  });
  assertEquals(
    entries.at(-1)!.key,
    "PLAIN",
    "a repeated key moves to its last line",
  );
  assertEquals(invalid, [13, 14]);
});

Deno.test("dotenv: an unclosed quote is reported, not swallowed", () => {
  assertEquals(parseEnv('A="open\nB=2').invalid, [2]);
});

Deno.test("dotenv: credential-looking names are secret by default", () => {
  for (
    const key of [
      "DB_PASSWORD",
      "API_KEY",
      "GITHUB_TOKEN",
      "DATABASE_URL",
      "STRIPE_SECRET",
    ]
  ) {
    assertEquals(looksSecret(key), true, key);
  }
  for (const key of ["NODE_ENV", "PORT", "PUBLIC_URL", "LOG_LEVEL"]) {
    assertEquals(looksSecret(key), false, key);
  }
});
