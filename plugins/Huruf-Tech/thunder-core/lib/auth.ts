import { betterAuth, BetterAuthOptions } from "better-auth";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { Env, EnvType } from "@/core/utils/env.ts";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongodb } from "@/database.ts";
import { admin, magicLink, multiSession, twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { Mailer } from "./mailer.ts";
import { createHash, SupportedHashAlg } from "@/core/utils/hash.ts";

export const capabilities = await Env.list("BETTER_AUTH_CAPABILITIES");
export const betterAuthConfig = {
  baseURL: Env.getSync("BASE_URL"),
  secret: Env.getSync("SECRET_KEY"),
  basePath: "/auth/api",
  trustedOrigins: Env.listSync("BETTER_AUTH_TRUSTED_ORIGIN"),
  database: mongodbAdapter(mongodb.db(), {
    client: mongodb,
    usePlural: true,
  }),
  user: {
    additionalFields: {
      gender: {
        type: "string",
        required: false,
      },
      dob: {
        type: "date",
        required: false,
      },
    },
  },
  session: {
    additionalFields: {
      device: {
        type: "json",
        required: false,
        input: true,
        validator: {
          input: z.object({
            model: z.string(),
            mobile: z.boolean(),
            platform: z.string(),
            platformVersion: z.string(),
            brands: z.array(z.object({
              brand: z.string(),
              version: z.string(),
            })),
          }),
        },
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!capabilities.includes("signup")) {
            throw new APIError("BAD_REQUEST", {
              message: "Signup is disabled",
            });
          }

          // runs before the user is inserted
          return {
            data: {
              ...user,
              image: user.image ??
                `https://www.gravatar.com/avatar/${await createHash(
                  SupportedHashAlg.SHA_256,
                  user.email,
                )}?s=200&d=identicon`,
            },
          };
        },
      },
    },
  },
  advanced: {
    database: {
      joins: true,
    },
    defaultCookieAttributes: {
      sameSite: Env.getSync("BETTER_AUTH_SAME_SITE", true) ||
        (Env.is(EnvType.PRODUCTION) ? "Strict" : "Lax"),
      secure: Env.is(EnvType.PRODUCTION),
      httpOnly: Env.is(EnvType.PRODUCTION),
    },
  },
  emailAndPassword: {
    enabled: capabilities.includes("email"),
    sendResetPassword: async ({ user, url }) => {
      await Mailer.send({
        template: "resetPasswordRequest",
        to: user.email,
        subject: "Reset password request",
        html: `
        <p>Click the following link to reset your password:</p>
        <a href="${url}">Reset now!</a>
        `,
        url,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await Mailer.send({
        template: "emailVerificationRequest",
        to: user.email,
        subject: "Verify your email address",
        html: `
        <p>Click the following link to verify your email:</p>
        <a href="${url}">Reset now!</a>
        `,
        url,
      });
    },
  },
  socialProviders: {
    ...(capabilities.includes("github")
      ? {
        github: {
          clientId: await Env.get("GITHUB_CLIENT_ID"),
          clientSecret: await Env.get("GITHUB_CLIENT_SECRET"),
        },
      }
      : {}),
    ...(capabilities.includes("google")
      ? {
        google: {
          clientId: await Env.get("GOOGLE_CLIENT_ID"),
          clientSecret: await Env.get("GOOGLE_CLIENT_SECRET"),
        },
      }
      : {}),
    ...(capabilities.includes("facebook")
      ? {
        facebook: {
          clientId: await Env.get("FACEBOOK_CLIENT_ID"),
          clientSecret: await Env.get("FACEBOOK_CLIENT_SECRET"),
        },
      }
      : {}),
  },
  plugins: [
    admin(),
    passkey(),
    twoFactor({
      trustDeviceMaxAge: 60 * 60 * 24 *
        (await Env.number("BETTER_AUTH_TRUST_DEVICE_DAYS") ?? 30), // 30 days
    }),
    magicLink({
      sendMagicLink: async (
        { email: to, url },
        ctx,
      ) => {
        await Mailer.send({
          template: "magicLinkAuth",
          to,
          subject: "Magic link auth",
          html: `
          <p>Click the following link to login:</p>
          <a href="${url}">Login now!</a>
          `,
          url,
        }).catch((error) => {
          throw ctx?.error("INTERNAL_SERVER_ERROR", error);
        });
      },
      disableSignUp: !capabilities.includes("magicLink"),
    }),
    multiSession({
      maximumSessions: !capabilities.includes("multiSession")
        ? 1
        : (await Env.number("BETTER_AUTH_MAX_MULTI_SESSIONS") ?? 5),
    }),
  ],
} satisfies BetterAuthOptions;

export const auth = betterAuth(betterAuthConfig);
