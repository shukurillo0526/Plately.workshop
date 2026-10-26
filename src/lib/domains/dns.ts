// ═══════════════════════════════════════════════════════════════
// Plately Workshop — In-App DNS Record Verification Engine
// ═══════════════════════════════════════════════════════════════

import dns from 'node:dns/promises';

export interface DnsVerificationResult {
  verified: boolean;
  method?: 'CNAME' | 'TXT';
  cnameRecord?: string;
  txtRecords?: string[];
  error?: string;
}

export const EXPECTED_CNAME_TARGET = 'cname.plately.app';
export const TXT_CHALLENGE_PREFIX = '_plately-challenge';

/**
 * Generates the expected TXT challenge record hostname for a domain.
 * e.g., "order.brand.uz" -> "_plately-challenge.order.brand.uz"
 */
export function getTxtChallengeHostname(domain: string): string {
  const clean = domain.trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  return `${TXT_CHALLENGE_PREFIX}.${clean}`;
}

/**
 * Performs automated DNS verification for custom domains using node:dns/promises.
 * Checks:
 * 1. CNAME record on domain pointing to cname.plately.app
 * 2. TXT record on _plately-challenge.<domain> containing verificationToken
 * 3. Fallback TXT record on root domain containing verificationToken
 */
export async function verifyDomainDns(
  domain: string | null | undefined,
  verificationToken: string | null | undefined
): Promise<DnsVerificationResult> {
  if (!domain || !domain.trim()) {
    return {
      verified: false,
      error: 'Domain is required for DNS verification.',
    };
  }

  if (!verificationToken || !verificationToken.trim()) {
    return {
      verified: false,
      error: 'Verification token is required for DNS verification.',
    };
  }

  const normalizedDomain = domain.trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  const token = verificationToken.trim();

  // 1. Check CNAME record
  try {
    const cnames = await dns.resolveCname(normalizedDomain);
    if (Array.isArray(cnames) && cnames.length > 0) {
      const match = cnames.find(c => {
        const cleanCname = c.trim().toLowerCase().replace(/\.$/, '');
        return cleanCname === EXPECTED_CNAME_TARGET || cleanCname.endsWith('.plately.app');
      });

      if (match) {
        return {
          verified: true,
          method: 'CNAME',
          cnameRecord: match,
        };
      }
    }
  } catch {
    // CNAME resolution failure (ENOTFOUND, ENODATA, etc.) is expected if operator chose TXT
  }

  // 2. Check TXT challenge record on _plately-challenge.<domain>
  const challengeHost = getTxtChallengeHostname(normalizedDomain);
  try {
    const txtRecords = await dns.resolveTxt(challengeHost);
    if (Array.isArray(txtRecords) && txtRecords.length > 0) {
      const flat = txtRecords.flat().map(t => t.trim());
      const match = flat.find(t =>
        t === token ||
        t === `plately-verify=${token}` ||
        t.includes(token)
      );

      if (match) {
        return {
          verified: true,
          method: 'TXT',
          txtRecords: flat,
        };
      }
    }
  } catch {
    // Challenge TXT resolution failure is expected if not yet configured
  }

  // 3. Fallback: Check TXT record on apex/root domain
  try {
    const apexTxt = await dns.resolveTxt(normalizedDomain);
    if (Array.isArray(apexTxt) && apexTxt.length > 0) {
      const flatApex = apexTxt.flat().map(t => t.trim());
      const match = flatApex.find(t =>
        t === token ||
        t === `plately-verify=${token}` ||
        t.includes(token)
      );

      if (match) {
        return {
          verified: true,
          method: 'TXT',
          txtRecords: flatApex,
        };
      }
    }
  } catch {
    // Apex TXT resolution failure
  }

  return {
    verified: false,
    error: `Neither a valid CNAME pointing to ${EXPECTED_CNAME_TARGET} nor a TXT challenge record containing the verification token was detected for ${normalizedDomain}.`,
  };
}
