/**
 * TTL cache with stampede protection and a per-key in-memory rate limit.
 *
 * Extracted from the original frontend risk route so it can back the
 * frontend, the trust-api, and the MCP server with the same semantics.
 *
 * Notes:
 * - Single-process, in-memory. Swap for Redis when running multiple
 *   replicas of the trust-api in production.
 * - `withCache` serves stale data if the recompute throws AND a previous
 *   value exists; this matches the behaviour of the original route.
 */

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface TtlCacheOptions {
  ttlMs: number;
}

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private inflight = new Map<string, Promise<T>>();

  constructor(private readonly opts: TtlCacheOptions) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.data;
    return undefined;
  }

  getStale(key: string): T | undefined {
    return this.store.get(key)?.data;
  }

  set(key: string, value: T): void {
    this.store.set(key, { data: value, expiresAt: Date.now() + this.opts.ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
    this.inflight.delete(key);
  }

  /**
   * Run `compute` if no fresh value exists, with stampede protection:
   * concurrent callers for the same key share the same in-flight promise.
   * On error, falls back to serving stale data when available.
   */
  async withCache(key: string, compute: () => Promise<T>): Promise<T> {
    const fresh = this.get(key);
    if (fresh !== undefined) return fresh;

    const inflight = this.inflight.get(key);
    if (inflight) return inflight;

    const stale = this.getStale(key);
    const promise = (async () => {
      try {
        const value = await compute();
        this.set(key, value);
        return value;
      } catch (err) {
        if (stale !== undefined) return stale;
        throw err;
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, promise);
    return promise;
  }
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export class InMemoryRateLimiter {
  private hits = new Map<string, number[]>();

  constructor(private readonly opts: RateLimitOptions) {}

  /**
   * Returns true if the caller has exceeded the limit in the current window.
   * Records the current timestamp as a side-effect when not limited.
   */
  isLimited(key: string): boolean {
    const now = Date.now();
    const timestamps = this.hits.get(key) || [];
    const recent = timestamps.filter((t) => t > now - this.opts.windowMs);
    this.hits.set(key, recent);
    if (recent.length >= this.opts.max) return true;
    recent.push(now);
    return false;
  }
}

export const DEFAULT_TRUST_CACHE_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_TRUST_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 1000,
  max: 30,
};
