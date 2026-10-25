import { useReducedMotion } from "motion/react"
import { curveMonotoneX } from "@visx/curve"

import { LineChart, Line } from "./line-chart"
import { Grid } from "./grid"
import { XAxis } from "./x-axis"
import { YAxis } from "./y-axis"
import { ChartTooltip } from "./tooltip"
import { AreaSparkline } from "./sparkline"

/**
 * Our defaults over bklit (DESIGN §6): compact margins, a short first draw
 * (none under reduced motion), Huruf's orange ramp, tooltips with units.
 * Pages use these, not the bklit components directly.
 */

/** Series colors in ramp order; past five, neutral greys (never status hues). */
export const SERIES = [
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-1)",
  "var(--chart-5)",
  "var(--chart-3)",
  "var(--muted-foreground)",
]

export type TSeries = { key: string; label: string; color?: string }

const DAY = 24 * 60 * 60 * 1000

/** Times for ranges up to two days, dates beyond, in the viewer's locale. */
function timeLabels(data: Record<string, unknown>[]) {
  const dates = data.map((d) => d.date as Date)
  const span = (dates.at(-1)?.getTime() ?? 0) - (dates[0]?.getTime() ?? 0)
  const format = new Intl.DateTimeFormat(
    undefined,
    span <= 2 * DAY
      ? { hour: "2-digit", minute: "2-digit" }
      : { month: "short", day: "numeric" }
  )
  return dates.map((d) => format.format(d))
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
      <XAxis numTicks={5} labels={timeLabels(data)} />
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

/** A KPI sparkline (for `Stat`'s chart slot). Not interactive. */
export function Spark<T extends Record<string, unknown>>({
  data,
  dataKey,
  color = "var(--chart-2)",
}: {
  data: readonly T[]
  dataKey: keyof T & string
  color?: string
}) {
  const still = useReducedMotion()
  return (
    <AreaSparkline
      data={data}
      dataKey={dataKey}
      color={color}
      interactive={false}
      animate={!still}
      className="size-full"
    />
  )
}
