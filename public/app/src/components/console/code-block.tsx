import { CopyButton } from "@/components/ui/copy-button"
import { cn } from "@/lib/utils"

/** Mono text with a copy button: DNS records, commands, logs. */
export function CodeBlock({
  code,
  wrap,
  label,
  maxHeight,
  className,
}: {
  code: string
  wrap?: boolean
  /** Scrolls the code past this height (e.g. "18rem"); the copy button stays put. */
  maxHeight?: string
  label?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative rounded-lg border bg-muted/50", className)}>
      {label && (
        <div className="border-b px-3 py-1.5 text-xs text-muted-foreground">
          {label}
        </div>
      )}
      <pre
        dir="ltr"
        style={maxHeight ? { maxHeight } : undefined}
        className={cn(
          "overflow-auto p-3 pe-10 font-mono text-xs leading-relaxed",
          wrap ? "break-all whitespace-pre-wrap" : "whitespace-pre"
        )}
      >
        {code}
      </pre>
      <CopyButton
        value={code}
        className={cn("absolute end-2", label ? "top-10" : "top-2")}
      />
    </div>
  )
}
