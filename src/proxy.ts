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
  const { response, user } = await updateSession(request);
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

  // Check if user needs onboarding (no restaurant_id in claims)
  const restaurantId = user.app_metadata?.restaurant_id;
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
