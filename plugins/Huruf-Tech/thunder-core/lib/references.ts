import { referenceModel } from "@/schemas/references.ts";
import { ClientSession } from "mongodb";

export class References {
  static async inc(label: string, prefix: string, databaseSession?: ClientSession) {
    const ref = await referenceModel.findOneAndUpdate(
      { label },
      {
        $inc: {
          count: 1,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        session: databaseSession,
      },
    );

    if (!ref) throw new Error("Couldn't increment ref");

    return prefix + ref.count;
  }
}
