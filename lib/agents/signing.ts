import { encodeBase32 } from "@std/encoding/base32";
import { decodeBase64Url, encodeBase64Url } from "@std/encoding/base64url";

/**
 * Request signing shared by the control plane and agents (PLAN §4.1):
 * Ed25519 over `METHOD \n path?query \n timestamp \n sha256hex(body)`.
 * Pure (no database), so the simulator and tests import it directly.
 */

export const MAX_CLOCK_SKEW_MS = 60_000;

const encoder = new TextEncoder();

const sha256 = async (data: Uint8Array) =>
  new Uint8Array(
    await crypto.subtle.digest("SHA-256", data as Uint8Array<ArrayBuffer>),
  );

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

export const fingerprintOf = async (signPublicKey: string) =>
  toHex(await sha256(decodeBase64Url(signPublicKey)));

/** Shown by the agent and typed by the user on accept (PLAN §4.2). */
export const pairingCodeOf = async (signPublicKey: string) =>
  encodeBase32(await sha256(decodeBase64Url(signPublicKey))).slice(0, 6);

export const canonicalRequest = async (
  method: string,
  pathWithQuery: string,
  timestamp: string,
  body: string,
) =>
  encoder.encode(
    [
      method.toUpperCase(),
      pathWithQuery,
      timestamp,
      toHex(await sha256(encoder.encode(body))),
    ].join("\n"),
  );

export const importSignPublicKey = (signPublicKey: string) =>
  crypto.subtle.importKey(
    "raw",
    decodeBase64Url(signPublicKey) as Uint8Array<ArrayBuffer>,
    "Ed25519",
    false,
    ["verify"],
  );

export const sign = async (privateKey: CryptoKey, data: Uint8Array) =>
  encodeBase64Url(
    await crypto.subtle.sign(
      "Ed25519",
      privateKey,
      data as Uint8Array<ArrayBuffer>,
    ),
  );

export const verify = async (
  publicKey: CryptoKey,
  signature: string,
  data: Uint8Array,
) => {
  try {
    return await crypto.subtle.verify(
      "Ed25519",
      publicKey,
      decodeBase64Url(signature) as Uint8Array<ArrayBuffer>,
      data as Uint8Array<ArrayBuffer>,
    );
  } catch {
    return false;
  }
};
