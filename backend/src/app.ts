import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env.js';
import { parseTrustProxy } from './config/trustProxy.js';
import userRoutes from './routes/user.routes.js';
import foodRoutes from './routes/food.routes.js';
import mealRoutes from './routes/meal.routes.js';
import savedMealRoutes from './routes/saved_meal.routes.js';
import pushRoutes from './routes/push.routes.js';
import { pool } from './database/pool.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';

export const app = express();

const corsOrigin = env.CORS_ORIGIN;

const trustProxy = parseTrustProxy(env.TRUST_PROXY);
if (trustProxy !== false) {
  app.set('trust proxy', trustProxy);
}

app.use(requestLogger);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'none'"],
        'base-uri': ["'none'"],
        'form-action': ["'none'"],
        'frame-ancestors': ["'none'"],
        'object-src': ["'none'"],
      },
    },
  })
);
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
app.use('/api/saved-meals', savedMealRoutes);
app.use('/api/push', pushRoutes);

// Health Check com probe ativo do banco
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
