import z from "zod";
import { mongodb } from "@/database.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";

export const resourceGrantSchema = z.record(z.string(), z.array(z.string()));

/**
 * Rotation state for one signed-in session (one `sid`).
 *
 * Refresh tokens rotate per session rather than per consent. A single counter
 * on the consent cannot work, because `uniqueConsentPerClient` gives a user
 * exactly one consent per client: every device would share the counter, and
 * whichever refreshed first would invalidate all the others.
 */
export const oauthConsentSessionSchema = z.object({
  /**
   * Current rotation version, or `0` for a revoked session.
   *
   * `0` is a tombstone, not a live version. Erasing the entry instead would
   * let a revoked refresh token through: with no entry, the token looks like
   * the first use of a session and gets adopted. Issued tokens always carry
   * a version of 1 or more, so a tombstone matches nothing — only a fresh
   * trip through `/oauth/authorize` can revive the session.
   */
  version: z.number(),

  /** When the previous version was superseded; drives the grace window. */
  rotatedAt: z.coerce.date().optional(),

  /** Set alongside `version: 0`, for an audit trail. */
  revokedAt: z.coerce.date().optional(),
});

export const oauthConsentSchema = z.object({
  client: $objectId,
  scopes: z.array(z.string().min(1).max(255)),
  resourceGrant: resourceGrantSchema,

  /**
   * Per-session rotation state, keyed by the encoded `sid`
   * (see `OAuth2.sessionKey`). Absent on consents created before per-session
   * rotation existed — those fall back to `version` once, then adopt a
   * session entry.
   */
  sessions: z.record(z.string(), oauthConsentSessionSchema).optional(),

  /**
   * Legacy consent-wide counter. Still written into new authorization codes
   * as the starting point for a session that has no entry yet, but it is no
   * longer incremented on refresh.
   */
  version: z.number().default(1),
  createdBy: $objectId,
  createdAt: z.date().optional().default(() => new Date()),
});

export const oauthConsentModel = mongodb.db().collection<
  z.infer<typeof oauthConsentSchema>
>("oauthConsents");
