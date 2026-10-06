export interface UserProfile {
  sex: 'masculino' | 'feminino' | 'prefiro_nao_responder';
  birthDate: string | Date; // YYYY-MM-DD
  weight: number; // kg
  height: number; // cm
  body_fat?: number | null; // percentual (ex: 15 para 15%)
  activity_level: 'sedentario' | 'pouco_ativo' | 'moderadamente_ativo' | 'muito_ativo' | 'extremamente_ativo';
  goal: 'perder_peso' | 'manter_peso' | 'ganhar_massa';
}

export interface EnergyTargets {
  tmb: number;
  tdee: number; // Total Daily Energy Expenditure (gasto total)
  suggestedCalories: number;
  suggestedMacros: {
    proteins: number;
    fats: number;
    carbs: number;
  };
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentario: 1.2,
  pouco_ativo: 1.375,
  moderadamente_ativo: 1.55,
  muito_ativo: 1.725,
  extremamente_ativo: 1.9,
};

export function calculateAge(birthDate: string | Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function calculateEnergyTargets(profile: UserProfile): EnergyTargets {
  let tmb = 0;

  // 1. Calcular TMB (Taxa Metabólica Basal)
  if (profile.body_fat && profile.body_fat > 0) {
    // Katch-McArdle se souber o BF
    const leanBodyMass = profile.weight * (1 - profile.body_fat / 100);
    tmb = 370 + 21.6 * leanBodyMass;
  } else {
    // Mifflin-St Jeor se não souber BF
    const age = calculateAge(profile.birthDate);
    const isMale = profile.sex === 'masculino';
    
    // Formula base Mifflin
    const baseTmb = (10 * profile.weight) + (6.25 * profile.height) - (5 * age);
    
    if (isMale) {
      tmb = baseTmb + 5;
    } else {
      // Para mulheres e 'prefiro_nao_responder', usamos a fórmula mais conservadora
      tmb = baseTmb - 161;
    }
  }

  // 2. Gasto Energético Total (TDEE)
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activity_level] || 1.2;
  const tdee = tmb * multiplier;

  // 3. Calorias Sugeridas (Objetivo)
  let suggestedCalories = tdee;
  if (profile.goal === 'perder_peso') {
    suggestedCalories = tdee * 0.80; // Déficit de 20%
  } else if (profile.goal === 'ganhar_massa') {
    suggestedCalories = tdee * 1.15; // Superávit de 15%
  }

  // Piso mínimo de segurança (Evitar dietas extremas)
  const minCalories = profile.sex === 'masculino' ? 1500 : 1200;
  if (suggestedCalories < minCalories) {
    suggestedCalories = minCalories;
  }

  // 4. Divisão de Macronutrientes (2g Prot/kg, 1g Gord/kg, resto Carb)
  const proteins = 2.0 * profile.weight;
  const fats = 1.0 * profile.weight;
  
  // Calorias das proteínas (4 kcal/g) e gorduras (9 kcal/g)
  const caloriesFromProt = proteins * 4;
  const caloriesFromFats = fats * 9;
  
  // O restante vai para carboidratos (4 kcal/g)
  let carbs = (suggestedCalories - caloriesFromProt - caloriesFromFats) / 4;
  
  // Se os carboidratos ficarem negativos (ex: calorias totais muito baixas para manter a regra)
  if (carbs < 0) carbs = 0;

  return {
    tmb: Math.round(tmb),
    tdee: Math.round(tdee),
    suggestedCalories: Math.round(suggestedCalories),
    suggestedMacros: {
      proteins: Math.round(proteins),
      fats: Math.round(fats),
      carbs: Math.round(carbs),
    }
  };
}
