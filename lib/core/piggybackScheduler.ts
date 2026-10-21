import type { Collection } from "mongodb";
import { Logger } from "@/core/utils/logger.ts";

export type TSchedulerSlot = { _id: number; nextRunAt: Date };

/**
 * "Due in memory → claim atomically → bounded work" (PLAN §3.4, §23.2), the
 * no-cron way to run periodic work on serverless: ordinary requests call
 * `tick`, which touches the database only when a slot looks due. One request
 * wins each claim; losers just learn to wait another interval.
 */
export class PiggybackScheduler {
  private readonly nextRunAt: number[];

  constructor(
    private readonly slots: Pick<
      Collection<TSchedulerSlot>,
      "findOneAndUpdate"
    >,
    private readonly opts: { slotCount: number; intervalMs: number },
    private readonly work: (slot: number) => Promise<void>,
  ) {
    this.nextRunAt = new Array(opts.slotCount).fill(0);
  }

  /** Never throws: a failed sweep must not fail the request hosting it. */
  async tick(slot: number) {
    const now = Date.now();
    if (now < this.nextRunAt[slot]) return;

    // Set before the await so concurrent requests on this instance don't all claim.
    this.nextRunAt[slot] = now + this.opts.intervalMs;

    try {
      const claimed = await this.slots.findOneAndUpdate(
        { _id: slot, nextRunAt: { $lte: new Date(now) } },
        { $set: { nextRunAt: new Date(now + this.opts.intervalMs) } },
        { projection: { _id: 1 } },
      );
      if (claimed) await this.work(slot);
    } catch (error) {
      Logger.error(`Piggyback slot ${slot} failed`, error);
    }
  }

  tickRandom() {
    return this.tick(Math.floor(Math.random() * this.opts.slotCount));
  }
}
