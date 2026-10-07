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
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        if (val === 'NA' || val === 'Tr' || val === '*') return 0;
        const parsed = parseFloat(val.replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    return {
      name: item.description,
      calories: parseNum(item.energy_kcal),
      proteins: parseNum(item.protein_g),
      carbs: parseNum(item.carbohydrate_g),
      fats: parseNum(item.lipid_g),
      base_unit: item.base_unit || 'g',
      serving_weight: item.base_qty || 100,
      source: 'TACO',
      external_id: `TACO-${item.id}`
    };
  }).filter((f: Record<string, unknown>) => typeof f.name === 'string' && f.name.trim() !== '');

  const outPath = path.join(process.cwd(), 'data', 'taco-full.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(foods, null, 2));
  console.log(`Arquivo estruturado salvo com ${foods.length} itens.`);
}

downloadTaco();
