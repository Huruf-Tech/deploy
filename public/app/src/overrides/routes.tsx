import type { TRoutesOverride } from "@/core/types"

export const routes: TRoutesOverride = {
  // Add your custom route objects here
  // E.g: posts: { name: "Posts", icon: icons.posts, Component: PostsPage, button: NavButton },

  // The built-in routes can be replaced by name. Anything you set here is
  // merged over core's definition, so you can swap just the Component and keep
  // its icon, priority and permission checks:
  //
  //   overview: { Component: MyDashboard },
  //
  // Available keys: overview, wallet, notifications.
}
