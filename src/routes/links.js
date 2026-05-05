import { Router } from 'express';
import { nanoid } from 'nanoid';
import { getDB } from '../db.js';

const router = Router();

// Allowed protocols for URLs
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return ALLOWED_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * POST /links
 * Body: { originalUrl: string, title?: string }
 * Returns: { shortId, shortUrl, originalUrl, createdAt }
 */
router.post('/', async (req, res) => {
  const { originalUrl, title } = req.body ?? {};

  if (!originalUrl || typeof originalUrl !== 'string') {
    return res.status(400).json({ error: 'originalUrl is required' });
  }

  if (!isValidUrl(originalUrl)) {
    return res.status(400).json({ error: 'originalUrl must be a valid http or https URL' });
  }

  const shortId = nanoid(8);
  const createdAt = new Date();

  const doc = { _id: shortId, originalUrl, createdAt };
  if (title && typeof title === 'string') doc.title = title.slice(0, 200);

  const db = getDB();
  await db.collection('links').insertOne(doc);

  const baseUrl = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

  res.status(201).json({
    shortId,
    shortUrl: `${baseUrl}/l/${shortId}`,
    originalUrl,
    createdAt
  });
});

/**
 * GET /links
 * Returns all links with their total click counts.
 */
router.get('/', async (_req, res) => {
  const db = getDB();
  const links = await db.collection('links').find({}).sort({ createdAt: -1 }).toArray();

  // Batch count clicks per link
  const linkIds = links.map(l => l._id);
  const clickCounts = await db.collection('clicks').aggregate([
    { $match: { linkId: { $in: linkIds } } },
    { $group: { _id: '$linkId', totalClicks: { $sum: 1 } } }
  ]).toArray();

  const countMap = Object.fromEntries(clickCounts.map(c => [c._id, c.totalClicks]));
  const baseUrl = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

  const result = links.map(l => ({
    shortId: l._id,
    shortUrl: `${baseUrl}/l/${l._id}`,
    originalUrl: l.originalUrl,
    title: l.title ?? null,
    createdAt: l.createdAt,
    totalClicks: countMap[l._id] ?? 0
  }));

  res.json(result);
});

export default router;
