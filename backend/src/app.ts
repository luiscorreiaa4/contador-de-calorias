import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = express();

const corsOrigin = env.CORS_ORIGIN;

app.use(helmet());
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

app.use(express.json());

import foodRoutes from './routes/food.routes.js';
import mealRoutes from './routes/meal.routes.js';

// Routes
app.use('/api/users', userRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meals', mealRoutes);

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Contador de Calorias Backend API' });
});

// Global Error Handler
app.use(errorHandler);
