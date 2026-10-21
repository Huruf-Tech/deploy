import { Router } from "@/core/http/router.ts";
import { createCRUD } from "@/core/utils/createCRUD.ts";
import { envModel, envSchema } from "@/schemas/env.ts";

export default new Router("/api", function envs(router) {
  createCRUD({
    router,
    schema: envSchema,
    insertSchema: envSchema,
    model: envModel,
  });
}).group("Admin");
