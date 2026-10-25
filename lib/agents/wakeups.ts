import type { ChangeStream } from "mongodb";
import { mongodb } from "@/database.ts";
import { Logger } from "@/core/utils/logger.ts";

/**
 * Long polling (PLAN Phase 13, D44): requests held until there's something
 * for them, keyed by server (agent polls) or stream session (browser reads).
 *
 * A waiter is registered *before* its request checks for work, so a wake
 * between the check and the wait isn't lost. Writes on this instance wake
 * directly; one change stream per instance carries writes made elsewhere.
 */
export class Wakeups {
  private readonly waiting = new Map<string, Set<() => void>>();

  /** Resolves `true` when woken, `false` after `ms`; call `cancel` if unused. */
  register(key: string) {
    let done!: (woken: boolean) => void;
    const promise = new Promise<boolean>((resolve) => (done = resolve));
    const wake = () => done(true);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cancel = () => {
      clearTimeout(timer);
      const set = this.waiting.get(key);
      set?.delete(wake);
      if (set && !set.size) this.waiting.delete(key);
    };
    (this.waiting.get(key) ?? this.waiting.set(key, new Set()).get(key)!)
      .add(wake);
    watch();
    return {
      /** Waits up to `ms`; always unregisters. */
      wait: async (ms: number) => {
        timer = setTimeout(() => done(false), ms);
        try {
          return await promise;
        } finally {
          cancel();
        }
      },
      cancel,
    };
  }

  wake(key: string) {
    for (const wake of this.waiting.get(key) ?? []) wake();
  }

  get size() {
    return this.waiting.size;
  }
}

export const serverWakeups = new Wakeups();
export const sessionWakeups = new Wakeups();

let stream: ChangeStream | undefined;
let retryAt = 0;

/**
 * One change stream per instance, opened with the first waiter: new commands,
 * desired states, terminal input and stream output. It watches the documents
 * themselves (not the lease counters, bumped before them), so a woken poll
 * always finds what woke it.
 * Without change streams (no replica set) this instance's own writes still
 * wake its waiters; only cross-instance wakes wait for the timeout.
 */
function watch() {
  if (stream || Date.now() < retryAt) return;
  try {
    stream = mongodb.db().watch([
      {
        $match: {
          $or: [
            { "ns.coll": "agentCommands", operationType: "insert" },
            {
              "ns.coll": "serverSpecs",
              operationType: { $in: ["insert", "update", "replace"] },
            },
            { "ns.coll": "streamInputs", operationType: "insert" },
            { "ns.coll": "streamChunks", operationType: "insert" },
          ],
        },
      },
      {
        $project: {
          "ns.coll": 1,
          documentKey: 1,
          "fullDocument.server": 1,
          "fullDocument.session": 1,
        },
      },
    ]);
  } catch (error) {
    fail(error);
    return;
  }
  stream.on("change", (change) => {
    const c = change as unknown as {
      ns: { coll: string };
      documentKey: { _id: unknown };
      fullDocument?: { server?: unknown; session?: unknown };
    };
    if (c.ns.coll === "serverSpecs") {
      serverWakeups.wake(String(c.documentKey._id));
    } else if (c.ns.coll === "streamChunks") {
      sessionWakeups.wake(String(c.fullDocument?.session));
    } else serverWakeups.wake(String(c.fullDocument?.server));
  });
  stream.on("error", fail);
}

function fail(error: unknown) {
  Logger.warn(
    "Long polling: change stream unavailable, retrying in 30 s",
    error,
  );
  stream?.close().catch(() => {});
  stream = undefined;
  retryAt = Date.now() + 30_000;
}

/** For tests and shutdown. */
export async function stopWatching() {
  await stream?.close().catch(() => {});
  stream = undefined;
}
