import { Router } from 'express';
import { getDB } from '../db.js';
import {
  getTotalClicks,
  getUniqueUsers,
  getTimeSeries,
  getCountryBreakdown,
  getDeviceBreakdown
} from '../services/analytics.js';

const router = Router();

/**
 * GET /analytics/:id
 * Returns full analytics for a short link.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const db = getDB();
  const link = await db.collection('links').findOne({ _id: id });

  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const [totalClicks, uniqueUsers, timeSeries, countryBreakdown, deviceBreakdown] = await Promise.all([
    getTotalClicks(id),
    getUniqueUsers(id),
    getTimeSeries(id),
    getCountryBreakdown(id),
    getDeviceBreakdown(id)
  ]);

  res.json({
    shortId: id,
    originalUrl: link.originalUrl,
    title: link.title ?? null,
    createdAt: link.createdAt,
    totalClicks,
    uniqueUsers,
    timeSeries,
    countryBreakdown,
    deviceBreakdown
  });
});

export default router;
