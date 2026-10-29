import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconBrandCloudflare, IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useCached } from "@/hooks/use-cached"
import { queries } from "@/lib/queries"
import { errorMessage } from "@/lib/utils"
import { useIsOwner } from "@/pages/rentals/rental"

const TOKENS_URL = "https://dash.cloudflare.com/profile/api-tokens"

/** The workspace's Cloudflare connection, above its domains (PLAN §14). */
export function CloudflareConnection() {
  const { t } = useTranslation()
  const isOwner = useIsOwner()
  const { data, reload } = useCached(queries.cloudflare())
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  if (!data || (!data.connected && !isOwner)) return null

  const disconnect = async () => {
    setBusy(true)
    try {
      await ThunderSDK.domains.disconnectCloudflare()
      reload()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not save"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2 text-[13px]">
      <IconBrandCloudflare className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-[1_1_16rem] text-muted-foreground">
        {data.connected
          ? t(
              "Cloudflare is connected ({{count}} zones): it creates domains' records for you.",
              {
                count: data.zones ?? 0,
              }
            )
          : t(
              "DNS on Cloudflare? Connect it and domains' records are created for you."
            )}
      </p>
      {isOwner &&
        (data.connected ? (
          <Button
            size="xs"
            variant="ghost"
            disabled={busy}
            onClick={disconnect}
          >
            {t("Disconnect")}
          </Button>
        ) : (
          <Button size="xs" variant="outline" onClick={() => setOpen(true)}>
            {t("Connect Cloudflare")}
          </Button>
        ))}
      {open && (
        <ConnectDialog
          onOpenChange={setOpen}
          onConnected={() => {
            setOpen(false)
            reload()
          }}
        />
      )}
    </div>
  )
}

function ConnectDialog({
  onOpenChange,
  onConnected,
}: {
  onOpenChange: (open: boolean) => void
  onConnected: () => void
}) {
  const { t } = useTranslation()
  const id = React.useId()
  const [token, setToken] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const connect = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const { zones } = await ThunderSDK.domains.connectCloudflareToken({
        body: { token: token.trim() },
      })
      toast.success(t("Connected: {{count}} zones", { count: zones }))
      onConnected()
    } catch (err) {
      toast.error(errorMessage(err) ?? t("Could not connect"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={connect} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("Connect Cloudflare")}</DialogTitle>
            <DialogDescription>
              {t(
                "In Cloudflare, create an API token from the \"Edit zone DNS\" template, for the zones your domains are in, and paste it here. It's stored encrypted and only creates your domains' records."
              )}{" "}
              <a
                href={TOKENS_URL}
                target="_blank"
                rel="noreferrer"
                className="text-brand-text hover:underline"
              >
                {t("Open API tokens")}
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={id}>{t("API token")}</Label>
            <Input
              id={id}
              type="password"
              autoComplete="off"
              dir="ltr"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy || token.trim().length < 20}>
              {busy && <IconLoader2 className="animate-spin" aria-hidden />}
              {t("Connect")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type TConflict = { type: string; content: string; proxied: boolean }

/** Creates a domain's records in Cloudflare; asks before replacing others. */
export function CloudflareSetUp({
  domain,
  hostname,
  onDone,
}: {
  domain: string
  hostname: string
  onDone: () => void
}) {
  const { t } = useTranslation()
  const isOwner = useIsOwner()
  const { data } = useCached(queries.cloudflare())
  const [busy, setBusy] = React.useState(false)
  const [conflicts, setConflicts] = React.useState<TConflict[]>()
  if (!data?.connected) return null

  const run = async (replace: boolean) => {
    setBusy(true)
    try {
      const result = await ThunderSDK.domains.setUpCloudflare({
        params: { id: domain },
        body: replace ? { replace } : {},
      })
      if (!result.applied) {
        setConflicts(result.conflicts ?? [])
        return
      }
      setConflicts(undefined)
      toast.success(
        t("Records created in Cloudflare ({{zone}}): checking now", {
          zone: result.zone ?? hostname,
        })
      )
      onDone()
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not create the records"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Button size="sm" disabled={busy} onClick={() => run(false)}>
        {busy ? (
          <IconLoader2 className="animate-spin" aria-hidden />
        ) : (
          <IconBrandCloudflare aria-hidden />
        )}
        {t("Create records in Cloudflare")}
      </Button>
      {conflicts && !isOwner && (
        <p className="text-xs text-warning-foreground">
          {t(
            "{{name}} already points elsewhere in Cloudflare: the workspace owner can replace those records.",
            { name: hostname }
          )}
        </p>
      )}
      <ConfirmDialog
        open={!!conflicts && isOwner}
        onOpenChange={(o) => !o && setConflicts(undefined)}
        title={t("Replace {{name}}'s records?", { name: hostname })}
        description={
          <>
            {t(
              "It already points elsewhere in Cloudflare. These records are deleted and replaced with the platform's, so whatever they served stops:"
            )}
            <span dir="ltr" className="mt-2 block font-mono text-xs">
              {conflicts?.map((c) => (
                <span key={`${c.type}:${c.content}`} className="block">
                  {c.type} {c.content}
                  {c.proxied ? ` (${t("proxied")})` : ""}
                </span>
              ))}
            </span>
          </>
        }
        confirmLabel={t("Replace them")}
        onConfirm={() => run(true)}
      />
    </>
  )
}
