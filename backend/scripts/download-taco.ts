import fs from 'fs';
import path from 'path';

const TACO_URL = 'https://raw.githubusercontent.com/danperrout/tabelataco/master/public/TACO.json';

async function downloadTaco() {
  console.log('Baixando a base TACO completa...');
  try {
    const res = await fetch(TACO_URL);
    if (!res.ok) {
      console.error(`Falha no download: ${res.statusText}`);
      process.exit(1);
    }
    const data = await res.json();
    console.log(`Download com sucesso! Encontrados ${data.length} alimentos.`);
    saveData(data);
  } catch (err) {
    console.error('Erro:', err);
  }
}

function saveData(data: Record<string, unknown>[]) {
  // O dataset do danperrout possui a estrutura:
  // {
  //   "id": 1,
  //   "description": "Arroz, integral, cozido",
  //   "base_qty": 100,
  //   "base_unit": "g",
  //   "category_id": 1,
  //   "attributes": {
  //     "energy": { "kcal": 124.0... },
  //     "protein": { "qty": 2.6... },
  //     "lipid": { "qty": 1.0... },
  //     "carbohydrate": { "qty": 25.8... }
  //   }
  // }
  
  const foods = data.map((item: Record<string, unknown>) => {
    const parseNum = (val: unknown) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val * 100) / 100;
      if (typeof val === 'string') {
        if (val === 'NA' || val === 'Tr' || val === '*' || val === '') return 0;
        const parsed = parseFloat(val.replace(',', '.'));
        return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
      }
      return 0;
    };

    const attrs = (item.attributes as Record<string, Record<string, unknown>>) || {};
    const energyVal = item.energy_kcal ?? attrs.energy?.kcal ?? item.calories;
    const proteinVal = item.protein_g ?? attrs.protein?.qty ?? item.proteins;
    const carbVal = item.carbohydrate_g ?? attrs.carbohydrate?.qty ?? item.carbs;
    const fatVal = item.lipid_g ?? attrs.lipid?.qty ?? item.fats;

    return {
      name: item.description || item.name,
      calories: parseNum(energyVal),
      proteins: parseNum(proteinVal),
      carbs: parseNum(carbVal),
      fats: parseNum(fatVal),
      base_unit: item.base_unit || 'g',
      serving_weight: parseNum(item.base_qty) || 100,
      source: 'TACO',
      external_id: `TACO-${item.id}`
    };
  }).filter((f: Record<string, unknown>) => {
    const hasValidName = typeof f.name === 'string' && f.name.trim() !== '';
    return hasValidName;
  });

  const validFoodsWithNutrients = foods.filter(f => (f.calories > 0 || f.proteins > 0 || f.carbs > 0 || f.fats > 0));
  if (foods.length > 0 && validFoodsWithNutrients.length === 0) {
    console.error('Erro crítico: nenhum alimento possui macronutrientes válidos (> 0). Abortando salvamento para evitar corrupção de dados.');
    process.exit(1);
  }

  const outPath = path.join(process.cwd(), 'data', 'taco-full.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(foods, null, 2));
  console.log(`Arquivo estruturado salvo com ${foods.length} itens (${validFoodsWithNutrients.length} com nutrientes > 0).`);
}

downloadTaco();
