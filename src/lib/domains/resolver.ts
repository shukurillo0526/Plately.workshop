// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Custom Domain Tenant Resolver
// ═══════════════════════════════════════════════════════════════

import { domainCache } from './cache';
import { createAdminClient } from '@/lib/supabase/admin';

export { invalidateDomainCache, clearDomainCache } from './cache';

/**
 * Resolves an external custom domain to a restaurant tenant slug.
 * 1. Checks the in-memory TTL resolution cache.
 * 2. On cache miss, queries Supabase using service-role admin client:
 *    - restaurants table where custom_domain = domain
 *    - restaurant_domains table where domain = domain AND verification_status = 'verified'
 * 3. Populates the cache with the resolved slug (or negative cache on miss).
 * 4. Returns the slug or null.
 */
export async function resolveCustomDomain(domain: string | null | undefined): Promise<string | null> {
  if (!domain) return null;

  const normalizedDomain = domain.trim().toLowerCase();
  if (!normalizedDomain) return null;

  // 1. Check in-memory cache
  const cached = domainCache.get(normalizedDomain);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const supabase = createAdminClient();

    // 2. Check restaurants table (where custom_domain matches directly)
    try {
      const { data: restData, error: restError } = await supabase
        .from('restaurants')
        .select('slug')
        .eq('custom_domain', normalizedDomain)
        .maybeSingle();

      if (!restError && restData?.slug) {
        domainCache.set(normalizedDomain, restData.slug);
        return restData.slug;
      }
    } catch {
      // restaurants lookup failed; proceed to restaurant_domains check
    }

    // 3. Check restaurant_domains table (verified domains)
    try {
      const { data: domainData, error: domainError } = await supabase
        .from('restaurant_domains')
        .select('restaurant_id, verification_status, restaurants(slug)')
        .eq('domain', normalizedDomain)
        .eq('verification_status', 'verified')
        .maybeSingle();

      if (!domainError && domainData) {
        // Check joined restaurant slug
        const joinedSlug = (domainData as any).restaurants?.slug;
        if (joinedSlug) {
          domainCache.set(normalizedDomain, joinedSlug);
          return joinedSlug;
        }

        // Fallback: look up restaurant by restaurant_id
        if (domainData.restaurant_id) {
          const { data: restRel } = await supabase
            .from('restaurants')
            .select('slug')
            .eq('id', domainData.restaurant_id)
            .maybeSingle();

          if (restRel?.slug) {
            domainCache.set(normalizedDomain, restRel.slug);
            return restRel.slug;
          }
        }
      }
    } catch {
      // restaurant_domains table may not exist yet or query failed
    }

    // 4. Domain not found or not verified: cache negative result (15s TTL)
    domainCache.set(normalizedDomain, null, 15);
    return null;
  } catch (err) {
    console.error(`Error resolving custom domain "${domain}":`, err);
    return null;
  }
}
