import React from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk"
import {
  IconAlertCircle,
  IconMoon,
  IconPlus,
  IconRocket,
  IconServer,
  IconTerminal2,
  type TablerIcon,
} from "@tabler/icons-react"

import { use } from "@/core/hooks/use"
import { getLocalPath } from "@/core/lib/utils"
import { useTheme } from "@/components/theme-provider"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export type TNavGroup = {
  title: string
  icon?: TablerIcon
  path: string
  items: { title: string; icon?: TablerIcon; path: string }[]
}

/**
 * ⌘K: jump to any page, project or server, or run a quick action. Opens
 * without animation (it's used many times a day, DESIGN §7).
 */
export function CommandMenu({
  open,
  onOpenChange,
  groups,
  onShell,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: TNavGroup[]
  /** Opens the shell dock; absent without the permission. */
  onShell?: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()

  const run = (action: () => void) => {
    onOpenChange(false)
    action()
  }
  const go = (path: string) => run(() => void navigate(getLocalPath(path)))

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("Command palette")}
      description={t("Jump to a page, project or server")}
      className="rounded-xl! duration-0 sm:max-w-xl"
    >
      <Command>
        <CommandInput placeholder={t("Type a command or search…")} />
        <CommandList className="max-h-[min(60vh,420px)]">
          <CommandEmpty>{t("No results.")}</CommandEmpty>
          {groups.map((group) => {
            const items = group.items.length
              ? group.items
              : [{ title: group.title, icon: group.icon, path: group.path }]
            return (
              <CommandGroup
                key={group.path}
                heading={group.items.length ? t(group.title) : t("Pages")}
              >
                {items.map((item) => (
                  <Item
                    key={item.path}
                    icon={item.icon ?? IconAlertCircle}
                    onSelect={() => go(item.path)}
                  >
                    {t(item.title)}
                  </Item>
                ))}
              </CommandGroup>
            )
          })}
          {open && <Resources onGo={go} />}
          <CommandGroup heading={t("Actions")}>
            {ThunderSDK.isPermitted("projects", "create") && (
              <Item
                icon={IconPlus}
                onSelect={() => go("applications/projects/new")}
              >
                {t("New project")}
              </Item>
            )}
            {onShell && (
              <Item icon={IconTerminal2} onSelect={() => run(onShell)}>
                {t("Open a shell on a server")}
              </Item>
            )}
            <Item
              icon={IconMoon}
              onSelect={() =>
                run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))
              }
            >
              {t("Toggle theme")}
            </Item>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

/** Projects and servers, read when the palette opens (cached with the pages'). */
function Resources({ onGo }: { onGo: (path: string) => void }) {
  const { t } = useTranslation()
  const canProjects = ThunderSDK.isPermitted("projects", "list")
  const projectsRequest = ThunderSDK.useCaching(
    ["projects"],
    async ({ signal }) =>
      canProjects ? await ThunderSDK.projects.list({ signal }) : []
  )
  const serversRequest = ThunderSDK.useCaching(
    ["projects", "placement"],
    async ({ signal }) =>
      ThunderSDK.isPermitted("projects", "placementInfo")
        ? await ThunderSDK.projects.placementInfo({ signal })
        : []
  )
  const { data: projects } = use(projectsRequest)
  const { data: servers } = use(serversRequest)

  return (
    <>
      {!!projects?.length && (
        <CommandGroup heading={t("Projects")}>
          {projects.map((p) => (
            <Item
              key={p._id}
              icon={IconRocket}
              value={`project ${p.name} ${p.slug}`}
              onSelect={() => onGo(`applications/projects/${p._id}`)}
            >
              {p.name}
            </Item>
          ))}
        </CommandGroup>
      )}
      {!!servers?.length && (
        <CommandGroup heading={t("Servers")}>
          {servers.map((s) => (
            <Item
              key={s.server}
              icon={IconServer}
              value={`server ${s.name}`}
              onSelect={() => onGo(`infrastructure/servers/${s.server}`)}
            >
              <span className="flex-1 truncate">{s.name}</span>
              <span
                className={
                  s.online
                    ? "text-xs text-success-foreground"
                    : "text-xs text-muted-foreground"
                }
              >
                {s.online ? t("Online") : t("Offline")}
              </span>
            </Item>
          ))}
        </CommandGroup>
      )}
    </>
  )
}

function Item({
  icon: Icon,
  children,
  ...props
}: React.ComponentProps<typeof CommandItem> & { icon: TablerIcon }) {
  return (
    <CommandItem
      className="h-9 rounded-lg! py-0 text-[13px] font-normal"
      {...props}
    >
      <Icon aria-hidden className="text-muted-foreground" />
      {children}
    </CommandItem>
  )
}
