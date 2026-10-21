import { assertEquals } from "@std/assert";
import { isPublicAddress } from "@/lib/agents/bootstrap.ts";

Deno.test("isPublicAddress blocks internal targets for the SSH wizard (SSRF)", () => {
  const blocked = [
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.10",
    "169.254.169.254", // cloud metadata
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
  ];
  const allowed = ["8.8.8.8", "172.32.0.1", "1.1.1.1", "2606:4700::1111"];

  for (const ip of blocked) assertEquals(isPublicAddress(ip), false, ip);
  for (const ip of allowed) assertEquals(isPublicAddress(ip), true, ip);
});
