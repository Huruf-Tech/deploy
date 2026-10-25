import * as acme from "acme-client";
import { MongoServerError, type ObjectId } from "mongodb";
import { keyring } from "@/lib/services.ts";
import { readTextSetting } from "@/lib/core/settings.ts";
import { PLATFORM_OWNER } from "@/schemas/monitoring/alert.ts";
import {
  acmeAccountModel,
  acmeChallengeModel,
} from "@/schemas/applications/domain.ts";

/**
 * Let's Encrypt with the HTTP challenge (PLAN §14): the control plane orders,
 * answers from MongoDB through whichever instance Let's Encrypt reaches.
 * Tests (against Pebble) skip the self-check, which needs a real domain.
 */
export const acmeOptions = { selfCheck: true };

const PLATFORM = { kind: "tenant" as const, ref: PLATFORM_OWNER };

const directory = () =>
  readTextSetting("ACME_DIRECTORY", acme.directory.letsencrypt.production);

async function account(
  directoryUrl: string,
): Promise<{ key: string; url?: string }> {
  const context = `acme:${directoryUrl}`;
  const found = await acmeAccountModel.findOne({ _id: directoryUrl });
  if (found) {
    return {
      key: await keyring.decrypt(PLATFORM, found.keyEnc, context),
      url: found.url,
    };
  }

  const key = (await acme.crypto.createPrivateEcdsaKey()).toString();
  try {
    await acmeAccountModel.insertOne({
      _id: directoryUrl,
      keyEnc: await keyring.encrypt(PLATFORM, key, context),
      createdAt: new Date(),
    });
    return { key };
  } catch (error) {
    // Another instance created it first: use theirs.
    if (!(error instanceof MongoServerError && error.code === 11000)) {
      throw error;
    }
    return await account(directoryUrl);
  }
}

/** What Let's Encrypt fetches at `/.well-known/acme-challenge/<token>`. */
export async function challengeAnswer(token: string) {
  const found = await acmeChallengeModel.findOne({ _id: token });
  return found?.keyAuthorization;
}

/** Orders a certificate for one hostname; throws Let's Encrypt's error. */
export async function orderCertificate(hostname: string, tenant: ObjectId) {
  const directoryUrl = await directory();
  const { key: accountKey, url: accountUrl } = await account(directoryUrl);
  const client = new acme.Client({ directoryUrl, accountKey, accountUrl });
  const email = await readTextSetting("ACME_EMAIL", "");
  if (!accountUrl) {
    // Registered once; later orders skip straight to the order.
    try {
      await client.createAccount({
        termsOfServiceAgreed: true,
        ...(email ? { contact: [`mailto:${email}`] } : {}),
      });
    } catch (error) {
      // Registered before but the URL wasn't saved: the library follows up
      // with an update some servers refuse, but it knows the URL by then.
      try {
        client.getAccountUrl();
      } catch {
        throw error;
      }
    }
    await acmeAccountModel.updateOne({ _id: directoryUrl }, {
      $set: { url: client.getAccountUrl() },
    });
  }
  const [key, csr] = await acme.crypto.createCsr(
    { altNames: [hostname] },
    await acme.crypto.createPrivateEcdsaKey(),
  );

  const pem = await client.auto({
    csr,
    challengePriority: ["http-01"],
    skipChallengeVerification: !acmeOptions.selfCheck,
    challengeCreateFn: async (_authz, challenge, keyAuthorization) => {
      await acmeChallengeModel.updateOne({ _id: challenge.token }, {
        $set: {
          keyAuthorization,
          expiresAt: new Date(Date.now() + 60 * 60_000),
        },
      }, { upsert: true });
    },
    challengeRemoveFn: async (_authz, challenge) => {
      await acmeChallengeModel.deleteOne({ _id: challenge.token });
    },
  });

  const { notAfter } = acme.crypto.readCertificateInfo(pem);
  return {
    pem,
    keyEnc: await keyring.encrypt(
      { kind: "tenant", ref: tenant },
      key.toString(),
      `certificate:${hostname}`,
    ),
    notAfter,
    issuedAt: new Date(),
  };
}
