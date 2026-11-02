import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  completeOnboardingSchema,
  updateGoalsSchema,
  createMeasurementSchema,
  createCustomFoodSchema,
  listFoodsQuerySchema,
} from '@caloriesync/shared';

describe('Schema Bounds and Strict Validation (#11)', () => {
  it('completeOnboardingSchema deve rejeitar valores numéricos fora dos limites', () => {
    const baseValid = {
      sex: 'masculino',
      birthDate: '1995-05-15',
      goal: 'perder_peso',
      weight: 70,
      height: 175,
      body_fat: 15,
      activity_level: 'moderadamente_ativo',
    };

    assert.strictEqual(completeOnboardingSchema.safeParse(baseValid).success, true);

    // weight boundary
    assert.strictEqual(
      completeOnboardingSchema.safeParse({ ...baseValid, weight: 500 }).success,
      true,
    );
    assert.strictEqual(
      completeOnboardingSchema.safeParse({ ...baseValid, weight: 501 }).success,
      false,
    );

    // height boundary
    assert.strictEqual(
      completeOnboardingSchema.safeParse({ ...baseValid, height: 300 }).success,
      true,
    );
    assert.strictEqual(
      completeOnboardingSchema.safeParse({ ...baseValid, height: 301 }).success,
      false,
    );

    // body_fat boundary
    assert.strictEqual(
      completeOnboardingSchema.safeParse({ ...baseValid, body_fat: 100 }).success,
      true,
    );
    assert.strictEqual(
      completeOnboardingSchema.safeParse({ ...baseValid, body_fat: 100.1 }).success,
      false,
    );

    // strict rejection
    assert.strictEqual(
      completeOnboardingSchema.safeParse({ ...baseValid, extraField: 'invalid' }).success,
      false,
    );
  });

  it('updateGoalsSchema deve rejeitar metas fora dos tetos e chaves extras', () => {
    const validGoals = {
      calories: 2500,
      proteins: 150,
      carbs: 300,
      fats: 70,
      mode: 'manual',
    };

    assert.strictEqual(updateGoalsSchema.safeParse(validGoals).success, true);

    // calories boundary
    assert.strictEqual(
      updateGoalsSchema.safeParse({ ...validGoals, calories: 15000 }).success,
      true,
    );
    assert.strictEqual(
      updateGoalsSchema.safeParse({ ...validGoals, calories: 15001 }).success,
      false,
    );

    // proteins boundary
    assert.strictEqual(
      updateGoalsSchema.safeParse({ ...validGoals, proteins: 1000 }).success,
      true,
    );
    assert.strictEqual(
      updateGoalsSchema.safeParse({ ...validGoals, proteins: 1001 }).success,
      false,
    );

    // carbs boundary
    assert.strictEqual(updateGoalsSchema.safeParse({ ...validGoals, carbs: 2000 }).success, true);
    assert.strictEqual(updateGoalsSchema.safeParse({ ...validGoals, carbs: 2001 }).success, false);

    // fats boundary
    assert.strictEqual(updateGoalsSchema.safeParse({ ...validGoals, fats: 1000 }).success, true);
    assert.strictEqual(updateGoalsSchema.safeParse({ ...validGoals, fats: 1001 }).success, false);

    // strict rejection
    assert.strictEqual(
      updateGoalsSchema.safeParse({ ...validGoals, unallowedKey: 123 }).success,
      false,
    );
  });

  it('createCustomFoodSchema deve rejeitar pesos de porção excessivos e chaves extras', () => {
    const validFood = {
      name: 'Pão Caseiro Integral',
      calories: 250,
      proteins: 8,
      carbs: 45,
      fats: 3,
      base_unit: 'g',
      serving_weight: 100,
      unit_name: 'fatia',
      unit_weight: 50,
    };

    assert.strictEqual(createCustomFoodSchema.safeParse(validFood).success, true);

    // serving_weight boundary
    assert.strictEqual(
      createCustomFoodSchema.safeParse({ ...validFood, serving_weight: 5000 }).success,
      true,
    );
    assert.strictEqual(
      createCustomFoodSchema.safeParse({ ...validFood, serving_weight: 5001 }).success,
      false,
    );

    // unit_weight boundary
    assert.strictEqual(
      createCustomFoodSchema.safeParse({ ...validFood, unit_weight: 5000 }).success,
      true,
    );
    assert.strictEqual(
      createCustomFoodSchema.safeParse({ ...validFood, unit_weight: 5001 }).success,
      false,
    );

    // strict rejection
    assert.strictEqual(
      createCustomFoodSchema.safeParse({ ...validFood, injected: true }).success,
      false,
    );
  });

  it('listFoodsQuerySchema deve respeitar teto de página', () => {
    assert.strictEqual(listFoodsQuerySchema.safeParse({ page: 1 }).success, true);
    assert.strictEqual(listFoodsQuerySchema.safeParse({ page: 10000 }).success, true);
    assert.strictEqual(listFoodsQuerySchema.safeParse({ page: 10001 }).success, false);
  });

  it('createMeasurementSchema deve ter limite inferior para measured_at e rejeitar chaves extras', () => {
    const validMeasurement = {
      weight: 80,
      body_fat: 20,
      measured_at: '2026-10-01T12:00:00Z',
    };

    assert.strictEqual(createMeasurementSchema.safeParse(validMeasurement).success, true);

    // lower bound for date
    assert.strictEqual(
      createMeasurementSchema.safeParse({
        ...validMeasurement,
        measured_at: '1899-12-31T23:59:59Z',
      }).success,
      false,
    );
    assert.strictEqual(
      createMeasurementSchema.safeParse({
        ...validMeasurement,
        measured_at: '1900-01-01T00:00:00Z',
      }).success,
      true,
    );

    // strict rejection
    assert.strictEqual(
      createMeasurementSchema.safeParse({ ...validMeasurement, unauthorized: 'test' }).success,
      false,
    );
  });
});
