import { Router } from "@/core/http/router.ts";
import { createCRUD } from "@/core/utils/createCRUD.ts";
import {
  accessControlInputSchema,
  accessControlModel,
  accessControlSchema,
} from "@/schemas/accessControl.ts";

export default new Router("/api", function accessControl(router) {
  createCRUD({
    router,
    schema: accessControlSchema,
    insertSchema: accessControlInputSchema,
    model: accessControlModel,
  });
}).group("IAM");
