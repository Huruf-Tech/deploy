import { ObjectId, type WithId } from "mongodb";
import z from "zod";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { entitlements, keyring } from "@/lib/services.ts";
import { refreshSpecs } from "@/lib/deploy/specs.ts";
import { assertPublicUrl, maskUrl } from "@/lib/monitoring/channels.ts";
import {
  channelContext,
  offlineGraceSec,
  resolveEvents,
} from "@/lib/monitoring/alerts.ts";
import {
  $alertChannelType,
  $alertMetric,
  AGENT_METRICS,
  alertEventModel,
  alertRuleModel,
  METRICS_BY_TARGET,
  PLATFORM_OWNER,
  type TAlertChannel,
  type TAlertRule,
} from "@/schemas/monitoring/alert.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { projectModel } from "@/schemas/applications/project.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { tenantMemberModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenantMember.ts";
import { userModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/user.ts";

const MAX_RULES = 50;

export const $alertRuleInput = z.object({
  name: z.string().min(1).max(80),
  target: z.object({
    kind: z.enum(["server", "project", "controlPlane"]),
    ref: $objectId.optional(),
  }),
  metric: $alertMetric,
  threshold: z.number().min(0).max(1_048_576).optional().describe(
    "Percent for cpu/memory/disk, MiB for room; a default when omitted",
  ),
  forSec: z.number().int().min(0).max(86_400).optional(),
  channels: z.array(z.object({
    type: $alertChannelType,
    target: z.string().min(3).max(500).describe(
      "Email address or webhook URL; send a channel's masked URL back to keep it",
    ),
  })).min(1).max(10),
  enabled: z.boolean().default(true),
});

export type TAlertRuleInput = z.output<typeof $alertRuleInput>;

const DEFAULTS: Record<TAlertRule["metric"], [number, number]> = {
  cpu: [90, 300],
  memory: [90, 300],
  disk: [90, 0],
  room: [512, 600],
  agentOffline: [0, 20],
  deployFailed: [0, 0],
  // Control plane: % of one core, % of host memory, p95 ms, % of requests,
  // % of the expected polls that arrive (below fires).
  cpCpu: [80, 300],
  cpMemory: [90, 300],
  cpPollLatency: [100, 300],
  cpErrorRate: [2, 300],
  cpPollsMissing: [50, 180],
};

const isPlatform = (tenant: ObjectId) => tenant.equals(PLATFORM_OWNER);

/** What the API shows: channel secrets stay out. */
const view = ({ channels, ...rule }: WithId<TAlertRule>) => ({
  ...rule,
  channels: channels.map(({ type, target }) => ({ type, target })),
});

export async function listRules(tenant: ObjectId) {
  const rules = await alertRuleModel.find({ tenant }, {
    sort: { createdAt: 1 },
    limit: MAX_RULES,
  }).toArray();
  return rules.map(view);
}

/** Emails of the workspace's members: alerts never go to strangers. */
async function memberEmails(tenant: ObjectId) {
  // The control plane's alerts go to platform admins.
  if (isPlatform(tenant)) {
    const admins = await userModel.find({ role: { $in: ["admin", "root"] } }, {
      projection: { email: 1 },
      limit: 1_000,
    }).toArray();
    return new Set(
      admins.map((u) => u.email).filter((e): e is string => !!e).map((e) =>
        e.toLowerCase()
      ),
    );
  }
  const [doc, members] = await Promise.all([
    tenantModel.findOne({ _id: tenant }, { projection: { createdBy: 1 } }),
    tenantMemberModel.find({ tenant }, {
      projection: { user: 1, email: 1 },
      limit: 1_000,
    }).toArray(),
  ]);
  const users = await userModel.find({
    _id: {
      $in: [
        ...members.map((m) => m.user),
        ...(doc?.createdBy ? [doc.createdBy] : []),
      ],
    },
  }, { projection: { email: 1 }, limit: 1_000 }).toArray();
  return new Set(
    [...members.map((m) => m.email), ...users.map((u) => u.email)]
      .filter((e): e is string => !!e).map((e) => e.toLowerCase()),
  );
}

async function sealChannels(
  tenant: ObjectId,
  rule: ObjectId,
  input: TAlertRuleInput["channels"],
  existing: TAlertChannel[] = [],
): Promise<TAlertChannel[]> {
  const emails = input.some((c) => c.type === "email")
    ? await memberEmails(tenant)
    : new Set<string>();
  return await Promise.all(input.map(async ({ type, target }) => {
    if (type === "email") {
      const email = target.trim().toLowerCase();
      if (!emails.has(email)) {
        throw Response.badRequest(
          isPlatform(tenant)
            ? `${target} isn't a platform admin; control plane alerts go to admins only`
            : `${target} isn't a member of this workspace; alerts go to members only`,
        );
      }
      return { type, target: email };
    }
    const kept = existing.find((c) => c.type === type && c.target === target);
    if (kept) return kept;
    try {
      if (
        type === "slack" && !target.startsWith("https://hooks.slack.com/")
      ) {
        throw new Error(
          "Use a Slack incoming webhook URL (https://hooks.slack.com/…)",
        );
      }
      await assertPublicUrl(target);
    } catch (error) {
      throw Response.badRequest((error as Error).message);
    }
    return {
      type,
      target: maskUrl(target),
      secretEnc: await keyring.encrypt(
        { kind: "tenant", ref: tenant },
        target,
        channelContext(rule),
      ),
    };
  }));
}

async function validate(tenant: ObjectId, input: TAlertRuleInput) {
  if (isPlatform(tenant) !== (input.target.kind === "controlPlane")) {
    throw Response.badRequest(
      isPlatform(tenant)
        ? "Control plane rules watch the control plane"
        : "Only platform admins watch the control plane",
    );
  }
  const allowed: readonly string[] = METRICS_BY_TARGET[input.target.kind];
  if (!allowed.includes(input.metric)) {
    throw Response.badRequest(
      `A ${input.target.kind} rule can watch ${allowed.join(", ")}`,
    );
  }
  const ref = input.target.ref;
  if (!ref || input.target.kind === "controlPlane") return;
  const found = input.target.kind === "server"
    ? await serverModel.countDocuments({ _id: ref, tenant }, { limit: 1 })
    : await projectModel.countDocuments({ _id: ref, tenant }, { limit: 1 });
  if (!found) throw Response.badRequest(`Unknown ${input.target.kind}`);
}

async function fields(input: TAlertRuleInput) {
  const [threshold, forSec] = DEFAULTS[input.metric];
  return {
    name: input.name,
    target: {
      kind: input.target.kind,
      ...(input.target.ref && input.target.kind !== "controlPlane"
        ? { ref: input.target.ref }
        : {}),
    },
    metric: input.metric,
    threshold: input.threshold ?? threshold,
    forSec: input.forSec ??
      (input.metric === "agentOffline" ? await offlineGraceSec() : forSec),
    enabled: input.enabled,
  };
}

/** Agents evaluate metric rules from their spec: refresh it when those change. */
async function refreshFor(tenant: ObjectId, ...metrics: string[]) {
  if (!metrics.some((m) => (AGENT_METRICS as readonly string[]).includes(m))) {
    return;
  }
  const servers = await serverModel.find({ tenant, status: "active" }, {
    projection: { _id: 1 },
    limit: 500,
  }).toArray();
  await refreshSpecs(servers.map((s) => s._id));
}

export async function createRule(
  tenant: ObjectId,
  user: ObjectId,
  input: TAlertRuleInput,
) {
  const allowed = isPlatform(tenant) ? MAX_RULES : Math.min(
    MAX_RULES,
    (await entitlements.resolve(tenant)).limits.alertRules,
  );
  if (await alertRuleModel.countDocuments({ tenant }) >= allowed) {
    throw Response.badRequest(`Your plan allows ${allowed} alert rules`);
  }
  await validate(tenant, input);
  const _id = new ObjectId();
  const now = new Date();
  await alertRuleModel.insertOne({
    _id,
    tenant,
    ...(await fields(input)),
    channels: await sealChannels(tenant, _id, input.channels),
    createdBy: user,
    createdAt: now,
    updatedAt: now,
  });
  await refreshFor(tenant, input.metric);
  return { _id };
}

export async function updateRule(
  tenant: ObjectId,
  id: ObjectId,
  input: TAlertRuleInput,
) {
  const rule = await alertRuleModel.findOne({ _id: id, tenant });
  if (!rule) throw Response.notFound("Unknown alert rule");
  await validate(tenant, input);
  const next = await fields(input);
  await alertRuleModel.updateOne({ _id: id, tenant }, {
    $set: {
      ...next,
      channels: await sealChannels(tenant, id, input.channels, rule.channels),
      updatedAt: new Date(),
    },
  });
  // A rule watching something else (or nothing) closes what it had open.
  if (
    !input.enabled || input.metric !== rule.metric ||
    input.target.kind !== rule.target.kind ||
    String(input.target.ref) !== String(rule.target.ref)
  ) {
    await resolveEvents({ rule: id }, { notify: false });
  }
  await refreshFor(tenant, rule.metric, input.metric);
}

export async function deleteRule(tenant: ObjectId, id: ObjectId) {
  const rule = await alertRuleModel.findOneAndDelete({ _id: id, tenant });
  if (!rule) throw Response.notFound("Unknown alert rule");
  await resolveEvents({ rule: id }, { notify: false });
  await refreshFor(tenant, rule.metric);
}

/** Recent episodes, newest first; offline ones show once their grace ends. */
export async function listEvents(
  tenant: ObjectId,
  opts: { open?: boolean; limit: number },
) {
  const events = await alertEventModel.find({
    tenant,
    firedAt: { $lte: new Date() },
    ...(opts.open ? { open: true } : {}),
  }, {
    sort: { firedAt: -1 },
    limit: opts.limit,
    projection: { key: 0, deliveredChannels: 0, "delivery.claimedUntil": 0 },
  }).toArray();
  const [servers, projects] = await Promise.all([
    serverModel.find({
      _id: { $in: events.flatMap((e) => e.server ? [e.server] : []) },
    }, { projection: { name: 1 } }).toArray(),
    projectModel.find({
      _id: { $in: events.flatMap((e) => e.project ? [e.project] : []) },
    }, { projection: { name: 1 } }).toArray(),
  ]);
  const name = (list: { _id: ObjectId; name: string }[], id?: ObjectId) =>
    id && list.find((x) => x._id.equals(id))?.name;
  return events.map((e) => ({
    ...e,
    open: !!e.open,
    serverName: name(servers, e.server),
    projectName: name(projects, e.project),
  }));
}
