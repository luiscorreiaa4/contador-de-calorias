import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateEnergyTargets, calculateAge, UserProfile } from '../../src/services/nutrition.service.js';
import { calculateItemNutrients } from '@caloriesync/shared';

describe('calculateAge (CA-09)', () => {
  it('não deve adiantar a idade no dia anterior ao aniversário (fuso BRT)', () => {
    // Nascido em 15 de maio de 1990
    const birthDate = '1990-05-15';

    // 14 de maio de 2026 (véspera do aniversário de 36 anos) -> deve ter 35 anos
    const eve = new Date(2026, 4, 14); // Mês 4 é maio (0-indexed)
    assert.strictEqual(calculateAge(birthDate, eve), 35);

    // 15 de maio de 2026 (dia do aniversário) -> deve ter 36 anos
    const birthday = new Date(2026, 4, 15);
    assert.strictEqual(calculateAge(birthDate, birthday), 36);
  });

  it('deve calcular corretamente a idade para nascidos em 01 de janeiro', () => {
    const birthDate = '1990-01-01';

    // 31 de dezembro de 2025 (véspera) -> deve ter 35 anos
    const eve = new Date(2025, 11, 31);
    assert.strictEqual(calculateAge(birthDate, eve), 35);

    // 01 de janeiro de 2026 (aniversário) -> deve ter 36 anos
    const birthday = new Date(2026, 0, 1);
    assert.strictEqual(calculateAge(birthDate, birthday), 36);
  });
});

describe('Nutrition Service (Unit)', () => {
  const today = new Date();
  // Cria data de nascimento 30 anos atrás exatos para teste
  const birthDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate()).toISOString();

  it('deve calcular TMB e TDEE via Mifflin-St Jeor (Masculino)', () => {
    const profile: UserProfile = {
      sex: 'masculino',
      birthDate,
      weight: 80,
      height: 180,
      activity_level: 'sedentario',
      goal: 'manter_peso',
    };

    const targets = calculateEnergyTargets(profile);
    
    // TMB: (10 * 80) + (6.25 * 180) - (5 * 30) + 5 = 800 + 1125 - 150 + 5 = 1780
    assert.strictEqual(targets.tmb, 1780);
    // TDEE: 1780 * 1.2 = 2136
    assert.strictEqual(targets.tdee, 2136);
    // Suggested calories: 2136 (manter)
    assert.strictEqual(targets.suggestedCalories, 2136);
    // Macros conforme D-15: 1.6g/kg Prot (128g), 25% Fat (59g) e restante em Carbs (273g)
    assert.strictEqual(targets.suggestedMacros.proteins, 128);
    assert.strictEqual(targets.suggestedMacros.fats, 59);
    assert.strictEqual(targets.suggestedMacros.carbs, 273);
  });

  it('deve calcular TMB via Mifflin-St Jeor (Feminino)', () => {
    const profile: UserProfile = {
      sex: 'feminino',
      birthDate,
      weight: 60,
      height: 160,
      activity_level: 'moderadamente_ativo',
      goal: 'perder_peso',
    };

    const targets = calculateEnergyTargets(profile);
    
    // TMB: (10 * 60) + (6.25 * 160) - (5 * 30) - 161 = 600 + 1000 - 150 - 161 = 1289
    assert.strictEqual(targets.tmb, 1289);
    // TDEE: 1289 * 1.55 = 1997.95 -> 1998
    assert.strictEqual(targets.tdee, 1998);
    // Goal perder_peso: 1997.95 * 0.8 = 1598.36 -> 1598
    assert.strictEqual(targets.suggestedCalories, 1598);
  });

  it('deve usar Katch-McArdle se houver percentual de gordura', () => {
    const profile: UserProfile = {
      sex: 'masculino',
      birthDate,
      weight: 80,
      height: 180,
      body_fat: 15,
      activity_level: 'sedentario',
      goal: 'manter_peso',
    };

    const targets = calculateEnergyTargets(profile);
    
    // LBM = 80 * (1 - 0.15) = 68
    // TMB = 370 + 21.6 * 68 = 1838.8 -> 1839
    assert.strictEqual(targets.tmb, 1839);
    // TDEE = 1838.8 * 1.2 = 2206.56 -> 2207
    assert.strictEqual(targets.tdee, 2207);
  });

  it('deve respeitar o piso mínimo de calorias (1200 para mulheres)', () => {
    const profile: UserProfile = {
      sex: 'feminino',
      birthDate: new Date(today.getFullYear() - 60, today.getMonth(), today.getDate()).toISOString(),
      weight: 45,
      height: 150,
      activity_level: 'sedentario',
      goal: 'perder_peso',
    };

    const targets = calculateEnergyTargets(profile);
    
    // TMB: (10 * 45) + (6.25 * 150) - (5 * 60) - 161 = 450 + 937.5 - 300 - 161 = 926.5
    // TDEE: 926.5 * 1.2 = 1111.8
    // Goal perder: 1111.8 * 0.8 = 889.44 -> Piso 1200
    assert.strictEqual(targets.suggestedCalories, 1200);
  });

  it('deve respeitar o piso mínimo de calorias (1500 para homens)', () => {
    const profile: UserProfile = {
      sex: 'masculino',
      birthDate: new Date(today.getFullYear() - 60, today.getMonth(), today.getDate()).toISOString(),
      weight: 50,
      height: 160,
      activity_level: 'sedentario',
      goal: 'perder_peso',
    };

    const targets = calculateEnergyTargets(profile);
    
    // TMB: (10 * 50) + (6.25 * 160) - (5 * 60) + 5 = 500 + 1000 - 300 + 5 = 1205
    // TDEE: 1205 * 1.2 = 1446
    // Goal perder: 1446 * 0.8 = 1156.8 -> Piso 1500
    assert.strictEqual(targets.suggestedCalories, 1500);
  });

  it('deve calcular superávit calórico (+15%) para ganhar_massa', () => {
    const profile: UserProfile = {
      sex: 'masculino',
      birthDate,
      weight: 80,
      height: 180,
      activity_level: 'sedentario', // 1.2
      goal: 'ganhar_massa',
    };

    const targets = calculateEnergyTargets(profile);
    
    // TMB = 1780
    // TDEE = 2136
    // Goal: 2136 * 1.15 = 2456.4 -> 2456
    assert.strictEqual(targets.suggestedCalories, 2456);
  });

  it('não deve zerar carboidratos nem permitir que soma de macros exceda meta calórica para IMC alto (CA-16)', () => {
    const profile: UserProfile = {
      sex: 'feminino',
      birthDate: '1986-05-15',
      weight: 120,
      height: 165,
      activity_level: 'sedentario',
      goal: 'perder_peso',
    };

    const targets = calculateEnergyTargets(profile);

    // Deve alocar carboidratos adequadamente (não pode zerar)
    assert.ok(targets.suggestedMacros.carbs > 0, `Carboidratos não devem ser 0g, recebido: ${targets.suggestedMacros.carbs}g`);

    // A soma das calorias dos macronutrientes não pode ultrapassar as calorias sugeridas
    const macroCalories = (targets.suggestedMacros.proteins * 4) +
                          (targets.suggestedMacros.fats * 9) +
                          (targets.suggestedMacros.carbs * 4);
    assert.ok(Math.abs(macroCalories - targets.suggestedCalories) <= 2, `Soma dos macros (${macroCalories} kcal) deve coincidir com a meta (${targets.suggestedCalories} kcal) dentro da tolerância de arredondamento de gramas`);
  });

  it('deve calcular macros adequados com base na massa magra (LBM) quando houver percentual de gordura elevado (CA-16)', () => {
    const profile: UserProfile = {
      sex: 'masculino',
      birthDate: '1990-01-01',
      weight: 120,
      height: 180,
      body_fat: 35, // 35% de gordura -> LBM = 78 kg
      activity_level: 'sedentario',
      goal: 'perder_peso',
    };

    const targets = calculateEnergyTargets(profile);

    // Carboidratos devem existir e ser saudáveis
    assert.ok(targets.suggestedMacros.carbs > 0, `Carboidratos não devem ser 0g, recebido: ${targets.suggestedMacros.carbs}g`);

    // Proteína não deve ser 240g (2.0 * 120kg), e sim calculada proporcional à massa magra (2.2 * 78kg = ~172g)
    assert.ok(targets.suggestedMacros.proteins < 200, `Proteína deve ser calculada sobre a massa magra, recebido: ${targets.suggestedMacros.proteins}g`);

    const macroCalories = (targets.suggestedMacros.proteins * 4) +
                          (targets.suggestedMacros.fats * 9) +
                          (targets.suggestedMacros.carbs * 4);
    assert.ok(Math.abs(macroCalories - targets.suggestedCalories) <= 2, `Soma dos macros (${macroCalories} kcal) deve coincidir com a meta (${targets.suggestedCalories} kcal)`);
  });
});

describe('calculateItemNutrients & calculateNutrients (A-021 / A-023)', () => {
  it('deve usar unit_weight quando unit === "un"', () => {
    const food = {
      serving_weight: 100,
      calories: 200,
      proteins: 10,
      carbs: 20,
      fats: 5,
      unit_weight: 50,
      base_unit: 'g',
    };
    const result = calculateItemNutrients({ foodId: 'f1', quantity: 2, unit: 'un' }, food);
    // 2 unidades * 50g = 100g -> calorias = 200
    assert.strictEqual(result.quantity, 100);
    assert.strictEqual(result.calories, 200);
    assert.strictEqual(result.displayAmount, 2);
  });

  it('deve usar serving_weight como fallback quando unit === "un" e unit_weight for nulo (A-023)', () => {
    const food = {
      serving_weight: 60,
      calories: 150,
      proteins: 8,
      carbs: 15,
      fats: 3,
      unit_weight: null,
      base_unit: 'g',
    };
    const result = calculateItemNutrients({ foodId: 'f2', quantity: 2, unit: 'un' }, food);
    // 2 unidades * 60g (serving_weight) = 120g -> calorias = 300 (não 2g/3kcal)
    assert.strictEqual(result.quantity, 120);
    assert.strictEqual(result.calories, 300);
    assert.strictEqual(result.displayAmount, 2);
  });

  it('deve preservar displayAmount 0 sem coagir para undefined (A-021)', () => {
    const food = {
      serving_weight: 100,
      calories: 100,
      proteins: 0,
      carbs: 0,
      fats: 0,
      unit_weight: 50,
      base_unit: 'g',
    };
    const result = calculateItemNutrients({ foodId: 'f3', quantity: 0, displayAmount: 0 }, food);
    assert.strictEqual(result.displayAmount, 0);
  });
});

