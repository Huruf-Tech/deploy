import React from "react"
import { Link, useLocation } from "react-router"
import {
  IconAlertCircle,
  type TablerIcon,
} from "@tabler/icons-react"
import { cva, type VariantProps } from "class-variance-authority"

import { useLayout } from "@/core/layouts/layout-provider"
import type { TRouteObject } from "@/core/router"
import { allowDisplayRoute } from "@/core/lib/utils"
import { cn } from "@/lib/utils"
import { MoreSheet } from "./more-sheet"
import { useTranslation } from "react-i18next"

export type TNav = {
  title: string;
  icon?: TablerIcon;
  path?: string;
  button?: React.ComponentType
};

/** Primary route tabs shown before the Cart + "More" tabs (keeps the bar at ≤5). */
const MAX_TABS = 3;

const bottomTabsVariants = cva(
  "fixed bottom-0 z-50 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80",
  {
    variants: {
      variant: {
        default:
          "inset-x-0 border-t border-border pb-[env(safe-area-inset-bottom)]",
        floating:
          "inset-x-0 mx-auto mb-[max(1rem,env(safe-area-inset-bottom))] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl border border-border shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function useNavItems() {
  const { router } = useLayout();

  return React.useMemo(() => {
    const items: TNav[] = [];

    for (const route of router.routes as TRouteObject[]) {
      if (!allowDisplayRoute(route.display)) continue;

      for (const child of route.children ?? []) {
        if (!allowDisplayRoute(child.display)) continue;

        items.push({
          title: child.name || "Unnamed Route",
          icon: child.icon,
          path: child.path,
          button: child.button
        });
      }
    }

    return items;
  }, [router.routes]);
}

function TabLink({ item, active }: { item: TNav; active: boolean }) {
  const { t } = useTranslation();
  const Icon = item.icon ?? IconAlertCircle;
  const isHashRoute = item.path?.startsWith("#");
  const ButtonComponent = item.button;

  return (
    <Link
      to={item.path || "#"}
      viewTransition={!isHashRoute}
      className={cn(
        "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <div className="relative flex items-center justify-center">
        <Icon className="size-5 shrink-0" />
        {ButtonComponent && <ButtonComponent />}
      </div>
      <span className="max-w-full truncate text-[11px] leading-none font-medium">
        {t(item.title)}
      </span>
    </Link>
  );
}

interface BottomTabsProps extends VariantProps<typeof bottomTabsVariants> {
  unreadCount?: number;
}

export function BottomTabs({
  variant,
  unreadCount = 0,
}: BottomTabsProps) {
  const location = useLocation();
  const navItems = useNavItems();

  const { primary, overflow } = React.useMemo(
    () => ({
      primary: navItems.slice(0, MAX_TABS),
      overflow: navItems.slice(MAX_TABS),
    }),
    [navItems],
  );

  const activeParent = React.useMemo(() => {
    const [, parent] = location.pathname.split("/").filter(Boolean);
    return parent;
  }, [location.pathname]);

  return (
    <nav className={cn(bottomTabsVariants({ variant }))}>
      <div className="mx-auto flex h-16 w-full max-w-3xl items-stretch">
        {primary.map((item) => (
          <TabLink
            key={item.title}
            item={item}
            active={!!item.path && activeParent === item.path}
          />
        ))}
        <MoreSheet
          overflowItems={overflow}
          activeParent={activeParent}
          unreadCount={unreadCount}
        />
      </div>
    </nav>
  );
}