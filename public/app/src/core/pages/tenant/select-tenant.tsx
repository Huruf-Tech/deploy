import React from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { use } from "@/core/hooks/use"

import Logo from "/logo.png"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAuthUrl, getInitials, transformImage } from "@/core/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonRepeater } from "@/core/custom/SkeletonRepeater"
import TenantForm from "./form"
import {
  IconAlertCircle,
  IconDots,
  IconLogout,
  IconPlus,
  IconUser,
} from "@tabler/icons-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Navigate, useLocation, useNavigate } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { useLoading } from "@/core/context/LoaderProvider"
import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useLogout } from "@/core/protected"
import { useBranding } from "@/core/hooks/useBranding"
import { ConfirmationDialog } from "@/core/custom/ConfirmationDialog"


// delay controls
const TENANT_LIST_REVEAL_START_DELAY_SECONDS = 0.08
const TENANT_ITEM_REVEAL_STAGGER_SECONDS = 0.08
const TENANT_ITEM_REVEAL_SECONDS = 0.45
const TENANT_ITEM_REVEAL_EASE = [0.16, 1, 0.3, 1] as const

// type TenantItemMotionProps = Pick<
//   React.ComponentProps<typeof motion.div>,
//   "initial" | "animate" | "exit" | "whileTap"
// >
type TenantItemMotionProps = React.ComponentProps<typeof motion.div>
const tenantItemRevealMotion: TenantItemMotionProps = {
  initial: {
    opacity: 0,
    y: 28,
    scale: 0.98,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.96,
    filter: "blur(6px)",
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
  whileTap: {
    scale: 0.96,
    y: 2,
  },
}

function getTenantItemRevealDelay(index: number) {
  return (
    TENANT_LIST_REVEAL_START_DELAY_SECONDS +
    TENANT_ITEM_REVEAL_STAGGER_SECONDS * index
  )
}

function getTenantItemRevealTransition(index: number) {
  return {
    delay: getTenantItemRevealDelay(index),
    duration: TENANT_ITEM_REVEAL_SECONDS,
    ease: TENANT_ITEM_REVEAL_EASE,
  } satisfies TenantItemMotionProps["transition"]
}

export function SelectTenant() {
  const { t } = useTranslation()
  const { setLoading } = useLoading()
  const [AddTenant, setAddTenant] = React.useState<
    { _id?: string; logo?: string; name: string } | undefined
  >()
  const navigate = useNavigate()
  const { hash } = useLocation()
  const logout = useLogout()
  const { appName, logo } = useBranding()

  /**
   * The tenant awaiting a delete confirmation.
   *
   * The action is chosen from a row's menu, and a menu item cannot be the
   * dialog's trigger -- it unmounts as the menu closes. So the choice is parked
   * here and one controlled dialog below reads it.
   */
  const [pendingDelete, setPendingDelete] = React.useState<
    { _id: string; name: string } | null
  >(null)

  const tenants = React.useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return await ThunderSDK.tenantMemberships.get({
        signal,
        query: {},
        params: {},
      })
    },
    []
  )

  const { data, error, isLoading, refetch } = use(tenants)

  //! Present on both cards on purpose. A user with no tenants lands on the
  //! create form, which has no dismiss, so without this there is no way out of
  //! the app short of clearing storage.
  const logoutButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => void logout()}
      className="text-muted-foreground hover:text-foreground"
    >
      <IconLogout className="size-4 rtl:rotate-180" />
      {t("Log out")}
    </Button>
  )

  if (data?.results.length === 1 && hash !== "#list")
    return <Navigate to={`/${data?.results[0].tenant._id}`} />

  return (
    <div className="flex h-full min-h-svh w-full flex-col items-center justify-center gap-3 p-2">
      {error ? (
        <Alert variant="destructive" className="max-w-md">
          <IconAlertCircle />
          <AlertTitle>{t(error.name)}</AlertTitle>
          <AlertDescription>{t(error.message)}</AlertDescription>
        </Alert>
      ) : null}
      {isLoading ? (
        <CardSkeleton />
      ) : data?.results.length && !AddTenant ? (
        <Card className="w-full max-w-md shadow-none">
          <CardHeader className="flex items-center justify-between gap-3">
            <div className="flex w-full grow flex-col">
              <div className="flex shrink-0 items-center gap-3">
                <img
                  src={logo || Logo}
                  alt={appName}
                  className="h-5 w-auto shrink-0"
                />
              </div>
              <CardTitle>{t("Select Tenant")}</CardTitle>
              <CardDescription>{t("Choose a tenant to proceed")}</CardDescription>
            </div>

            <div className="flex w-full items-center justify-end gap-2">
              {logoutButton}

              <Button
                variant="secondary"
                size="icon-sm"
                aria-label={t("Add tenant")}
                onClick={() => setAddTenant({ name: "" })}
              >
                <IconPlus />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-50 w-full overflow-y-auto px-5 scroll-mask-y-from-90%">
              <AnimatePresence mode="popLayout">
                {data?.results.map(({ tenant }, index) => {
                  const isFirst = index === 0
                  const isLast = index === data.results.length - 1

                  return (
                    <motion.div
                      key={tenant._id as string}
                      {...tenantItemRevealMotion}
                      transition={getTenantItemRevealTransition(index)}
                      layout="position"
                      className="mb-1 transform-gpu will-change-transform"
                    >
                      <Item
                        variant="muted"
                        size="xs"
                        key={tenant._id as string}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isFirst ? "rounded-b-lg" : "",
                          isLast ? "rounded-t-lg" : "",
                        )}
                        onClick={() => navigate(`/${tenant._id}`)}
                      >
                        <ItemMedia variant="default">
                          <Avatar size="lg">
                            <AvatarImage
                              src={transformImage(tenant.logo)}
                              alt={tenant.name}
                            />
                            <AvatarFallback className="bg-muted-foreground/10">
                              {getInitials(tenant.name)}
                            </AvatarFallback>
                          </Avatar>
                        </ItemMedia>

                        <ItemContent>
                          <ItemTitle
                            className="line-clamp-1"
                            title={tenant.name}
                          >
                            {tenant.name}
                          </ItemTitle>
                        </ItemContent>

                        <ItemActions onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant={"link"}
                            onClick={(e) => {
                              e.stopPropagation()
                              const authUrl = getAuthUrl(`/?tab=members&tenant=${tenant._id}`)

                              window.location.href = authUrl.toString()
                            }}
                          >
                            {t("Members")}
                          </Button>

                          {/*
                            `items` used to be passed here as well as rendered
                            as children below, leaving the same list declared
                            twice for one menu.
                          */}
                          <Select
                            onValueChange={(value) => {
                              switch (value) {
                                case "edit":
                                  setAddTenant({
                                    _id: tenant._id,
                                    logo: tenant.logo,
                                    name: tenant.name,
                                  })
                                  break

                                case "delete":
                                  //! Deleting a tenant takes everything in it
                                  //! and cannot be undone, so it is confirmed
                                  //! rather than run straight from the menu.
                                  setPendingDelete({
                                    _id: tenant._id,
                                    name: tenant.name,
                                  })
                                  break
                              }
                            }}
                          >
                            <SelectTrigger
                              render={
                                <Button variant="outline" size="icon-sm">
                                  <IconDots />
                                </Button>
                              }
                            ></SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>{t("Actions")}</SelectLabel>
                                {[
                                  { label: t("Edit"), value: "edit" },
                                  { label: t("Delete"), value: "delete" },
                                ].map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </ItemActions>
                      </Item>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </CardContent>
          <CardFooter className="text-center">
            <small className="text-muted-foreground">
              {t("Tenant selection is required so that you can access the appropriate resources and settings.")}
            </small>
          </CardFooter>
        </Card>
      ) : (
        <Card className="w-full max-w-md shadow-none">
          <CardHeader className="flex flex-col items-center justify-center text-center">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
              <IconUser className="size-4" />
            </div>

            {/* Read "Create Tenant" while editing, since nothing branched. */}
            <CardTitle>
              {AddTenant?._id ? t("Edit Tenant") : t("Create Tenant")}
            </CardTitle>
            <CardDescription>
              {AddTenant?._id
                ? t("Update the tenant name and logo")
                : t("Please fill the form to create a new tenant")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TenantForm
              data={AddTenant}
              afterSubmitSuccess={() => {
                refetch()
                setAddTenant(undefined)
              }}
              footerContent={() =>
                data?.results?.length ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setAddTenant(undefined)}
                  >
                    {t("Dismiss")}
                  </Button>
                ) : (
                  <div className="flex justify-center">{logoutButton}</div>
                )
              }
            />
          </CardContent>
        </Card>
      )}

      {/*
        One dialog for the whole list, driven by `pendingDelete`. `type="strict"`
        asks for the tenant name to be typed out: this is the most destructive
        action on the page and there is no undo behind it.
      */}
      <ConfirmationDialog
        trigger={undefined}
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        type="strict"
        hint={pendingDelete?.name ?? ""}
        variant="destructive"
        title={t("Delete tenant")}
        description={t(
          "This permanently deletes {{name}} and everything inside it. This cannot be undone.",
          { name: pendingDelete?.name ?? "" }
        )}
        confirmText={t("Delete")}
        confirmingText={t("Deleting...")}
        onConfirm={async () => {
          if (!pendingDelete) return

          setLoading(true)

          try {
            await ThunderSDK.tenants.del({ params: { id: pendingDelete._id } })

            toast.success(t("Deleted successfully."))

            //! Closed by clearing the state that opens it, rather than through
            //! the dialog's `dismiss()`: while `open` is controlled, the state
            //! here is the source of truth and the imperative close would be
            //! fighting it.
            setPendingDelete(null)

            await refetch()
          } catch (err) {
            //! The old call had no catch and reset the loader on the happy path
            //! only, so a failed delete left the page spinning for good.
            toast.error(
              err instanceof Error ? err.message : t("Failed to delete tenant.")
            )
          } finally {
            setLoading(false)
          }
        }}
      />
    </div>
  )
}

function CardSkeleton() {
  return (
    <Card className="w-full max-w-md shadow-none">
      <CardHeader className="flex flex-col items-center justify-center gap-2 text-center">
        <Skeleton className="size-10 min-w-10 rounded-full bg-muted-foreground/10" />
        <Skeleton className="h-4 w-full max-w-20 bg-muted-foreground/10" />
        <Skeleton className="h-4 w-full max-w-30 bg-muted-foreground/10" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-50 w-full">
          <SkeletonRepeater count={3}>
            <Item
              variant="muted"
              size="xs"
              className="first:rounded-b-lg last:rounded-t-lg"
            >
              <Skeleton className="size-10 min-w-10 rounded-full bg-muted-foreground/10" />
              <div className="flex flex-1 flex-col">
                <Skeleton className="my-0.5 h-4 max-w-30 bg-muted-foreground/10" />
              </div>
              <Skeleton className="h-7 w-14 bg-muted-foreground/10" />
            </Item>
          </SkeletonRepeater>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex items-center justify-center">
        <Skeleton className="h-4 w-full max-w-50 bg-muted-foreground/10" />
      </CardFooter>
    </Card>
  )
}

