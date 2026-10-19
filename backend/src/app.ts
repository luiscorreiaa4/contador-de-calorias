import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env.js';
import { parseTrustProxy } from './config/trustProxy.js';
import userRoutes from './routes/user.routes.js';
import foodRoutes from './routes/food.routes.js';
import mealRoutes from './routes/meal.routes.js';
import { pool } from './database/pool.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = express();

const corsOrigin = env.CORS_ORIGIN;

// BL-01 / D-19 — número de saltos confiáveis (nunca `true`).
const trustProxy = parseTrustProxy(env.TRUST_PROXY);
if (trustProxy !== false) {
  app.set('trust proxy', trustProxy);
}

app.use(helmet());
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '50kb' }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meals', mealRoutes);

// Health Check com probe ativo do banco (ARCH-018)
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'Contador de Calorias Backend API',
        database: 'connected',
      },
    });
  } catch {
    res.status(503).json({
      success: false,
      message: 'Database disconnected',
    });
  }
});

// Global Error Handler
app.use(errorHandler);
