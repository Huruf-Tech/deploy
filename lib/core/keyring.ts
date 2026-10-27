import { decodeBase64, encodeBase64 } from "@std/encoding/base64";
import { isDuplicateKeyError } from "@/database.ts";
import type { Collection } from "mongodb";
import type { TKeyring, TKeyringOwner } from "@/schemas/crypto/keyring.ts";
import { BoundedCache } from "@/lib/core/boundedCache.ts";

const FORMAT = "v1";
// Rotation re-wraps every data key in place (scripts/rewrapKeyring.ts) and bumps the doc's keyVersion.
const KEY_VERSION = 1;

const toBase64 = encodeBase64;
const fromBase64 = decodeBase64;

/** AAD: the owner, plus an optional context (e.g. the record id) to stop swaps within one owner. */
const ownerTag = (owner: TKeyringOwner, context?: string) =>
  new TextEncoder().encode(
    `${owner.kind}:${owner.ref}${context ? `|${context}` : ""}`,
  );

const importAesKey = (raw: Uint8Array) =>
  crypto.subtle.importKey(
    "raw",
    raw as Uint8Array<ArrayBuffer>,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );

async function seal(key: CryptoKey, data: Uint8Array, aad: Uint8Array) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: aad as Uint8Array<ArrayBuffer>,
    },
    key,
    data as Uint8Array<ArrayBuffer>,
  );
  return `${FORMAT}.${toBase64(iv)}.${toBase64(new Uint8Array(ct))}`;
}

async function open(key: CryptoKey, blob: string, aad: Uint8Array) {
  const [format, iv, ct] = blob.split(".");
  if (format !== FORMAT || !iv || !ct) throw new Error("Invalid sealed value");

  return new Uint8Array(
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: fromBase64(iv),
        additionalData: aad as Uint8Array<ArrayBuffer>,
      },
      key,
      fromBase64(ct),
    ),
  );
}

/** Imports a base64-encoded 32-byte master key. */
export async function importMasterKey(base64: string) {
  const raw = fromBase64(base64);
  if (raw.length !== 32) {
    throw new Error("DEPLOY_MASTER_KEY must be 32 bytes, base64-encoded");
  }
  return await importAesKey(raw);
}

/**
 * Re-seals a stored data key under a new master key. Returns null when it is
 * already sealed with `to`, so an interrupted rotation can simply be re-run.
 */
export async function rewrapDataKey(
  doc: Pick<TKeyring, "owner" | "dataKeyEnc">,
  from: CryptoKey,
  to: CryptoKey,
) {
  const aad = ownerTag(doc.owner);
  if (await open(to, doc.dataKeyEnc, aad).then(() => true, () => false)) {
    return null;
  }
  return await seal(to, await open(from, doc.dataKeyEnc, aad), aad);
}

export type TKeyringStore = Pick<
  Collection<TKeyring>,
  "findOne" | "insertOne"
>;

/**
 * Envelope encryption (PLAN §12): one AES-256-GCM data key per owner, stored
 * wrapped by the master key. Ciphertexts are bound to their owner through AAD,
 * so a value copied to another owner's record fails to decrypt.
 */
export class Keyring {
  private masterKey?: Promise<CryptoKey>;
  private readonly dataKeys = new BoundedCache<string, Promise<CryptoKey>>({
    maxEntries: 5_000,
    ttlMs: 10 * 60_000,
  });

  constructor(
    private readonly store: TKeyringStore,
    private readonly loadMasterKey: () => Promise<CryptoKey>,
  ) {}

  async encrypt(owner: TKeyringOwner, plaintext: string, context?: string) {
    return await seal(
      await this.dataKey(owner),
      new TextEncoder().encode(plaintext),
      ownerTag(owner, context),
    );
  }

  async decrypt(owner: TKeyringOwner, sealed: string, context?: string) {
    return new TextDecoder().decode(
      await open(await this.dataKey(owner), sealed, ownerTag(owner, context)),
    );
  }

  private dataKey(owner: TKeyringOwner) {
    const id = `${owner.kind}:${owner.ref}`;
    let key = this.dataKeys.get(id);

    if (!key) {
      key = this.resolveDataKey(owner);
      key.catch(() => this.dataKeys.delete(id));
      this.dataKeys.set(id, key);
    }

    return key;
  }

  private async resolveDataKey(owner: TKeyringOwner): Promise<CryptoKey> {
    this.masterKey ??= this.loadMasterKey();
    const master = await this.masterKey;
    const filter = { "owner.kind": owner.kind, "owner.ref": owner.ref };

    const existing = await this.store.findOne(filter);
    if (existing) {
      return await importAesKey(
        await open(master, existing.dataKeyEnc, ownerTag(owner)),
      );
    }

    const raw = crypto.getRandomValues(new Uint8Array(32));

    try {
      await this.store.insertOne({
        owner,
        dataKeyEnc: await seal(master, raw, ownerTag(owner)),
        keyVersion: KEY_VERSION,
        createdAt: new Date(),
      });
    } catch (error) {
      // Another request created this owner's key first: use theirs.
      if (isDuplicateKeyError(error)) {
        return await this.resolveDataKey(owner);
      }
      throw error;
    }

    return await importAesKey(raw);
  }
}
