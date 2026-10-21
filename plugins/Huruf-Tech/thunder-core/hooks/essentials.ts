import { THook } from "@/core/http/hooks.ts";
import { Env } from "@/core/utils/env.ts";
import { envModel } from "@/schemas/env.ts";

export const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-TENANT-ID, X-API-KEY, X-PAYLOAD-SIGNATURE",
  "Access-Control-Allow-Credentials": "true",
};

export default {
  priority: Infinity,
  pre: ({ req }) => {
    // Handle preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Origin": req.headers.get("Origin") || "*",
        },
      });
    }

    // Following function override will resolve undefined env variables from database.
    Env.onGetFailed = async (key: string) => {
      const env = await envModel.findOne({ key });

      return env?.value;
    };
  },
  post: ({ req, res }) => {
    // Append CORS headers to the response
    for (
      const [key, value] of Object.entries({
        ...corsHeaders,
        "Access-Control-Allow-Origin": req.headers.get("Origin") || "*",
      })
    ) {
      res.headers.set(key, value);
    }
  },
} satisfies THook;
