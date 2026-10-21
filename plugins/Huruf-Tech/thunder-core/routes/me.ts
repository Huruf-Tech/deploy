import { Router } from "@/core/http/router.ts";
import { Response } from "@/core/http/response.ts";
import z from "zod";
import { userModel, userSchema } from "@/schemas/user.ts";
import { withAuthSession } from "@/utils/withAuthSession.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { bodyAsJson } from "@/core/http/utils.ts";
import { SMS } from "@/lib/sms.ts";
import { mongodb } from "@/database.ts";

export default new Router("/api", function me(router) {
  router.get("/", function get() {
    const $return = userSchema.extend({
      _id: $objectId,
    });

    return {
      shape: () => ({
        return: $return,
      }),
      handler: async (req: Request) => {
        const { user } = await withAuthSession(req);

        return Response.json(user satisfies z.output<typeof $return>);
      },
    };
  });

  router.patch("/phone-number", function setPhoneNumber() {
    const $body = z.object({
      phoneNumber: z.e164(),
    });

    return {
      shape: () => ({
        body: $body,
      }),
      handler: async (req: Request) => {
        const body = $body.parse(await bodyAsJson(req));

        const { user } = await withAuthSession(req);

        const code = Math.floor(Math.random() * 900000) + 100000;

        await mongodb.withSession((session) =>
          session.withTransaction(async () => {
            const { modifiedCount } = await userModel.updateOne(
              {
                _id: user._id,
                phoneNumber: { $ne: body.phoneNumber },
                $or: [
                  {
                    phoneNumberVerified: false,
                    phoneNumberVerificationRequestAt: {
                      $lt: new Date(Date.now() - 60 * 1000), // 1 minute
                    },
                  },
                  {
                    phoneNumberVerified: {
                      $exists: false,
                    },
                    phoneNumberVerificationRequestAt: {
                      $exists: false,
                    },
                  },
                ],
              },
              {
                $set: {
                  phoneNumber: body.phoneNumber,
                  phoneNumberVerified: false,
                  phoneNumberVerificationCode: code.toString(),
                  phoneNumberVerificationRequestAt: new Date(),
                },
              },
              { session },
            );

            if (modifiedCount === 0) {
              return Response.badRequest(
                "You can only request a new verification code once per minute.",
              );
            }

            await SMS.send({
              to: body.phoneNumber,
              text: `Your verification code is: ${code}`,
            });
          })
        );

        return Response.ok();
      },
    };
  });

  router.patch("/phone-number/verify", function verifyPhoneNumber() {
    const $body = z.object({
      code: z.string(),
    });

    return {
      shape: () => ({
        body: $body,
      }),
      handler: async (req: Request) => {
        const body = $body.parse(await bodyAsJson(req));

        const { user } = await withAuthSession(req);

        const { modifiedCount } = await userModel.updateOne(
          {
            _id: user._id,
            phoneNumberVerificationCode: body.code,
            phoneNumberVerified: false,
          },
          {
            $set: {
              phoneNumberVerified: true,
            },
          },
        );

        if (modifiedCount === 0) {
          return Response.badRequest("Invalid verification code.");
        }

        return Response.ok();
      },
    };
  });
});
