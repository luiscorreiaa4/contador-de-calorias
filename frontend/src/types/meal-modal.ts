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

export function calculateNutrients(food: Food, quantityInBaseUnit: number) {
  const serving = Number(food.serving_weight) || 100;
  const factor = quantityInBaseUnit / serving;
  return {
    calories: Math.round(Number(food.calories) * factor * 10) / 10,
    proteins: Math.round(Number(food.proteins) * factor * 10) / 10,
    carbs: Math.round(Number(food.carbs) * factor * 10) / 10,
    fats: Math.round(Number(food.fats) * factor * 10) / 10,
  };
}
