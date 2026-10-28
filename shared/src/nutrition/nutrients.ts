/**
 * BL-03 / D-17 — Cálculo nutricional compartilhado entre frontend e backend.
 *
 * Fonte única da verdade para a regra de três sobre `serving_weight` (base 100 g/ml)
 * e para a conversão de unidades (`un` ↔ gramas via `unit_weight`). Antes existiam
 * implementações duplicadas em `backend/src/services/meal.service.ts` e em
 * `frontend/src/types/meal-modal.ts`; cobertas por testes de paridade em ambos os lados.
 */

export interface NutrientValues {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

export interface FoodNutrientSource {
  id?: string;
  calories: number | string;
  proteins: number | string;
  carbs: number | string;
  fats: number | string;
  serving_weight: number | string;
  base_unit?: string;
  unit_weight?: number | string | null;
}

export interface MealItemInput {
  foodId: string;
  quantity: number;
  unit?: 'g' | 'ml' | 'un';
  displayAmount?: number;
}

export interface CalculatedMealItem extends NutrientValues {
  foodId: string;
  quantity: number;
  unit: string;
  displayAmount?: number;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Regra de três dos macros a partir da quantidade já normalizada na unidade base
 * (g/ml). Base padrão de 100 g/ml quando `serving_weight` não é informado.
 */
export function calculateNutrients(food: FoodNutrientSource, quantityInBaseUnit: number): NutrientValues {
  const serving =
    food.serving_weight != null && !isNaN(Number(food.serving_weight)) && Number(food.serving_weight) > 0
      ? Number(food.serving_weight)
      : 100;
  const factor = quantityInBaseUnit / serving;
  return {
    calories: roundToTenth(Number(food.calories) * factor),
    proteins: roundToTenth(Number(food.proteins) * factor),
    carbs: roundToTenth(Number(food.carbs) * factor),
    fats: roundToTenth(Number(food.fats) * factor),
  };
}

/**
 * Resolve a quantidade final em gramas (considerando `un` + `unit_weight`),
 * o `displayAmount` e os macros do item da refeição.
 */
export function calculateItemNutrients(item: MealItemInput, food: FoodNutrientSource): CalculatedMealItem {
  let finalQuantity = Number(item.quantity);
  let displayAmount =
    item.displayAmount !== undefined && item.displayAmount !== null ? Number(item.displayAmount) : undefined;
  const unit = item.unit || food.base_unit || 'g';

  // Se a unidade for 'un'
  if (unit === 'un') {
    if (food.unit_weight != null && !isNaN(Number(food.unit_weight)) && Number(food.unit_weight) > 0) {
      if (displayAmount === undefined) {
        displayAmount = finalQuantity;
      }
      finalQuantity = displayAmount * Number(food.unit_weight);
    } else if (food.serving_weight != null && !isNaN(Number(food.serving_weight)) && Number(food.serving_weight) > 0) {
      // Fallback para porção cadastrada quando unidade não tiver peso específico
      if (displayAmount === undefined) {
        displayAmount = finalQuantity;
      }
      finalQuantity = displayAmount * Number(food.serving_weight);
    } else {
      // Fallback conservador para porção padrão (100g)
      if (displayAmount === undefined) {
        displayAmount = finalQuantity;
      }
      finalQuantity = displayAmount * 100;
    }
  } else if (displayAmount === undefined) {
    displayAmount = finalQuantity;
  }

  return {
    foodId: food.id ?? item.foodId,
    quantity: finalQuantity,
    unit,
    displayAmount,
    ...calculateNutrients(food, finalQuantity),
  };
}
