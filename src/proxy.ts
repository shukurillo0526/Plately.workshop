// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Proxy (Next.js 16 convention)
// ═══════════════════════════════════════════════════════════════
// Note: In Next.js 16, "middleware" was renamed to "proxy".
// The file must export a function named `proxy` (not `middleware`).

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_AUTH_PATHS = ['/login', '/signup'];

export async function proxy(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Allow public restaurant guest storefronts
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

  // Allow API routes and webhooks
  if (pathname.startsWith('/api/')) {
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
     * - sounds/ (audio assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sounds).*)',
  ],
};
