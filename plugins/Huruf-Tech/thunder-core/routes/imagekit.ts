import { Router } from "@/core/http/router.ts";
import z from "zod";
import { ImageKit } from "@imagekit/nodejs";
import { Env } from "@/core/utils/env.ts";

export default new Router("/api", function imageKit(router) {
  router.get("/auth", function auth() {
    const $return = z.object({
      token: z.string(),
      expire: z.number(),
      signature: z.string(),
      publicKey: z.string(),
    });

    return {
      shape: () => ({
        return: $return,
      }),
      handler: async (_: Request) => {
        const imageKitClient = new ImageKit({
          privateKey: await Env.get("IMAGEKIT_PRIVATE_KEY"),
        });

        return Response.json(
          {
            ...imageKitClient.helper
              .getAuthenticationParameters(),
            publicKey: await Env.get("IMAGEKIT_PUBLIC_KEY"),
          } satisfies z.output<typeof $return>,
        );
      },
    };
  });
}).group("Media");
