import { app } from './app.js';
import { env } from './config/env.js';
import userRoutes from './routes/user.routes.js';
import foodRoutes from './routes/food.routes.js';
import mealRoutes from './routes/meal.routes.js';

const PORT = env.PORT;

app.use('/api/users', userRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meals', mealRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando com sucesso na porta ${PORT}`);
  console.log(`📡 URL base: http://localhost:${PORT}/api`);
});
