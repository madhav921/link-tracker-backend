import { createHash } from 'crypto';

/**
 * Compute a stable, privacy-safe unique key for a visitor.
 * Uses SHA-256(ip + userAgent) — never stored in plaintext.
 * @param {string} ip
 * @param {string} userAgent
 * @returns {string}
 */
export function makeUniqueKey(ip, userAgent) {
  const raw = `${ip ?? ''}|${userAgent ?? ''}`;
  return createHash('sha256').update(raw).digest('hex');
}
