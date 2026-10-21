import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  IconWallet,
  IconAlertCircle,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"

interface OverdraftLimitModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string | null
}

// Wallet amounts are always persisted as integer minor units (cents/paisa)
const toMinorUnits = (amount: number) => Math.round(amount * 100)
const fromMinorUnits = (minorUnits: number) => minorUnits / 100

export function OverdraftLimitModal({
  isOpen,
  onClose,
  userId,
}: OverdraftLimitModalProps) {
  const { t } = useTranslation()
  const [selectedTenantId, setSelectedTenantId] = useState<string>("")
  const [limit, setLimit] = useState<string>("")
  const [existingLimit, setExistingLimit] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [tenants, setTenants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch user tenants directly from the Admin route
  useEffect(() => {
    let isMounted = true

    const fetchTenants = async () => {
      if (!userId || !isOpen) return

      try {
        setIsLoading(true)

        const response = await ThunderSDK.users.getUserTenants({
          params: { id: userId },
        })

        if (isMounted) {
          // The backend route directly returns the array of { _id, name } objects
          const data = response
          setTenants(data)
          if (data.length > 0) {
            setSelectedTenantId(data[0]._id)
          } else {
            setSelectedTenantId("")
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch tenants:", error)
        toast.error(
          "Fetch tenants error: " + (error?.message || "Unknown error")
        )
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchTenants()

    return () => {
      isMounted = false
    }
  }, [userId, isOpen])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLimit("")
      setExistingLimit(0)
    }
  }, [isOpen])

  // Fetch wallet for the selected tenant to display existing overdraft limit
  useEffect(() => {
    let isMounted = true

    const fetchOverdraftLimit = async () => {
      if (!userId || !selectedTenantId) {
        if (isMounted) {
          setLimit("")
          setExistingLimit(0)
        }
        return
      }

      try {
        const response = await ThunderSDK.wallets.getOverdraftLimit({
          query: {
            userId,
            tenantId: selectedTenantId,
          },
        })
        if (isMounted) {
          setExistingLimit(fromMinorUnits(response?.overdraftLimit ?? 0))
          setLimit("")
        }
      } catch (error) {
        console.error("Failed to fetch overdraft limit:", error)
        if (isMounted) {
          setLimit("")
          setExistingLimit(0)
        }
      }
    }

    fetchOverdraftLimit()

    return () => {
      isMounted = false
    }
  }, [userId, selectedTenantId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedLimit = parseFloat(limit)
    if (
      !userId ||
      !selectedTenantId ||
      !limit ||
      isNaN(parsedLimit) ||
      parsedLimit < 0
    )
      return

    try {
      setIsSubmitting(true)
      await ThunderSDK.wallets.updateOverdraftLimit({
        body: {
          userId,
          tenantId: selectedTenantId,
          limit: toMinorUnits(parsedLimit),
        },
      })
      toast.success(t("Overdraft limit updated successfully!"))
      onClose()
    } catch (error: any) {
      toast.error(error?.message || t("Failed to update overdraft limit"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconWallet className="h-5 w-5" />
            </div>
            {t("Add Overdraft Limit")}
          </SheetTitle>
          <SheetDescription className="pt-2">
            {t(
              "Select a tenant and set an overdraft limit for this user's wallet. This allows them to spend beyond their current balance."
            )}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-4 rounded-xl border bg-card/50 p-4 shadow-sm">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="tenant-select"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {t("Tenant")}
              </Label>
              <Select
                value={selectedTenantId}
                onValueChange={(val) => setSelectedTenantId(val || "")}
                disabled={isLoading || tenants.length === 0}
              >
                <SelectTrigger
                  id="tenant-select"
                  className="w-full bg-background transition-colors hover:bg-accent/50"
                >
                  <SelectValue
                    placeholder={
                      isLoading ? t("Loading tenants...") : t("Select a tenant")
                    }
                  >
                    {selectedTenantId
                      ? tenants.find((t: any) => t._id === selectedTenantId)
                          ?.name
                      : isLoading
                        ? t("Loading tenants...")
                        : t("Select a tenant")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant: any) => (
                    <SelectItem
                      key={tenant._id}
                      value={tenant._id}
                      className="cursor-pointer"
                    >
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tenants.length === 0 && !isLoading && (
                <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                  <IconAlertCircle className="h-3 w-3" />
                  {t("This user does not belong to any tenants.")}
                </p>
              )}
              {selectedTenantId && existingLimit > 0 && (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("Current Overdraft Limit")}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {existingLimit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Label
                htmlFor="input"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {t("Overdraft Limit Amount")}
              </Label>
              <div className="relative">
                <Input
                  id="input"
                  type="number"
                  step="any"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="0"
                  className="[appearance:textfield] bg-background pl-8 text-lg font-medium transition-colors hover:bg-accent/50 focus:bg-background [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("Maximum allowed negative balance.")}
              </p>
            </div>
          </div>

          <SheetFooter className="mt-auto gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedTenantId || !limit}
              className="w-full gap-2 shadow-md sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  {t("Saving...")}
                </>
              ) : (
                <>
                  <IconCheck className="h-4 w-4" />
                  {t("Save Limit")}
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}