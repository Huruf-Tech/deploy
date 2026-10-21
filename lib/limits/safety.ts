import { readFlagSetting, readNumberSetting } from "@/lib/core/settings.ts";

/** Platform safety limits (PLAN §20.3 B). Admin-only, stored in `envs`; never set them in `.env`. */
export const SAFETY_LIMITS = {
  SAFETY_TENANTS_OWNED_PER_USER: 3,
  SAFETY_PENDING_SERVERS_PER_TENANT: 5,
  SAFETY_HELLO_PER_IP_PER_MIN: 10,
  SAFETY_SSH_BOOTSTRAPS_PER_TENANT_PER_HOUR: 10,
  SAFETY_MIN_POLL_INTERVAL_MS: 250,
  SAFETY_EVENT_BATCH_MAX_KB: 256,
  SAFETY_STREAM_BYTES_PER_SEC: 64 * 1024,
  SAFETY_PENDING_COMMANDS_PER_SERVER: 100,
  SAFETY_API_REQUESTS_PER_USER_PER_MIN: 600,
  SAFETY_TERMINAL_IDLE_MIN: 15,
  SAFETY_TERMINAL_MAX_HOURS: 4,
  SAFETY_STREAM_IDLE_SEC: 30,
  SAFETY_BUILD_TIMEOUT_MIN: 30,
  ALERT_AGENT_OFFLINE_GRACE_SEC: 20,
  PLAN_OVERLIMIT_GRACE_DAYS: 3,
};

export const safetyLimit = (key: keyof typeof SAFETY_LIMITS) =>
  readNumberSetting(key, SAFETY_LIMITS[key]);

/** Safety flags; all off by default. */
export const safetyFlag = (
  key: "SAFETY_ALLOW_UNVERIFIED_EMAIL" | "SAFETY_SSH_ALLOW_PRIVATE_TARGETS",
) => readFlagSetting(key);
