export interface MealItem {
  id: string;
  meal_id: string;
  food_id: string;
  quantity: number;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  created_at: Date;
  food_name?: string; // from join
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  meal_time: Date;
  created_at: Date;
  updated_at: Date;
  items?: MealItem[]; // nested items
  total_calories?: number;
  total_proteins?: number;
}
