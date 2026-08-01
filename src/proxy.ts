// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Proxy (Next.js 16 convention)
// ═══════════════════════════════════════════════════════════════
// Note: In Next.js 16, "middleware" was renamed to "proxy".
// The file must export a function named `proxy` (not `middleware`).

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/signup'];

export async function proxy(request: NextRequest) {
  // Update the Supabase session (refreshes auth cookies)
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Allow public paths without auth check
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return response;
  }

  // TODO: Check auth status and redirect to /login if not authenticated
  // This will be fully wired once Supabase credentials are configured.
  // For now, allow all authenticated routes through.

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
