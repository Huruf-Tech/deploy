import { Router } from "@/core/http/router.ts";
import { createCRUD } from "@/core/utils/createCRUD.ts";
import {
  $serverClass,
  $serverClassInput,
  $serverClassUpdate,
  serverClassModel,
} from "@/schemas/billing/serverClass.ts";

/**
 * Server classes and their rate cards (PLAN §26.8), root only. Rentals keep
 * the price they were approved at, so edits apply to new rentals and sizes.
 */
export default new Router("/api", function serverClasses(router) {
  createCRUD({
    router,
    schema: $serverClass,
    insertSchema: $serverClassInput,
    updateSchema: $serverClassUpdate,
    model: serverClassModel,
  });
}).group("Admin");
