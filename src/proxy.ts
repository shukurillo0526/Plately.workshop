// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Edge Proxy (Next.js 16 convention)
// ═══════════════════════════════════════════════════════════════
// Note: In Next.js 16, "middleware" was renamed to "proxy".
// The file must export a function named `proxy` (not `middleware`).

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { classifyHost } from '@/lib/domains/host';
import { resolveCustomDomain } from '@/lib/domains/resolver';

const PUBLIC_AUTH_PATHS = ['/login', '/signup'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Fast-path: Preserve static assets, media files, and metadata
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/sounds') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    /\.(png|jpe?g|gif|svg|ico|webp|mp3|wav|css|js|woff2?|map)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Preserve API routes and webhooks without rewrite
  if (pathname.startsWith('/api/')) {
    const { response } = await updateSession(request);
    return response;
  }

  // 3. Extract and classify incoming host
  const hostHeader =
    request.headers?.get?.('x-forwarded-host') ||
    request.headers?.get?.('host') ||
    request.nextUrl?.host;
  const classification = classifyHost(hostHeader);

  // 4. Handle Storefront Traffic (Branded Subdomains & Custom Domains)
  if (classification.type === 'subdomain' || classification.type === 'custom_domain') {
    // Preserve staff authentication routes if accessed from tenant domain
    if (PUBLIC_AUTH_PATHS.some(path => pathname.startsWith(path))) {
      const { response, user } = await updateSession(request);
      if (user) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return response;
    }

    // Direct /store/* paths are allowed without re-prefixing
    if (pathname.startsWith('/store')) {
      return NextResponse.next();
    }

    // Determine tenant slug
    let slug: string | null = null;
    if (classification.type === 'subdomain') {
      slug = classification.slug || null;
    } else {
      slug = await resolveCustomDomain(classification.domain || classification.hostname);
    }

    if (!slug) {
      return new NextResponse('Domain not found or not verified', { status: 404 });
    }

    // Transparent internal rewrite to /store/[slug]
    const subPath = pathname === '/' ? '' : (pathname.startsWith('/') ? pathname : `/${pathname}`);
    const rewritePath = `/store/${slug}${subPath}`;
    const rewriteUrl = new URL(rewritePath, request.url);
    if (request.nextUrl?.search) {
      rewriteUrl.search = request.nextUrl.search;
    }

    const requestHeaders = new Headers(request.headers || {});
    requestHeaders.set('x-plately-tenant-slug', slug);
    requestHeaders.set('x-plately-domain-type', classification.type);

    const rewriteResponse = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });

    rewriteResponse.headers.set('x-plately-tenant-slug', slug);
    rewriteResponse.headers.set('x-plately-domain-type', classification.type);

    return rewriteResponse;
  }

  // 5. Workshop / Administrative / Core traffic pipeline
  const { response, user, supabase } = await updateSession(request);

  // Allow direct store access on workshop domain
  if (pathname.startsWith('/store')) {
    return response;
  }

  // Allow public auth paths
  if (PUBLIC_AUTH_PATHS.some(path => pathname.startsWith(path))) {
    // If already authenticated, redirect away from auth pages
    if (user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  // Protected routes: redirect to login if not authenticated
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user has an associated restaurant (claims or database fallback)
  let restaurantId = (user.app_metadata?.restaurant_id || user.user_metadata?.restaurant_id) as string | undefined;

  if (!restaurantId && supabase) {
    try {
      const { data: staffData } = await supabase
        .from('staff')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (staffData?.restaurant_id) {
        restaurantId = staffData.restaurant_id;
      }
    } catch {
      // Ignored: fallback to onboarding if lookup fails
    }
  }

  // If user already has a restaurant, do not trap them on onboarding
  if (restaurantId && pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user has no restaurant, redirect to onboarding
  if (!restaurantId && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata)
     * - sounds/, images/ (media assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sounds|images).*)',
  ],
};
