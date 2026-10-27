import { Link, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { IconPencil } from "@tabler/icons-react"

import { Page } from "@/components/page"
import { getLocalPath } from "@/core/lib/utils"
import { useBreadcrumbTitle } from "@/core/layouts/shared/breadcrumb"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { KeyValue } from "@/components/console/key-value"
import { StatusBadge } from "@/components/console/status"
import { EmptyState } from "@/components/console/empty-state"
import { Chip } from "@/components/record-cards"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"

/**
 * A role and the policies attached to it (Admin > Roles > a role), each with
 * its permissions and a way into the policy's form.
 */
export default function RoleDetail() {
  const { t } = useTranslation()
  const { id = "" } = useParams()

  const { data: role, isLoading } = useCached(queries.role(id))
  // The role's policies are picked from all of them.
  const { data: policies } = useCached(queries.policies())
  useBreadcrumbTitle(role?.role)

  if (isLoading && !role)
    return (
      <Page className="flex flex-col gap-4 py-5">
        <Skeleton className="h-12 rounded-[10px]" />
        <Skeleton className="h-40 rounded-[10px]" />
      </Page>
    )
  if (!role)
    return (
      <Page className="py-5">
        <EmptyState title={t("Role not found")} />
      </Page>
    )

  const attached = role.policies.map(
    (pid) => policies?.find((p) => p._id === pid) ?? { _id: pid }
  )

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={
          <h1
            dir="ltr"
            className="truncate font-mono text-xl font-semibold tracking-tight"
          >
            {role.role}
          </h1>
        }
        status={
          role.skipIntersection && (
            <StatusBadge tone="warning" label={t("Full grant to invitees")} />
          )
        }
        description={
          role.policies.length === 1
            ? t("1 policy attached")
            : t("{{count}} policies attached", {
                count: role.policies.length,
              })
        }
        actions={
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={
              <Link to={getLocalPath(`admin/accessControl/form/${role._id}`)} />
            }
          >
            <IconPencil data-icon="inline-start" aria-hidden />
            {t("Edit role")}
          </Button>
        }
      />

      <Panel bodyClassName="px-4 py-1">
        <KeyValue
          items={[
            { label: t("Role"), value: role.role, copy: role.role },
            {
              label: t("Policies"),
              value: (
                <span className="tabular-nums">{role.policies.length}</span>
              ),
            },
            {
              label: t("Full grant to invitees"),
              value: role.skipIntersection ? t("Yes") : t("No"),
            },
            ...(role.subRoles?.length
              ? [
                  {
                    label: t("Can invite as"),
                    value: (
                      <span className="flex flex-wrap gap-1.5">
                        {role.subRoles.map((r) => (
                          <Chip key={r}>{r}</Chip>
                        ))}
                      </span>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        {attached.map((policy) => (
          <Panel
            key={policy._id}
            title={
              <span dir="ltr" className="font-mono text-[13px]">
                {"name" in policy ? policy.name : t("Unknown policy")}
              </span>
            }
            description={
              "permissions" in policy
                ? policy.permissions.includes("*")
                  ? t("Every permission")
                  : policy.permissions.length === 1
                    ? t("1 permission")
                    : t("{{count}} permissions", {
                        count: policy.permissions.length,
                      })
                : t("It may have been deleted.")
            }
            actions={
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("Edit {{name}}", {
                  name: "name" in policy ? policy.name : policy._id,
                })}
                nativeButton={false}
                render={
                  <Link
                    to={getLocalPath(
                      `admin/accessControlPolicies/form/${policy._id}`
                    )}
                  />
                }
              >
                <IconPencil data-icon="inline-start" aria-hidden />
                {t("Edit")}
              </Button>
            }
            bodyClassName={
              "permissions" in policy && policy.permissions.length > 0
                ? "p-4"
                : "hidden"
            }
          >
            {"permissions" in policy && policy.permissions.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {[...policy.permissions].sort().map((p) => (
                  <li key={p}>
                    {p === "*" ? (
                      <StatusBadge tone="danger" label={t("everything (*)")} />
                    ) : (
                      <Chip>{p}</Chip>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ))}
      </div>
    </Page>
  )
}
