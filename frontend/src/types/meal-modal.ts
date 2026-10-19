import type { Food } from '../services/food.service';

export interface MealItem {
  uid: string;
  food: Food;
  quantity: number;
  unit: 'g' | 'ml' | 'un';
  displayAmount: number;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

export interface FoodOption {
  value: string;
  label: string;
  food: Food;
}

// Cálculo nutricional compartilhado importado pelo subpath para otimização do bundle.
export { calculateNutrients } from '@caloriesync/shared/nutrition';
