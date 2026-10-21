import { ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { BoundedCache } from "@/lib/core/boundedCache.ts";
import { entitlements } from "@/lib/services.ts";
import { safetyLimit } from "@/lib/limits/safety.ts";
import { issueCommand } from "@/lib/agents/commands.ts";
import type { TAgentIdentity } from "@/lib/agents/agentAuth.ts";
import {
  streamChunkModel,
  streamSessionModel,
  type TStreamSession,
} from "@/schemas/infrastructure/stream.ts";
import type { $streamChunkEvent } from "@/schemas/protocol/agent.ts";
import type z from "zod";

const SESSION_MAX_MS = 60 * 60_000;
const CHUNK_TTL_MS = 2 * 60_000;
/** A closed session lingers as long as its last chunks, then TTL removes both (PLAN §3.5). */
const closedExpiry = () => new Date(Date.now() + CHUNK_TTL_MS);
const READ_LIMIT = 500;
const TOUCH_EVERY_MS = 10_000;

/** Session owners never change, so reads skip the session lookup (PLAN §20.4). */
const owners = new BoundedCache<string, { tenant: string; server: string }>({
  maxEntries: 20_000,
  ttlMs: 10 * 60_000,
});
/** Last `lastReadAt` write per session: readers poll every second, we write every 10 s. */
const touched = new BoundedCache<string, number>({
  maxEntries: 20_000,
  ttlMs: 60_000,
});

export const openStream = async (opts: {
  tenant: ObjectId;
  server: ObjectId;
  user: ObjectId;
  kind: TStreamSession["kind"];
  params: Record<string, unknown>;
}) => {
  const now = new Date();
  const idleMs = (await safetyLimit("SAFETY_STREAM_IDLE_SEC")) * 1000;

  const { limits } = await entitlements.resolve(opts.tenant);
  const open = await streamSessionModel.countDocuments({
    tenant: opts.tenant,
    status: "open",
    lastReadAt: { $gt: new Date(now.getTime() - idleMs) },
  });
  if (open >= limits.concurrentStreams) {
    throw Response.forbidden(
      `Your plan allows ${limits.concurrentStreams} live views at a time; close one first`,
    );
  }

  const { insertedId } = await streamSessionModel.insertOne({
    tenant: opts.tenant,
    server: opts.server,
    kind: opts.kind,
    params: opts.params,
    status: "open",
    createdBy: opts.user,
    createdAt: now,
    lastReadAt: now,
    expiresAt: new Date(now.getTime() + SESSION_MAX_MS),
  });

  await issueCommand({
    server: opts.server,
    tenant: opts.tenant,
    type: "stream.open",
    createdBy: opts.user,
    payload: {
      session: insertedId.toHexString(),
      kind: opts.kind,
      params: opts.params,
      maxBytesPerSec: await safetyLimit("SAFETY_STREAM_BYTES_PER_SEC"),
    },
  });

  return insertedId;
};

/** `GET /streams/api/:id/chunks?after=` — one indexed range read in the common case. */
export const readStream = async (
  session: ObjectId,
  tenant: ObjectId,
  after: number,
) => {
  const key = session.toHexString();
  let owner = owners.get(key);
  if (!owner) {
    const doc = await streamSessionModel.findOne(
      { _id: session },
      { projection: { tenant: 1, server: 1 } },
    );
    if (!doc) throw Response.notFound("Unknown stream");
    owner = {
      tenant: doc.tenant.toHexString(),
      server: doc.server.toHexString(),
    };
    owners.set(key, owner);
  }
  if (owner.tenant !== tenant.toHexString()) {
    throw Response.notFound("Unknown stream");
  }

  const now = Date.now();
  if (now - (touched.get(key) ?? 0) > TOUCH_EVERY_MS) {
    touched.set(key, now);
    await streamSessionModel.updateOne({ _id: session }, {
      $set: { lastReadAt: new Date(now) },
    });
  }

  const chunks = await streamChunkModel
    .find({ session, seq: { $gt: after } }, {
      sort: { seq: 1 },
      limit: READ_LIMIT,
      projection: { _id: 0, seq: 1, data: 1, done: 1, error: 1 },
    })
    .toArray();

  return { chunks };
};

export const closeStream = async (session: ObjectId, tenant: ObjectId) => {
  const doc = await streamSessionModel.findOneAndUpdate(
    { _id: session, tenant, status: "open" },
    {
      $set: {
        status: "closed",
        closedReason: "closed",
        expiresAt: closedExpiry(),
      },
    },
    { projection: { server: 1 } },
  );
  if (!doc) return;

  await issueCommand({
    server: doc.server,
    tenant,
    type: "stream.close",
    payload: { session: session.toHexString() },
  }).catch(() => {}); // An offline server stops the stream on its own when it reconnects.
};

/**
 * Stores chunks from an agent and tells it which sessions to stop: closed,
 * unwatched for SAFETY_STREAM_IDLE_SEC, or not its own.
 */
export const ingestChunks = async (
  identity: TAgentIdentity,
  events: z.output<typeof $streamChunkEvent>[],
) => {
  if (!events.length) return { applied: 0, close: [] as string[] };

  const now = new Date();
  const idleMs = (await safetyLimit("SAFETY_STREAM_IDLE_SEC")) * 1000;
  const ids = [...new Set(events.map((e) => e.data.session))]
    .filter(ObjectId.isValid)
    .map((id) => ObjectId.createFromHexString(id));

  const sessions = await streamSessionModel
    .find({ _id: { $in: ids } }, {
      projection: { server: 1, status: 1, lastReadAt: 1 },
    })
    .toArray();
  const live = new Set(
    sessions
      .filter((s) =>
        s.server.equals(identity.server) && s.status === "open" &&
        now.getTime() - s.lastReadAt.getTime() < idleMs
      )
      .map((s) => s._id.toHexString()),
  );

  const accepted = events.filter((e) => live.has(e.data.session));
  // Keepalives (empty, from silent streams) only prove liveness; they are not stored.
  const stored = accepted.filter((e) =>
    e.data.data || e.data.done || e.data.error
  );
  if (stored.length) {
    await streamChunkModel.insertMany(
      stored.map((e) => ({
        session: ObjectId.createFromHexString(e.data.session),
        seq: e.data.seq,
        data: e.data.data,
        done: e.data.done,
        error: e.data.error,
        expiresAt: new Date(now.getTime() + CHUNK_TTL_MS),
      })),
      { ordered: false },
    ).catch((error) => {
      // Retried batches hit the unique (session, seq) index: already stored.
      if (error?.code !== 11000 && !error?.writeErrors) throw error;
    });
  }

  const finished = accepted.filter((e) => e.data.done).map((e) =>
    e.data.session
  );
  const stop = ids
    .map((id) => id.toHexString())
    .filter((id) => !live.has(id) || finished.includes(id));

  const idle = sessions
    .filter((s) => s.status === "open" && !live.has(s._id.toHexString()))
    .map((s) => s._id);
  if (idle.length || finished.length) {
    await streamSessionModel.bulkWrite([
      ...idle.map((_id) => ({
        updateOne: {
          filter: { _id, status: "open" as const },
          update: {
            $set: {
              status: "closed" as const,
              closedReason: "idle",
              expiresAt: closedExpiry(),
            },
          },
        },
      })),
      ...finished.map((id) => ({
        updateOne: {
          filter: {
            _id: ObjectId.createFromHexString(id),
            status: "open" as const,
          },
          update: {
            $set: {
              status: "closed" as const,
              closedReason: "done",
              expiresAt: closedExpiry(),
            },
          },
        },
      })),
    ], { ordered: false });
  }

  return { applied: accepted.length, close: stop };
};
