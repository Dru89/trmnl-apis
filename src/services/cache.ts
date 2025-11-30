import { getStore, type Store } from "@netlify/blobs";

type Cached<T> = { value: T; cachedAt: number };

const DEFAULT_CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export function isCached(x: unknown): x is Cached<unknown> {
  if (x == null || typeof x !== "object") return false;
  const cached: Cached<unknown> = x as Cached<unknown>;

  return typeof cached.cachedAt === "number" && cached.value != null;
}

export default class Cache<T> {
  #cacheName: string;
  #ttl: number;
  #memoryCache: Map<string, Cached<T>>;

  constructor(cacheName: string, ttl = DEFAULT_CACHE_DURATION_MS) {
    this.#cacheName = cacheName;
    this.#ttl = ttl;
    this.#memoryCache = new Map<string, Cached<T>>();
  }

  async #getNetlify(key: string): Promise<T | null> {
    let store: Store | undefined;
    try {
      store = getStore(this.#cacheName);
    } catch (e) {
      console.error("Failed to get Netlify store.", e);
      return null;
    }

    let result: unknown;
    try {
      result = await store.get(key, { type: "json" });
    } catch (e) {
      console.error(`Failed to fetch key '${key}' from Netlify store.`, e);
      return null;
    }

    if (result == null) {
      console.info("No object found in Netlify cache.");
      return null;
    }

    if (!isCached(result)) {
      console.error(
        "Object from Netlify store doesn't match Cached<T>",
        result
      );
      return null;
    }

    const age = Date.now() - result.cachedAt;
    if (age >= this.#ttl) {
      console.info("Object from Netlify store is expired.");
      return null;
    }

    console.info("Returning cached value from Netlify store");
    return result.value as T;
  }

  async #setNetlify(key: string, value: T, now: number): Promise<void> {
    let store: Store | undefined;
    try {
      store = getStore(this.#cacheName);
    } catch (e) {
      console.error("Failed to get Netlify store.", e);
      return;
    }

    try {
      await store.setJSON(key, { cachedAt: now, value } satisfies Cached<T>);
    } catch (e) {
      console.error(`Failed to set key '${key}' in Netlify store.`, e);
      return;
    }
  }

  #getLocalCache(key: string): T | null {
    let result: unknown;
    result = this.#memoryCache.get(key);

    if (result == null) {
      console.info("No object found in local cache.");
      return null;
    }

    if (!isCached(result)) {
      console.error("Object from local cache doesn't match Cached<T>", result);
      return null;
    }

    const age = Date.now() - result.cachedAt;
    if (age >= this.#ttl) {
      console.info("Object from local cache is expired.");
      return null;
    }

    console.info("Returning cached value from local cache");
    return result.value as T;
  }

  #setLocalCache(key: string, value: T, now: number): void {
    this.#memoryCache.set(key, { cachedAt: now, value });
  }

  async get(key: string): Promise<T | null> {
    const local = this.#getLocalCache(key);
    return local ?? await this.#getNetlify(key);
  }

  async set(key: string, value: T): Promise<void> {
    const now = Date.now();
    this.#setLocalCache(key, value, now);
    await this.#setNetlify(key, value, now);
  }
}
