import { ThunderSDK } from "thunder-sdk"
import { Link, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { IconLock, IconPencil, IconShield } from "@tabler/icons-react"

import { Page } from "@/components/page"
import { use } from "@/core/hooks/use"
import { getLocalPath } from "@/core/lib/utils"
import { useBreadcrumbTitle } from "@/core/layouts/shared/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useFresh } from "@/hooks/use-fresh"
import { IconChip } from "@/components/meter"

/**
 * A role and the policies attached to it (Admin > Roles > a role), each with
 * its permissions and a way into the policy's form.
 */
export default function RoleDetail() {
  const { t } = useTranslation()
  const { id = "" } = useParams()

  const roleRequest = ThunderSDK.useCaching(
    ["accessControl", id],
    async ({ signal }) =>
      (
        await ThunderSDK.accessControl.get({
          signal,
          params: { id },
          query: {},
        })
      ).results[0]
  )
  // Few enough to read at once; the role's are picked from them.
  const policiesRequest = ThunderSDK.useCaching(
    ["accessControlPolicies", "all"],
    async ({ signal }) =>
      (
        await ThunderSDK.accessControlPolicies.get({
          signal,
          params: {},
          query: { limit: 500 },
        })
      ).results
  )
  const { data: role, isLoading } = use(roleRequest)
  const { data: policies } = use(policiesRequest)
  useFresh(roleRequest, policiesRequest)
  useBreadcrumbTitle(role?.role)

  if (isLoading && !role)
    return (
      <Page className="flex flex-col gap-4 py-4">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </Page>
    )
  if (!role)
    return (
      <Page className="py-4">
        <p className="text-sm text-muted-foreground">{t("Role not found")}</p>
      </Page>
    )

  const attached = role.policies.map(
    (pid) => policies?.find((p) => p._id === pid) ?? { _id: pid }
  )

  return (
    <Page className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-start gap-4">
        <IconChip hue="violet" icon={IconShield} className="size-12" />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 font-mono text-xl font-semibold">
            {role.role}
            {role.skipIntersection && (
              <Badge variant="outline" className="font-sans">
                {t("Full grant to invitees")}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {role.policies.length === 1
              ? t("1 policy attached")
              : t("{{count}} policies attached", {
                  count: role.policies.length,
                })}
            {!!role.subRoles?.length &&
              ` · ${t("Can invite as: {{roles}}", {
                roles: role.subRoles.join(", "),
              })}`}
          </p>
        </div>
        <Button
          variant="outline"
          render={
            <Link to={getLocalPath(`admin/accessControl/form/${role._id}`)} />
          }
        >
          <IconPencil aria-hidden /> {t("Edit role")}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {attached.map((policy) => (
          <Card key={policy._id} size="sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <IconChip hue="sky" icon={IconLock} />
              <div className="min-w-0 flex-1">
                <CardTitle className="font-mono text-base">
                  {"name" in policy ? policy.name : t("Unknown policy")}
                </CardTitle>
                <CardDescription>
                  {"permissions" in policy
                    ? policy.permissions.includes("*")
                      ? t("Every permission")
                      : policy.permissions.length === 1
                        ? t("1 permission")
                        : t("{{count}} permissions", {
                            count: policy.permissions.length,
                          })
                    : t("It may have been deleted.")}
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("Edit {{name}}", {
                  name: "name" in policy ? policy.name : policy._id,
                })}
                render={
                  <Link
                    to={getLocalPath(
                      `admin/accessControlPolicies/form/${policy._id}`
                    )}
                  />
                }
              >
                <IconPencil aria-hidden /> {t("Edit")}
              </Button>
            </CardHeader>
            {"permissions" in policy && policy.permissions.length > 0 && (
              <CardContent>
                <ul className="flex flex-wrap gap-1.5">
                  {[...policy.permissions].sort().map((p) => (
                    <li key={p}>
                      <Badge
                        variant={p === "*" ? "destructive" : "secondary"}
                        className="font-mono"
                      >
                        {p === "*" ? t("everything (*)") : p}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </Page>
  )
}
