// ═══════════════════════════════════════════════════════════════
// Plately Workshop — In-Memory Domain Resolution Cache
// ═══════════════════════════════════════════════════════════════

export interface CacheEntry {
  slug: string | null;
  cachedAt: number;
  expiresAt: number;
}

/**
 * High-performance in-memory TTL cache for mapping custom domains to restaurant slugs.
 * Reduces database lookups on the Edge proxy path to < 0.1ms.
 */
export class DomainCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTtlMs: number;

  constructor(defaultTtlSeconds: number = 60) {
    this.defaultTtlMs = defaultTtlSeconds * 1000;
  }

  private normalize(domain: string): string {
    return domain.trim().toLowerCase();
  }

  /**
   * Retrieves the cached slug for a given domain.
   * Returns undefined if cache miss or expired. Returns null if cached negative lookup.
   */
  get(domain: string): string | null | undefined {
    if (!domain) return undefined;
    const key = this.normalize(domain);
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.slug;
  }

  /**
   * Sets a domain-to-slug mapping with configurable TTL in seconds (defaults to constructor default).
   */
  set(domain: string, slug: string | null, ttlSeconds?: number): void {
    if (!domain) return;
    const key = this.normalize(domain);
    const now = Date.now();
    const ttlMs = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtlMs;

    this.cache.set(key, {
      slug,
      cachedAt: now,
      expiresAt: now + ttlMs,
    });
  }

  /**
   * Invalidates a single domain entry immediately upon DNS verification or domain update.
   */
  invalidate(domain: string): boolean {
    if (!domain) return false;
    const key = this.normalize(domain);
    return this.cache.delete(key);
  }

  /**
   * Clears all cached domain resolutions.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Checks whether a valid (non-expired) cache entry exists for a domain.
   */
  has(domain: string): boolean {
    return this.get(domain) !== undefined;
  }

  /**
   * Returns the number of unexpired entries currently in cache.
   */
  size(): number {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

// Global singleton instance with 60-second default TTL
export const domainCache = new DomainCache(60);
export const cache = domainCache;

// Top-level functional helpers
export function getCachedSlug(domain: string): string | null | undefined {
  return domainCache.get(domain);
}

export function setCachedSlug(domain: string, slug: string | null, ttlSeconds?: number): void {
  domainCache.set(domain, slug, ttlSeconds);
}

export function invalidateDomainCache(domain: string): boolean {
  return domainCache.invalidate(domain);
}

export function clearDomainCache(): void {
  domainCache.clear();
}

export default domainCache;
