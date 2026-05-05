import { UAParser } from 'ua-parser-js';

/**
 * Parse a User-Agent string into device type, browser, and OS.
 * @param {string} userAgent
 * @returns {{ deviceType: string, browser: string, os: string }}
 */
export function parseDevice(userAgent) {
  if (!userAgent) return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const deviceType = result.device?.type ?? 'desktop'; // ua-parser returns undefined for desktop
  const browser = result.browser?.name ?? 'unknown';
  const os = result.os?.name ?? 'unknown';

  return { deviceType, browser, os };
}
