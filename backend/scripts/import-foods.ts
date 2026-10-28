import fs from 'fs';
import path from 'path';
import { PoolClient } from 'pg';
import { pool } from '../src/database/pool.js';

export interface RawFood {
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

export interface ImportFoodsResult {
  inserted: number;
  updated: number;
  skipped: number;
}

export function formatFoodName(name: string): string {
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

export async function importFoodsFromJson(
  filePathOrFoods: string | RawFood[],
  options?: { isDryRun?: boolean; client?: PoolClient }
): Promise<ImportFoodsResult> {
  const isDryRun = Boolean(options?.isDryRun);
  let foods: RawFood[];

  if (typeof filePathOrFoods === 'string') {
    const resolvedPath = path.resolve(filePathOrFoods);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Arquivo não encontrado: ${resolvedPath}`);
    }
    const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
    foods = JSON.parse(fileContent);
  } else {
    foods = filePathOrFoods;
  }

  const client = options?.client ?? (await pool.connect());
  const shouldRelease = !options?.client;

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  try {
    await client.query('BEGIN');

    for (const food of foods) {
      if (!food.source || !food.external_id) {
        skipped++;
        continue;
      }

      const formattedName = formatFoodName(food.name);

      // O catálogo possui índice único parcial sobre o nome normalizado
      // (`f_unaccent(lower(name))` quando `active = true`). Antes do upsert,
      // desativamos qualquer outro alimento ativo do catálogo global com o mesmo nome para manter
      // a carga idempotente, exceto se for curado/editado (admin_edited_at IS NOT NULL) (B10).
      await client.query(
        `UPDATE foods
         SET active = false,
             updated_at = NOW()
         WHERE active = true
           AND user_id IS NULL
           AND admin_edited_at IS NULL
           AND f_unaccent(lower(name)) = f_unaccent(lower($1))
           AND NOT (source = $2 AND external_id = $3)`,
        [formattedName, food.source, food.external_id]
      );

      // Upsert logic respeitando B10:
      // 1. Alimentos curados (admin_edited_at IS NOT NULL) não são sobrescritos (WHERE foods.admin_edited_at IS NULL).
      // 2. Alimentos desativados (active = false) nunca são reativados (active = foods.active).
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
          active = foods.active,
          updated_at = NOW()
        WHERE foods.admin_edited_at IS NULL
        RETURNING (xmax = 0) AS is_inserted;
      `;
      
      const values = [
        formattedName, food.calories, food.proteins, food.carbs, food.fats,
        food.base_unit || 'g', food.serving_weight || 100,
        food.unit_name || null, food.unit_weight || null,
        food.source, food.external_id
      ];

      const res = await client.query<{ is_inserted: boolean }>(query, values);

      if (res.rows.length === 0) {
        // Alimento protegido contra sobrescrita por admin_edited_at (B10)
        skipped++;
      } else if (res.rows[0].is_inserted) {
        inserted++;
      } else {
        updated++;
      }
    }

    if (isDryRun) {
      await client.query('ROLLBACK');
    } else {
      await client.query('COMMIT');
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignora
    }
    throw error;
  } finally {
    if (shouldRelease) {
      client.release();
    }
  }

  return { inserted, updated, skipped };
}

async function runCli() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const filePathIndex = args.findIndex(a => !a.startsWith('--'));
  
  if (filePathIndex === -1) {
    console.error('Uso: npx tsx scripts/import-foods.ts [--dry-run] <caminho-para-json>');
    process.exit(1);
  }

  const filePath = path.resolve(args[filePathIndex]);
  console.log(`Iniciando importação de alimentos de: ${filePath}`);
  if (isDryRun) {
    console.log('--- MODO DRY-RUN: Nenhuma alteração será efetivada no banco ---');
  }

  try {
    const result = await importFoodsFromJson(filePath, { isDryRun });
    console.log('Importação concluída com sucesso:');
    console.log(`- Inseridos novos: ${result.inserted}`);
    console.log(`- Atualizados: ${result.updated}`);
    console.log(`- Ignorados / protegidos (B10): ${result.skipped}`);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Falha no processo de importação:', err);
    await pool.end();
    process.exit(1);
  }
}

// Executa se invocado diretamente
if (process.argv[1] && process.argv[1].endsWith('import-foods.ts')) {
  runCli();
}
