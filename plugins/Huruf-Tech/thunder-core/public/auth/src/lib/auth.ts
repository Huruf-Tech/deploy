import { passkeyClient } from "@better-auth/passkey/client";
import {
  adminClient,
  inferAdditionalFields,
  magicLinkClient,
  multiSessionClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { apiOrigin } from "./api";

export const authClient = createAuthClient({
  baseURL: apiOrigin,
  basePath: "/auth/api",
  plugins: [
    passkeyClient(),
    twoFactorClient(),
    magicLinkClient(),
    adminClient(),
    multiSessionClient(),
    inferAdditionalFields({
      user: {
        gender: {
          type: "string",
          required: false,
        },
        dob: {
          type: "date",
          required: false,
        },
      },
      session: {
        device: { type: "json", required: false },
      },
    }),
  ],
});

export type TSession = typeof authClient.$Infer.Session;
export type TUser = TSession["user"];
