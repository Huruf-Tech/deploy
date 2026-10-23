import * as React from "react"
import { useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import { toast } from "sonner"

import { Page } from "@/components/page"
import { use } from "@/core/hooks/use"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { errorMessage } from "@/lib/utils"
import { ServerLabels } from "./ServerLabels"
import { serverSchema } from "./server"

/**
 * Edit server: the generic form shows `labels` (a record) as a JSON textarea,
 * so this one uses the same tag editor as the server page. Servers are added
 * through "Add server", never this form.
 */
export default function ServerForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id = "" } = useParams<{ id: string }>()
  const [name, setName] = React.useState<string>()
  const [busy, setBusy] = React.useState(false)

  const request = ThunderSDK.useCaching(
    ["servers", id],
    async ({ signal }) =>
      (await ThunderSDK.servers.get({ signal, params: { id }, query: {} })) as {
        results: unknown[]
      }
  )
  const { data, isLoading } = use(request)
  const server = React.useMemo(() => {
    const parsed = serverSchema.safeParse(data?.results?.[0])
    return parsed.success ? parsed.data : undefined
  }, [data])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!server) return
    const next = (name ?? server.name).trim()
    setBusy(true)
    try {
      if (next !== server.name)
        await ThunderSDK.servers.update({
          params: { id },
          body: { name: next },
        })
      request.invalidate()
      toast.success(t("Server saved"))
      navigate(-1)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save the server"))
    } finally {
      setBusy(false)
    }
  }

  if (isLoading || !server)
    return (
      <Page className="py-4">
        <Skeleton className="h-64 max-w-xl rounded-4xl" />
      </Page>
    )

  return (
    <Page className="py-4">
      <form onSubmit={save} className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>{t("Edit server")}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {server.inventory.hostname}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="server-name">{t("Name")}</Label>
              <Input
                id="server-name"
                value={name ?? server.name}
                maxLength={60}
                required
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("Labels")}</Label>
              {/* Saved as you add or remove them. */}
              <ServerLabels
                server={id}
                labels={server.labels}
                onSaved={() => request.invalidate()}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={busy || !(name ?? server.name).trim()}
            >
              {t("Save")}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Page>
  )
}
