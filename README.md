# Link Tracker — Backend API

Express.js REST API that generates short links, logs click events with geo + device enrichment, and serves analytics aggregates.

## API Reference

### `POST /links`
Create a short link.

**Body**
```json
{ "originalUrl": "https://example.com", "title": "optional label" }
```

**Response `201`**
```json
{
  "shortId": "fyGZWvCN",
  "shortUrl": "https://your-backend.railway.app/l/fyGZWvCN",
  "originalUrl": "https://example.com",
  "createdAt": "2026-05-05T12:00:00.000Z"
}
```

---

### `GET /l/:id`
Redirect to original URL and asynchronously log the click event.  
Returns **`302`** with `Location` header. Does **not** block on geo lookup.

---

### `GET /links`
List all short links with total click counts.

**Response `200`** — array of link objects, sorted newest first.

---

### `GET /analytics/:id`
Full analytics for a single link.

**Response `200`**
```json
{
  "shortId": "fyGZWvCN",
  "originalUrl": "https://example.com",
  "totalClicks": 42,
  "uniqueUsers": 17,
  "timeSeries": [{ "date": "2026-05-05", "count": 10 }],
  "countryBreakdown": [{ "country": "India", "count": 30 }],
  "deviceBreakdown": [{ "deviceType": "desktop", "count": 28 }]
}
```

---

### `GET /health`
Returns `{ "status": "ok" }` — no DB required.

---

## Stack

- Node.js (ESM) + Express
- MongoDB Atlas (via official `mongodb` driver)
- `nanoid` — 8-char URL-safe short IDs
- `ua-parser-js` — device / browser / OS parsing
- `ip-api.com` — free IP geo lookup (fire-and-forget)
- `express-rate-limit` — basic rate limiting
- `dotenv` — local env loading

## Data Model

**`links`**
```
_id (shortId)  |  originalUrl  |  title?  |  createdAt
```

**`clicks`**
```
linkId  |  timestamp  |  ip  |  userAgent  |  referrer
country  |  city  |  deviceType  |  browser  |  os  |  uniqueKey
```
`uniqueKey = sha256(ip + userAgent)` — used for unique visitor counting.

## Indexes (created automatically on startup)
- `clicks.linkId` (asc)
- `clicks.timestamp` (asc)
- `clicks.uniqueKey` (asc)

## Local Development

```bash
# 1. Clone
git clone https://github.com/madhav921/link-tracker-backend.git
cd link-tracker-backend

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Fill in MONGO_URI, BASE_URL, PORT

# 4. Run
npm start
# or hot-reload:
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `BASE_URL` | ✅ | Public URL of this backend (used to build shortUrl) |
| `PORT` | optional | Defaults to `3000` |
| `ALLOWED_ORIGINS` | optional | Comma-separated CORS origins (e.g. your Vercel URL) |

## Deploy to Railway

1. Create a new project from this GitHub repo in [Railway](https://railway.app)
2. Add environment variables (see table above)
3. Add MongoDB Atlas IP **0.0.0.0/0** to Atlas Network Access (or restrict to Railway's egress IPs)
4. Railway auto-deploys on every push to `main`

## Project Structure

```
src/
├── index.js                  # Express entry point
├── db.js                     # MongoClient singleton + index setup
├── routes/
│   ├── links.js              # POST /links, GET /links
│   ├── redirect.js           # GET /l/:id
│   └── analytics.js          # GET /analytics/:id
└── services/
    ├── geo.js                # ip-api.com lookup
    ├── device.js             # ua-parser-js wrapper
    ├── uniqueKey.js          # sha256 visitor fingerprint
    └── analytics.js          # MongoDB aggregation helpers
```

## Rate Limits

| Route | Window | Max requests |
|---|---|---|
| `POST /links` | 15 min | 50 per IP |
| `GET /l/:id` | 1 min | 120 per IP |

## Security Notes

- URLs are validated for `http:`/`https:` protocol before storage
- IP addresses are **hashed** before storage (sha256 via `uniqueKey`)
- Raw IPs are stored for geo lookup only and never returned via API
- CORS origin allowlist configurable via `ALLOWED_ORIGINS`
