import { getDB } from '../db.js';

/**
 * Total click count for a link.
 */
export async function getTotalClicks(linkId) {
  const db = getDB();
  return db.collection('clicks').countDocuments({ linkId });
}

/**
 * Unique visitor count based on hashed (ip+ua) key.
 */
export async function getUniqueUsers(linkId) {
  const db = getDB();
  const keys = await db.collection('clicks').distinct('uniqueKey', { linkId });
  return keys.length;
}

/**
 * Daily time series — array of { date: "YYYY-MM-DD", count: N }
 */
export async function getTimeSeries(linkId) {
  const db = getDB();
  return db.collection('clicks').aggregate([
    { $match: { linkId } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1 } }
  ]).toArray();
}

/**
 * Click count grouped by country.
 */
export async function getCountryBreakdown(linkId) {
  const db = getDB();
  return db.collection('clicks').aggregate([
    { $match: { linkId } },
    { $group: { _id: '$country', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, country: { $ifNull: ['$_id', 'Unknown'] }, count: 1 } }
  ]).toArray();
}

/**
 * Click count grouped by device type.
 */
export async function getDeviceBreakdown(linkId) {
  const db = getDB();
  return db.collection('clicks').aggregate([
    { $match: { linkId } },
    { $group: { _id: '$deviceType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, deviceType: { $ifNull: ['$_id', 'desktop'] }, count: 1 } }
  ]).toArray();
}
