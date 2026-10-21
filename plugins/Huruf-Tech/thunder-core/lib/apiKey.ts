import { createHashSync, SupportedHashAlg } from "@/core/utils/hash.ts";

export class APIKey {
  static hash(secret: string) {
    return createHashSync(SupportedHashAlg.SHA_1, secret);
  }

  static async resolve(secret: string) {
    const { apiKeyModel } = await import("@/schemas/apiKey.ts");

    return await apiKeyModel.findOneAndUpdate({
      secret: this.hash(secret),
    }, {
      $inc: {
        accessCount: 1,
      },
      $set: {
        lastAccessAt: new Date(),
      },
    });
  }
}
