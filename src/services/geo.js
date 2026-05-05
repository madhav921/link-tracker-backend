/**
 * Lookup geo info for an IP address using ip-api.com free tier.
 * Returns { country, city } or { country: null, city: null } on failure.
 * ip-api.com allows 45 requests/minute on free tier (HTTP only).
 */
export async function lookupGeo(ip) {
  // Skip lookup for private/loopback IPs
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: null, city: null };
  }

  try {
    const { default: fetch } = await import('node-fetch');
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return { country: null, city: null };
    const data = await res.json();
    if (data.status !== 'success') return { country: null, city: null };
    return { country: data.country ?? null, city: data.city ?? null };
  } catch {
    return { country: null, city: null };
  }
}
