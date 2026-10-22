import { assertEquals, assertRejects } from "@std/assert";
import { encodeBase64Url } from "@std/encoding/base64url";
import { openSealed, sealTo } from "@/lib/agents/sealing.ts";

// The same fixed key the Go test uses (identity.FromSeed with bytes 1..32).
const SEED = Uint8Array.from({ length: 32 }, (_, i) => i + 1);
const PKCS8_X25519 = [
  0x30,
  0x2e,
  0x02,
  0x01,
  0x00,
  0x30,
  0x05,
  0x06,
  0x03,
  0x2b,
  0x65,
  0x6e,
  0x04,
  0x22,
  0x04,
  0x20,
];

export const seedKeys = async () => {
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    new Uint8Array([...PKCS8_X25519, ...SEED]),
    { name: "X25519" },
    true,
    ["deriveBits"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);
  return { privateKey, publicKey: jwk.x! };
};

Deno.test("sealing: only the recipient's key opens it", async () => {
  const { privateKey, publicKey } = await seedKeys();
  const sealed = await sealTo(publicKey, "token=ghs_secret");
  assertEquals(sealed.includes("ghs_secret"), false);
  assertEquals(
    await openSealed(privateKey, publicKey, sealed),
    "token=ghs_secret",
  );

  const other = await crypto.subtle.generateKey({ name: "X25519" }, true, [
    "deriveBits",
  ]) as CryptoKeyPair;
  const otherPublic = encodeBase64Url(
    new Uint8Array(await crypto.subtle.exportKey("raw", other.publicKey)),
  );
  await assertRejects(() => openSealed(other.privateKey, otherPublic, sealed));
});

if (import.meta.main) {
  // Prints a vector for agent/internal/identity/identity_test.go.
  const { publicKey } = await seedKeys();
  console.log(
    publicKey,
    await sealTo(publicKey, "sealed by the control plane"),
  );
}
