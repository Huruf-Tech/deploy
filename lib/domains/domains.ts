import { ObjectId, type WithId } from "mongodb";
import { isDuplicateKeyError } from "@/database.ts";
import { Response } from "@/core/http/response.ts";
import { Env } from "@/core/utils/env.ts";
import { encodeHex } from "@std/encoding/hex";
import { cache } from "@/core/utils/cache.ts";
import { entitlements, keyring, quotaGuard } from "@/lib/services.ts";
import { PLATFORM_OWNER } from "@/schemas/monitoring/alert.ts";
import { getProject } from "@/lib/deploy/projects.ts";
import { PiggybackScheduler } from "@/lib/core/piggybackScheduler.ts";
import {
  checkDomain,
  ingressTargets,
  OWNERSHIP_PREFIX,
  ownershipName,
} from "@/lib/domains/dns.ts";
import { orderCertificate } from "@/lib/domains/acme.ts";
import { appDomain, ensureAppCertificate } from "@/lib/domains/appDomain.ts";
import { refreshSpecs } from "@/lib/deploy/specs.ts";
import { projectModel } from "@/schemas/applications/project.ts";
import {
  certificateArchiveModel,
  domainJobSlotModel,
  domainModel,
  platformSecretModel,
  type TDomain,
} from "@/schemas/applications/domain.ts";

/** After "Check now": look every minute, for half an hour (PLAN §14). */
export const CHECK_WINDOW_MS = 30 * 60_000;
export const CHECK_EVERY_MS = 60_000;
/** A new certificate's HTTPS check: every 30 s, for 10 minutes. */
export const VERIFY_EVERY_MS = 30_000;
export const VERIFY_WINDOW_MS = 10 * 60_000;
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
    // Free test domains are handed out, never added (PLAN §14).
    await appDomain(),
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
  const token = await ownershipToken(tenant, hostname);
  try {
    await domainModel.insertOne({
      _id,
      tenant,
      project: projectId,
      hostname,
      token,
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
  // Records already in place (e.g. re-adding a domain): verified right away.
  // Otherwise it waits for "Check now", as nothing is checked unprompted.
  const ready = await checkDomain(hostname, token).catch(() => undefined);
  if (ready?.ownership && ready.dns) await startCheck(tenant, _id);
  return _id;
}

const PLATFORM = { kind: "tenant" as const, ref: PLATFORM_OWNER };
const TOKEN_SECRET = "domainTokens";

/** The ownership token's key: made once, sealed, never rotated. */
const tokenKey = cache(async () => {
  let doc = await platformSecretModel.findOne({ _id: TOKEN_SECRET });
  if (!doc) {
    const value = encodeHex(crypto.getRandomValues(new Uint8Array(32)));
    await platformSecretModel.insertOne({
      _id: TOKEN_SECRET,
      valueEnc: await keyring.encrypt(
        PLATFORM,
        value,
        `secret:${TOKEN_SECRET}`,
      ),
      createdAt: new Date(),
    }).catch((error) => {
      if (!isDuplicateKeyError(error)) throw error; // another instance won
    });
    doc = (await platformSecretModel.findOne({ _id: TOKEN_SECRET }))!;
  }
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(
      await keyring.decrypt(PLATFORM, doc.valueEnc, `secret:${TOKEN_SECRET}`),
    ),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}, 60 * 60_000);

/**
 * The TXT ownership value for a tenant's domain: derived (HMAC of tenant and
 * hostname), so re-adding a domain gives the same record that's already in
 * DNS, while another tenant gets a different one.
 */
export async function ownershipToken(tenant: ObjectId, hostname: string) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await tokenKey(),
    new TextEncoder().encode(`${tenant}:${hostname}`),
  );
  return encodeHex(new Uint8Array(signature)).slice(0, 32);
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

/**
 * Records just created through the DNS provider's API (Cloudflare, with the
 * zone owner's authorization) prove ownership and DNS: verified now, with no
 * lookup (a resolver may still hold the "no such name" from when it was
 * added), and the certificate ordered after `delayMs`, once the provider
 * serves the records. Let's Encrypt's own validation still applies.
 */
export async function verifyByProvider(
  tenant: ObjectId,
  id: ObjectId,
  delayMs: number,
) {
  const now = new Date();
  try {
    await domainModel.updateOne(
      { _id: id, tenant, status: { $in: ["pending", "failed", "checking"] } },
      {
        $set: {
          status: "issuing",
          verifiedAt: now,
          checks: { ownership: true, dns: true, checkedAt: now },
          issueAt: new Date(now.getTime() + delayMs),
          issueFailures: 0,
          updatedAt: now,
        },
        $unset: { nextCheckAt: "", checkUntil: "", error: "" },
      },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    throw Response.badRequest("This domain is in use by another account");
  }
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

/** Keeps removed domains' valid certificates for their tenant to reuse. */
async function archiveCertificates(domains: WithId<TDomain>[]) {
  const now = new Date();
  for (const d of domains) {
    if (!d.certificate || d.certificate.notAfter <= now) continue;
    await certificateArchiveModel.updateOne({ _id: d.hostname }, {
      $set: { tenant: d.tenant, certificate: d.certificate, archivedAt: now },
    }, { upsert: true });
  }
}

/** A kept certificate for this tenant's hostname, taken out of the archive. */
async function archivedCertificate(domain: WithId<TDomain>, now: Date) {
  const kept = await certificateArchiveModel.findOneAndDelete({
    _id: domain.hostname,
    tenant: domain.tenant,
  });
  return kept && now < renewAt(kept.certificate) ? kept.certificate : null;
}

export async function removeDomain(tenant: ObjectId, id: ObjectId) {
  const domain = await domainModel.findOneAndDelete({ _id: id, tenant });
  if (!domain) throw Response.notFound("Domain not found");
  await archiveCertificates([domain]);
  // A free test domain never took a place in the plan's quota.
  if (!domain.appDomain) await quotaGuard.release(tenant, "domains");
}

/** With its project: frees each domain's quota, keeps its certificate. */
export async function removeProjectDomains(
  tenant: ObjectId,
  project: ObjectId,
) {
  const domains = await domainModel.find({ tenant, project }).toArray();
  if (!domains.length) return;
  const { deletedCount } = await domainModel.deleteMany({
    _id: { $in: domains.map((d) => d._id) },
  });
  await archiveCertificates(domains);
  const counted = deletedCount - domains.filter((d) => d.appDomain).length;
  for (let i = 0; i < counted; i++) {
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

  const first = domain.status === "issuing";
  // A first certificate needn't be ordered when one is still good: its own
  // (checked again after a failure) or one its tenant had for the hostname.
  const kept = first
    ? domain.certificate && now < renewAt(domain.certificate)
      ? domain.certificate
      : await archivedCertificate(domain, now)
    : null;
  const orders = kept ? recent : [...recent, now];
  try {
    const certificate = kept ??
      await orderCertificate(domain.hostname, domain.tenant);
    await domainModel.updateOne({ _id: id }, {
      $set: {
        // A first certificate is live once it answers over HTTPS.
        status: first ? "verifying" : "active",
        certificate,
        issueAt: renewAt(certificate),
        issueFailures: 0,
        issueOrders: orders,
        updatedAt: new Date(),
        ...(first
          ? {
            nextCheckAt: new Date(now.getTime() + VERIFY_EVERY_MS),
            checkUntil: new Date(now.getTime() + VERIFY_WINDOW_MS),
          }
          : {}),
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

/** Swapped in tests: whether `https://<hostname>` answers with its certificate. */
export const liveCheck = {
  answers: async (hostname: string) => {
    // Any response means TLS worked: the certificate is the one served.
    const res = await fetch(`https://${hostname}/`, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    await res.body?.cancel();
  },
};

/**
 * One check of a domain that's `verifying`: live once `https://<hostname>`
 * answers through Traefik with its new certificate. Retried every 30 s for
 * 10 minutes, then it fails with why; "Check now" tries again without a new
 * order.
 */
export async function verifyOnce(domain: WithId<TDomain>, now = new Date()) {
  const filter = { _id: domain._id, status: "verifying" as const };
  try {
    await liveCheck.answers(domain.hostname);
    await domainModel.updateOne(filter, {
      $set: { status: "active", updatedAt: now },
      $unset: { nextCheckAt: "", checkUntil: "", error: "" },
    });
  } catch (error) {
    const message = String((error as Error)?.message ?? error).slice(0, 300);
    const expired = !domain.checkUntil || now >= domain.checkUntil;
    await domainModel.updateOne(
      filter,
      expired
        ? {
          $set: {
            status: "failed",
            error: `https://${domain.hostname} doesn't answer: ${message}`,
            updatedAt: now,
          },
          $unset: { nextCheckAt: "", checkUntil: "" },
        }
        : {
          $set: {
            nextCheckAt: new Date(now.getTime() + VERIFY_EVERY_MS),
            updatedAt: now,
          },
        },
    );
  }
}

/** Verifies the domains that are due, a bounded batch per run. */
export async function verifyDue(now = new Date()) {
  const due = await domainModel.find(
    { status: "verifying", nextCheckAt: { $lte: now } },
    { limit: CHECK_BATCH, sort: { nextCheckAt: 1 } },
  ).toArray();
  await Promise.all(due.map((d) => verifyOnce(d, now)));
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
    await verifyDue();
    await ensureAppCertificate();
  },
);
