import { ObjectId, type WithId } from "mongodb";
import { isDuplicateKeyError } from "@/database.ts";
import { Response } from "@/core/http/response.ts";
import { Env } from "@/core/utils/env.ts";
import { entitlements, quotaGuard } from "@/lib/services.ts";
import { getProject } from "@/lib/deploy/projects.ts";
import { PiggybackScheduler } from "@/lib/core/piggybackScheduler.ts";
import {
  checkDomain,
  ingressTargets,
  OWNERSHIP_PREFIX,
  ownershipName,
} from "@/lib/domains/dns.ts";
import { orderCertificate } from "@/lib/domains/acme.ts";
import { refreshSpecs } from "@/lib/deploy/specs.ts";
import { projectModel } from "@/schemas/applications/project.ts";
import {
  domainJobSlotModel,
  domainModel,
  type TDomain,
} from "@/schemas/applications/domain.ts";

/** After "Check now": look every minute, for half an hour (PLAN §14). */
export const CHECK_WINDOW_MS = 30 * 60_000;
export const CHECK_EVERY_MS = 60_000;
const CHECK_BATCH = 20;

/** Let's Encrypt allows 5 failed validations per hour: stay under it. */
export const ORDERS_PER_HOUR = 3;
const GIVE_UP_AFTER = 5;
const ISSUE_BATCH = 5;
const RENEW_BEFORE_MS = 30 * 24 * 60 * 60_000;

/** 30 days before expiry, or a third of the lifetime for short-lived ones. */
export const renewAt = ({ issuedAt, notAfter }: TCertificateDates) =>
  new Date(
    notAfter.getTime() -
      Math.min(RENEW_BEFORE_MS, (notAfter.getTime() - issuedAt.getTime()) / 3),
  );
type TCertificateDates = { issuedAt: Date; notAfter: Date };
const HOUR = 60 * 60_000;

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

/** Lower-cased, without a trailing dot; throws a 400 for what can't be served. */
export async function normalizeHostname(input: string) {
  const hostname = input.trim().toLowerCase().replace(/\.$/, "");
  const labels = hostname.split(".");
  if (
    hostname.length > 253 || labels.length < 2 ||
    !labels.every((l) => LABEL.test(l)) || /^\d+$/.test(labels.at(-1)!)
  ) {
    throw Response.badRequest(
      "Enter a domain name like app.example.com (no wildcards, IPs or ports)",
    );
  }
  // Custom domains only: the platform's own names are never handed out (D43).
  const own = [
    new URL(Env.getSync("BASE_URL", true) || "http://localhost").hostname,
    (await ingressTargets()).hostname,
  ].filter((h) => h && h !== "localhost");
  if (own.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
    throw Response.badRequest("The platform's own domain can't be used");
  }
  return hostname;
}

const verifiedElsewhere = (hostname: string, tenant: ObjectId) =>
  domainModel.findOne(
    { hostname, verifiedAt: { $exists: true }, tenant: { $ne: tenant } },
    { projection: { _id: 1 } },
  );

export async function addDomain(
  tenant: ObjectId,
  user: ObjectId,
  projectId: ObjectId,
  input: string,
) {
  const hostname = await normalizeHostname(input);
  await getProject(tenant, projectId);
  if (await verifiedElsewhere(hostname, tenant)) {
    throw Response.badRequest(`${hostname} is in use by another account`);
  }

  const { limits } = await entitlements.resolve(tenant);
  const limit = limits.domains ?? 3; // older paid periods predate the limit
  if (!await quotaGuard.acquire(tenant, "domains", limit)) {
    throw Response.forbidden(`Your plan allows ${limit} domains`);
  }
  const now = new Date();
  const _id = new ObjectId();
  try {
    await domainModel.insertOne({
      _id,
      tenant,
      project: projectId,
      hostname,
      token: crypto.randomUUID().replaceAll("-", ""),
      status: "pending",
      createdBy: user,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    await quotaGuard.release(tenant, "domains");
    if (isDuplicateKeyError(error)) {
      throw Response.badRequest(`${hostname} is already added`);
    }
    throw error;
  }
  return _id;
}

/** The DNS records the user creates, shown next to each domain. */
export async function domainRecords(
  domain: Pick<TDomain, "hostname" | "token">,
) {
  const targets = await ingressTargets();
  return {
    ownership: {
      type: "TXT" as const,
      name: ownershipName(domain.hostname),
      value: `${OWNERSHIP_PREFIX}${domain.token}`,
    },
    ...(targets.hostname ? { cname: targets.hostname } : {}),
    ...(targets.ipv4.length ? { ipv4: targets.ipv4 } : {}),
  };
}

/**
 * One check of a domain that's `checking`. Both passing verifies it (the
 * partial unique index keeps a hostname verified by one tenant only) and
 * hands it to issuing; otherwise it waits a minute, until its window ends.
 */
export async function checkOnce(domain: WithId<TDomain>, now = new Date()) {
  const result = await checkDomain(domain.hostname, domain.token);
  const checks = { ...result, checkedAt: now };
  const filter = { _id: domain._id, status: "checking" as const };

  if (result.ownership && result.dns) {
    try {
      await domainModel.updateOne(filter, {
        $set: {
          status: "issuing",
          verifiedAt: now,
          checks,
          issueAt: now,
          issueFailures: 0,
          updatedAt: now,
        },
        $unset: { nextCheckAt: "", checkUntil: "", error: "" },
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      await domainModel.updateOne(filter, {
        $set: {
          status: "failed",
          checks,
          error: `${domain.hostname} is in use by another account`,
          updatedAt: now,
        },
        $unset: { nextCheckAt: "", checkUntil: "" },
      });
    }
    return;
  }

  const expired = !domain.checkUntil || now >= domain.checkUntil;
  await domainModel.updateOne(
    filter,
    expired
      ? {
        $set: {
          status: "failed",
          checks,
          error: result.detail ?? "DNS checks didn't pass",
          updatedAt: now,
        },
        $unset: { nextCheckAt: "", checkUntil: "" },
      }
      : {
        $set: {
          checks,
          nextCheckAt: new Date(now.getTime() + CHECK_EVERY_MS),
          updatedAt: now,
        },
      },
  );
}

/** "Check now": checks right away, then every minute for 30 minutes. */
export async function startCheck(tenant: ObjectId, id: ObjectId) {
  const now = new Date();
  const domain = await domainModel.findOneAndUpdate(
    { _id: id, tenant, status: { $in: ["pending", "failed", "checking"] } },
    {
      $set: {
        status: "checking",
        checkUntil: new Date(now.getTime() + CHECK_WINDOW_MS),
        nextCheckAt: new Date(now.getTime() + CHECK_EVERY_MS),
        updatedAt: now,
      },
      $unset: { error: "" },
    },
    { returnDocument: "after" },
  );
  if (!domain) {
    if (await domainModel.findOne({ _id: id, tenant })) {
      throw Response.badRequest("This domain is already verified");
    }
    throw Response.notFound("Domain not found");
  }
  await checkOnce(domain, now);
}

export async function removeDomain(tenant: ObjectId, id: ObjectId) {
  const { deletedCount } = await domainModel.deleteOne({ _id: id, tenant });
  if (!deletedCount) throw Response.notFound("Domain not found");
  await quotaGuard.release(tenant, "domains");
}

/** With its project: frees each domain's quota. */
export async function removeProjectDomains(
  tenant: ObjectId,
  project: ObjectId,
) {
  const { deletedCount } = await domainModel.deleteMany({ tenant, project });
  for (let i = 0; i < deletedCount; i++) {
    await quotaGuard.release(tenant, "domains");
  }
}

/** Rechecks the domains that are due, a bounded batch per run. */
export async function checkDue(now = new Date()) {
  const due = await domainModel.find(
    { status: "checking", nextCheckAt: { $lte: now } },
    { limit: CHECK_BATCH, sort: { nextCheckAt: 1 } },
  ).toArray();
  await Promise.all(due.map((d) => checkOnce(d, now)));
}

/**
 * One order for a verified domain: its first certificate, or a renewal.
 * Claimed first, so only one instance orders. A failed first order backs
 * off and gives up after 5; a failed renewal keeps the current certificate.
 */
export async function issueOnce(id: ObjectId, now = new Date()) {
  const domain = await domainModel.findOneAndUpdate(
    {
      _id: id,
      status: { $in: ["issuing", "active"] },
      issueAt: { $lte: now },
      $or: [
        { issueLockedUntil: { $exists: false } },
        { issueLockedUntil: { $lte: now } },
      ],
    },
    { $set: { issueLockedUntil: new Date(now.getTime() + 5 * 60_000) } },
    { returnDocument: "after" },
  );
  if (!domain) return;

  const recent = (domain.issueOrders ?? []).filter((at) =>
    now.getTime() - at.getTime() < HOUR
  );
  if (recent.length >= ORDERS_PER_HOUR) {
    await domainModel.updateOne({ _id: id }, {
      $set: { issueAt: new Date(recent[0].getTime() + HOUR) },
      $unset: { issueLockedUntil: "" },
    });
    return;
  }

  const orders = [...recent, now];
  try {
    const certificate = await orderCertificate(domain.hostname, domain.tenant);
    const first = domain.status === "issuing";
    await domainModel.updateOne({ _id: id }, {
      $set: {
        status: "active",
        certificate,
        issueAt: renewAt(certificate),
        issueFailures: 0,
        issueOrders: orders,
        updatedAt: new Date(),
      },
      $unset: { issueLockedUntil: "", error: "" },
    });
    if (first) {
      // Servers set up before the tunnels were configured get them now.
      const project = await projectModel.findOne({ _id: domain.project }, {
        projection: { placedOn: 1 },
      });
      if (project?.placedOn.length) await refreshSpecs(project.placedOn);
    }
  } catch (error) {
    const failures = (domain.issueFailures ?? 0) + 1;
    const message = String((error as Error)?.message ?? error).slice(0, 450);
    const renewing = domain.status === "active";
    const giveUp = !renewing && failures >= GIVE_UP_AFTER;
    await domainModel.updateOne({ _id: id }, {
      $set: {
        ...(giveUp ? { status: "failed" as const } : {}),
        error: renewing ? `Renewal failed: ${message}` : message,
        issueFailures: failures,
        issueOrders: orders,
        updatedAt: new Date(),
        ...(giveUp ? {} : {
          issueAt: new Date(
            now.getTime() + Math.min(2 ** failures * 60_000, HOUR),
          ),
        }),
      },
      $unset: { issueLockedUntil: "", ...(giveUp ? { issueAt: "" } : {}) },
    });
  }
}

/** Orders for the domains that are due, a few per run: each takes seconds. */
export async function issueDue(now = new Date()) {
  const due = await domainModel.find(
    { status: { $in: ["issuing", "active"] }, issueAt: { $lte: now } },
    { projection: { _id: 1 }, limit: ISSUE_BATCH, sort: { issueAt: 1 } },
  ).toArray();
  await Promise.all(due.map((d) => issueOnce(d._id, now)));
}

export const domainChecks = new PiggybackScheduler(
  domainJobSlotModel,
  { slotCount: 1, intervalMs: 15_000 },
  async () => {
    await checkDue();
    await issueDue();
  },
);
