import z from "zod";
import { $objectId } from "@/core/utils/createCRUD.ts";

/**
 * Cron expressions as the agent's timer reads them (agent/internal/cron):
 * minute hour day-of-month month day-of-week with `*`, values, ranges, steps
 * and lists, or a macro. Checked here so a bad one never reaches an agent.
 */
const MACROS = new Set([
  "@hourly",
  "@daily",
  "@midnight",
  "@weekly",
  "@monthly",
  "@yearly",
  "@annually",
]);
const BOUNDS = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];

const int = (s: string) => /^\d{1,2}$/.test(s) ? Number(s) : NaN;

function validPart(part: string, lo: number, hi: number) {
  const [span, step, ...rest] = part.split("/");
  if (rest.length || (step !== undefined && !(int(step) >= 1))) return false;
  if (span === "*") return true;
  const [a, b, ...more] = span.split("-");
  const from = int(a), to = b === undefined ? from : int(b);
  return !more.length && from >= lo && to <= hi && from <= to;
}

export function isCron(expr: string) {
  const s = expr.trim();
  if (MACROS.has(s)) return true;
  const fields = s.split(/\s+/);
  return fields.length === 5 &&
    fields.every((f, i) =>
      f.split(",").every((p) => validPart(p, BOUNDS[i][0], BOUNDS[i][1]))
    );
}

const ZONES = new Set(["UTC", ...Intl.supportedValuesOf("timeZone")]);

/** An IANA time zone name, as the browser lists them. */
export const isTimeZone = (zone: string) => ZONES.has(zone);

/** Restart a project's containers on a schedule (PLAN §10.1). */
export const $restartSchedule = z.object({
  cron: z.string().trim().max(100).refine(isCron, "Not a cron expression"),
  timezone: z.string().max(64).refine(isTimeZone, "Unknown time zone"),
  servers: z.array($objectId.meta({ ref: "servers" })).max(50).default([])
    .describe("Only on these of the project's servers; all when empty"),
});

export type TRestartSchedule = z.output<typeof $restartSchedule>;
