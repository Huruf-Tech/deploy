import { cache } from "@/core/utils/cache.ts";
import { Env } from "@/core/utils/env.ts";

/*
 * Admin-adjustable settings, cached 60 s per instance (PLAN §20.3).
 * `Env.get` falls back to an uncached `envs` query on every call, so request
 * paths must read settings through here, never through `Env` directly.
 */

export const readNumberSetting = cache(
  async (key: string, fallback: number) => {
    const value = await Env.number(key);
    return Number.isFinite(value) ? value : fallback;
  },
  60_000,
);

/** Flags are off unless set, so name them so that off is the safe default. */
export const readFlagSetting = cache(
  (key: string) => Env.enabled(key),
  60_000,
);
