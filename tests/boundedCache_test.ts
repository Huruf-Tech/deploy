import { assertEquals } from "@std/assert";
import { BoundedCache } from "@/lib/core/boundedCache.ts";

Deno.test("BoundedCache never exceeds maxEntries and evicts least recently used", () => {
  const cache = new BoundedCache<number, number>({
    maxEntries: 3,
    ttlMs: 60_000,
  });

  for (let i = 0; i < 1_000; i++) cache.set(i, i);
  assertEquals(cache.size, 3);
  assertEquals(cache.get(997), 997);

  cache.get(998); // reads refresh recency: 999 is now the least recently used
  cache.set(1_000, 1_000);
  assertEquals(cache.get(999), undefined);
  assertEquals(cache.get(997), 997);
  assertEquals(cache.get(998), 998);
});

Deno.test("BoundedCache expires entries after ttl", async () => {
  const cache = new BoundedCache<string, string>({ maxEntries: 10, ttlMs: 5 });
  cache.set("a", "1");
  await new Promise((r) => setTimeout(r, 10));
  assertEquals(cache.get("a"), undefined);
  assertEquals(cache.size, 0);
});
