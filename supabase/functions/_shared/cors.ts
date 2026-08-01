// ═══════════════════════════════════════════════════════════════
// Plately — Shared CORS Headers for Supabase Edge Functions
// ═══════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  'https://theplately.com',
  'https://www.theplately.com',
  'https://app.theplately.com',
  'https://workshop.theplately.com',
];

// Add localhost origins in development
if (Deno.env.get('ENVIRONMENT') === 'development') {
  ALLOWED_ORIGINS.push(
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:54321', // Supabase local
  );
}

/**
 * Generate CORS response headers for a given request.
 * Only allows requests from known Plately domains.
 */
export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Authorization, Content-Type, x-client-info, apikey',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle CORS preflight (OPTIONS) requests.
 */
export function handleCorsOptions(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * on webhook signature validation.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validate HMAC-SHA256 signature of a webhook payload.
 */
export async function validateHmacSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return timingSafeEqual(signature, expectedSignature);
}
