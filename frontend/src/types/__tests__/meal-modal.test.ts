import { describe, it, expect } from 'vitest';
import { calculateItemNutrients } from '@caloriesync/shared/nutrition';
import { calculateNutrients } from '../meal-modal';

/**
 * BL-03 / D-17 — paridade do cálculo nutricional compartilhado. Os mesmos
 * fixtures e resultados são verificados no backend (`backend/tests/meal.test.ts`).
 */
describe('Cálculo nutricional compartilhado (BL-03 / D-17)', () => {
  it('calcula calorias e macros para 150g de frango (base 100g: 165 kcal, 31g prot)', () => {
    const result = calculateItemNutrients(
      { foodId: 'food-1', quantity: 150, unit: 'g' },
      { id: 'food-1', base_unit: 'g', serving_weight: 100, calories: 165, proteins: 31, carbs: 0, fats: 3.6 }
    );

    expect(result.calories).toBe(247.5);
    expect(result.proteins).toBe(46.5);
  });

  it('calcula calorias para 250ml de leite (base 100ml: 60 kcal, 3.2g prot)', () => {
    const result = calculateItemNutrients(
      { foodId: 'food-2', quantity: 250, unit: 'ml' },
      { id: 'food-2', base_unit: 'ml', serving_weight: 100, calories: 60, proteins: 3.2, carbs: 5, fats: 3 }
    );

    expect(result.calories).toBe(150);
    expect(result.proteins).toBe(8);
  });

  it('calcula 2 unidades de ovo (50g por unidade -> 100g, base 100g: 156 kcal)', () => {
    const result = calculateItemNutrients(
      { foodId: 'food-3', quantity: 2, unit: 'un', displayAmount: 2 },
      { id: 'food-3', base_unit: 'g', unit_weight: 50, serving_weight: 100, calories: 156, proteins: 12.6, carbs: 1.2, fats: 10.6 }
    );

    expect(result.quantity).toBe(100);
    expect(result.calories).toBe(156);
  });

  it('usa a mesma regra de três do backend para a quantidade na unidade base', () => {
    const result = calculateNutrients(
      { base_unit: 'g', serving_weight: 100, calories: 165, proteins: 31, carbs: 0, fats: 3.6 },
      150
    );

    expect(result).toEqual({ calories: 247.5, proteins: 46.5, carbs: 0, fats: 5.4 });
  });
});
