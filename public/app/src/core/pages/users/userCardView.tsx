import { Card, CardContent } from "@/components/ui/card.tsx"
import { Checkbox } from "@/components/ui/checkbox.tsx"

import UserCardSkeleton from "./components/userCardSkeleton.tsx"
import type { TCardProps } from "@/core/types.ts"
import { zodToMongoProjection } from "@/core/lib/zodToMongoProjection.ts"
import { IconUser, IconClock, IconMail, IconBadge } from "@tabler/icons-react"
import React from "react"
import { useNavigate } from "react-router"
import z from "zod"
import { VirtuosoGrid } from "react-virtuoso"
import { Badge } from "@/components/ui/badge.tsx"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { OverdraftLimitModal } from "./components/OverdraftLimitModal.tsx"

import { Container } from "@/core/custom/Container.tsx"
import { getDateGroup } from "@/core/lib/utils.ts"
import { ConfirmationDialog } from "@/core/custom/ConfirmationDialog.tsx"

const usersSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().optional(),
  role: z.string(),
  banned: z.boolean().optional(),
  createdAt: z.string(),
})

export default function UserCardView({
  data,
  isLoading,
  fetcher,
  selectedIds = [],
  toggleSelect,
}: TCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [scrollParent, setScrollParent] = React.useState<HTMLDivElement | null>(
    null
  )
  const [pendingBanUserId, setPendingBanUserId] = React.useState<string | null>(
    null
  )
  const [overdraftUserId, setOverdraftUserId] = React.useState<string | null>(
    null
  )
  const banTriggerRef = React.useRef<HTMLButtonElement>(null)

  const userActions = (user: { banned?: boolean }) => [
    user.banned
      ? { name: t("Unban"), value: "unban" }
      : { name: t("Ban"), value: "ban" },
    { name: t("Add Overdraft Limit"), value: "add-overdraft-limit" },
  ]

  const handleSelectChange = (value: string, userId: string) => {
    if (value === "ban") {
      setPendingBanUserId(userId)
      requestAnimationFrame(() => banTriggerRef.current?.click())
    } else if (value === "unban") {
      // Do nothing for now
    } else if (value === "add-overdraft-limit") {
      setOverdraftUserId(userId)
    }
  }

  const handleConfirmBan = async (reason: string, dismiss: () => void) => {
    if (!pendingBanUserId) return dismiss()
    await ThunderSDK.users.ban({
      params: { id: pendingBanUserId },
      body: { reason },
    })
    fetcher(zodToMongoProjection(usersSchema))
    setPendingBanUserId(null)
    dismiss()
  }

  React.useEffect(() => {
    fetcher(zodToMongoProjection(usersSchema))
  }, [fetcher])

  const users = React.useMemo(() => {
    if (!Array.isArray(data)) return []
    return usersSchema.array().parse(data)
  }, [data])

  return (
    <div
      ref={setScrollParent}
      className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto mask-y-from-98%"
    >
      <Container className="relative w-full">
        {isLoading ? (
          <UserCardSkeleton />
        ) : (
          <VirtuosoGrid
            customScrollParent={scrollParent ?? undefined}
            computeItemKey={(_, user) => user._id}
            listClassName="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6"
            style={{
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
            data={users}
            increaseViewportBy={{ top: 400, bottom: 800 }}
            itemContent={(_, user) => {
              const isSelected = selectedIds.includes(user._id)

              return (
                <Card
                  key={user._id}
                  className="shrink-0 cursor-pointer gap-2 rounded-lg p-0 shadow-sm"
                  onClick={() =>
                    navigate(`./${user._id}`, { state: { name: user.name } })
                  }
                >
                  <div className="relative h-32 w-full overflow-hidden bg-muted">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                        onLoad={(e) => (e.currentTarget.style.opacity = "1")}
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <IconUser className="size-14 text-muted-foreground" />
                      </div>
                    )}

                    <div
                      className="absolute start-2 top-2 z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelect(user._id)
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(user._id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  <CardContent className="flex flex-col gap-1 px-3 py-3">
                    <div className="flex items-start justify-between">
                      <span
                        className="truncate text-sm font-semibold"
                        title={user.name}
                      >
                        {user.name}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-1.5 truncate text-xs text-muted-foreground"
                      title={user.email}
                    >
                      <IconMail className="size-3.5 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] font-medium tracking-wide"
                      >
                        <IconBadge className="mr-1 size-3" />
                        {user.role}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center gap-1 border-t pt-2 text-[11px] text-muted-foreground">
                      <IconClock className="size-3 shrink-0" />
                      <span className="truncate">
                        {getDateGroup(user.createdAt)}
                      </span>
                    </div>

                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value=""
                        onValueChange={(value) =>
                          handleSelectChange(value ?? "", user._id)
                        }
                      >
                        <SelectTrigger className="h-8 w-full text-xs">
                          <SelectValue placeholder={t("Actions")} />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectGroup>
                            {userActions(user).map((opt) => (
                              <SelectItem
                                key={opt.value}
                                value={opt.value}
                                className="text-xs"
                              >
                                {opt.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )
            }}
          />
        )}
      </Container>

      {/* Hidden ConfirmationDialog for ban confirmation */}
      <ConfirmationDialog
        type="input"
        trigger={
          <button ref={banTriggerRef} className="hidden" aria-hidden="true" />
        }
        title={t("Ban User")}
        description={t(
          "Are you sure you want to ban this user? Please provide a reason."
        )}
        inputLabel={t("Reason")}
        inputPlaceholder={t("Enter reason for ban...")}
        confirmText={t("Ban User")}
        confirmingText={t("Banning...")}
        variant="destructive"
        onConfirm={handleConfirmBan}
      />

      {/* Overdraft Limit Modal */}
      <OverdraftLimitModal
        isOpen={!!overdraftUserId}
        onClose={() => setOverdraftUserId(null)}
        userId={overdraftUserId}
      />
    </div>
  )
}
