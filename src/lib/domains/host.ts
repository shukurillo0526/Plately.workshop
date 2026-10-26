// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Host Parsing & Classification
// ═══════════════════════════════════════════════════════════════

export type HostType = 'workshop' | 'subdomain' | 'custom_domain' | 'reserved';
export type DomainType = 'root' | 'subdomain' | 'custom_domain';

export interface HostClassification {
  type: HostType;
  slug?: string;
  domain?: string;
  subdomain?: string;
  hostname: string;
}

export interface HostParseResult {
  hostname: string;
  port?: string;
  domainType: DomainType;
  subdomain: string | null;
  customDomain: string | null;
}

/**
 * Platform-wide reserved subdomains that cannot be claimed or routed as storefronts.
 */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set<string>([
  // Core Platform & Administrative
  'app',
  'workshop',
  'admin',
  'portal',
  'dashboard',

  // APIs & Services
  'api',
  'auth',
  'static',
  'assets',
  'cdn',
  'media',
  'ws',
  'kds',

  // Standard Internet Protocols & DNS
  'www',
  'mail',
  'smtp',
  'imap',
  'pop',
  'ftp',
  'ns1',
  'ns2',
  'cname',

  // Documentation, Status & Billing
  'docs',
  'support',
  'help',
  'status',
  'health',
  'billing',

  // Environments & Testing
  'dev',
  'staging',
  'test',
  'demo',
  'preview',
]);

/**
 * Standard workshop core hostnames.
 */
export const WORKSHOP_HOSTS: ReadonlySet<string> = new Set<string>([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'app.plately.app',
  'workshop.plately.app',
  'plately.app',
  'plately.uz',
]);

/**
 * Platform base domains supporting branded subdomains.
 */
export const BASE_DOMAINS: readonly string[] = ['plately.app', 'plately.uz', 'localhost'];

/**
 * Extracts and normalizes hostname from a raw host header or URL string.
 * Strips protocol, pathname, trailing ports, and handles comma-separated reverse-proxy headers.
 */
export function extractHostname(rawHost: string | null | undefined): string {
  if (!rawHost) return '';

  let cleaned = rawHost.trim().toLowerCase();
  if (!cleaned) return '';

  // Take first host if comma-separated (e.g. from x-forwarded-host behind proxies)
  if (cleaned.includes(',')) {
    cleaned = cleaned.split(',')[0].trim();
  }

  // Strip protocol if present
  if (cleaned.includes('://')) {
    const afterProtocol = cleaned.split('://')[1];
    cleaned = afterProtocol || '';
  }

  // Strip pathname / query if present
  if (cleaned.includes('/')) {
    cleaned = cleaned.split('/')[0] || '';
  }

  // Handle IPv6 address with port e.g. [::1]:3000 or [::1]
  if (cleaned.startsWith('[')) {
    const closeBracket = cleaned.indexOf(']');
    if (closeBracket !== -1) {
      return cleaned.slice(1, closeBracket);
    }
  }

  // Strip port e.g. localhost:3000 -> localhost
  const [hostname] = cleaned.split(':');
  return hostname.trim();
}

/**
 * Checks whether a subdomain string matches any platform-reserved keyword.
 */
export function isReservedSubdomain(subdomain: string): boolean {
  if (!subdomain) return false;
  const normalized = subdomain.trim().toLowerCase();

  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return true;
  }

  // If multipart (e.g. "admin.branch"), verify each component
  if (normalized.includes('.')) {
    return normalized.split('.').some(part => RESERVED_SUBDOMAINS.has(part));
  }

  return false;
}

/**
 * Classifies an incoming host into Workshop core, Reserved, Branded Subdomain, or Custom Domain.
 */
export function classifyHost(
  rawHost: string | null | undefined,
  baseDomains: readonly string[] = BASE_DOMAINS
): HostClassification {
  const hostname = extractHostname(rawHost);

  if (!hostname) {
    return {
      type: 'workshop',
      hostname: 'localhost',
      domain: 'localhost',
    };
  }

  // 1. Explicit Workshop core hosts
  if (WORKSHOP_HOSTS.has(hostname)) {
    return {
      type: 'workshop',
      hostname,
      domain: hostname,
    };
  }

  // 2. Check against base domains
  for (const base of baseDomains) {
    // Exact match with root domain e.g. "plately.app"
    if (hostname === base) {
      return {
        type: 'workshop',
        hostname,
        domain: hostname,
      };
    }

    const suffix = `.${base}`;
    if (hostname.endsWith(suffix)) {
      const sub = hostname.slice(0, -suffix.length);

      if (!sub) {
        return {
          type: 'workshop',
          hostname,
          domain: hostname,
        };
      }

      if (isReservedSubdomain(sub)) {
        return {
          type: 'reserved',
          subdomain: sub,
          hostname,
          domain: hostname,
        };
      }

      return {
        type: 'subdomain',
        slug: sub,
        subdomain: sub,
        hostname,
        domain: hostname,
      };
    }
  }

  // 3. External Custom Domain (e.g. "order.brand.uz", "eat.restaurant.com")
  return {
    type: 'custom_domain',
    domain: hostname,
    hostname,
  };
}

/**
 * Compatibility helper matching Survey 1 / test specification.
 */
export function parseIncomingHost(
  hostHeader: string | null | undefined,
  baseDomains: readonly string[] = BASE_DOMAINS
): HostParseResult {
  const hostname = extractHostname(hostHeader);
  const raw = hostHeader ? hostHeader.split(',')[0].trim().toLowerCase() : '';
  const port = raw.includes(':') && !raw.startsWith('[') ? raw.split(':')[1] : undefined;

  const classification = classifyHost(hostHeader, baseDomains);

  if (classification.type === 'workshop' || classification.type === 'reserved') {
    return {
      hostname: hostname || 'localhost',
      port,
      domainType: 'root',
      subdomain: classification.subdomain || null,
      customDomain: null,
    };
  }

  if (classification.type === 'subdomain') {
    return {
      hostname,
      port,
      domainType: 'subdomain',
      subdomain: classification.subdomain || null,
      customDomain: null,
    };
  }

  return {
    hostname,
    port,
    domainType: 'custom_domain',
    subdomain: null,
    customDomain: hostname,
  };
}
