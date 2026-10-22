import z from "zod";
import { upsertSystemTemplate } from "@/lib/build/templates.ts";
import { $template, $templateContent } from "@/schemas/build/template.ts";
import { systemTemplates } from "@/scripts/data/systemTemplates.ts";

const $meta = $template.pick({
  slug: true,
  name: true,
  kind: true,
  icon: true,
  description: true,
});

/** System templates from data (PLAN §9.1). Idempotent: unchanged content adds no version. */
export const seedTemplates = async () => {
  const results: Record<string, string> = {};
  for (const { meta, content } of systemTemplates) {
    const parsed = z.object({ meta: $meta, content: $templateContent }).parse({
      meta,
      content,
    });
    results[parsed.meta.slug] = await upsertSystemTemplate(
      parsed.meta,
      parsed.content,
    );
  }
  return results;
};

if (import.meta.main) {
  console.log(await seedTemplates());
  Deno.exit();
}
