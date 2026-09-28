export interface MealItem {
  id: string;
  meal_id: string;
  food_id: string;
  quantity: number;
  unit: string;
  display_amount?: number | null;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  created_at: Date;
  food_name?: string; // from join
  food_base_unit?: string;
  food_unit_name?: string | null;
  food_unit_weight?: number | null;
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
