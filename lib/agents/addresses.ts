/** IP address classification, shared by the SSH wizard (SSRF guard) and agent registration. */

const ipv4ToNumber = (ip: string) =>
  ip.split(".").reduce((n, part) => n * 256 + Number(part), 0);

const IPV4_BLOCKED: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

/**
 * False for loopback, private, link-local, CGNAT, multicast and reserved
 * ranges: the wizard must not let users probe our own network (SSRF).
 */
export const isPublicAddress = (ip: string): boolean => {
  const mapped = ip.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPublicAddress(mapped[1]);

  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    const value = ipv4ToNumber(ip);
    return !IPV4_BLOCKED.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return ((value & mask) >>> 0) === ((ipv4ToNumber(base) & mask) >>> 0);
    });
  }

  const v6 = ip.toLowerCase();
  return !(v6 === "::" || v6 === "::1" || /^f[cd]/.test(v6) ||
    /^fe[89ab]/.test(v6) || v6.startsWith("ff"));
};
