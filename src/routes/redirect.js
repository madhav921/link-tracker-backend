import { Router } from 'express';
import { getDB } from '../db.js';
import { lookupGeo } from '../services/geo.js';
import { parseDevice } from '../services/device.js';
import { makeUniqueKey } from '../services/uniqueKey.js';

const router = Router();

/**
 * GET /l/:id
 * Resolves the short link, fires async click logging, returns 302 redirect.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const db = getDB();
  const link = await db.collection('links').findOne({ _id: id });

  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  // Capture metadata before redirect
  const ip = (req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? '').toString().split(',')[0].trim();
  const userAgent = req.headers['user-agent'] ?? '';
  const referrer = req.headers['referer'] ?? 'direct';
  const uniqueKey = makeUniqueKey(ip, userAgent);
  const { deviceType, browser, os } = parseDevice(userAgent);

  // Fire-and-forget async logging (does NOT block the redirect)
  (async () => {
    try {
      const { country, city } = await lookupGeo(ip);
      await db.collection('clicks').insertOne({
        linkId: id,
        timestamp: new Date(),
        ip,
        userAgent,
        referrer,
        country,
        city,
        deviceType,
        browser,
        os,
        uniqueKey
      });
    } catch (err) {
      // Logging failure must never break the redirect
      console.error('Click logging error:', err?.message);
    }
  })();

  // Immediate redirect — user is not waiting for geo lookup
  res.redirect(302, link.originalUrl);
});

export default router;
