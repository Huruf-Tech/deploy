import React from "react"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"

export const Multiselect: typeof Combobox = (props) => {
  const anchor = useComboboxAnchor()

  return (
    <Combobox {...props}>
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(values) => (
            <React.Fragment>
              {values.map((value: string) => (
                <ComboboxChip key={value}>
                  {(props.items as any)?.find((v: any) => v.value === value)?.label ?? value}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => {
            const label = typeof item === "string" ? item : item.label
            const value = typeof item === "string" ? item : item.value

            return (
              <ComboboxItem key={value} value={value}>
                {label}
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
