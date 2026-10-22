import { Mailer } from "@/plugins/Huruf-Tech/thunder-core/lib/mailer.ts";
import { isPublicAddress } from "@/lib/agents/addresses.ts";

/** Each channel gets this long per attempt (PLAN §3.4: a strict per-item timeout). */
export const CHANNEL_TIMEOUT_MS = 5_000;

export type TNotice = {
  subject: string;
  text: string;
  payload: Record<string, unknown>;
};

/**
 * Webhook URLs are user input fetched by the control plane: https only, and
 * every address the name resolves to must be public (SSRF guard).
 * ponytail: resolved once before the fetch, so DNS rebinding is possible; pin the address if it matters.
 */
export async function assertPublicUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Enter a valid URL");
  }
  if (url.protocol !== "https:") throw new Error("Webhooks must use https://");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const literal = /^[\d.]+$/.test(host) || host.includes(":");
  const addresses = literal ? [host] : await resolve(host);
  if (!addresses.length || !addresses.every(isPublicAddress)) {
    throw new Error("The webhook's address must be public");
  }
  return url;
}

const resolve = async (host: string) => {
  const lookups = await Promise.allSettled([
    Deno.resolveDns(host, "A"),
    Deno.resolveDns(host, "AAAA"),
  ]);
  return lookups.flatMap((r) => r.status === "fulfilled" ? r.value : []);
};

/** Shown instead of a webhook URL: its tokens are secrets. */
export const maskUrl = (raw: string) => {
  const url = new URL(raw);
  return `${url.protocol}//${url.host}/…${raw.slice(-4)}`;
};

const timeout = <T>(work: Promise<T>) =>
  Promise.race([
    work,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Timed out")),
        CHANNEL_TIMEOUT_MS,
      )
    ),
  ]);

async function post(url: string, body: unknown) {
  await assertPublicUrl(url);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    redirect: "manual",
    signal: AbortSignal.timeout(CHANNEL_TIMEOUT_MS),
  });
  await response.body?.cancel();
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

/** Sends one notice to one channel; throws why it didn't arrive. */
export function send(
  channel: { type: "email" | "webhook" | "slack"; target: string },
  notice: TNotice,
) {
  switch (channel.type) {
    case "email":
      return timeout(
        Mailer.send({
          to: channel.target,
          subject: notice.subject,
          text: notice.text,
        }),
      );
    case "slack":
      return post(channel.target, { text: notice.text });
    case "webhook":
      return post(channel.target, { ...notice.payload, text: notice.text });
  }
}
