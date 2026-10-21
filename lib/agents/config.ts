import { cache } from "@/core/utils/cache.ts";
import { createHashSync, SupportedHashAlg } from "@/core/utils/hash.ts";
import { readNumberSetting } from "@/lib/core/settings.ts";
import { safetyLimit } from "@/lib/limits/safety.ts";
import type { TAgentConfig } from "@/schemas/protocol/agent.ts";

/**
 * Agent runtime config (PLAN §3.2): decided by the control plane, never
 * hardcoded in agents. Admin-adjustable through `envs` like safety limits.
 */
export const AGENT_CONFIG_DEFAULTS = {
  AGENT_POLL_IDLE_MS: 5_000,
  AGENT_POLL_ACTIVE_MS: 1_000,
  AGENT_POLL_TERMINAL_MS: 300,
  AGENT_POLL_JITTER_PERCENT: 20,
  AGENT_SUMMARY_INTERVAL_MS: 60_000,
  AGENT_MAX_BACKOFF_MS: 60_000,
};

const setting = (key: keyof typeof AGENT_CONFIG_DEFAULTS) =>
  readNumberSetting(key, AGENT_CONFIG_DEFAULTS[key]);

/** Resolved config plus its version; agents refetch when the version changes. */
export const getAgentConfig = cache(async () => {
  const minPoll = await safetyLimit("SAFETY_MIN_POLL_INTERVAL_MS");
  const terminalMs = Math.max(minPoll, await setting("AGENT_POLL_TERMINAL_MS"));
  const activeMs = Math.max(terminalMs, await setting("AGENT_POLL_ACTIVE_MS"));
  const idleMs = Math.max(activeMs, await setting("AGENT_POLL_IDLE_MS"));

  const config: TAgentConfig = {
    poll: { idleMs, activeMs, terminalMs },
    jitterPercent: Math.min(
      50,
      Math.max(0, await setting("AGENT_POLL_JITTER_PERCENT")),
    ),
    summaryIntervalMs: await setting("AGENT_SUMMARY_INTERVAL_MS"),
    maxBackoffMs: await setting("AGENT_MAX_BACKOFF_MS"),
  };

  return {
    config,
    version: createHashSync(SupportedHashAlg.SHA_1, JSON.stringify(config))
      .slice(0, 12),
    /** Two idle intervals, so one lost or late poll never marks a server offline. */
    leaseMs: idleMs * 2,
  };
}, 5_000);
