import { ThunderSDK } from "thunder-sdk"

import type { TOverview } from "@/pages/admin/control-plane"

/**
 * Every cached read of the dashboard, defined once. The SDK keeps one entry
 * per key and the first callback registered for a key wins, so a key must
 * never be registered from two places with different callbacks: add reads
 * here and read them with `useCached` (`@/hooks/use-cached`).
 */
const query = <T>(
  key: [string, ...string[]],
  callback: (opts: { signal: AbortSignal }) => Promise<T>
) =>
  // eslint-disable-next-line react-hooks/rules-of-hooks -- the SDK's cache registry, not a React hook
  ThunderSDK.useCaching(key, callback)

export type TQuery<T> = ReturnType<typeof query<T>>

const can = (scope: string, action: string) =>
  ThunderSDK.isPermitted(scope, action)

/** A request's `query` type, from the SDK. */
type TQueryOf<F extends (...args: never[]) => unknown> = NonNullable<
  NonNullable<Parameters<F>[0]> extends { query?: infer Q } ? Q : never
>

export const queries = {
  me: () =>
    query(["me"], async ({ signal }) => await ThunderSDK.me.get({ signal })),
  aiStatus: () =>
    query(
      ["ai", "status"],
      async ({ signal }) => await ThunderSDK.ai.status({ signal })
    ),

  projects: () =>
    query(["projects"], async ({ signal }) =>
      can("projects", "list") ? await ThunderSDK.projects.list({ signal }) : []
    ),
  /** Servers deployments can go to, with whether each is online. */
  placement: () =>
    query(["projects", "placement"], async ({ signal }) =>
      can("projects", "placementInfo")
        ? await ThunderSDK.projects.placementInfo({ signal })
        : []
    ),
  project: (id: string) =>
    query(
      ["projects", id],
      async ({ signal }) =>
        await ThunderSDK.projects.get({ signal, params: { id } })
    ),
  releases: (id: string) =>
    query(
      ["projects", id, "releases"],
      async ({ signal }) =>
        await ThunderSDK.projects.releases({ signal, params: { id } })
    ),
  deployments: (id: string) =>
    query(
      ["projects", id, "deployments"],
      async ({ signal }) =>
        await ThunderSDK.projects.deployments({
          signal,
          params: { id },
          query: { page: 1 },
        })
    ),
  folders: () =>
    query(["projectGroups"], async ({ signal }) =>
      can("projectGroups", "get")
        ? (
            await ThunderSDK.projectGroups.get({
              signal,
              params: {},
              query: { limit: 500 },
            })
          ).results
        : []
    ),
  domains: (project: string) =>
    query(["domains", project], async ({ signal }) =>
      can("domains", "list")
        ? await ThunderSDK.domains.list({ signal, query: { project } })
        : []
    ),
  variables: (scope: TQueryOf<typeof ThunderSDK.variables.list>) =>
    query(
      ["variables", scope.scope, scope.project ?? ""],
      async ({ signal }) =>
        await ThunderSDK.variables.list({ signal, query: scope })
    ),
  templates: () =>
    query(
      ["templates"],
      async ({ signal }) => await ThunderSDK.templates.list({ signal })
    ),
  template: (id: string, version?: number) =>
    query(
      ["templates", id, String(version ?? "latest")],
      async ({ signal }) =>
        await ThunderSDK.templates.get({
          signal,
          params: { id },
          query: version ? { version } : {},
        })
    ),
  templateVersions: (id: string) =>
    query(
      ["templates", id, "versions"],
      async ({ signal }) =>
        await ThunderSDK.templates.versions({ signal, params: { id } })
    ),
  gitIntegrations: () =>
    query(
      ["gitIntegrations"],
      async ({ signal }) => await ThunderSDK.gitIntegrations.list({ signal })
    ),
  registries: () =>
    query(
      ["registries"],
      async ({ signal }) => await ThunderSDK.registries.list({ signal })
    ),
  storages: () =>
    query(
      ["storages"],
      async ({ signal }) => await ThunderSDK.storages.list({ signal })
    ),
  networks: () =>
    query(
      ["networks"],
      async ({ signal }) => await ThunderSDK.networks.get({ signal })
    ),

  server: (id: string) =>
    query(
      ["servers", id],
      async ({ signal }) =>
        (await ThunderSDK.servers.get({
          signal,
          params: { id },
          query: {},
        })) as {
          results: unknown[]
        }
    ),
  /** Latency, uptime and, for a machine, its rating and class (PLAN §29). */
  serverProfile: (id: string) =>
    query(
      ["servers", id, "profile"],
      async ({ signal }) =>
        await ThunderSDK.servers.profile({ params: { id }, signal })
    ),
  agentRelease: () =>
    query(
      ["servers", "agentRelease"],
      async ({ signal }) => await ThunderSDK.servers.agentRelease({ signal })
    ),

  alertRules: () =>
    query(
      ["alertRules"],
      async ({ signal }) => await ThunderSDK.alertRules.list({ signal })
    ),
  alertEvents: () =>
    query(
      ["alertEvents"],
      async ({ signal }) =>
        await ThunderSDK.alertEvents.list({ query: { limit: 100 }, signal })
    ),
  openAlerts: () =>
    query(
      ["alertEvents", "open"],
      async ({ signal }) =>
        await ThunderSDK.alertEvents.list({
          query: { open: "true", limit: 10 },
          signal,
        })
    ),

  billing: () =>
    query(
      ["billing"],
      async ({ signal }) => await ThunderSDK.billing.get({ signal })
    ),
  billingPlans: () =>
    query(
      ["billing", "plans"],
      async ({ signal }) => await ThunderSDK.billing.plans({ signal })
    ),
  billingPeriods: () =>
    query(
      ["billing", "periods"],
      async ({ signal }) => await ThunderSDK.billing.periods({ signal })
    ),
  /** A plan's price for this tenant; no plan, no quote. */
  billingQuote: (plan?: string) =>
    query(["billing", "quote", plan ?? ""], async ({ signal }) =>
      plan ? await ThunderSDK.billing.quote({ query: { plan }, signal }) : null
    ),
  billingAdmin: () =>
    query(
      ["billingAdmin"],
      async ({ signal }) =>
        await ThunderSDK.billingAdmin.subscriptions({ query: {}, signal })
    ),
  plans: () =>
    query(
      ["plans", "all"],
      async ({ signal }) =>
        await ThunderSDK.plans.get({
          params: {},
          query: { limit: 100 },
          signal,
        })
    ),

  paymentsConfig: () =>
    query(
      ["payments", "config"],
      async ({ signal }) => await ThunderSDK.payments.config({ signal })
    ),
  paymentsSummary: () =>
    query(["payments", "summary"], async ({ signal }) =>
      can("payments", "summary")
        ? await ThunderSDK.payments.summary({ signal })
        : null
    ),
  /** Owners only: `owner` false reads nothing. */
  cards: (owner: boolean) =>
    query(["payments", "cards", String(owner)], async ({ signal }) =>
      owner ? await ThunderSDK.payments.cards({ signal }) : null
    ),
  statement: (owner: boolean) =>
    query(["payments", "statement", String(owner)], async ({ signal }) =>
      owner ? await ThunderSDK.payments.statement({ signal }) : null
    ),
  topups: (
    status: TQueryOf<typeof ThunderSDK.paymentsAdmin.topups>["status"] | "all"
  ) =>
    query(
      ["paymentsAdmin", "topups", status ?? "all"],
      async ({ signal }) =>
        await ThunderSDK.paymentsAdmin.topups({
          query: !status || status === "all" ? {} : { status },
          signal,
        })
    ),
  paymentEvents: () =>
    query(
      ["paymentsAdmin", "events"],
      async ({ signal }) =>
        await ThunderSDK.paymentsAdmin.events({ query: {}, signal })
    ),

  rentals: () =>
    query(["rentals", "list"], async ({ signal }) =>
      can("rentals", "list") ? await ThunderSDK.rentals.list({ signal }) : []
    ),
  /** The market (PLAN §30.4): machines for rent, filtered. */
  market: (filters: TQueryOf<typeof ThunderSDK.market.machines>) =>
    query(
      [
        "market",
        "machines",
        ...Object.entries(filters)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => `${k}=${v}`)
          .sort(),
      ],
      async ({ signal }) =>
        await ThunderSDK.market.machines({ query: filters, signal })
    ),
  /** A size's price on a machine; nothing to quote, or a failed quote, is null. */
  marketQuote: (q?: TQueryOf<typeof ThunderSDK.market.quote>) =>
    query(
      q
        ? ["market", "quote", ...Object.entries(q).map(([k, v]) => `${k}=${v}`)]
        : ["market", "quote"],
      async ({ signal }) =>
        q
          ? await ThunderSDK.market
              .quote({ query: q, signal })
              .catch(() => null)
          : null
    ),
  /** Where an owner's proposal can go instead (PLAN §30.8). */
  proposalTargets: (rental: string) =>
    query(
      ["rentals", rental, "proposalTargets"],
      async ({ signal }) =>
        await ThunderSDK.rentals.proposalTargets({
          params: { id: rental },
          signal,
        })
    ),

  /** One of the workspace's machines for rent: prices, rentals, security. */
  hostingMachine: (server: string) =>
    query(["hosting", "machine", server], async ({ signal }) =>
      can("hosting", "machine")
        ? await ThunderSDK.hosting.machine({ params: { id: server }, signal })
        : null
    ),
  /** Requests and resizes waiting for this workspace's machines. */
  hostingRequests: () =>
    query(["hosting", "requests"], async ({ signal }) =>
      can("hosting", "requests")
        ? await ThunderSDK.hosting.requests({ signal })
        : []
    ),
  /** Empty `rental`: nothing to read. */
  /** Any machine's rentals, for admins (community machines included). */
  adminMachine: (server: string) =>
    query(
      ["rentalsAdmin", "machine", server],
      async ({ signal }) =>
        await ThunderSDK.rentalsAdmin.machine({
          params: { id: server },
          signal,
        })
    ),
  hostingMoveTargets: (rental: string) =>
    query(["hosting", "move", rental], async ({ signal }) =>
      rental
        ? await ThunderSDK.hosting.moveTargets({
            params: { id: rental },
            signal,
          })
        : null
    ),
  earnings: () =>
    query(
      ["earnings"],
      async ({ signal }) => await ThunderSDK.earnings.summary({ signal })
    ),

  /** Approved rentals still without a server: stuck, or being set up. */
  rentalWaiting: () =>
    query(["rentalsAdmin", "waiting"], async ({ signal }) =>
      can("rentalsAdmin", "waiting")
        ? await ThunderSDK.rentalsAdmin.waiting({ signal })
        : []
    ),
  rentalCapacity: () =>
    query(
      ["rentalsAdmin", "capacity"],
      async ({ signal }) => await ThunderSDK.rentalsAdmin.capacity({ signal })
    ),
  /** Empty `rental`: nothing to read. */
  moveTargets: (rental: string) =>
    query(["rentalsAdmin", "move", rental], async ({ signal }) =>
      rental
        ? await ThunderSDK.rentalsAdmin.moveTargets({
            params: { id: rental },
            signal,
          })
        : null
    ),
  disputes: (status: "open" | "resolved" | "all") =>
    query(["rentalsAdmin", "disputes", status], async ({ signal }) =>
      can("rentalsAdmin", "listDisputes")
        ? await ThunderSDK.rentalsAdmin.listDisputes({
            query: { status },
            signal,
          })
        : []
    ),
  claimReverts: () =>
    query(["rentalsAdmin", "reverts"], async ({ signal }) =>
      can("rentalsAdmin", "listReverts")
        ? await ThunderSDK.rentalsAdmin.listReverts({ signal })
        : []
    ),
  /** A dispute with everything to decide it (PLAN §30.9). */
  disputeDetail: (id: string) =>
    query(
      ["rentalsAdmin", "dispute", id],
      async ({ signal }) =>
        await ThunderSDK.rentalsAdmin.dispute({ params: { id }, signal })
    ),
  /** An abuse report with both records (PLAN §30.10). */
  reportDetail: (id: string) =>
    query(
      ["rentalsAdmin", "report", id],
      async ({ signal }) =>
        await ThunderSDK.rentalsAdmin.report({ params: { id }, signal })
    ),
  abuseReports: (status: "open" | "closed" | "all" = "open") =>
    query(["rentalsAdmin", "reports", status], async ({ signal }) =>
      can("rentalsAdmin", "listReports")
        ? await ThunderSDK.rentalsAdmin.listReports({
            query: { status },
            signal,
          })
        : []
    ),

  role: (id: string) =>
    query(
      ["accessControl", id],
      async ({ signal }) =>
        (
          await ThunderSDK.accessControl.get({
            signal,
            params: { id },
            query: {},
          })
        ).results[0]
    ),
  /** Few enough to read at once. */
  policies: () =>
    query(
      ["accessControlPolicies", "all"],
      async ({ signal }) =>
        (
          await ThunderSDK.accessControlPolicies.get({
            signal,
            params: {},
            query: { limit: 500 },
          })
        ).results
    ),

  controlPlane: (
    range: NonNullable<
      TQueryOf<typeof ThunderSDK.controlPlane.overview>["range"]
    >
  ) =>
    query(
      ["controlPlane", range],
      async ({ signal }) =>
        (await ThunderSDK.controlPlane.overview({
          signal,
          query: { range },
        })) as unknown as TOverview
    ),
  controlPlaneRules: () =>
    query(
      ["controlPlane", "rules"],
      async ({ signal }) => await ThunderSDK.controlPlane.rules({ signal })
    ),
  controlPlaneAlerts: () =>
    query(
      ["controlPlane", "alerts"],
      async ({ signal }) =>
        await ThunderSDK.controlPlane.alerts({ signal, query: { limit: 10 } })
    ),
}
