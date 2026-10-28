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

export type ActivityLevel = UserProfile['activity_level'];

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  pouco_ativo: 1.375,
  moderadamente_ativo: 1.55,
  muito_ativo: 1.725,
  extremamente_ativo: 1.9,
};

export function calculateAge(birthDate: string | Date, referenceDate: Date = new Date()): number {
  let birthYear: number;
  let birthMonth: number;
  let birthDay: number;

  if (typeof birthDate === 'string') {
    const match = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      birthYear = parseInt(match[1], 10);
      birthMonth = parseInt(match[2], 10) - 1;
      birthDay = parseInt(match[3], 10);
    } else {
      const birth = new Date(birthDate);
      birthYear = birth.getFullYear();
      birthMonth = birth.getMonth();
      birthDay = birth.getDate();
    }
  } else {
    birthYear = birthDate.getFullYear();
    birthMonth = birthDate.getMonth();
    birthDay = birthDate.getDate();
  }

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();

  let age = refYear - birthYear;
  const m = refMonth - birthMonth;
  if (m < 0 || (m === 0 && refDay < birthDay)) {
    age--;
  }
  return age;
}

export function calculateEnergyTargets(profile: UserProfile): EnergyTargets {
  let tmb: number;

  // 1. Calcular TMB (Taxa Metabólica Basal)
  if (profile.body_fat && profile.body_fat > 0) {
    // Katch-McArdle se souber o BF
    const leanBodyMass = profile.weight * (1 - profile.body_fat / 100);
    tmb = 370 + 21.6 * leanBodyMass;
  } else {
    // Mifflin-St Jeor se não souber BF
    const age = calculateAge(profile.birthDate);
    const baseTmb = (10 * profile.weight) + (6.25 * profile.height) - (5 * age);

    if (profile.sex === 'masculino') {
      tmb = baseTmb + 5;
    } else if (profile.sex === 'feminino') {
      tmb = baseTmb - 161;
    } else {
      // prefiro_nao_responder (A-061): média aritmética entre as fórmulas masculina e feminina ((+5 + -161)/2 = -78)
      tmb = baseTmb - 78;
    }
  }

  // 2. Gasto Energético Total (TDEE)
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activity_level] ?? 1.2;
  const tdee = tmb * multiplier;

  // 3. Calorias Sugeridas (Objetivo)
  let suggestedCalories = tdee;
  if (profile.goal === 'perder_peso') {
    suggestedCalories = tdee * 0.80; // Déficit de 20%
  } else if (profile.goal === 'ganhar_massa') {
    suggestedCalories = tdee * 1.15; // Superávit de 15%
  }

  // Piso mínimo de segurança (Evitar dietas extremas: 1500 masc, 1200 fem, 1350 prefiro_nao_responder)
  const minCalories = profile.sex === 'masculino' ? 1500 : profile.sex === 'feminino' ? 1200 : 1350;
  if (suggestedCalories < minCalories) {
    suggestedCalories = minCalories;
  }

  // 4. Divisão de Macronutrientes (Decisão D-15 / Regras de Projeto de Saúde)
  // Massa de referência:
  let massaReferencia: number;
  const heightInMeters = profile.height / 100;
  const bmi = heightInMeters > 0 ? profile.weight / (heightInMeters * heightInMeters) : 22;

  if (profile.body_fat && profile.body_fat > 0) {
    // Se houver % de gordura, usar massa magra (peso * (1 - %gordura/100))
    massaReferencia = profile.weight * (1 - profile.body_fat / 100);
  } else if (bmi >= 30 && heightInMeters > 0) {
    // Se IMC >= 30, usar peso ajustado: PI + 0.25 * (peso - PI), com PI = 22.5 * altura^2
    const idealWeight = 22.5 * (heightInMeters * heightInMeters);
    massaReferencia = idealWeight + 0.25 * (profile.weight - idealWeight);
  } else {
    // Senão, o peso atual
    massaReferencia = profile.weight;
  }

  // Proteína: 1.6 g/kg da massa de referência, limitada a 35% das kcal
  let protGrams = 1.6 * massaReferencia;
  if (protGrams * 4 > suggestedCalories * 0.35) {
    protGrams = (suggestedCalories * 0.35) / 4;
  }

  // Gordura: 25% das kcal
  let fatGrams = (suggestedCalories * 0.25) / 9;

  // Carboidrato: o restante das kcal
  let carbKcal = suggestedCalories - (protGrams * 4) - (fatGrams * 9);

  // Ordem de ajuste se o carboidrato ficar abaixo de 20% das kcal:
  if (carbKcal < suggestedCalories * 0.20) {
    // 1. Reduzir gordura até 20% das kcal
    fatGrams = (suggestedCalories * 0.20) / 9;
    carbKcal = suggestedCalories - (protGrams * 4) - (fatGrams * 9);

    // 2. Se ainda abaixo de 20%, depois reduzir proteína até 1.2 g/kg da massa de referência
    if (carbKcal < suggestedCalories * 0.20) {
      const minProtGrams = 1.2 * massaReferencia;
      const targetProtKcal = suggestedCalories - (fatGrams * 9) - (suggestedCalories * 0.20);
      protGrams = Math.max(minProtGrams, targetProtKcal / 4);
    }
  }

  const roundedProt = Math.round(protGrams);
  const roundedFats = Math.round(fatGrams);
  const roundedCalories = Math.round(suggestedCalories);

  // Reconciliação direta dos carboidratos:
  const remainingCalories = Math.max(0, roundedCalories - (roundedProt * 4) - (roundedFats * 9));
  const roundedCarbs = Math.round(remainingCalories / 4);

  return {
    tmb: Math.round(tmb),
    tdee: Math.round(tdee),
    suggestedCalories: roundedCalories,
    suggestedMacros: {
      proteins: roundedProt,
      fats: roundedFats,
      carbs: roundedCarbs,
    }
  };
}
