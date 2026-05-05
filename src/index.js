import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectDB } from './db.js';
import linksRouter from './routes/links.js';
import redirectRouter from './routes/redirect.js';
import analyticsRouter from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Trust Railway's reverse proxy for correct IP forwarding
app.set('trust proxy', 1);

// CORS — allow the frontend origin
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : '*'
}));

app.use(express.json());

// Rate limiting
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const redirectLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});

// Health check (no DB required)
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/links', createLimiter, linksRouter);
app.use('/l', redirectLimiter, redirectRouter);
app.use('/analytics', analyticsRouter);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Connect to DB then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
