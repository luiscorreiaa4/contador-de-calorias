CREATE INDEX IF NOT EXISTS idx_meals_user_id_meal_time ON meals(user_id, meal_time DESC);
