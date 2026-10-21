"use client"

import { Input } from "@/components/ui/input"
import React from "react"
import { debounce } from "../lib/debounce"

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounceMs = 500, // This is the wait time, not the function
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounceMs?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = React.useState(initialValue)

  // Sync with initialValue when it changes
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(initialValue)
  }, [initialValue])

  const debouncedOnChange = React.useMemo(
    () =>
      debounce((newValue: string | number) => {
        onChange(newValue)
      }, debounceMs),
    [debounceMs, onChange]
  )

  React.useEffect(() => {
    return () => {
      debouncedOnChange.cancel()
    }
  }, [debouncedOnChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue) // Update local state immediately
    debouncedOnChange(newValue) // Call debounced version
  }

  return <Input {...props} value={value} onChange={handleChange} />
}
