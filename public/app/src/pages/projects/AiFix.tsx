import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { IconLoader2, IconSparkles } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAiStatus } from "@/hooks/use-ai"
import { cn, errorMessage } from "@/lib/utils"

type TFix = Awaited<ReturnType<typeof ThunderSDK.ai.fix>>

/** Lines removed (-), added (+) and kept, by longest common subsequence. */
function lineDiff(before: string, after: string) {
  const a = before.split("\n")
  const b = after.split("\n")
  const lcs = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  )
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      lcs[i][j] =
        a[i] === b[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1])
  const out: { kind: " " | "-" | "+"; line: string }[] = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      out.push({ kind: " ", line: a[i] })
      i++
      j++
    } else if (
      i < a.length &&
      (j === b.length || lcs[i + 1][j] >= lcs[i][j + 1])
    ) {
      out.push({ kind: "-", line: a[i++] })
    } else {
      out.push({ kind: "+", line: b[j++] })
    }
  }
  return out
}

/**
 * "Fix with AI" on a failed deployment (PLAN Phase 12): the cause, and for
 * projects built from a template, the change to accept. Accepting saves a new
 * template version and redeploys.
 */
export function AiFixButton({
  deployment,
  log,
  onRedeployed,
}: {
  deployment: string
  log: () => string
  onRedeployed: (deployment: string) => void
}) {
  const { t } = useTranslation()
  const { status, refresh } = useAiStatus()
  const [fix, setFix] = React.useState<TFix>()
  const [before, setBefore] = React.useState("")
  const [busy, setBusy] = React.useState<"ask" | "apply" | null>(null)

  if (!status?.enabled) return null

  const ask = async () => {
    setBusy("ask")
    try {
      const result = await ThunderSDK.ai.fix({
        body: { deployment, log: log().slice(-100_000) },
      })
      if (result.template && result.baseVersion) {
        const current = await ThunderSDK.templates.get({
          params: { id: result.template },
          query: { version: result.baseVersion },
        })
        setBefore(current.content.dockerfile ?? current.content.compose ?? "")
      }
      setFix(result)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("The AI couldn't propose a fix"))
    } finally {
      setBusy(null)
      refresh()
    }
  }

  const apply = async () => {
    if (!fix?.content) return
    setBusy("apply")
    try {
      await ThunderSDK.ai.applyAiFix({
        body: { project: fix.project, content: fix.content },
      })
      const { deployment: next } = await ThunderSDK.projects.deployProject({
        params: { id: fix.project },
        body: { noCache: false },
      })
      toast.success(t("Fix saved; redeploying"))
      setFix(undefined)
      onRedeployed(next)
    } catch (e) {
      toast.error(errorMessage(e) ?? t("Could not apply the fix"))
    } finally {
      setBusy(null)
    }
  }

  const after = fix?.content?.dockerfile ?? fix?.content?.compose ?? ""

  return (
    <>
      <Button variant="outline" onClick={ask} disabled={!!busy}>
        {busy === "ask" ? (
          <IconLoader2 className="animate-spin" aria-hidden />
        ) : (
          <IconSparkles aria-hidden />
        )}
        {busy === "ask" ? t("Looking into it…") : t("Fix with AI")}
      </Button>

      <Dialog open={!!fix} onOpenChange={(o) => !o && setFix(undefined)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconSparkles className="size-5 text-primary" aria-hidden />
              {t("Proposed fix")}
            </DialogTitle>
            <DialogDescription>{fix?.explanation}</DialogDescription>
          </DialogHeader>

          {fix?.content ? (
            <pre
              dir="ltr"
              className="max-h-96 min-w-0 overflow-auto rounded-2xl bg-muted/50 p-3 font-mono text-xs leading-relaxed"
            >
              {lineDiff(before, after).map((d, i) => (
                <div
                  key={i}
                  className={cn(
                    d.kind === "+" && "bg-success/15 text-success",
                    d.kind === "-" &&
                      "bg-destructive/10 text-destructive line-through"
                  )}
                >
                  {d.kind} {d.line}
                </div>
              ))}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t(
                "The fix isn't in a template this project uses, so apply it yourself and deploy again."
              )}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFix(undefined)}>
              {t("Close")}
            </Button>
            {fix?.content && (
              <Button onClick={apply} disabled={!!busy}>
                {busy === "apply" && (
                  <IconLoader2 className="animate-spin" aria-hidden />
                )}
                {t("Save as a new version and redeploy")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
