import { closeTestPool } from './helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createMealSchema } from '@caloriesync/shared';
import { calculateItemNutrients } from '../src/services/meal.service.js';

describe('Meal Schema Validation (createMealSchema)', () => {
  closeTestPool();
  it('deve validar refeição com alimentos em gramas', () => {
    const data = {
      name: 'Almoço',
      mealTime: new Date().toISOString(),
      items: [
        {
          foodId: '0a7df39a-6e78-458c-9338-c14a955536fe',
          quantity: 150,
          unit: 'g' as const,
        },
      ],
    };

    const result = createMealSchema.safeParse(data);
    assert.strictEqual(result.success, true);
  });

  it('deve validar refeição com alimentos em ml', () => {
    const data = {
      name: 'Café da Manhã',
      mealTime: new Date().toISOString(),
      items: [
        {
          foodId: '0a7df39a-6e78-458c-9338-c14a955536fe',
          quantity: 200,
          unit: 'ml' as const,
        },
      ],
    };

    const result = createMealSchema.safeParse(data);
    assert.strictEqual(result.success, true);
  });

  it('deve validar refeição com modo de unidade e displayAmount', () => {
    const data = {
      name: 'Café da Manhã',
      mealTime: new Date().toISOString(),
      items: [
        {
          foodId: '0a7df39a-6e78-458c-9338-c14a955536fe',
          quantity: 100,
          unit: 'un' as const,
          displayAmount: 2,
        },
      ],
    };

    const result = createMealSchema.safeParse(data);
    assert.strictEqual(result.success, true);
  });

  it('deve rejeitar quantidade menor ou igual a zero', () => {
    const data = {
      name: 'Almoço',
      mealTime: new Date().toISOString(),
      items: [
        {
          foodId: '0a7df39a-6e78-458c-9338-c14a955536fe',
          quantity: 0,
        },
      ],
    };

    const result = createMealSchema.safeParse(data);
    assert.strictEqual(result.success, false);
  });
});

describe('Nutritional Factor Calculations', () => {
  it('calcula calorias e macros para 150g de frango (base 100g: 165 kcal, 31g prot)', () => {
    const result = calculateItemNutrients(
      { foodId: 'food-1', quantity: 150, unit: 'g' },
      { id: 'food-1', base_unit: 'g', serving_weight: 100, calories: 165, proteins: 31, carbs: 0, fats: 3.6 }
    );

    assert.strictEqual(result.calories, 247.5);
    assert.strictEqual(result.proteins, 46.5);
  });

  it('calcula calorias para 250ml de leite (base 100ml: 60 kcal, 3.2g prot)', () => {
    const result = calculateItemNutrients(
      { foodId: 'food-2', quantity: 250, unit: 'ml' },
      { id: 'food-2', base_unit: 'ml', serving_weight: 100, calories: 60, proteins: 3.2, carbs: 5, fats: 3 }
    );

    assert.strictEqual(result.calories, 150);
    assert.strictEqual(result.proteins, 8);
  });

  it('calcula 2 unidades de ovo (50g por unidade -> 100g, base 100g: 156 kcal)', () => {
    const result = calculateItemNutrients(
      { foodId: 'food-3', quantity: 2, unit: 'un', displayAmount: 2 },
      { id: 'food-3', base_unit: 'g', unit_weight: 50, serving_weight: 100, calories: 156, proteins: 12.6, carbs: 1.2, fats: 10.6 }
    );

    assert.strictEqual(result.quantity, 100);
    assert.strictEqual(result.calories, 156);
  });
});
