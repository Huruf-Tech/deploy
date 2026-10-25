import * as React from "react"

/**
 * A small highlighter for what the dashboard shows: shell commands, YAML
 * (compose files, templates) and Dockerfiles. Colours come from the theme's
 * tokens (DESIGN §3), so both themes stay readable.
 *
 * ponytail: regex tokens per line, not a parser; heredocs and multi-line
 * strings colour line by line. Swap for shiki if real grammars are needed.
 */
export type TLang = "shell" | "yaml" | "dockerfile"

const STYLE = {
  cmd: "text-brand-text",
  flag: "text-info-foreground",
  str: "text-success-foreground",
  var: "text-warning-foreground",
  key: "text-info-foreground",
  comment: "text-muted-foreground italic",
  num: "text-warning-foreground",
  punct: "text-muted-foreground",
} as const
type TToken = keyof typeof STYLE

/** Pattern, token, and whether it may start mid-word (strings, variables). */
type TRule = [RegExp, TToken, boolean?]

const STRING: TRule = [/"(?:[^"\\]|\\.)*"?|'[^']*'?/y, "str", true]
const VAR: TRule = [
  /\$\{[^}]*\}|\$[A-Za-z_][A-Za-z0-9_]*|\{\{[^}]*\}\}/y,
  "var",
  true,
]
const COMMENT: TRule = [/#.*/y, "comment"]

const RULES: Record<TLang, TRule[]> = {
  shell: [
    COMMENT,
    STRING,
    VAR,
    [/--?[A-Za-z][\w-]*/y, "flag"],
    [/[|&;\\]+/y, "punct", true],
  ],
  yaml: [
    COMMENT,
    [/[A-Za-z0-9_.-]+(?=\s*:(\s|$))/y, "key"],
    STRING,
    VAR,
    [/\b(?:true|false|null|yes|no|\d+(?:\.\d+)?)\b/y, "num"],
  ],
  dockerfile: [
    COMMENT,
    [
      /\b(?:FROM|RUN|CMD|COPY|ADD|WORKDIR|ENV|ARG|EXPOSE|ENTRYPOINT|USER|LABEL|VOLUME|HEALTHCHECK|SHELL|STOPSIGNAL|ONBUILD|AS)\b/y,
      "cmd",
    ],
    STRING,
    VAR,
    [/--?[A-Za-z][\w-]*/y, "flag"],
  ],
}

function line(text: string, lang: TLang, key: number, startsCommand: boolean) {
  const out: React.ReactNode[] = []
  let plain = ""
  // A shell line's first word (after env assignments / sudo) is the command.
  let expectCmd = startsCommand
  const flush = () => {
    if (plain) out.push(plain)
    plain = ""
  }
  for (let i = 0; i < text.length;) {
    let hit: { len: number; tok: TToken } | null = null
    // Flags, keys, comments and commands only start a word: not "a-b", "x#y".
    const wordStart = i === 0 || /[\s=(|;&]/.test(text[i - 1])
    for (const [re, tok, anywhere] of RULES[lang]) {
      if (!anywhere && !wordStart) continue
      re.lastIndex = i
      const m = re.exec(text)
      if (!m || !m[0]) continue
      hit = { len: m[0].length, tok }
      break
    }
    if (!hit && expectCmd && wordStart && /[A-Za-z./_]/.test(text[i])) {
      const word = /[^\s|;&]+/y
      word.lastIndex = i
      const m = word.exec(text)!
      if (!/=/.test(m[0])) {
        hit = { len: m[0].length, tok: "cmd" }
        if (m[0] !== "sudo") expectCmd = false
      }
    }
    if (hit) {
      flush()
      out.push(
        <span key={i} className={STYLE[hit.tok]}>
          {text.slice(i, i + hit.len)}
        </span>
      )
      if (lang === "shell" && hit.tok === "punct" && /[|;&]/.test(text[i]))
        expectCmd = true
      i += hit.len
    } else {
      plain += text[i]
      i += 1
    }
  }
  flush()
  return <React.Fragment key={key}>{out}</React.Fragment>
}

export function highlight(code: string, lang: TLang) {
  // A line ending in "\" continues the command: its next line has no new command.
  return code.split("\n").flatMap((text, i, lines) => {
    const continued = i > 0 && /\\\s*$/.test(lines[i - 1])
    const node = line(text, lang, i, lang === "shell" && !continued)
    return i < lines.length - 1 ? [node, "\n"] : [node]
  })
}

/** Guesses the language from a file name, for rendered template files. */
export function langOf(name: string): TLang | undefined {
  if (/dockerfile/i.test(name)) return "dockerfile"
  if (/\.(ya?ml)$/i.test(name)) return "yaml"
  if (/\.(sh|bash)$/i.test(name)) return "shell"
  return undefined
}
