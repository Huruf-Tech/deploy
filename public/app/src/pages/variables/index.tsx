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
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"

import { Container } from "@/core/custom/Container"
import { use } from "@/core/hooks/use"
import { getAuthUrl } from "@/core/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CopyButton } from "@/components/ui/copy-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { errorMessage } from "@/lib/utils"
import { VariableDialog, type TScope, type TVariable } from "./VariableDialog"

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
        body: { scope },
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
        query: { scope },
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

function VariableTable({ scope }: { scope: TScope }) {
  const { t } = useTranslation()
  const [editing, setEditing] = React.useState<TVariable | "new" | null>(null)
  const [deleting, setDeleting] = React.useState<TVariable>()

  const request = ThunderSDK.useCaching(
    ["variables", scope],
    async ({ signal }) =>
      await ThunderSDK.variables.list({ signal, query: { scope } })
  )
  const { data, isLoading } = use(request)
  const reload = () => request.invalidate()

  const stageLabel = {
    runtime: t("Runtime"),
    build: t("Build"),
    both: t("Build and runtime"),
  }

  const add = (
    <Button onClick={() => setEditing("new")}>
      <IconPlus aria-hidden /> {t("Add variable")}
    </Button>
  )

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <Skeleton className="h-48 rounded-4xl" />
      ) : !data?.length ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconBraces />
            </EmptyMedia>
            <EmptyTitle>{t("No variables yet")}</EmptyTitle>
            <EmptyDescription>
              {scope === "tenant"
                ? t("Shared by everyone in this workspace and its apps.")
                : t("Yours alone. Every workspace you own uses them.")}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{add}</EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="flex justify-end">{add}</div>
          <div className="overflow-hidden rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Key")}</TableHead>
                  <TableHead>{t("Value")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("Available at")}
                  </TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">{t("Actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((variable) => (
                  <TableRow key={variable._id}>
                    <TableCell className="max-w-56">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-xs font-medium">
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
                    </TableCell>
                    <TableCell className="max-w-40 md:max-w-72">
                      {variable.isSecret ? (
                        <SecretValue variable={variable} scope={scope} />
                      ) : (
                        <div className="flex items-center gap-1">
                          <span
                            className="truncate font-mono text-xs"
                            title={variable.value}
                          >
                            {variable.value || (
                              <span className="text-muted-foreground italic">
                                {t("empty")}
                              </span>
                            )}
                          </span>
                          {variable.value && (
                            <CopyButton value={variable.value} />
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">
                        {stageLabel[variable.stage]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <IconKey className="size-4" aria-hidden />{" "}
          {t("Use from scripts and CI")}
        </CardTitle>
        <CardDescription>
          {t(
            "Returns this workspace's resolved variables (references expanded) as env and files. Create an API key with the variableApi scope so it can read nothing else."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="relative rounded-2xl bg-muted/50 p-3 pe-10">
          <pre className="overflow-x-auto font-mono text-xs">{command}</pre>
          <CopyButton value={command} className="absolute end-2 top-2" />
        </div>
        <div>
          <Button
            variant="outline"
            onClick={() => (window.location.href = getAuthUrl().toString())}
          >
            {t("Manage API keys")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** Variables (PLAN §12, §15.6): workspace and account scopes, plus script access. */
export default function VariablesPage() {
  const { t } = useTranslation()

  return (
    <Container className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-xl font-semibold">{t("Variables")}</h1>
        <p className="text-sm text-muted-foreground">
          {t(
            "Encrypted settings for your apps. When a key exists in both scopes, the workspace value wins."
          )}
        </p>
      </div>

      <Tabs defaultValue="tenant">
        <TabsList>
          <TabsTrigger value="tenant">{t("Workspace")}</TabsTrigger>
          <TabsTrigger value="global">{t("My account")}</TabsTrigger>
        </TabsList>
        <TabsContent value="tenant" className="pt-2">
          <VariableTable scope="tenant" />
        </TabsContent>
        <TabsContent value="global" className="pt-2">
          <VariableTable scope="global" />
        </TabsContent>
      </Tabs>

      <ScriptAccess />
    </Container>
  )
}
