import { Logger } from "@/core/utils/logger.ts";
import { THook } from "@/core/http/hooks.ts";

export default {
  priority: -Infinity,
  post: ({ req, res }) => {
    const log = (() => {
      switch (true) {
        case res.status < 300:
          return Logger.success;
        case res.status < 400:
          return Logger.info;
        case res.status < 500:
          return Logger.warn;

        default:
          return Logger.error;
      }
    })();

    log.bind(Logger)(req.method.toUpperCase(), req.url, res.status);
  },
} satisfies THook;
