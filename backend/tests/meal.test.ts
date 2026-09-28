import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createMealSchema } from '../src/schemas/meal.schema.js';

describe('Meal Schema Validation (createMealSchema)', () => {
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
    const baseCalories = 165;
    const baseProteins = 31;
    const quantity = 150;
    const servingWeight = 100;
    const factor = quantity / servingWeight;

    const calories = Math.round(baseCalories * factor * 10) / 10;
    const proteins = Math.round(baseProteins * factor * 10) / 10;

    assert.strictEqual(calories, 247.5);
    assert.strictEqual(proteins, 46.5);
  });

  it('calcula calorias para 250ml de leite (base 100ml: 60 kcal, 3.2g prot)', () => {
    const baseCalories = 60;
    const baseProteins = 3.2;
    const quantity = 250;
    const servingWeight = 100;
    const factor = quantity / servingWeight;

    const calories = Math.round(baseCalories * factor * 10) / 10;
    const proteins = Math.round(baseProteins * factor * 10) / 10;

    assert.strictEqual(calories, 150);
    assert.strictEqual(proteins, 8);
  });

  it('calcula 2 unidades de ovo (50g por unidade -> 100g, base 100g: 156 kcal)', () => {
    const unitWeight = 50;
    const displayAmount = 2;
    const totalGrams = displayAmount * unitWeight;
    const baseCalories = 156;
    const servingWeight = 100;
    const factor = totalGrams / servingWeight;

    const calories = Math.round(baseCalories * factor * 10) / 10;
    assert.strictEqual(calories, 156);
  });
});
