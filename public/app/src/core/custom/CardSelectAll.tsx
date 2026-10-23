import { Checkbox } from "@/components/ui/checkbox"

interface CardSelectAllProps {
    checked?: boolean | "indeterminate"
    selectedCount?: number
    totalCount?: number
    onChange?: (checked: boolean) => void
}

export function CardSelectAll({
    checked = false,
    selectedCount = 0,
    totalCount = 0,
    onChange,
}: CardSelectAllProps) {
    const isChecked = checked === true

    return (
        <button
            type="button"
            className="flex h-9 cursor-pointer select-none items-center gap-2 rounded-full border border-border bg-background px-3 text-xs shadow-xs transition-colors hover:bg-accent focus:outline-none"
            onClick={() => onChange?.(!isChecked)}
        >
            <Checkbox
                checked={isChecked}
                tabIndex={-1}
                className="pointer-events-none size-4 rounded-sm"
                aria-label="Select all cards"
            />
            <span className="font-medium text-muted-foreground">
                {selectedCount > 0
                    ? `${selectedCount} / ${totalCount}`
                    : totalCount}
            </span>
        </button>
    )
}
