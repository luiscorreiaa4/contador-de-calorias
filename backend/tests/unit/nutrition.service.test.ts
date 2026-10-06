import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateEnergyTargets, UserProfile } from '../../src/services/nutrition.service.js';

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
    // Macros: 160g Prot, 80g Fat. Calories: 640 + 720 = 1360. Carbs: (2136 - 1360)/4 = 194
    assert.strictEqual(targets.suggestedMacros.proteins, 160);
    assert.strictEqual(targets.suggestedMacros.fats, 80);
    assert.strictEqual(targets.suggestedMacros.carbs, 194);
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
});
