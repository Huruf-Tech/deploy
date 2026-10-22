import { type Filter, ObjectId, type WithId } from "mongodb";
import type z from "zod";
import { Logger } from "@/core/utils/logger.ts";
import { isDuplicateKeyError } from "@/database.ts";
import { keyring } from "@/lib/services.ts";
import { send, type TNotice } from "@/lib/monitoring/channels.ts";
import { readNumberSetting } from "@/lib/core/settings.ts";
import {
  alertEventModel,
  alertRuleModel,
  type TAlertEvent,
  type TAlertRule,
} from "@/schemas/monitoring/alert.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { projectModel } from "@/schemas/applications/project.ts";
import type {
  $alertEvent as $agentAlertEvent,
  $autoscaleEvent,
} from "@/schemas/protocol/agent.ts";

const MAX_ATTEMPTS = 8;
const CLAIM_MS = 60_000;
/** With nothing due, each instance looks again after this long (PLAN §3.4). */
const IDLE_CHECK_MS = 5_000;

const log = (text: string) => Logger.warn(`[alerts] ${text}`);

/** A channel secret's encryption context: bound to its rule. */
export const channelContext = (rule: ObjectId) => `alert:${rule}`;

type TSubject = { server?: ObjectId; project?: ObjectId };

const keyOf = (rule: ObjectId, subject: TSubject) =>
  [rule, subject.server, subject.project].filter(Boolean).join(":");

const isId = (hex?: string): hex is string =>
  !!hex && /^[a-f0-9]{24}$/.test(hex);

let nextCheckAt = 0;

/** Opens an episode; a repeat while one is open is ignored (dedupe). */
async function openEvent(
  rule: WithId<TAlertRule>,
  subject: TSubject,
  opts: { firedAt?: Date; value?: number; detail?: string },
) {
  const firedAt = opts.firedAt ?? new Date();
  try {
    await alertEventModel.insertOne({
      tenant: rule.tenant,
      rule: rule._id,
      ruleName: rule.name,
      metric: rule.metric,
      threshold: rule.threshold,
      ...subject,
      key: keyOf(rule._id, subject),
      open: true,
      firedAt,
      ...(opts.value !== undefined ? { value: opts.value } : {}),
      ...(opts.detail ? { detail: opts.detail.slice(0, 500) } : {}),
      deliveredChannels: [],
      delivery: {
        notice: "fired",
        status: "pending",
        attempts: 0,
        nextAttemptAt: firedAt,
      },
    });
    nextCheckAt = 0;
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }
}

/**
 * Resolves open episodes and queues their resolve notices. One whose fired
 * notice is still waiting out its grace period was a blip: it's dropped.
 * `notify: false` closes them quietly (the rule was removed or disabled).
 */
export async function resolveEvents(
  filter: Filter<TAlertEvent>,
  opts: { notify?: boolean } = {},
) {
  const now = new Date();
  const open = await alertEventModel.find({ ...filter, open: true }, {
    projection: { delivery: 1 },
    limit: 500,
  }).toArray();
  for (const event of open) {
    const blip = event.delivery.notice === "fired" &&
      event.delivery.attempts === 0 && event.delivery.nextAttemptAt > now;
    if (blip) {
      await alertEventModel.deleteOne({ _id: event._id, open: true });
    } else if (opts.notify === false) {
      await alertEventModel.updateOne({ _id: event._id, open: true }, {
        $set: { resolvedAt: now },
        $unset: { open: "" },
      });
    } else {
      await alertEventModel.updateOne({ _id: event._id, open: true }, {
        $set: {
          resolvedAt: now,
          deliveredChannels: [],
          delivery: {
            notice: "resolved",
            status: "pending",
            attempts: 0,
            nextAttemptAt: now,
          },
        },
        $unset: { open: "" },
      });
    }
  }
  if (open.length) nextCheckAt = 0;
}

/** `alert.fired` / `alert.resolved` from an agent (PLAN §13). */
export async function onAgentAlert(
  server: ObjectId,
  event: z.output<typeof $agentAlertEvent>,
) {
  const [ruleId, projectId] = event.data.rule.split(":");
  if (!isId(ruleId)) return;
  const doc = await serverModel.findOne({ _id: server }, {
    projection: { tenant: 1 },
  });
  const rule = doc && await alertRuleModel.findOne({
    _id: new ObjectId(ruleId),
    tenant: doc.tenant,
  });
  if (!rule) return;
  const project = isId(projectId)
    ? new ObjectId(projectId)
    : rule.target.kind === "project"
    ? rule.target.ref
    : undefined;
  const subject = { server, ...(project ? { project } : {}) };

  if (event.type === "alert.fired") {
    if (rule.enabled) {
      await openEvent(rule, subject, { value: event.data.value });
    }
  } else await resolveEvents({ key: keyOf(rule._id, subject) });
}

const rulesFor = (tenants: ObjectId[], metric: TAlertRule["metric"]) =>
  alertRuleModel.find({ tenant: { $in: tenants }, enabled: true, metric }, {
    limit: 500,
  }).toArray();

/**
 * From the offline sweep (PLAN §3.4): the fired notice waits out the rule's
 * grace (`forSec`), so a server that comes back sooner never alerts.
 */
export async function onServersOffline(servers: ObjectId[], since: Date) {
  const docs = await serverModel.find({ _id: { $in: servers } }, {
    projection: { tenant: 1 },
  }).toArray();
  if (!docs.length) return;
  const rules = await rulesFor(docs.map((d) => d.tenant), "agentOffline");
  for (const server of docs) {
    for (const rule of rules) {
      const applies = rule.tenant.equals(server.tenant) &&
        (!rule.target.ref || rule.target.ref.equals(server._id));
      if (applies) {
        await openEvent(rule, { server: server._id }, {
          firedAt: new Date(since.getTime() + rule.forSec * 1000),
        });
      }
    }
  }
}

/** A poll from a server the sweep marked offline. */
export const onServerBack = (server: ObjectId) =>
  resolveEvents({ server, metric: "agentOffline" });

/** From the rollout state machine (PLAN §13); open until a deploy succeeds. */
export async function onDeployFailed(
  deployment: { tenant: ObjectId; project: ObjectId },
  error: string,
) {
  const rules = await rulesFor([deployment.tenant], "deployFailed");
  for (const rule of rules) {
    if (!rule.target.ref || rule.target.ref.equals(deployment.project)) {
      await openEvent(rule, { project: deployment.project }, {
        detail: error,
      });
    }
  }
}

export const onDeploySucceeded = (project: ObjectId) =>
  resolveEvents({ project, metric: "deployFailed" });

/** `autoscale.changed`: the latest count per server, shown on the project. */
export async function onAutoscale(
  server: ObjectId,
  data: z.output<typeof $autoscaleEvent>["data"],
) {
  if (!isId(data.project)) return;
  const filter = { _id: new ObjectId(data.project), placedOn: server };
  await projectModel.updateOne(filter, { $pull: { autoscaled: { server } } });
  await projectModel.updateOne(filter, {
    $push: {
      autoscaled: {
        server,
        replicas: data.to,
        reason: data.reason,
        at: new Date(),
      },
    },
  });
}

const percentMetrics = ["cpu", "memory", "disk"];
const LABEL: Record<TAlertRule["metric"], string> = {
  cpu: "CPU",
  memory: "Memory",
  disk: "Disk",
  room: "Memory room",
  agentOffline: "Server offline",
  deployFailed: "Deploy failed",
};

const time = (d: Date) =>
  d.toISOString().slice(0, 16).replace("T", " ") + " UTC";

/** The text and webhook payload of an event's current notice. */
export function noticeOf(
  event: WithId<TAlertEvent>,
  names: { server?: string; project?: string },
): TNotice {
  const subject = [names.project, names.server && `on ${names.server}`]
    .filter(Boolean).join(" ") || "your workspace";
  const resolved = event.delivery.notice === "resolved";
  const value = event.value === undefined
    ? ""
    : percentMetrics.includes(event.metric)
    ? `${event.value}% (threshold ${event.threshold}%)`
    : `${event.value} MiB (threshold ${event.threshold} MiB)`;
  const what = event.metric === "agentOffline"
    ? `${names.server ?? "A server"} stopped reporting`
    : event.metric === "deployFailed"
    ? `A deploy of ${names.project ?? "a project"} failed${
      event.detail ? `: ${event.detail}` : ""
    }`
    : `${LABEL[event.metric]} ${subject}: ${value}`;
  const text = resolved
    ? `✅ Resolved: ${event.ruleName}. ${what}, since ${time(event.firedAt)}.`
    : `🔴 ${event.ruleName}. ${what}.`;

  return {
    subject: `${resolved ? "Resolved" : "Alert"}: ${event.ruleName} (${
      LABEL[event.metric]
    }, ${subject})`,
    text,
    payload: {
      event: resolved ? "alert.resolved" : "alert.fired",
      rule: { id: event.rule, name: event.ruleName, metric: event.metric },
      threshold: event.threshold,
      value: event.value,
      server: event.server && { id: event.server, name: names.server },
      project: event.project && { id: event.project, name: names.project },
      detail: event.detail,
      firedAt: event.firedAt,
      resolvedAt: event.resolvedAt,
    },
  };
}

/**
 * The outbox (PLAN §3.4): claims the most overdue notice and delivers it to
 * the channels it hasn't reached yet, retrying with backoff. Piggybacked on
 * dashboard requests and event ingestion, never on polls; with nothing due an
 * instance checks at most every 5 s.
 */
export async function deliverDueAlerts(opts: { force?: boolean } = {}) {
  if (!opts.force && Date.now() < nextCheckAt) return false;
  nextCheckAt = Date.now() + IDLE_CHECK_MS;
  const now = new Date();
  const claimedUntil = new Date(now.getTime() + CLAIM_MS);
  const event = await alertEventModel.findOneAndUpdate(
    {
      "delivery.status": "pending",
      "delivery.nextAttemptAt": { $lte: now },
      $or: [
        { "delivery.claimedUntil": { $exists: false } },
        { "delivery.claimedUntil": { $lt: now } },
      ],
    },
    { $set: { "delivery.claimedUntil": claimedUntil } },
    { sort: { "delivery.nextAttemptAt": 1 }, returnDocument: "after" },
  );
  if (!event) return false;
  nextCheckAt = 0; // there may be more

  const rule = await alertRuleModel.findOne({ _id: event.rule });
  const [server, project] = await Promise.all([
    event.server &&
    serverModel.findOne({ _id: event.server }, { projection: { name: 1 } }),
    event.project &&
    projectModel.findOne({ _id: event.project }, { projection: { name: 1 } }),
  ]);
  const notice = noticeOf(event, {
    server: server?.name,
    project: project?.name,
  });

  const delivered = [...event.deliveredChannels];
  const errors: string[] = [];
  await Promise.all((rule?.channels ?? []).map(async (channel, index) => {
    if (delivered.includes(index)) return;
    try {
      const target = channel.secretEnc
        ? await keyring.decrypt(
          { kind: "tenant", ref: event.tenant },
          channel.secretEnc,
          channelContext(event.rule),
        )
        : channel.target;
      await send({ type: channel.type, target }, notice);
      delivered.push(index);
    } catch (error) {
      errors.push(`${channel.type}: ${(error as Error).message}`);
    }
  }));

  const attempts = event.delivery.attempts + 1;
  const done = !!rule && !errors.length;
  const status = done
    ? "sent"
    : !rule || attempts >= MAX_ATTEMPTS
    ? "failed"
    : "pending";
  if (errors.length) log(`${event._id}: ${errors.join("; ")}`);
  // Only the notice we claimed: a resolve may have replaced it meanwhile.
  await alertEventModel.updateOne(
    {
      _id: event._id,
      "delivery.notice": event.delivery.notice,
      "delivery.claimedUntil": claimedUntil,
    },
    {
      $set: {
        deliveredChannels: delivered.sort(),
        "delivery.status": status,
        "delivery.attempts": attempts,
        "delivery.nextAttemptAt": new Date(
          Date.now() + Math.min(30_000 * 2 ** attempts, 3_600_000),
        ),
        ...(rule
          ? errors.length
            ? { "delivery.error": errors.join("; ").slice(0, 500) }
            : {}
          : { "delivery.error": "The rule was deleted" }),
      },
      $unset: {
        "delivery.claimedUntil": "",
        ...(done ? { "delivery.error": "" } : {}),
      },
    },
  );
  return true;
}

/** Runs the outbox without holding up the request it rides on. */
export const deliverInBackground = () => {
  if (Date.now() < nextCheckAt) return;
  deliverDueAlerts().catch((error) => log(`delivery failed: ${error}`));
};

/** Default grace for `agentOffline` rules (PLAN §3.4). */
export const offlineGraceSec = () =>
  readNumberSetting("ALERT_AGENT_OFFLINE_GRACE_SEC", 20);
