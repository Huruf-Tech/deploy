export type TLogLevel = "error" | "warn" | "info" | "debug"

export type TLogLine = {
  /** Docker's RFC 3339 timestamp, when the line had one. */
  time?: Date
  level?: TLogLevel
  message: string
  /** Remaining structured fields of a JSON line, in their original order. */
  fields: [string, string][]
}

const TIMESTAMP =
  /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d))\s/
const LEVEL_WORD =
  /\b(fatal|panic|crit(?:ical)?|err(?:or)?|warn(?:ing)?|info|notice|debug|trace)\b/i
const MESSAGE_KEYS = ["msg", "message"]
const LEVEL_KEYS = ["level", "lvl", "severity"]
const SKIP_KEYS = ["ts", "time", "timestamp", "@timestamp"]

function levelOf(word: unknown): TLogLevel | undefined {
  const w = String(word ?? "").toLowerCase()
  if (/^(fatal|panic|crit|critical|err|error|emerg|alert)$/.test(w))
    return "error"
  if (/^(warn|warning)$/.test(w)) return "warn"
  if (/^(info|notice)$/.test(w)) return "info"
  if (/^(debug|trace)$/.test(w)) return "debug"
}

/** Splits a container log line into timestamp, level, message and fields. */
export function parseLogLine(raw: string): TLogLine {
  let rest = raw
  let time: Date | undefined
  const stamp = TIMESTAMP.exec(raw)
  if (stamp) {
    // Date parses milliseconds only; Docker sends nanoseconds.
    time = new Date(stamp[1].replace(/(\.\d{3})\d+/, "$1"))
    rest = raw.slice(stamp[0].length)
  }

  if (rest.startsWith("{")) {
    try {
      const json = JSON.parse(rest) as Record<string, unknown>
      if (json && typeof json === "object" && !Array.isArray(json)) {
        let level: TLogLevel | undefined
        let message = ""
        const fields: [string, string][] = []
        for (const [key, value] of Object.entries(json)) {
          if (!level && LEVEL_KEYS.includes(key)) level = levelOf(value)
          else if (!message && MESSAGE_KEYS.includes(key))
            message = String(value)
          else if (!SKIP_KEYS.includes(key)) {
            fields.push([
              key,
              typeof value === "string" ? value : JSON.stringify(value),
            ])
          }
        }
        return { time, level, message, fields }
      }
    } catch {
      // Not JSON after all: fall through to plain text.
    }
  }

  const word = LEVEL_WORD.exec(rest.slice(0, 64))
  return {
    time,
    level: word ? levelOf(word[1]) : undefined,
    message: rest,
    fields: [],
  }
}
