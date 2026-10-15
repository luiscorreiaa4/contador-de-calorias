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

  // 4. Divisão de Macronutrientes (Ciência Nutricional & Fitness Moderno - D-15 / CA-16)
  // Em sobrepeso ou obesidade, calcular sobre o peso bruto superestima proteínas e gorduras,
  // zerando carboidratos (BUG-B03). Aplicamos a metodologia de referência (ISSN / Aragon / Wilkens):
  let proteins: number;
  let fats: number;

  const heightInMeters = profile.height / 100;
  const bmi = heightInMeters > 0 ? profile.weight / (heightInMeters * heightInMeters) : 22;

  if (profile.body_fat && profile.body_fat > 0) {
    const leanBodyMass = profile.weight * (1 - profile.body_fat / 100);
    const isHighBodyFat = (profile.sex === 'masculino' && profile.body_fat >= 25) ||
                          (profile.sex !== 'masculino' && profile.body_fat >= 32);

    if (isHighBodyFat) {
      // Baseado na massa magra para alta adiposidade (ISSN: 2.2g/kg LBM e gorduras a 25% das calorias ou 0.8g/kg LBM)
      proteins = 2.2 * leanBodyMass;
      fats = Math.max(0.8 * leanBodyMass, (suggestedCalories * 0.25) / 9);
    } else {
      // Atleta / composição corporal favorável
      proteins = 2.0 * profile.weight;
      fats = 1.0 * profile.weight;
    }
  } else if (bmi >= 28.0 && heightInMeters > 0) {
    // IMC elevado sem bioimpedância: aplica Peso Ajustado de Wilkens
    // Peso ideal baseado em IMC 24 (limite superior da faixa de eutrofia/fitness saudável)
    const idealWeight = 24.0 * (heightInMeters * heightInMeters);
    const adjustedWeight = idealWeight + 0.25 * (profile.weight - idealWeight);

    proteins = 2.0 * adjustedWeight;
    fats = 0.8 * adjustedWeight;
  } else {
    // Padrão fitness para eutrofia (2.0g/kg proteína, 1.0g/kg gordura)
    proteins = 2.0 * profile.weight;
    fats = 1.0 * profile.weight;
  }

  // Trava de segurança metabólica: Proteína + Gordura não podem exceder 75% das calorias totais,
  // garantindo no mínimo 25% das calorias para carboidratos (combustível glicolítico e função tireoidiana).
  const maxProtFatCalories = suggestedCalories * 0.75;
  if ((proteins * 4 + fats * 9) > maxProtFatCalories) {
    fats = (suggestedCalories * 0.25) / 9;
    if (proteins * 4 > (suggestedCalories * 0.50)) {
      proteins = (suggestedCalories * 0.50) / 4;
    }
  }

  const roundedProt = Math.round(proteins);
  const roundedFats = Math.round(fats);
  const roundedCalories = Math.round(suggestedCalories);

  // Reconciliação direta dos carboidratos (BUG-B04):
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
