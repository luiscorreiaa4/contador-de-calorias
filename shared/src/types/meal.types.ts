/**
 * Item de refeição no formato de transporte (wire). `meal_time`/datas podem ser
 * `Date` no backend (driver `pg`) ou `string` (ISO) no frontend.
 */
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
  created_at?: string | Date;
  food_name?: string;
  food_base_unit?: string;
  food_unit_name?: string | null;
  food_unit_weight?: number | null;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  meal_time: string | Date;
  created_at?: string | Date;
  updated_at?: string | Date;
  items: MealItem[];
  total_calories?: number;
  total_proteins?: number;
  total_carbs?: number;
  total_fats?: number;
}

export interface SavedMealItem {
  id: string;
  saved_meal_id: string;
  food_id: string;
  food_name: string;
  food_base_unit: string;
  food_unit_name?: string | null;
  food_unit_weight?: number | null;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  quantity: number;
  unit: string;
  display_amount?: number | null;
}

export interface SavedMeal {
  id: string;
  user_id: string;
  name: string;
  created_at: string | Date;
  updated_at: string | Date;
  items: SavedMealItem[];
  total_calories: number;
  total_proteins: number;
  total_carbs?: number;
  total_fats?: number;
}
