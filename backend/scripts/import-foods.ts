import fs from 'fs';
import path from 'path';
import { pool } from '../src/database/pool.js';

interface RawFood {
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  base_unit: string;
  serving_weight: number;
  unit_name?: string;
  unit_weight?: number;
  source: string;
  external_id: string;
}

function formatFoodName(name: string): string {
  let clean = name;
  
  // Casos específicos chatos da TACO
  clean = clean.replace(/^Carne, bovina, /i, 'Corte Bovino: ');
  clean = clean.replace(/^Frango, /i, 'Frango: ');
  clean = clean.replace(/^Porco, /i, 'Porco: ');
  clean = clean.replace(/ sem gordura/i, ' (Magro)');
  clean = clean.replace(/ com gordura/i, ' (Com Gordura)');

  // Remove todas as vírgulas restantes e troca por espaço
  clean = clean.replace(/,/g, '');
  
  // Remove espaços duplos
  clean = clean.replace(/\s+/g, ' ').trim();

  // Tratamentos específicos após retirar vírgula
  clean = clean.replace(/Arroz branco cozido/i, 'Arroz Branco Cozido');
  clean = clean.replace(/Feijão carioca cozido/i, 'Feijão Carioca Cozido');
  clean = clean.replace(/Ovo de galinha inteiro cozido/i, 'Ovo Cozido');

  // Capitaliza a primeira letra de cada palavra (Title Case)
  // Ignorando preposições comuns para ficar mais bonito
  const prepositions = ['de', 'da', 'do', 'das', 'dos', 'com', 'sem'];
  return clean.split(' ').map((word, index) => {
    if (index > 0 && prepositions.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
  }).join(' ');
}

async function runImport() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const filePathIndex = args.findIndex(a => !a.startsWith('--'));
  
  if (filePathIndex === -1) {
    console.error('Uso: npx tsx scripts/import-foods.ts [--dry-run] <caminho-para-json>');
    process.exit(1);
  }

  const filePath = path.resolve(args[filePathIndex]);
  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  let foods: RawFood[];
  try {
    foods = JSON.parse(fileContent);
  } catch (err: unknown) {
    console.error('O arquivo fornecido não é um JSON válido.', err);
    process.exit(1);
  }

  console.log(`Iniciando importação de ${foods.length} alimentos...`);
  if (isDryRun) {
    console.log('--- MODO DRY-RUN: Nenhuma alteração será efetivada no banco ---');
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    let inserted = 0;
    let updated = 0;

    for (const food of foods) {
      if (!food.source || !food.external_id) {
        console.warn(`Alimento "${food.name}" ignorado: faltando source ou external_id.`);
        continue;
      }

      // Upsert logic
      const query = `
        INSERT INTO foods (
          name, calories, proteins, carbs, fats, base_unit, serving_weight, 
          unit_name, unit_weight, source, external_id, active
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true
        )
        ON CONFLICT (source, external_id) DO UPDATE SET
          name = EXCLUDED.name,
          calories = EXCLUDED.calories,
          proteins = EXCLUDED.proteins,
          carbs = EXCLUDED.carbs,
          fats = EXCLUDED.fats,
          base_unit = EXCLUDED.base_unit,
          serving_weight = EXCLUDED.serving_weight,
          unit_name = EXCLUDED.unit_name,
          unit_weight = EXCLUDED.unit_weight,
          active = EXCLUDED.active,
          updated_at = NOW()
        RETURNING (xmax = 0) AS inserted;
      `;
      
      const values = [
        formatFoodName(food.name), food.calories, food.proteins, food.carbs, food.fats,
        food.base_unit || 'g', food.serving_weight || 100,
        food.unit_name || null, food.unit_weight || null,
        food.source, food.external_id
      ];

      const res = await client.query(query, values);
      
      if (res.rows[0].inserted) {
        inserted++;
      } else {
        updated++;
      }
    }

    console.log(`Importação concluída.`);
    console.log(`- Inseridos novos: ${inserted}`);
    console.log(`- Atualizados: ${updated}`);
    
    if (isDryRun) {
      await client.query('ROLLBACK');
      console.log('ROLLBACK executado (dry-run).');
    } else {
      await client.query('COMMIT');
      console.log('COMMIT executado com sucesso.');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro durante a importação. ROLLBACK executado.', error);
  } finally {
    client.release();
  }
}

runImport().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
