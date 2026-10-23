/**
 * Parses a .env file the way dotenv tools do: `KEY=value` lines, `export`
 * prefixes, `#` comments, single/double/backtick quotes (multi-line allowed),
 * and `\n`-style escapes inside double quotes. Pure, so tests/dotenv_test.ts
 * runs it under Deno.
 */

export type TEnvEntry = { key: string; value: string }

const KEY = /^[A-Za-z_][A-Za-z0-9_]*$/
const LINE = /^\s*(?:export\s+)?([^=\s#]+)\s*=\s*(.*)$/
const ESCAPES: Record<string, string> = { n: "\n", r: "\r", t: "\t" }

/** Entries in file order (a repeated key keeps its last value); `invalid` lists line numbers. */
export function parseEnv(text: string): {
  entries: TEnvEntry[]
  invalid: number[]
} {
  const lines = text.replace(/\r\n?/g, "\n").split("\n")
  const values = new Map<string, string>()
  const invalid: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim() || line.trim().startsWith("#")) continue
    const match = LINE.exec(line)
    if (!match || !KEY.test(match[1])) {
      invalid.push(i + 1)
      continue
    }
    const [, key, rest] = match
    const quote = rest[0]

    if (quote === '"' || quote === "'" || quote === "`") {
      // A quoted value may span lines; it ends at the next unescaped quote.
      let body = rest.slice(1)
      let end = closingQuote(body, quote)
      while (end < 0 && i + 1 < lines.length) {
        body += "\n" + lines[++i]
        end = closingQuote(body, quote)
      }
      if (end < 0) {
        invalid.push(i + 1)
        continue
      }
      let value = body.slice(0, end)
      if (quote === '"') {
        value = value.replace(/\\(.)/g, (_, c: string) => ESCAPES[c] ?? c)
      }
      values.delete(key) // keep the last position for repeated keys
      values.set(key, value)
    } else {
      // Unquoted: an inline comment starts at " #".
      values.delete(key)
      values.set(key, rest.replace(/\s+#.*$/, "").trim())
    }
  }

  return {
    entries: [...values].map(([key, value]) => ({ key, value })),
    invalid,
  }
}

function closingQuote(text: string, quote: string) {
  for (let i = 0; i < text.length; i++) {
    if (quote === '"' && text[i] === "\\") i++
    else if (text[i] === quote) return i
  }
  return -1
}

/** Names that usually hold credentials: imported as secrets unless unticked. */
export const looksSecret = (key: string) =>
  /SECRET|PASSWORD|PASSWD|PASS$|TOKEN|PRIVATE|CREDENTIAL|API_?KEY|ACCESS_KEY|_KEY$|DSN$|(DATABASE|MONGO|REDIS|POSTGRES|MYSQL)_?URL|CONNECTION_STRING/i.test(
    key
  )
