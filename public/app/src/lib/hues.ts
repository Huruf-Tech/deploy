/** One hue per thing it identifies (a resource, an action), never per rank. */
export const HUES = {
  sky: {
    chip: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    bar: "bg-sky-500",
    soft: "bg-sky-500/35",
    ring: "hover:border-sky-500/50",
  },
  violet: {
    chip: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    bar: "bg-violet-500",
    soft: "bg-violet-500/35",
    ring: "hover:border-violet-500/50",
  },
  emerald: {
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    bar: "bg-emerald-500",
    soft: "bg-emerald-500/35",
    ring: "hover:border-emerald-500/50",
  },
  amber: {
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    bar: "bg-amber-500",
    soft: "bg-amber-500/35",
    ring: "hover:border-amber-500/50",
  },
  rose: {
    chip: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    bar: "bg-rose-500",
    soft: "bg-rose-500/35",
    ring: "hover:border-rose-500/50",
  },
  orange: {
    chip: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    bar: "bg-orange-500",
    soft: "bg-orange-500/35",
    ring: "hover:border-orange-500/50",
  },
} as const
export type THue = keyof typeof HUES

export type TLevel = "ok" | "warning" | "critical"

/** A bar's fill: the resource's hue while fine, amber or rose when it isn't. */
export const levelFill = (hue: THue, level: TLevel = "ok") =>
  level === "critical"
    ? HUES.rose.bar
    : level === "warning"
      ? HUES.amber.bar
      : HUES[hue].bar
