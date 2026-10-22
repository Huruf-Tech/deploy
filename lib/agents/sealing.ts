import { decodeBase64Url, encodeBase64Url } from "@std/encoding/base64url";

/**
 * Secrets for an agent are sealed to its X25519 key (PLAN §4.2): an ephemeral
 * X25519 key agreement, HKDF-SHA256, then AES-256-GCM. Only that agent can
 * open them, and the control plane can't read them back. Pure, so the agent
 * simulator and tests use it directly. Format: `s1.` + base64url(ephemeral
 * public key ‖ nonce ‖ ciphertext). The Go side is identity.Open.
 */

const INFO = new TextEncoder().encode("huruf-deploy seal v1");
const buf = (bytes: Uint8Array) => bytes as Uint8Array<ArrayBuffer>;

const aesKey = async (
  shared: ArrayBuffer,
  ephemeral: Uint8Array,
  recipient: Uint8Array,
) => {
  const ikm = await crypto.subtle.importKey("raw", shared, "HKDF", false, [
    "deriveKey",
  ]);
  return await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: buf(new Uint8Array([...ephemeral, ...recipient])),
      info: INFO,
    },
    ikm,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

export async function sealTo(boxPublicKey: string, plaintext: string) {
  const recipient = decodeBase64Url(boxPublicKey);
  const publicKey = await crypto.subtle.importKey(
    "raw",
    buf(recipient),
    { name: "X25519" },
    false,
    [],
  );
  const ephemeral = await crypto.subtle.generateKey(
    { name: "X25519" },
    true,
    ["deriveBits"],
  ) as CryptoKeyPair;
  const shared = await crypto.subtle.deriveBits(
    { name: "X25519", public: publicKey },
    ephemeral.privateKey,
    256,
  );
  const ephemeralRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", ephemeral.publicKey),
  );
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      await aesKey(shared, ephemeralRaw, recipient),
      new TextEncoder().encode(plaintext),
    ),
  );
  return `s1.${
    encodeBase64Url(new Uint8Array([...ephemeralRaw, ...nonce, ...ciphertext]))
  }`;
}

/** The agent side, for the simulator and tests (the real agent is Go). */
export async function openSealed(
  boxPrivateKey: CryptoKey,
  boxPublicKey: string,
  sealed: string,
) {
  if (!sealed.startsWith("s1.")) throw new Error("Unknown sealed format");
  const raw = decodeBase64Url(sealed.slice(3));
  const ephemeral = raw.slice(0, 32);
  const nonce = raw.slice(32, 44);
  const shared = await crypto.subtle.deriveBits(
    {
      name: "X25519",
      public: await crypto.subtle.importKey(
        "raw",
        buf(ephemeral),
        { name: "X25519" },
        false,
        [],
      ),
    },
    boxPrivateKey,
    256,
  );
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: buf(nonce) },
      await aesKey(shared, ephemeral, decodeBase64Url(boxPublicKey)),
      buf(raw.slice(44)),
    ),
  );
}
