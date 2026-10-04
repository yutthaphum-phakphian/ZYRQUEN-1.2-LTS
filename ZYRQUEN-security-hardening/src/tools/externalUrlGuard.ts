import { promises as dns } from 'node:dns';
import net from 'node:net';

const now = () => new Date().toISOString();
const privateHost = (host: string) => {
  const h = host.toLowerCase().replace(/[\[\]]/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h === 'metadata.google.internal' || h === 'instance-data.ec2.internal') return true;
  if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(h)) return true;
  const m = h.match(/^172\.(\d+)\./);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  if (h === '::1' || h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true;
  return false;
};
const privateIp = (ip: string) => {
  if (net.isIPv4(ip)) {
    const [a,b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 169 && b === 254 || a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31 || a === 0;
  }
  const h = ip.toLowerCase();
  return h === '::1' || h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd') || h === '::';
};

export interface ExternalUrlCheck { decision: 'ALLOW' | 'DENY' | 'UNKNOWN'; url: string; reasons: string[]; checkedAt: string; }

function parseAllowedDomains(raw: string[] = []) { return raw.map((d) => d.trim().toLowerCase().replace(/^\.+/, '')).filter(Boolean); }
function domainAllowed(host: string, domains: string[]) { return domains.some((d) => host === d || host.endsWith(`.${d}`)); }

export function validateExternalUrl(raw: string, allowedDomains: string[] = []): ExternalUrlCheck {
  const reasons: string[] = [];
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    const domains = parseAllowedDomains(allowedDomains);
    if (u.protocol !== 'https:') reasons.push('HTTPS_REQUIRED');
    if (u.username || u.password) reasons.push('URL_USERINFO_BLOCKED');
    if (!host || privateHost(host)) reasons.push('PRIVATE_OR_METADATA_HOST_BLOCKED');
    if (!domains.length) reasons.push('EXPLICIT_DOMAIN_ALLOWLIST_REQUIRED');
    else if (!domainAllowed(host, domains)) reasons.push('DOMAIN_NOT_ALLOWLISTED');
    if (reasons.some((r) => r !== 'EXPLICIT_DOMAIN_ALLOWLIST_REQUIRED')) return { decision: 'DENY', url: raw, reasons, checkedAt: now() };
    return { decision: 'UNKNOWN', url: raw, reasons: ['DNS_TARGET_REQUIRES_RUNTIME_RESOLUTION', 'REDIRECTS_MUST_BE_DISABLED_OR_REVALIDATED'], checkedAt: now() };
  } catch { return { decision: 'DENY', url: raw, reasons: ['INVALID_URL'], checkedAt: now() }; }
}

export async function validateExternalUrlResolved(raw: string, allowedDomains: string[] = []): Promise<ExternalUrlCheck> {
  const base = validateExternalUrl(raw, allowedDomains);
  if (base.decision === 'DENY') return base;
  try {
    const u = new URL(raw);
    const addresses = net.isIP(u.hostname) ? [u.hostname] : (await dns.lookup(u.hostname, { all: true })).map((x) => x.address);
    if (!addresses.length || addresses.some(privateIp)) return { decision: 'DENY', url: raw, reasons: ['DNS_RESOLVES_TO_PRIVATE_OR_LOCAL_ADDRESS'], checkedAt: now() };
    return { decision: 'ALLOW', url: raw, reasons: ['HTTPS_VALIDATED', 'DOMAIN_ALLOWLIST_VALIDATED', 'DNS_RESOLVED_PUBLIC_ADDRESS', 'REDIRECTS_DISABLED'], checkedAt: now() };
  } catch { return { decision: 'DENY', url: raw, reasons: ['DNS_RESOLUTION_FAILED'], checkedAt: now() }; }
}
