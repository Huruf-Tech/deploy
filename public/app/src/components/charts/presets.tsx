import { useReducedMotion } from "motion/react"
import { curveMonotoneX } from "@visx/curve"

import { LineChart, Line } from "./line-chart"
import { Grid } from "./grid"
import { XAxis } from "./x-axis"
import { YAxis } from "./y-axis"
import { ChartTooltip } from "./tooltip"

/**
 * Our defaults over bklit (DESIGN §6): compact margins, a short first draw
 * (none under reduced motion), Huruf's orange ramp, tooltips with units.
 * Pages use these, not the bklit components directly.
 */

/**
 * Series colours: Huruf orange first, then hues far apart from it and from
 * each other (an orange ramp was too close to tell lines apart). Defined in
 * index.css per theme; never the status colours.
 */
export const SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--muted-foreground)",
]

export type TSeries = { key: string; label: string; color?: string }

const DAY = 24 * 60 * 60 * 1000

/**
 * Ticks evenly spaced in time (sparse or uneven samples can't bunch them):
 * times for ranges up to two days, dates beyond, in the viewer's locale.
 * The first tick sits under the y axis' bottom label, so it stays blank.
 */
function tickFormatter(data: Record<string, unknown>[]) {
  const first = (data[0]?.date as Date | undefined)?.getTime() ?? 0
  const last = (data.at(-1)?.date as Date | undefined)?.getTime() ?? 0
  const format = new Intl.DateTimeFormat(
    undefined,
    last - first <= 2 * DAY
      ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
      : { month: "short", day: "numeric" }
  )
  return (date: Date, index: number) => (index === 0 ? "" : format.format(date))
}

export function TimeSeries({
  data,
  series,
  format = String,
  aspectRatio = "3 / 1",
  className,
}: {
  /** Rows with a `date` (Date) and one number per series key. */
  data: Record<string, unknown>[]
  series: TSeries[]
  format?: (value: number) => string
  aspectRatio?: string
  className?: string
}) {
  const still = useReducedMotion()
  const color = (s: TSeries, i: number) => s.color ?? SERIES[i % SERIES.length]
  return (
    <LineChart
      data={data}
      aspectRatio={aspectRatio}
      className={className}
      margin={{ top: 8, right: 8, bottom: 24, left: 64 }}
      animationDuration={still ? 0 : 300}
    >
      <Grid horizontal numTicksRows={4} />
      {series.map((s, i) => (
        <Line
          key={s.key}
          dataKey={s.key}
          stroke={color(s, i)}
          strokeWidth={1.75}
          // Monotone: never overshoots the samples, unlike the default natural curve.
          curve={curveMonotoneX}
          animate={!still}
        />
      ))}
      <YAxis numTicks={4} formatValue={format} />
      <XAxis numTicks={5} tickMode="domain" formatTick={tickFormatter(data)} />
      <ChartTooltip
        rows={(point) =>
          series.map((s, i) => ({
            color: color(s, i),
            label: s.label,
            value:
              typeof point[s.key] === "number"
                ? format(point[s.key] as number)
                : "–",
          }))
        }
      />
    </LineChart>
  )
}
