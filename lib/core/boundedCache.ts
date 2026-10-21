/**
 * Size-capped TTL + LRU cache (PLAN §20.4). Every in-memory cache keyed by an
 * unbounded identity (agent, tenant, user, IP) must use this, never a bare Map.
 * Built on Map insertion order: the first key is always the least recently used.
 */
export class BoundedCache<K, V> {
  private readonly entries = new Map<K, { value: V; expiresAt: number }>();
  readonly maxEntries: number;
  readonly ttlMs: number;
  hits = 0;
  misses = 0;

  constructor(opts: { maxEntries: number; ttlMs: number }) {
    if (!(opts.maxEntries > 0)) throw new Error("maxEntries must be > 0");
    this.maxEntries = opts.maxEntries;
    this.ttlMs = opts.ttlMs;
  }

  get size() {
    return this.entries.size;
  }

  get(key: K): V | undefined {
    const entry = this.entries.get(key);

    if (!entry || entry.expiresAt <= Date.now()) {
      if (entry) this.entries.delete(key);
      this.misses++;
      return;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);
    this.hits++;
    return entry.value;
  }

  set(key: K, value: V) {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });

    while (this.entries.size > this.maxEntries) {
      this.entries.delete(this.entries.keys().next().value as K);
    }
  }

  delete(key: K) {
    this.entries.delete(key);
  }
}
