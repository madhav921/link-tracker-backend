import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI env variable is not set');

const client = new MongoClient(MONGO_URI);

let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('tracker');

    // Ensure indexes on clicks collection
    const clicks = db.collection('clicks');
    await clicks.createIndex({ linkId: 1 });
    await clicks.createIndex({ timestamp: 1 });
    await clicks.createIndex({ uniqueKey: 1 });

    console.log('MongoDB connected and indexes ensured');
  }
  return db;
}

export function getDB() {
  if (!db) throw new Error('DB not connected. Call connectDB() first.');
  return db;
}
