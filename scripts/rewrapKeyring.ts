import { Env } from "@/core/utils/env.ts";
import { importMasterKey, rewrapDataKey } from "@/lib/core/keyring.ts";
import { keyringModel } from "@/schemas/crypto/keyring.ts";

/**
 * Master key rotation (PLAN §12): re-wraps every data key from
 * DEPLOY_MASTER_KEY_PREVIOUS to DEPLOY_MASTER_KEY. Variable ciphertexts don't
 * change. Safe to re-run; already re-wrapped keys are skipped.
 *
 *   DEPLOY_MASTER_KEY_PREVIOUS=<old> DEPLOY_MASTER_KEY=<new> deno run -A scripts/rewrapKeyring.ts
 *
 * Running instances cache data keys for up to 10 minutes, and read the master
 * key at startup: deploy the new key, then run this right away.
 */
export const rewrapKeyring = async () => {
  const from = await importMasterKey(Env.getSync("DEPLOY_MASTER_KEY_PREVIOUS"));
  const to = await importMasterKey(Env.getSync("DEPLOY_MASTER_KEY"));
  let rewrapped = 0;
  let skipped = 0;

  for await (const doc of keyringModel.find()) {
    const dataKeyEnc = await rewrapDataKey(doc, from, to);
    if (!dataKeyEnc) {
      skipped++;
      continue;
    }
    await keyringModel.updateOne(
      { _id: doc._id, dataKeyEnc: doc.dataKeyEnc },
      { $set: { dataKeyEnc }, $inc: { keyVersion: 1 } },
    );
    rewrapped++;
  }

  return { rewrapped, skipped };
};

if (import.meta.main) {
  console.log(await rewrapKeyring());
  Deno.exit();
}
