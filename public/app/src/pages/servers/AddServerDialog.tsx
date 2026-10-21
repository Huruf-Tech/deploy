import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconLoader2,
  IconLock,
} from "@tabler/icons-react"

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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { usePolling } from "@/hooks/use-polling"
import { cn } from "@/lib/utils"

type TProgress = Awaited<
  ReturnType<typeof ThunderSDK.servers.bootstrapProgress>
>

const errorMessage = (error: unknown) => {
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (typeof data === "string" && data) return data
  const messages = (data as { messages?: { message?: string }[] })?.messages
  return messages?.[0]?.message ?? null
}

function SshForm({ onStarted }: { onStarted: (session: string) => void }) {
  const { t } = useTranslation()
  const [auth, setAuth] = React.useState<"password" | "key">("password")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const text = (name: string) => String(form.get(name) ?? "").trim()

    setBusy(true)
    setError(null)
    try {
      const { session } = await ThunderSDK.servers.bootstrap({
        body: {
          host: text("host"),
          port: Number(text("port")) || 22,
          username: text("username"),
          ...(auth === "password"
            ? { password: String(form.get("password") ?? "") }
            : {
                privateKey: String(form.get("privateKey") ?? ""),
                passphrase: String(form.get("passphrase") ?? "") || undefined,
              }),
        },
      })
      onStarted(session)
    } catch (e) {
      setError(errorMessage(e) ?? t("Could not start the installation"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <Field>
          <FieldLabel htmlFor="ssh-host">{t("Host or IP")}</FieldLabel>
          <Input
            id="ssh-host"
            name="host"
            required
            placeholder="203.0.113.10"
            autoComplete="off"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="ssh-port">{t("Port")}</FieldLabel>
          <Input
            id="ssh-port"
            name="port"
            type="number"
            defaultValue={22}
            min={1}
            max={65535}
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="ssh-user">{t("Username")}</FieldLabel>
        <Input
          id="ssh-user"
          name="username"
          required
          defaultValue="root"
          autoComplete="off"
        />
      </Field>

      <Tabs
        value={auth}
        onValueChange={(v) => setAuth(v as "password" | "key")}
      >
        <TabsList>
          <TabsTrigger value="password">{t("Password")}</TabsTrigger>
          <TabsTrigger value="key">{t("Private key")}</TabsTrigger>
        </TabsList>
        <TabsContent value="password" className="pt-3">
          <Field>
            <FieldLabel htmlFor="ssh-password">{t("Password")}</FieldLabel>
            <Input
              id="ssh-password"
              name="password"
              type="password"
              required={auth === "password"}
              autoComplete="off"
            />
          </Field>
        </TabsContent>
        <TabsContent value="key" className="flex flex-col gap-3 pt-3">
          <Field>
            <FieldLabel htmlFor="ssh-key">{t("Private key")}</FieldLabel>
            <Textarea
              id="ssh-key"
              name="privateKey"
              rows={5}
              required={auth === "key"}
              className="font-mono text-xs"
              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="ssh-passphrase">{t("Passphrase")}</FieldLabel>
            <Input
              id="ssh-passphrase"
              name="passphrase"
              type="password"
              autoComplete="off"
            />
          </Field>
        </TabsContent>
      </Tabs>

      <p className="flex gap-2 rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
        <IconLock className="size-4 shrink-0 text-foreground" aria-hidden />
        {t(
          "Credentials are used once to start the installer and are never stored. Non-root users need sudo rights."
        )}
      </p>

      {error && <FieldError>{error}</FieldError>}

      <DialogFooter>
        <Button type="submit" disabled={busy}>
          {busy && (
            <IconLoader2 className="motion-safe:animate-spin" aria-hidden />
          )}
          {t("Install agent")}
        </Button>
      </DialogFooter>
    </form>
  )
}

function InstallProgress({
  session,
  onOnline,
}: {
  session: string
  onOnline: () => void
}) {
  const { t } = useTranslation()
  const [progress, setProgress] = React.useState<TProgress | null>(null)
  const done = progress?.status === "online" || progress?.status === "failed"

  usePolling(() => {
    if (done) return
    ThunderSDK.servers
      .bootstrapProgress({ params: { id: session } })
      .then((p) => {
        setProgress(p)
        if (p.status === "online") onOnline()
      })
      .catch(() => {})
  }, 2_000)

  const stages = [
    {
      key: "connect",
      label: t("Connect over SSH"),
      done: (progress?.steps.length ?? 0) > 0,
    },
    {
      key: "install",
      label: t("Install the agent"),
      done: (progress?.steps.length ?? 0) > 1,
    },
    {
      key: "register",
      label: t("Agent registers"),
      done: progress?.status === "registered" || progress?.status === "online",
    },
    {
      key: "online",
      label: t("Server online"),
      done: progress?.status === "online",
    },
  ]
  const current = stages.findIndex((s) => !s.done)

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      <ol className="flex flex-col gap-3">
        {stages.map((stage, index) => {
          const failed = progress?.status === "failed" && index === current
          return (
            <li key={stage.key} className="flex items-center gap-3 text-sm">
              {stage.done ? (
                <IconCircleCheck className="size-5 text-success" aria-hidden />
              ) : failed ? (
                <IconAlertTriangle
                  className="size-5 text-destructive"
                  aria-hidden
                />
              ) : index === current ? (
                <IconLoader2
                  className="size-5 text-primary motion-safe:animate-spin"
                  aria-hidden
                />
              ) : (
                <span
                  className="size-5 rounded-full border-2 border-muted"
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  !stage.done && index !== current && "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
            </li>
          )
        })}
      </ol>
      {progress?.error && (
        <p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
          {progress.error}
        </p>
      )}
    </div>
  )
}

function ManualInstall() {
  const { t } = useTranslation()
  const [command, setCommand] = React.useState<string>()

  React.useEffect(() => {
    ThunderSDK.servers
      .installCommand()
      .then((r) => setCommand(r.command))
      .catch(() => {})
  }, [])

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-muted-foreground">
        {t(
          "Run this on the server (Ubuntu 22.04 or 24.04). It prints a pairing code; accept the server here with that code."
        )}
      </p>
      <div className="flex items-start gap-2 rounded-2xl bg-muted p-3 font-mono text-xs">
        <code className="min-w-0 flex-1 break-all">{command ?? "…"}</code>
        {command && <CopyButton value={command} />}
      </div>
    </div>
  )
}

export function AddServerDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: () => void
}) {
  const { t } = useTranslation()
  const [session, setSession] = React.useState<string | null>(null)

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) setSession(null)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Add a server")}</DialogTitle>
          <DialogDescription>
            {t(
              "Connect a machine you own. Workloads run on it; we only orchestrate."
            )}
          </DialogDescription>
        </DialogHeader>

        {session ? (
          <InstallProgress
            session={session}
            onOnline={() => {
              toast.success(t("Server online"))
              onAdded()
            }}
          />
        ) : (
          <Tabs defaultValue="ssh">
            <TabsList className="w-full">
              <TabsTrigger value="ssh">{t("Over SSH")}</TabsTrigger>
              <TabsTrigger value="manual">{t("Manual")}</TabsTrigger>
            </TabsList>
            <TabsContent value="ssh" className="pt-4">
              <SshForm onStarted={setSession} />
            </TabsContent>
            <TabsContent value="manual" className="pt-4">
              <ManualInstall />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
