import { encodeBase64 } from "@std/encoding/base64";

/**
 * Ed25519 deploy keys for generic Git over SSH (PLAN §9.3), in the formats
 * ssh reads: `ssh-ed25519 AAAA…` and an unencrypted openssh-key-v1 private
 * key. WebCrypto makes the key; this only encodes it.
 */

const text = new TextEncoder();
const u32 = (n: number) =>
  new Uint8Array([n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
const str = (data: Uint8Array | string) => {
  const bytes = typeof data === "string" ? text.encode(data) : data;
  return new Uint8Array([...u32(bytes.length), ...bytes]);
};
const concat = (...parts: Uint8Array[]) =>
  new Uint8Array(parts.flatMap((p) => [...p]));

export async function generateDeployKey(comment: string) {
  const pair = await crypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ]) as CryptoKeyPair;
  const pub = new Uint8Array(
    await crypto.subtle.exportKey("raw", pair.publicKey),
  );
  // PKCS#8 for Ed25519 ends with the 32-byte seed.
  const seed = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", pair.privateKey),
  ).slice(-32);

  const publicBlob = concat(str("ssh-ed25519"), str(pub));
  const check = crypto.getRandomValues(new Uint8Array(4));
  let secret = concat(
    check,
    check,
    str("ssh-ed25519"),
    str(pub),
    str(concat(seed, pub)),
    str(comment),
  );
  // Padded to the cipher block size (8 for "none") with 1, 2, 3, …
  const pad = (8 - (secret.length % 8)) % 8;
  secret = concat(secret, Uint8Array.from({ length: pad }, (_, i) => i + 1));

  const body = concat(
    text.encode("openssh-key-v1\0"),
    str("none"),
    str("none"),
    str(""),
    u32(1),
    str(publicBlob),
    str(secret),
  );
  const lines = encodeBase64(body).match(/.{1,70}/g)!.join("\n");

  return {
    publicKey: `ssh-ed25519 ${encodeBase64(publicBlob)} ${comment}`,
    privateKey:
      `-----BEGIN OPENSSH PRIVATE KEY-----\n${lines}\n-----END OPENSSH PRIVATE KEY-----\n`,
  };
}
