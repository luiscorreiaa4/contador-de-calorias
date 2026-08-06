import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

export const app = express();

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/users', userRoutes);

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Contador de Calorias Backend API' });
});

// Global Error Handler
app.use(errorHandler);
