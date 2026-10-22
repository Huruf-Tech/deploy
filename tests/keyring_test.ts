import { assertEquals, assertNotEquals, assertRejects } from "@std/assert";
import { ObjectId } from "mongodb";
import {
  importMasterKey,
  Keyring,
  rewrapDataKey,
  type TKeyringStore,
} from "@/lib/core/keyring.ts";
import type { TKeyring } from "@/schemas/crypto/keyring.ts";

const memoryStore = () => {
  const docs: TKeyring[] = [];
  const store = {
    findOne: (filter: Record<string, unknown>) =>
      Promise.resolve(
        docs.find((d) =>
          d.owner.kind === filter["owner.kind"] &&
          d.owner.ref.equals(filter["owner.ref"] as ObjectId)
        ) ?? null,
      ),
    insertOne: (doc: TKeyring) => {
      docs.push(doc);
      return Promise.resolve({
        acknowledged: true,
        insertedId: new ObjectId(),
      });
    },
  } as unknown as TKeyringStore;
  return { docs, store };
};

const randomMasterKey = () =>
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));

Deno.test("Keyring encryption round-trips and stores no plaintext", async () => {
  const { docs, store } = memoryStore();
  const master = randomMasterKey();
  const tenant = { kind: "tenant" as const, ref: new ObjectId() };

  const sealed = await new Keyring(store, () => importMasterKey(master))
    .encrypt(tenant, "s3cret-value");
  assertNotEquals(sealed.includes("s3cret-value"), true);
  assertEquals(docs.length, 1);

  // A fresh instance (cold cache) recovers the data key from the store.
  const plain = await new Keyring(store, () => importMasterKey(master))
    .decrypt(tenant, sealed);
  assertEquals(plain, "s3cret-value");
});

Deno.test("Keyring ciphertext is bound to its owner and master key", async () => {
  const { store } = memoryStore();
  const master = randomMasterKey();
  const keyring = new Keyring(store, () => importMasterKey(master));
  const a = { kind: "tenant" as const, ref: new ObjectId() };
  const b = { kind: "tenant" as const, ref: new ObjectId() };

  const sealed = await keyring.encrypt(a, "value");
  await assertRejects(() => keyring.decrypt(b, sealed));

  const wrongMaster = new Keyring(
    store,
    () => importMasterKey(randomMasterKey()),
  );
  await assertRejects(() => wrongMaster.decrypt(a, sealed));
});

Deno.test("importMasterKey rejects keys that are not 32 bytes", async () => {
  await assertRejects(() => importMasterKey(btoa("too-short")));
});

Deno.test("rewrapDataKey moves data keys to a new master key, once", async () => {
  const { docs, store } = memoryStore();
  const oldMaster = randomMasterKey();
  const newMaster = randomMasterKey();
  const tenant = { kind: "tenant" as const, ref: new ObjectId() };
  const sealed = await new Keyring(store, () => importMasterKey(oldMaster))
    .encrypt(tenant, "value", "variable:1");

  const [from, to] = await Promise.all(
    [oldMaster, newMaster].map(importMasterKey),
  );
  docs[0].dataKeyEnc = (await rewrapDataKey(docs[0], from, to))!;
  assertEquals(await rewrapDataKey(docs[0], from, to), null);

  // Values sealed before the rotation still open with the new master key.
  const keyring = new Keyring(store, () => importMasterKey(newMaster));
  assertEquals(await keyring.decrypt(tenant, sealed, "variable:1"), "value");
  // The context is part of the AAD.
  await assertRejects(() => keyring.decrypt(tenant, sealed, "variable:2"));
});
