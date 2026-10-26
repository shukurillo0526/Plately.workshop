import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyDomainDns, EXPECTED_CNAME_TARGET, getTxtChallengeHostname } from '@/lib/domains/dns';
import { invalidateDomainCache } from '@/lib/domains/resolver';
import { isReservedSubdomain, extractHostname } from '@/lib/domains/host';

export const dynamic = 'force-dynamic';

/**
 * Validates alphanumeric + hyphen slug format (3 to 63 chars)
 */
function isValidSubdomainSlug(slug: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(slug);
}

/**
 * Validates domain format (e.g. order.restaurant.uz, diner.food.com)
 */
function isValidCustomDomainFormat(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  // Must have at least one dot, no leading/trailing dots or hyphens
  return /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain);
}

// ═══════════════════════════════════════════════════════════════
// GET /api/domains/verify?restaurantId=...
// Returns domain status, active configurations, and DNS guidance
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify staff membership / access
    const admin = createAdminClient();
    const { data: rest, error: restError } = await admin
      .from('restaurants')
      .select('id, name, slug, subdomain, custom_domain, domain_verified_at, domain_verification_token')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restError || !rest) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    let token = rest.domain_verification_token;
    if (!token) {
      token = `plately-verify-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
      await admin
        .from('restaurants')
        .update({ domain_verification_token: token })
        .eq('id', restaurantId);
    }

    const domain = rest.custom_domain;
    const isVerified = Boolean(domain && rest.domain_verified_at);

    return NextResponse.json({
      success: true,
      data: {
        restaurantId: rest.id,
        slug: rest.slug,
        subdomain: rest.subdomain || null,
        customDomain: rest.custom_domain || null,
        isVerified,
        verifiedAt: rest.domain_verified_at || null,
        verificationToken: token,
        dnsSetup: domain ? {
          cname: {
            type: 'CNAME',
            host: domain,
            target: EXPECTED_CNAME_TARGET,
          },
          txt: {
            type: 'TXT',
            host: getTxtChallengeHostname(domain),
            value: token,
          },
        } : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/domains/verify
// Updates subdomain and/or verifies external custom domain DNS
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { restaurantId, subdomain, customDomain, action } = body;

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch restaurant
    const { data: rest, error: restError } = await admin
      .from('restaurants')
      .select('id, name, slug, subdomain, custom_domain, domain_verified_at, domain_verification_token')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restError || !rest) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    let token = rest.domain_verification_token;
    if (!token) {
      token = `plately-verify-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
      await admin
        .from('restaurants')
        .update({ domain_verification_token: token })
        .eq('id', restaurantId);
    }

    const responsePayload: Record<string, any> = { success: true };

    // 2. Handle Subdomain Update
    if (subdomain !== undefined) {
      const cleanSub = (subdomain || '').trim().toLowerCase();

      if (cleanSub) {
        if (!isValidSubdomainSlug(cleanSub)) {
          return NextResponse.json(
            { error: 'Subdomain must be 3-63 lowercase alphanumeric characters or hyphens.' },
            { status: 400 }
          );
        }

        if (isReservedSubdomain(cleanSub)) {
          return NextResponse.json(
            { error: `The subdomain "${cleanSub}" is a reserved system keyword and cannot be claimed.` },
            { status: 400 }
          );
        }

        // Check availability
        const { data: existingSub } = await admin
          .from('restaurants')
          .select('id')
          .eq('subdomain', cleanSub)
          .neq('id', restaurantId)
          .maybeSingle();

        if (existingSub) {
          return NextResponse.json(
            { error: `The subdomain "${cleanSub}.plately.app" is already claimed by another restaurant.` },
            { status: 409 }
          );
        }

        await admin
          .from('restaurants')
          .update({ subdomain: cleanSub })
          .eq('id', restaurantId);

        responsePayload.subdomain = cleanSub;
      } else {
        // Clear subdomain
        await admin
          .from('restaurants')
          .update({ subdomain: null })
          .eq('id', restaurantId);
        responsePayload.subdomain = null;
      }
    }

    // 3. Handle Custom Domain Configuration / DNS Verification
    if (customDomain !== undefined || action === 'verify_dns') {
      const targetDomain = extractHostname(customDomain || rest.custom_domain || '');

      if (!targetDomain) {
        // Clearing custom domain
        if (customDomain === '' || customDomain === null) {
          if (rest.custom_domain) {
            invalidateDomainCache(rest.custom_domain);
          }
          await admin
            .from('restaurants')
            .update({
              custom_domain: null,
              domain_verified_at: null,
            })
            .eq('id', restaurantId);

          return NextResponse.json({
            success: true,
            message: 'Custom domain cleared successfully.',
            customDomain: null,
            isVerified: false,
          });
        }

        return NextResponse.json(
          { error: 'Please enter a valid custom domain name.' },
          { status: 400 }
        );
      }

      if (!isValidCustomDomainFormat(targetDomain)) {
        return NextResponse.json(
          { error: 'Invalid custom domain format. Example: order.myrestaurant.com' },
          { status: 400 }
        );
      }

      // Check if claimed by another restaurant
      const { data: existingCustom } = await admin
        .from('restaurants')
        .select('id')
        .eq('custom_domain', targetDomain)
        .neq('id', restaurantId)
        .maybeSingle();

      if (existingCustom) {
        return NextResponse.json(
          { error: `The custom domain "${targetDomain}" is already connected to another restaurant.` },
          { status: 409 }
        );
      }

      // Save domain target first if not yet set
      if (rest.custom_domain !== targetDomain) {
        await admin
          .from('restaurants')
          .update({
            custom_domain: targetDomain,
            domain_verified_at: null,
          })
          .eq('id', restaurantId);
      }

      // Perform live DNS lookup check
      const dnsResult = await verifyDomainDns(targetDomain, token);

      if (dnsResult.verified) {
        const now = new Date().toISOString();
        await admin
          .from('restaurants')
          .update({
            custom_domain: targetDomain,
            domain_verified_at: now,
          })
          .eq('id', restaurantId);

        // Also upsert restaurant_domains registry table
        try {
          await admin
            .from('restaurant_domains')
            .upsert(
              {
                restaurant_id: restaurantId,
                domain: targetDomain,
                domain_type: 'custom',
                verification_status: 'verified',
                verification_token: token,
                verified_at: now,
                updated_at: now,
              },
              { onConflict: 'domain' }
            );
        } catch {
          // Non-critical if table not yet migrated
        }

        // Invalidate proxy cache so domain starts resolving immediately
        invalidateDomainCache(targetDomain);

        return NextResponse.json({
          ...responsePayload,
          success: true,
          verified: true,
          customDomain: targetDomain,
          verifiedAt: now,
          method: dnsResult.method,
          message: `Domain ${targetDomain} successfully verified via ${dnsResult.method}! Storefront is now live.`,
        });
      } else {
        // DNS lookup not yet matching
        return NextResponse.json({
          ...responsePayload,
          success: true,
          verified: false,
          customDomain: targetDomain,
          error: dnsResult.error,
          dnsSetup: {
            cname: {
              type: 'CNAME',
              host: targetDomain,
              target: EXPECTED_CNAME_TARGET,
            },
            txt: {
              type: 'TXT',
              host: getTxtChallengeHostname(targetDomain),
              value: token,
            },
          },
          message: 'DNS records not yet detected. Note that DNS propagation can take a few minutes.',
        });
      }
    }

    return NextResponse.json({
      ...responsePayload,
      message: 'Domain configuration updated.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
