import * as React from "react"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"
import { IconGitBranch, IconLock, IconSearch } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { errorMessage } from "@/lib/utils"

type TRepository = Awaited<
  ReturnType<typeof ThunderSDK.gitIntegrations.repositories>
>["repositories"][number]

export type TRepoTarget = {
  integration: string
  installation: number
  account: string
}

function Branches({ target, repo }: { target: TRepoTarget; repo: string }) {
  const { t } = useTranslation()
  const [branches, setBranches] = React.useState<string[]>()
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    ThunderSDK.gitIntegrations
      .branches({
        params: {
          id: target.integration,
          installation: String(target.installation),
        },
        query: { repo, page: 1 },
      })
      .then((r) => setBranches(r.branches.map((b) => b.name)))
      .catch((e) => setError(errorMessage(e) ?? t("Could not load branches")))
  }, [target, repo, t])

  if (error) return <p className="text-xs text-destructive">{error}</p>
  if (!branches) return <Skeleton className="h-5 w-40" />
  return (
    <div className="flex flex-wrap gap-1">
      {branches.map((name) => (
        <Badge key={name} variant="outline" className="gap-1 font-mono">
          <IconGitBranch aria-hidden /> {name}
        </Badge>
      ))}
    </div>
  )
}

/** Repositories an installation can read, with each one's branches on demand. */
export function RepositoriesSheet({
  target,
  onOpenChange,
}: {
  target: TRepoTarget | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const [repos, setRepos] = React.useState<TRepository[]>([])
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string>()
  const [search, setSearch] = React.useState("")
  const [expanded, setExpanded] = React.useState<string>()

  React.useEffect(() => {
    setRepos([])
    setPage(1)
    setSearch("")
    setExpanded(undefined)
    setError(undefined)
  }, [target])

  React.useEffect(() => {
    if (!target) return
    setLoading(true)
    ThunderSDK.gitIntegrations
      .repositories({
        params: {
          id: target.integration,
          installation: String(target.installation),
        },
        query: { page },
      })
      .then((r) => {
        setRepos((current) => [...current, ...r.repositories])
        setHasMore(r.hasMore)
      })
      .catch((e) =>
        setError(errorMessage(e) ?? t("Could not load repositories"))
      )
      .finally(() => setLoading(false))
  }, [target, page, t])

  const shown = repos.filter((r) =>
    r.fullName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Sheet open={!!target} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{target?.account}</SheetTitle>
          <SheetDescription>
            {t(
              "Repositories this installation can read. Change the selection in the App's settings on GitHub."
            )}
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
          <InputGroup>
            <InputGroupAddon>
              <IconSearch aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Filter repositories")}
              aria-label={t("Filter repositories")}
            />
          </InputGroup>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            {shown.map((repo) => (
              <li key={repo.id} className="rounded-2xl border">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-start hover:bg-muted"
                  aria-expanded={expanded === repo.fullName}
                  onClick={() =>
                    setExpanded((e) =>
                      e === repo.fullName ? undefined : repo.fullName
                    )
                  }
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {repo.fullName}
                    </span>
                    {repo.description && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {repo.description}
                      </span>
                    )}
                  </span>
                  {repo.private && (
                    <Badge variant="secondary" className="gap-1">
                      <IconLock aria-hidden /> {t("Private")}
                    </Badge>
                  )}
                </button>
                {expanded === repo.fullName && target && (
                  <div className="border-t px-3 py-2">
                    <Branches target={target} repo={repo.fullName} />
                  </div>
                )}
              </li>
            ))}
            {loading &&
              Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-12 rounded-2xl" />
              ))}
            {!loading && !error && repos.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("This installation can't read any repositories yet.")}
              </p>
            )}
          </ul>
          {hasMore && !loading && (
            <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
              {t("Load more")}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
