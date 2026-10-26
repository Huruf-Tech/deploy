import type { ObjectId } from "mongodb";
import { Mailer } from "@/plugins/Huruf-Tech/thunder-core/lib/mailer.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { userModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/user.ts";

/**
 * Emails the workspace owner about billing (past due, rentals approved or
 * suspended…). `subject` and `text` may use `{workspace}` for its name.
 * Silently does nothing when the owner has no email.
 */
export async function notifyOwner(
  tenant: ObjectId,
  message: { subject: string; text: string },
) {
  const doc = await tenantModel.findOne({ _id: tenant }, {
    projection: { name: 1, createdBy: 1 },
  });
  const owner = doc &&
    await userModel.findOne({ _id: doc.createdBy }, {
      projection: { email: 1 },
    });
  if (!owner?.email) return;
  const fill = (s: string) => s.replaceAll("{workspace}", doc!.name);
  await Mailer.send({
    to: owner.email,
    subject: fill(message.subject),
    text: fill(message.text),
  });
}
