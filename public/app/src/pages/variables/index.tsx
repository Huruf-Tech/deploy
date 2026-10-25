import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconBraces,
  IconEye,
  IconEyeOff,
  IconFile,
  IconKey,
  IconLock,
  IconPencil,
  IconFileImport,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"

import { Page } from "@/components/page"
import { PageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Toolbar } from "@/components/console/toolbar"
import { DataTable, type TColumn } from "@/components/console/data-table"
import { EmptyState } from "@/components/console/empty-state"
import { CodeBlock } from "@/components/console/code-block"
import { use } from "@/core/hooks/use"
import { getAuthUrl } from "@/core/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  SelectAllCheckbox,
  SelectCheckbox,
  SelectionBar,
  useSelection,
} from "@/components/selection-bar"
import { errorMessage } from "@/lib/utils"
import { VariableDialog, type TScope, type TVariable } from "./VariableDialog"
import { ImportEnvDialog } from "./ImportEnvDialog"
import { useFresh } from "@/hooks/use-fresh"
import { ago } from "@/pages/projects/shared"

function SecretValue({
  variable,
  scope,
}: {
  variable: TVariable
  scope: TScope
}) {
  const { t } = useTranslation()
  const [value, setValue] = React.useState<string>()
  const [busy, setBusy] = React.useState(false)

  const toggle = async () => {
    if (value !== undefined) return setValue(undefined)
    setBusy(true)
    try {
      const revealed = await ThunderSDK.variables.reveal({
        params: { id: variable._id },
        body: scope,
      })
      setValue(revealed.value)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not reveal the value"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <span className="truncate font-mono text-xs">
        {value ?? "••••••••••••"}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggle}
        disabled={busy}
        aria-label={value === undefined ? t("Reveal") : t("Hide")}
      >
        {value === undefined ? <IconEye /> : <IconEyeOff />}
      </Button>
      {value !== undefined && <CopyButton value={value} />}
    </div>
  )
}

function DeleteDialog({
  variable,
  scope,
  onOpenChange,
  onDeleted,
}: {
  variable?: TVariable
  scope: TScope
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = React.useState(false)

  const remove = async () => {
    if (!variable) return
    setBusy(true)
    try {
      await ThunderSDK.variables.del({
        params: { id: variable._id },
        query: scope,
      })
      toast.success(t("Variable deleted"))
      onDeleted()
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not delete the variable"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!variable} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("Delete {{key}}?", { key: variable?.key })}
          </DialogTitle>
          <DialogDescription>
            {t(
              "Running apps keep their current value until their next deploy. Variables that reference it will fail to resolve."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" onClick={remove} disabled={busy}>
            {t("Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function VariableTable({
  scope,
  switcher,
}: {
  scope: TScope
  /** A scope switch, shown at the start of the toolbar. */
  switcher?: React.ReactNode
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = React.useState<TVariable | "new" | null>(null)
  const [deleting, setDeleting] = React.useState<TVariable>()
  const [importing, setImporting] = React.useState(false)
  const [filter, setFilter] = React.useState("")

  const request = ThunderSDK.useCaching(
    ["variables", scope.scope, scope.project ?? ""],
    async ({ signal }) =>
      await ThunderSDK.variables.list({ signal, query: scope })
  )
  const { data, isLoading } = use(request)
  useFresh(request)
  const reload = () => request.invalidate()
  const selection = useSelection()

  const stageLabel = {
    runtime: t("Runtime"),
    build: t("Build"),
    both: t("Build and runtime"),
  }

  const add = (
    <>
      <Button size="sm" variant="outline" onClick={() => setImporting(true)}>
        <IconFileImport aria-hidden /> {t("Import .env")}
      </Button>
      <Button size="sm" onClick={() => setEditing("new")}>
        <IconPlus aria-hidden /> {t("Add variable")}
      </Button>
    </>
  )

  const needle = filter.trim().toLowerCase()
  const rows = needle
    ? data?.filter(
        (v) =>
          v.key.toLowerCase().includes(needle) ||
          v.description?.toLowerCase().includes(needle)
      )
    : data

  const columns: TColumn<TVariable>[] = [
    {
      id: "select",
      header: (
        <SelectAllCheckbox
          selection={selection}
          ids={(rows ?? []).map((v) => v._id)}
        />
      ),
      className: "w-10",
      cell: (variable) => (
        <SelectCheckbox
          selection={selection}
          id={variable._id}
          label={variable.key}
        />
      ),
    },
    {
      id: "key",
      header: t("Key"),
      sortValue: (v) => v.key,
      className: "max-w-56",
      cell: (variable) => (
        <>
          <div className="flex items-center gap-2">
            <span dir="ltr" className="truncate font-mono text-xs font-medium">
              {variable.key}
            </span>
            {variable.isSecret && (
              <IconLock
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-label={t("Secret")}
              />
            )}
            {variable.kind === "file" && (
              <Badge variant="secondary" className="gap-1">
                <IconFile aria-hidden /> {t("File")}
              </Badge>
            )}
          </div>
          {variable.description && (
            <p className="truncate text-xs text-muted-foreground">
              {variable.description}
            </p>
          )}
        </>
      ),
    },
    {
      id: "value",
      header: t("Value"),
      className: "max-w-40 md:max-w-72",
      cell: (variable) =>
        variable.isSecret ? (
          <SecretValue variable={variable} scope={scope} />
        ) : (
          <div className="flex items-center gap-1">
            <span
              dir="ltr"
              className="truncate font-mono text-xs"
              title={variable.value}
            >
              {variable.value || (
                <span className="text-muted-foreground italic">
                  {t("empty")}
                </span>
              )}
            </span>
            {variable.value && <CopyButton value={variable.value} />}
          </div>
        ),
    },
    {
      id: "stage",
      header: t("Available at"),
      sortValue: (v) => v.stage,
      className: "hidden md:table-cell",
      cell: (variable) => (
        <Badge variant="outline">{stageLabel[variable.stage]}</Badge>
      ),
    },
    {
      id: "updated",
      header: t("Updated"),
      sortValue: (v) => v.updatedAt,
      className: "hidden lg:table-cell",
      cell: (variable) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {ago(variable.updatedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("Actions")}</span>,
      className: "w-20",
      cell: (variable) => (
        <div className="flex justify-end gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditing(variable)}
            aria-label={t("Edit {{key}}", { key: variable.key })}
          >
            <IconPencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDeleting(variable)}
            aria-label={t("Delete {{key}}?", {
              key: variable.key,
            })}
          >
            <IconTrash />
          </Button>
        </div>
      ),
    },
  ]

  const empty = !isLoading && !data?.length

  return (
    <div className="flex flex-col gap-3">
      {(switcher || !empty) && (
        <Toolbar
          search={filter}
          onSearch={empty ? undefined : setFilter}
          placeholder={t("Filter variables")}
          actions={!empty && add}
        >
          {switcher}
        </Toolbar>
      )}
      {empty ? (
        <EmptyState
          icon={IconBraces}
          title={t("No variables yet")}
          description={
            scope.scope === "project"
              ? t(
                  "Only this project gets them; they override tenant variables."
                )
              : scope.scope === "tenant"
                ? t("Shared by everyone in this tenant and its apps.")
                : t("Yours alone. Every tenant you own uses them.")
          }
          action={<div className="flex flex-wrap gap-2">{add}</div>}
        />
      ) : (
        <DataTable
          label={t("Variables")}
          columns={columns}
          rows={rows}
          loading={isLoading}
          rowId={(v) => v._id}
          isSelected={(v) => selection.has(v._id)}
        />
      )}

      <SelectionBar
        selection={selection}
        remove={(id) =>
          ThunderSDK.variables.del({ params: { id }, query: scope })
        }
        onDone={reload}
        canDelete={ThunderSDK.isPermitted("variables", "del")}
      />

      <ImportEnvDialog
        scope={scope}
        existing={new Set((data ?? []).map((v) => v.key))}
        open={importing}
        onOpenChange={setImporting}
        onImported={reload}
      />
      <VariableDialog
        scope={scope}
        variable={editing === "new" ? undefined : (editing ?? undefined)}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={reload}
      />
      <DeleteDialog
        variable={deleting}
        scope={scope}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        onDeleted={reload}
      />
    </div>
  )
}

function ScriptAccess() {
  const { t } = useTranslation()
  const origin = import.meta.env.VITE_API_BASE_URL || window.location.origin
  const command = [
    `curl ${origin}/variables/api/resolve?stage=runtime \\`,
    `  -H "X-Api-Key: $HURUF_API_KEY" \\`,
    `  -H "X-TENANT-ID: ${ThunderSDK.plugins.essentials.getTenant()}"`,
  ].join("\n")

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <IconKey className="size-4" aria-hidden />
          {t("Use from scripts and CI")}
        </span>
      }
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // Opens the account page on its API keys view.
            const url = getAuthUrl()
            url.searchParams.set("tab", "developers")
            url.searchParams.set("view", "api-keys")
            window.location.href = url.toString()
          }}
        >
          {t("Manage API keys")}
        </Button>
      }
      bodyClassName="flex flex-col gap-3"
    >
      <p className="text-[13px] text-muted-foreground">
        {t(
          "Returns this tenant's resolved variables (references expanded) as env and files. Create an API key with the variableApi scope so it can read nothing else."
        )}
      </p>
      <CodeBlock code={command} />
    </Panel>
  )
}

/** Variables (PLAN §12, §15.6): tenant and global scopes, plus script access. */
export default function VariablesPage() {
  const { t } = useTranslation()
  const [scope, setScope] = React.useState<"tenant" | "global">("tenant")

  return (
    <Page className="flex flex-col gap-4 py-5">
      <PageHeader
        title={t("Variables")}
        description={t(
          "Encrypted settings for your apps. When a key exists in both scopes, the tenant value wins."
        )}
      />

      {/* Keyed so filter and selection don't carry over between scopes. */}
      <VariableTable
        key={scope}
        scope={{ scope }}
        switcher={
          <ToggleGroup
            aria-label={t("Scope")}
            value={scope}
            onValueChange={(v) => setScope(v as "tenant" | "global")}
          >
            <ToggleGroupItem value="tenant" className="h-7 py-0 text-[13px]">
              {t("Tenant")}
            </ToggleGroupItem>
            <ToggleGroupItem value="global" className="h-7 py-0 text-[13px]">
              {t("Global")}
            </ToggleGroupItem>
          </ToggleGroup>
        }
      />

      <ScriptAccess />
    </Page>
  )
}
