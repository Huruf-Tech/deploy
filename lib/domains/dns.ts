import { readTextSetting } from "@/lib/core/settings.ts";

/**
 * DNS checks for custom domains (PLAN §14): plain lookups through the
 * system resolver, no third-party API. Tests replace `resolver`.
 */
export const resolver = {
  txt: async (name: string) =>
    (await Deno.resolveDns(name, "TXT")).map((parts) => parts.join("")),
  a: (name: string) => Deno.resolveDns(name, "A"),
};

const lookup = async <T>(fn: () => Promise<T[]>): Promise<T[]> => {
  try {
    return await fn();
  } catch {
    return []; // NXDOMAIN, no records, timeout: nothing there (yet)
  }
};

export const OWNERSHIP_PREFIX = "huruf-verify=";
export const ownershipName = (hostname: string) => `_huruf.${hostname}`;

/** Where users point their domains: CNAME target and A record IPs. */
export async function ingressTargets() {
  const hostname = (await readTextSetting("INGRESS_HOSTNAME", "")).trim()
    .toLowerCase();
  const ipv4 = (await readTextSetting("INGRESS_IPV4", ""))
    .split(",").map((ip) => ip.trim()).filter(Boolean);
  return { hostname, ipv4 };
}

// Cloudflare's proxy ranges (cloudflare.com/ips-v4): a proxied record hides
// where it really points.
const CLOUDFLARE = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
];

const toInt = (ip: string) =>
  ip.split(".").reduce((n, part) => (n << 8) + Number(part), 0) >>> 0;

export const inCidr = (ip: string, cidr: string) => {
  const [base, bits] = cidr.split("/");
  const mask = bits === "0" ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return (toInt(ip) & mask) === (toInt(base) & mask);
};

export type TCheck = { ownership: boolean; dns: boolean; detail?: string };

/** Both checks a domain needs before it gets a certificate. */
export async function checkDomain(
  hostname: string,
  token: string,
): Promise<TCheck> {
  const targets = await ingressTargets();
  if (!targets.hostname && !targets.ipv4.length) {
    return {
      ownership: false,
      dns: false,
      detail:
        "The platform's ingress isn't configured yet (INGRESS_HOSTNAME or INGRESS_IPV4): ask the platform admin.",
    };
  }

  const [txt, ips, ingressIps] = await Promise.all([
    lookup(() => resolver.txt(ownershipName(hostname))),
    lookup(() => resolver.a(hostname)),
    targets.hostname
      ? lookup(() => resolver.a(targets.hostname))
      : Promise.resolve([]),
  ]);

  const ownership = txt.some((value) =>
    value.trim() === `${OWNERSHIP_PREFIX}${token}`
  );
  const allowed = new Set([...targets.ipv4, ...ingressIps]);
  const dns = ips.length > 0 && ips.every((ip) => allowed.has(ip));

  const problems: string[] = [];
  if (!ownership) {
    problems.push(
      `Add a TXT record ${
        ownershipName(hostname)
      } with the value ${OWNERSHIP_PREFIX}${token}.`,
    );
  }
  if (!dns) {
    if (!ips.length) {
      problems.push(`${hostname} doesn't resolve yet.`);
    } else if (ips.some((ip) => CLOUDFLARE.some((c) => inCidr(ip, c)))) {
      problems.push(
        `${hostname} is proxied by Cloudflare (orange cloud), which hides where it points: set its record to "DNS only" (grey cloud).`,
      );
    } else {
      problems.push(
        `${hostname} points to ${ips.join(", ")}, not to the platform${
          targets.hostname ? ` (CNAME ${targets.hostname})` : ""
        }${targets.ipv4.length ? ` (A ${targets.ipv4.join(", ")})` : ""}.`,
      );
    }
  }
  return {
    ownership,
    dns,
    ...(problems.length ? { detail: problems.join(" ").slice(0, 500) } : {}),
  };
}
