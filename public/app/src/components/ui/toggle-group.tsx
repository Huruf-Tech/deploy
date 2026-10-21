import * as React from "react"

import { cn } from "@/lib/utils"

interface ToggleGroupProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  value?: string
  onValueChange?: (value: string) => void
}

const ToggleGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

function ToggleGroup({
  className,
  value,
  onValueChange,
  children,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupContext.Provider value={{ value, onValueChange }}>
      <div
        data-slot="toggle-group"
        className={cn(
          "inline-flex items-center gap-0.5 rounded-lg bg-input/50 p-0.5",
          className
        )}
        role="group"
        {...props}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  )
}

function ToggleGroupItem({
  className,
  value,
  children,
  ...props
}: React.ComponentProps<"button"> & { value: string }) {
  const ctx = React.useContext(ToggleGroupContext)
  const isActive = ctx.value === value

  return (
    <button
      type="button"
      data-slot="toggle-group-item"
      data-state={isActive ? "on" : "off"}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-all outline-none",
        "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground",
        className
      )}
      onClick={() => ctx.onValueChange?.(value)}
      aria-pressed={isActive}
      {...props}
    >
      {children}
    </button>
  )
}

export { ToggleGroup, ToggleGroupItem }
