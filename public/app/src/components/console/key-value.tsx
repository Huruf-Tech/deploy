import { CopyButton } from "@/components/ui/copy-button"
import { cn } from "@/lib/utils"

export type TKeyValue = {
  label: React.ReactNode
  value: React.ReactNode
  /** Shown in mono with a copy button. */
  copy?: string
}

/** A facts list for detail pages: label → value. */
export function KeyValue({
  items,
  className,
}: {
  items: TKeyValue[]
  className?: string
}) {
  return (
    <dl className={cn("flex flex-col text-[13px]", className)}>
      {items.map((item, i) => (
        <div
          key={i}
          className="grid grid-cols-[minmax(7rem,40%)_1fr] gap-x-4 border-b py-2 last:border-0"
        >
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="flex min-w-0 items-center gap-1">
            {item.copy ? (
              <>
                <span dir="ltr" className="truncate font-mono text-xs">
                  {item.value}
                </span>
                <CopyButton value={item.copy} />
              </>
            ) : (
              <span className="min-w-0 break-words">{item.value}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
