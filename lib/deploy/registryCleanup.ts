import type { ObjectId } from "mongodb";
import { Logger } from "@/core/utils/logger.ts";
import { issueCommand } from "@/lib/agents/commands.ts";
import { builtinRegistry } from "@/lib/network/mesh.ts";
import type { TRelease } from "@/schemas/applications/deployment.ts";

/**
 * Releases that are gone (pruned, failed before running, or their project
 * deleted) give their images back: the server running the built-in registry
 * deletes those tags and frees the space (PLAN §8.4). Kept releases are
 * never named, so rollbacks keep their images. Failure never blocks the
 * caller: an unreachable or replaced registry just keeps the images.
 */
export async function dropBuiltinImages(
  tenant: ObjectId,
  releases: Pick<TRelease, "pushedImage" | "builtinRegistry">[],
) {
  const pushed = releases.flatMap((r) =>
    r.builtinRegistry && r.pushedImage ? [r.pushedImage] : []
  );
  if (!pushed.length) return;
  try {
    const registry = await builtinRegistry(tenant);
    if (!registry) return;
    // Images pushed to an earlier primary went with it.
    const prefix = `${registry.host}/`;
    const tags = pushed.filter((p) => p.startsWith(prefix)).map((p) =>
      p.slice(prefix.length)
    );
    if (!tags.length) return;
    await issueCommand({
      server: registry.primary._id,
      tenant,
      type: "registry.delete",
      payload: { tags },
    });
  } catch (error) {
    Logger.warn(`[deploy] couldn't free registry images: ${error}`);
  }
}
