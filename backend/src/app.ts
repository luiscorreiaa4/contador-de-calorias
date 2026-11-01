import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env.js';
import { parseTrustProxy } from './config/trustProxy.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import foodRoutes from './routes/food.routes.js';
import mealRoutes from './routes/meal.routes.js';
import savedMealRoutes from './routes/saved_meal.routes.js';
import pushRoutes from './routes/push.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { pool } from './database/pool.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';

export const app = express();
app.disable('x-powered-by');

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

const allowedOrigins = corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const corsErr = Object.assign(new Error('Origem não permitida por CORS.'), {
        statusCode: 403,
        code: 'FORBIDDEN',
      });
      return callback(corsErr);
    },
    credentials: true,
  })
);

app.use(compression());
app.use(express.json({ limit: '50kb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/saved-meals', savedMealRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/admin', adminRoutes);

// Health Check com probe ativo do banco e timeout dedicado de 2s (A-040)
app.get('/health', async (_req, res) => {
  try {
    const probeQuery = pool.query('SELECT 1');
    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Database probe timeout')), 2000);
      timer.unref();
    });

    try {
      await Promise.race([probeQuery, timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }

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

// Rota exclusiva para testes de compressão (não exposta em produção)
if (env.NODE_ENV === 'test') {
  app.get('/test-compression-payload', (_req, res) => {
    res.json({ data: 'X'.repeat(2048) });
  });
}

// 404 Handler para rotas inexistentes (A-017)
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada.',
  });
});

// Global Error Handler
app.use(errorHandler);
