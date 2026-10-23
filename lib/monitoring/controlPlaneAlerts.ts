import type { WithId } from "mongodb";
import { getAgentConfig } from "@/lib/agents/config.ts";
import {
  deliverInBackground,
  openEvent,
  resolveEvents,
} from "@/lib/monitoring/alerts.ts";
import { percentile } from "@/lib/monitoring/controlPlane.ts";
import {
  alertEventModel,
  alertRuleModel,
  PLATFORM_OWNER,
  type TAlertRule,
} from "@/schemas/monitoring/alert.ts";
import {
  controlPlaneSampleModel,
  type TControlPlaneSample,
} from "@/schemas/monitoring/controlPlane.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";

/**
 * Control plane alert rules (PLAN §13), evaluated by each instance right
 * after it writes its minute sample: no background job. A rule fires when
 * every sample in its window breaches, and resolves once the latest doesn't.
 */

const RULES_TTL_MS = 60_000;
const ALIVE_MS = 3 * 60_000;
let cache: { at: number; rules: WithId<TAlertRule>[] } | undefined;

async function activeRules() {
  if (cache && Date.now() - cache.at < RULES_TTL_MS) return cache.rules;
  const rules = await alertRuleModel.find({
    tenant: PLATFORM_OWNER,
    "target.kind": "controlPlane",
    enabled: true,
  }, { limit: 50 }).toArray();
  cache = { at: Date.now(), rules };
  return rules;
}

/** Rule edits apply on the next minute instead of after the cache expires. */
export const forgetControlPlaneRules = () => (cache = undefined);

type TSample = Pick<
  TControlPlaneSample,
  "at" | "requests" | "errors" | "polls" | "pollLatency" | "process" | "system"
>;

/** A sample's value for a per-instance metric; undefined when it can't say. */
export function valueOf(metric: TAlertRule["metric"], s: TSample) {
  switch (metric) {
    case "cpCpu":
      return s.process.cpuPct;
    case "cpMemory":
      return s.system
        ? Math.round(100 * (1 - s.system.memAvailableMb / s.system.memTotalMb))
        : undefined;
    case "cpPollLatency":
      return percentile(s.pollLatency, 0.95) ?? undefined;
    case "cpErrorRate":
      // Too few requests make a percentage noise.
      return s.requests >= 20
        ? Math.round((1000 * s.errors) / s.requests) / 10
        : undefined;
  }
}

/** Whether every value breaches: enough samples to cover the window, all over. */
export function breaches(
  values: (number | undefined)[],
  threshold: number,
  needed: number,
  below = false,
) {
  const known = values.filter((v): v is number => v !== undefined);
  return known.length >= needed && known.length === values.length &&
    known.every((v) => below ? v < threshold : v > threshold);
}

export async function evaluateControlPlane(instance: string, label: string) {
  const rules = await activeRules();
  if (!rules.length) return;
  const now = Date.now();
  let changed = false;

  for (const rule of rules) {
    const windowMs = Math.max(rule.forSec * 1000, 60_000);
    const needed = Math.max(1, Math.round(windowMs / 60_000));
    const since = new Date(now - windowMs - 30_000);

    if (rule.metric === "cpPollsMissing") {
      // Fleet-wide: every instance computes it; the open episode's key dedupes.
      const [samples, online, config] = await Promise.all([
        controlPlaneSampleModel.find({ at: { $gte: since } }, {
          projection: { at: 1, polls: 1 },
          limit: 10_000,
        }).toArray(),
        serverLeaseModel.countDocuments({ aliveUntil: { $gt: new Date() } }),
        getAgentConfig(),
      ]);
      const expected = online * (60_000 / config.config.poll.idleMs);
      if (expected < 10) continue; // too few agents to judge
      const perMinute = new Map<number, number>();
      for (const s of samples) {
        const minute = Math.floor(s.at.getTime() / 60_000);
        perMinute.set(minute, (perMinute.get(minute) ?? 0) + s.polls);
      }
      const ratios = [...perMinute.values()].map((n) =>
        Math.round((100 * n) / expected)
      );
      if (breaches(ratios, rule.threshold, needed, true)) {
        await openEvent(rule, { instance: "all" }, {
          value: Math.max(...ratios),
        });
        changed = true;
      } else if (ratios.length) {
        await resolveEvents({ rule: rule._id, instance: "all" });
        changed = true;
      }
      continue;
    }

    const samples = await controlPlaneSampleModel.find(
      { instance, at: { $gte: since } },
      {
        projection: {
          at: 1,
          requests: 1,
          errors: 1,
          polls: 1,
          pollLatency: 1,
          process: 1,
          system: 1,
        },
        sort: { at: 1 },
        limit: 1_500,
      },
    ).toArray();
    const values = samples.map((s) => valueOf(rule.metric, s));
    if (breaches(values, rule.threshold, needed)) {
      await openEvent(rule, { instance: label }, { value: values.at(-1) });
      changed = true;
    } else if (values.at(-1) !== undefined) {
      await resolveEvents({ rule: rule._id, instance: label });
      changed = true;
    }
  }

  // An instance that stopped reporting (restart, scale-in) keeps nothing open.
  const open = await alertEventModel.find({
    tenant: PLATFORM_OWNER,
    open: true,
    instance: { $nin: ["all", label] },
  }, { projection: { instance: 1 }, limit: 200 }).toArray();
  if (open.length) {
    const alive = await controlPlaneSampleModel.find({
      at: { $gte: new Date(now - ALIVE_MS) },
    }, { projection: { host: 1, instance: 1 }, limit: 1_000 }).toArray();
    const labels = new Set(alive.map((s) => instanceLabel(s.host, s.instance)));
    const gone = open.filter((e) => !labels.has(e.instance!));
    if (gone.length) {
      await resolveEvents({ _id: { $in: gone.map((e) => e._id) } });
      changed = true;
    }
  }
  if (changed) deliverInBackground();
}

export const instanceLabel = (host: string, instance: string) =>
  `${host} (${instance})`;
