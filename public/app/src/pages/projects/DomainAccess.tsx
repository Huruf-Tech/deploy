import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconLoader2, IconLock, IconLockOpen } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CodeBlock } from "@/components/console/code-block"
import { errorMessage } from "@/lib/utils"

export type TProjectServer = { _id: string; name: string }

const ALL = "all"

/** Which servers serve a domain (PLAN §14): all of the project's, or one. */
export function ServedFrom({
  servers,
  value,
  onChange,
  disabled,
  label,
}: {
  servers: TProjectServer[]
  value?: string
  onChange: (server: string | null) => void
  disabled?: boolean
  label: string
}) {
  const { t } = useTranslation()
  // A server it no longer runs on still shows, so the choice can be undone.
  const known = !value || servers.some((s) => s._id === value)
  const items = [
    { value: ALL, label: t("All servers") },
    ...servers.map((s) => ({
      value: s._id,
      label: t("Only {{server}}", { server: s.name }),
    })),
    ...(known ? [] : [{ value: value!, label: t("A removed server") }]),
  ]
  return (
    <Select
      items={items}
      value={value ?? ALL}
      onValueChange={(v) => onChange(v === ALL ? null : (v as string))}
      disabled={disabled}
    >
      <SelectTrigger size="sm" aria-label={label} className="min-w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * A login in front of a domain (Traefik basic auth). The password is made
 * here, shown once: the platform keeps only its hash.
 */
export function DomainLogin({
  domain,
  hostname,
  username,
  onChanged,
}: {
  domain: string
  hostname: string
  username?: string
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState(username ?? "")
  const [password, setPassword] = React.useState<string>()
  const [busy, setBusy] = React.useState<"set" | "remove" | null>(null)

  const show = (next: boolean) => {
    setOpen(next)
    if (next) {
      setName(username ?? "")
      setPassword(undefined)
    }
  }
  const set = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy("set")
    try {
      const res = await ThunderSDK.domains.setLogin({
        params: { id: domain },
        body: { username: name.trim() },
      })
      setPassword(res.password)
      onChanged()
    } catch (err) {
      toast.error(errorMessage(err) ?? t("Could not set the login"))
    } finally {
      setBusy(null)
    }
  }
  const remove = async () => {
    setBusy("remove")
    try {
      await ThunderSDK.domains.removeLogin({ params: { id: domain } })
      onChanged()
      setOpen(false)
    } catch (err) {
      toast.error(errorMessage(err) ?? t("Could not remove the login"))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Button
        size="icon-xs"
        variant="ghost"
        aria-label={
          username
            ? t("Login for {{name}}", { name: hostname })
            : t("Add a login to {{name}}", { name: hostname })
        }
        title={username ? t("Asks for a login") : t("No login")}
        onClick={() => show(true)}
      >
        {username ? <IconLock /> : <IconLockOpen className="opacity-60" />}
      </Button>
      <Dialog open={open} onOpenChange={show}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={set} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{t("Login")}</DialogTitle>
              <DialogDescription>
                {t(
                  "Visitors of {{name}} must sign in with this user name and password first, e.g. for Prometheus, which has no login of its own. The app never sees it.",
                  { name: hostname }
                )}
              </DialogDescription>
            </DialogHeader>

            {password ? (
              <Field>
                <FieldLabel>{t("Password")}</FieldLabel>
                <CodeBlock code={password} wrap />
                <FieldDescription>
                  {t(
                    "Copy it now: it isn't shown again. It works within a few seconds."
                  )}
                </FieldDescription>
              </Field>
            ) : (
              <Field>
                <FieldLabel htmlFor="login-user">{t("User name")}</FieldLabel>
                <Input
                  id="login-user"
                  dir="ltr"
                  autoComplete="off"
                  value={name}
                  maxLength={64}
                  pattern="[A-Za-z0-9._@\-]+"
                  required
                  onChange={(e) => setName(e.target.value)}
                />
                <FieldDescription>
                  {username
                    ? t(
                        "A new password replaces the current one; whoever has it signs in again."
                      )
                    : t(
                        "The password is generated for you: long and random, so it can't be guessed."
                      )}
                </FieldDescription>
              </Field>
            )}

            <DialogFooter>
              {username && !password && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive-foreground sm:me-auto"
                  disabled={!!busy}
                  onClick={remove}
                >
                  {busy === "remove" && (
                    <IconLoader2 className="animate-spin" aria-hidden />
                  )}
                  {t("Remove the login")}
                </Button>
              )}
              {password ? (
                <Button type="button" onClick={() => setOpen(false)}>
                  {t("Done")}
                </Button>
              ) : (
                <Button type="submit" disabled={!!busy || !name.trim()}>
                  {busy === "set" && (
                    <IconLoader2 className="animate-spin" aria-hidden />
                  )}
                  {username ? t("New password") : t("Add login")}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
