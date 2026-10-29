import { ObjectId } from "mongodb";
import { encodeHex } from "@std/encoding/hex";
import { isDuplicateKeyError } from "@/database.ts";
import { Response } from "@/core/http/response.ts";
import { Logger } from "@/core/utils/logger.ts";
import { readTextSetting } from "@/lib/core/settings.ts";
import { getProject } from "@/lib/deploy/projects.ts";
import { refreshSpecs } from "@/lib/deploy/specs.ts";
import { orderCertificate } from "@/lib/domains/acme.ts";
import {
  cloudflareDnsChallenge,
  ensureWildcardRecord,
} from "@/lib/domains/cloudflare.ts";
import { PLATFORM_OWNER } from "@/schemas/monitoring/alert.ts";
import {
  appCertificateModel,
  domainModel,
} from "@/schemas/applications/domain.ts";

/**
 * Free test domains (PLAN §14): a project gets `<name>-<random>.<APP_DOMAIN>`,
 * live at once over HTTPS with the platform's wildcard certificate. A domain
 * of its own, never the platform's: its apps can't reach the platform's
 * cookies or reputation. Off until `APP_DOMAIN` is set.
 */

/** The domain free test domains live under; empty: the feature is off. */
export const appDomain = async () =>
  (await readTextSetting("APP_DOMAIN", "")).toLowerCase()
    .replace(/^[.*]+|\.+$/g, "");

/** Words a test address may not carry: they'd make phishing look official. */
const RESERVED =
  /huruf|login|signin|sign-in|admin|account|billing|pay|bank|verify|secure|support|wallet|password|auth|oauth/;

/** `<project>-<6 hex>.<domain>`: the name from the project, never chosen. */
export function appHostname(project: string, domain: string) {
  let slug = project.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "").slice(0, 20).replace(/-+$/, "");
  if (!slug || RESERVED.test(slug)) slug = "app";
  const suffix = encodeHex(crypto.getRandomValues(new Uint8Array(3)));
  return `${slug}-${suffix}.${domain}`;
}

/** A project's free test domain: one each, live at once. */
export async function addAppDomain(
  tenant: ObjectId,
  user: ObjectId,
  projectId: ObjectId,
) {
  const domain = await appDomain();
  if (!domain) {
    throw Response.badRequest("Free test domains aren't available here");
  }
  const project = await getProject(tenant, projectId);
  const now = new Date();
  for (let attempt = 0; attempt < 3; attempt++) {
    const _id = new ObjectId();
    try {
      await domainModel.insertOne({
        _id,
        tenant,
        project: projectId,
        hostname: appHostname(project.name, domain),
        token: encodeHex(crypto.getRandomValues(new Uint8Array(16))),
        status: "active",
        appDomain: true,
        verifiedAt: now,
        createdBy: user,
        createdAt: now,
        updatedAt: now,
      });
      // Servers set up before the tunnels were configured get them now.
      if (project.placedOn.length) await refreshSpecs(project.placedOn);
      return _id;
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      if (await domainModel.findOne({ project: projectId, appDomain: true })) {
        throw Response.badRequest("This project already has a test domain");
      }
      // The random part was taken: another one.
    }
  }
  throw Response.badRequest("Could not pick a free name: try again");
}

const HOUR = 60 * 60_000;
const RENEW_BEFORE_MS = 30 * 24 * HOUR;

/**
 * Keeps `*.<APP_DOMAIN>` certified: points it at the ingress if it doesn't,
 * and orders the wildcard certificate (DNS challenge in the platform's
 * Cloudflare zone, `APP_DOMAIN_CLOUDFLARE_TOKEN`) when it's missing or 30
 * days from expiry. A failure backs off up to an hour. Runs with the domain
 * jobs, one instance at a time.
 */
export async function ensureAppCertificate(now = new Date()) {
  const [domain, token] = await Promise.all([
    appDomain(),
    readTextSetting("APP_DOMAIN_CLOUDFLARE_TOKEN", ""),
  ]);
  if (!domain || !token) return;
  const doc = await appCertificateModel.findOne({ _id: domain });
  if (doc && doc.renewAt > now) return;
  try {
    await ensureWildcardRecord(token, domain);
    const certificate = await orderCertificate(
      `*.${domain}`,
      PLATFORM_OWNER,
      cloudflareDnsChallenge(token),
    );
    await appCertificateModel.updateOne({ _id: domain }, {
      $set: {
        ...certificate,
        renewAt: new Date(
          certificate.notAfter.getTime() -
            Math.min(
              RENEW_BEFORE_MS,
              (certificate.notAfter.getTime() -
                certificate.issuedAt.getTime()) / 3,
            ),
        ),
        failures: 0,
      },
      $unset: { error: "" },
    }, { upsert: true });
  } catch (error) {
    const failures = (doc?.failures ?? 0) + 1;
    const message = String((error as Error)?.message ?? error).slice(0, 450);
    Logger.error(`Test domain certificate (*.${domain}) failed`, error);
    await appCertificateModel.updateOne({ _id: domain }, {
      $set: {
        failures,
        error: message,
        renewAt: new Date(
          now.getTime() + Math.min(2 ** failures * 60_000, HOUR),
        ),
      },
    }, { upsert: true });
  }
}
