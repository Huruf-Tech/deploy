import type { ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { platformTenantId } from "@/lib/billing/platform.ts";

/**
 * The version of the consent a renter gives before using a community machine
 * (PLAN §30.4): the wording the dashboard shows. Bump it with the dashboard's
 * `COMMUNITY_CONSENT_VERSION` whenever that wording changes, so each rental
 * records the text its renter agreed to and an older page can't be accepted.
 */
export const COMMUNITY_CONSENT_VERSION = "2026-10-28";

/** A machine of the community, not Huruf's own. */
export async function isCommunity(owner: ObjectId) {
  const platform = await platformTenantId();
  return !platform || !owner.equals(platform);
}

/**
 * The renter's consent for a community machine, to record on the rental:
 * refused unless they accepted the current version.
 */
export function communityConsent(version?: string) {
  if (version !== COMMUNITY_CONSENT_VERSION) {
    throw Response.badRequest(
      "Read and accept the current terms for community machines: its owner can access your data, and you answer for its leak or loss",
    );
  }
  return { at: new Date(), version };
}
