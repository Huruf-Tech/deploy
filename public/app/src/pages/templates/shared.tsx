import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  IconBolt,
  IconBrandDeno,
  IconBrandNextjs,
  IconBrandNodejs,
  IconBrandReact,
  IconBucket,
  IconDatabase,
  IconLeaf,
  IconStack2,
  IconTemplate,
  type Icon,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
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
import { cn, errorMessage } from "@/lib/utils"

export type TTemplate = Awaited<
  ReturnType<typeof ThunderSDK.templates.list>
>[number]

// Templates name their icon; only these are bundled (importing every Tabler icon is ~1 MB).
const ICONS: Record<string, Icon> = {
  bolt: IconBolt,
  "brand-react": IconBrandReact,
  "brand-nextjs": IconBrandNextjs,
  "brand-nodejs": IconBrandNodejs,
  "brand-deno": IconBrandDeno,
  database: IconDatabase,
  leaf: IconLeaf,
  "stack-2": IconStack2,
  bucket: IconBucket,
}

export function TemplateIcon({
  icon,
  className,
}: {
  icon?: string
  className?: string
}) {
  if (icon && /^https?:\/\//.test(icon)) {
    return <img src={icon} alt="" className={cn("object-contain", className)} />
  }
  const Component = (icon && ICONS[icon]) || IconTemplate
  return <Component className={className} aria-hidden />
}

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)

/** Name + slug, for cloning a template into the workspace. */
export function CloneDialog({
  template,
  onOpenChange,
  onCloned,
}: {
  template: TTemplate | null
  onOpenChange: (open: boolean) => void
  onCloned: (id: string) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [slugEdited, setSlugEdited] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!template) return
    const initial = t("{{name}} (custom)", { name: template.name })
    setName(initial)
    setSlug(slugify(`${template.slug}-custom`))
    setSlugEdited(false)
    setError(null)
  }, [template, t])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!template) return
    setBusy(true)
    setError(null)
    try {
      const { _id } = await ThunderSDK.templates.clone({
        params: { id: template._id },
        body: { name, slug },
      })
      toast.success(t("Template cloned"))
      onOpenChange(false)
      onCloned(_id)
    } catch (e) {
      setError(errorMessage(e) ?? t("Could not clone the template"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!template} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {t("Clone {{name}}", { name: template?.name })}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Copies the latest version into this workspace, where you can edit it. The original is unchanged."
              )}
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="clone-name">{t("Name")}</FieldLabel>
            <Input
              id="clone-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!slugEdited) setSlug(slugify(e.target.value))
              }}
              maxLength={80}
              required
              autoFocus
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="clone-slug">{t("Slug")}</FieldLabel>
            <Input
              id="clone-slug"
              value={slug}
              onChange={(e) => {
                setSlugEdited(true)
                setSlug(slugify(e.target.value))
              }}
              maxLength={60}
              required
              className="font-mono"
            />
          </Field>
          {error && <FieldError>{error}</FieldError>}
          <DialogFooter>
            <Button type="submit" disabled={busy || !name || !slug}>
              {t("Clone")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
