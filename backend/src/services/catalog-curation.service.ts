import { PoolClient } from 'pg';
import { pool } from '../database/pool.js';
import { z } from 'zod';
import { calculateCaloricWarnings } from '@caloriesync/shared';
import { recordAuditLog } from '../models/admin-audit.model.js';

export interface CatalogExportResult {
  csvContent: string;
  total: number;
  inactiveCount: number;
  suggestionCount: number;
}

export interface CatalogApplyResult {
  totalRows: number;
  withDecisions: number;
  modified: number;
  unchanged: number;
  errors: string[];
}

export interface CuratedImportResult {
  total: number;
  inserted: number;
  updated: number;
  reviewWarnings: string[];
  errors: string[];
}

export const curatedFoodItemSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres.').max(255),
  calories: z.number().min(0, 'Calorias não podem ser negativas.').max(900, 'Calorias máximas de 900.'),
  proteins: z.number().min(0).max(100, 'Proteínas máximas de 100.'),
  carbs: z.number().min(0).max(100, 'Carboidratos máximos de 100.'),
  fats: z.number().min(0).max(100, 'Gorduras máximas de 100.'),
  base_unit: z.enum(['g', 'ml']).default('g'),
  serving_weight: z.number().positive().default(100),
  unit_name: z.string().trim().max(50).nullable().optional(),
  unit_weight: z.number().positive().max(5000).nullable().optional(),
  source: z.string().trim().min(2, 'O campo source é obrigatório.').max(50),
  source_ref: z.string().trim().min(2, 'O campo source_ref é obrigatório (B9).').max(255),
  external_id: z.string().trim().max(100).optional(),
}).refine(
  (data) => data.proteins + data.carbs + data.fats <= 100.5,
  {
    message: 'A soma de proteínas, carboidratos e gorduras não pode exceder 100,5 g por 100 g.',
    path: ['proteins'],
  }
);

export const curatedFoodsArraySchema = z.array(curatedFoodItemSchema);

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Heurística de sugestões de duplicatas para revisão do catálogo
 */
function detectDuplicateSuggestion(name: string, allNames: string[]): string {
  const clean = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/tipo\s*\d+/i.test(clean)) {
    return 'Variante por tipo (ex.: tipo 1 / tipo 2)';
  }

  const prepMatch = clean.match(/\b(cru|cozid[ao]|grelhad[ao]|frit[ao]|assad[ao]|refogad[ao])\b/);
  if (prepMatch) {
    const rootName = clean.replace(/\b(cru|cozid[ao]|grelhad[ao]|frit[ao]|assad[ao]|refogad[ao])\b/g, '').replace(/\s+/g, ' ').trim();
    if (rootName.length > 3) {
      const related = allNames.filter((other) => {
        if (other === name) return false;
        const otherClean = other.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return otherClean.includes(rootName);
      });
      if (related.length > 0) {
        return `Variação de preparo com base semelhante (${related.length} correlatos)`;
      }
    }
  }

  return '';
}

/**
 * Exporta catálogo global para CSV formatado em UTF-8 com BOM e separador ';'
 */
export async function exportCatalogToCsv(client?: PoolClient): Promise<CatalogExportResult> {
  const db = client ?? pool;
  const res = await db.query<{
    id: string;
    external_id: string | null;
    source: string | null;
    name: string;
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
    active: boolean;
  }>(`
    SELECT id, external_id, source, name, calories, proteins, carbs, fats, active
    FROM foods
    WHERE user_id IS NULL
    ORDER BY name ASC
  `);

  const foods = res.rows;
  const allNames = foods.map((f) => f.name);

  const header = ['id', 'external_id', 'source', 'nome', 'kcal', 'proteina', 'carboidrato', 'gordura', 'ativo', 'sugestao', 'decisao', 'novo_nome'].join(';');

  let inactiveCount = 0;
  let suggestionCount = 0;

  const rows: string[] = [header];

  for (const food of foods) {
    if (!food.active) inactiveCount++;
    const sugestao = detectDuplicateSuggestion(food.name, allNames);
    if (sugestao) suggestionCount++;

    const row = [
      escapeCsvField(food.id),
      escapeCsvField(food.external_id),
      escapeCsvField(food.source),
      escapeCsvField(food.name),
      escapeCsvField(food.calories),
      escapeCsvField(food.proteins),
      escapeCsvField(food.carbs),
      escapeCsvField(food.fats),
      escapeCsvField(food.active ? 'sim' : 'nao'),
      escapeCsvField(sugestao),
      '', // decisao
      '', // novo_nome
    ].join(';');

    rows.push(row);
  }

  // UTF-8 com BOM (\uFEFF)
  const csvContent = '\uFEFF' + rows.join('\r\n') + '\r\n';

  return {
    csvContent,
    total: foods.length,
    inactiveCount,
    suggestionCount,
  };
}

/**
 * Parser de CSV com separador ';' e suporte a aspas
 */
function parseCsvLines(csvContent: string): string[][] {
  const clean = csvContent.startsWith('\uFEFF') ? csvContent.slice(1) : csvContent;
  const lines: string[][] = [];
  let currentField = '';
  let inQuotes = false;
  let currentLine: string[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // pular quote escapado
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ';') {
        currentLine.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentLine.push(currentField.trim());
        currentField = '';
        if (currentLine.some((c) => c.length > 0)) {
          lines.push(currentLine);
        }
        currentLine = [];
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some((c) => c.length > 0)) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Aplica decisões de curadoria a partir do arquivo CSV.
 * Por padrão roda em simulação; apenas aplica alterações quando options.dryRun === false.
 */
export async function applyCatalogDecisions(
  csvContent: string,
  options: { dryRun: boolean; client?: PoolClient }
): Promise<CatalogApplyResult> {
  const lines = parseCsvLines(csvContent);
  if (lines.length === 0) {
    return { totalRows: 0, withDecisions: 0, modified: 0, unchanged: 0, errors: ['Arquivo CSV vazio.'] };
  }

  const rawHeader = lines[0].map((h) => h.toLowerCase().trim());
  const idIdx = rawHeader.indexOf('id');
  const decisaoIdx = rawHeader.indexOf('decisao');
  const novoNomeIdx = rawHeader.indexOf('novo_nome');

  if (idIdx === -1 || decisaoIdx === -1) {
    return {
      totalRows: lines.length - 1,
      withDecisions: 0,
      modified: 0,
      unchanged: 0,
      errors: ['Cabeçalho CSV inválido: colunas "id" e "decisao" são obrigatórias.'],
    };
  }

  const dataRows = lines.slice(1);
  const errors: string[] = [];
  let withDecisions = 0;
  let modified = 0;
  let unchanged = 0;

  const dbClient = options.client ?? (await pool.connect());
  const shouldRelease = !options.client;

  try {
    if (!options.dryRun) {
      await dbClient.query('BEGIN');
    }

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const lineNum = i + 2;
      const id = row[idIdx]?.trim();
      const decisao = row[decisaoIdx]?.trim().toLowerCase();
      const novoNome = novoNomeIdx !== -1 ? row[novoNomeIdx]?.trim() : '';

      if (!decisao) {
        continue;
      }

      withDecisions++;

      if (!id) {
        errors.push(`Linha ${lineNum}: Coluna "id" vazia.`);
        continue;
      }

      const validDecisions = ['ocultar', 'desativar', 'renomear', 'reativar', 'ativar'];
      if (!validDecisions.includes(decisao)) {
        errors.push(`Linha ${lineNum}: Decisão desconhecida "${decisao}". Permitidos: ocultar, renomear, reativar.`);
        continue;
      }

      if (decisao === 'renomear' && (!novoNome || novoNome.length < 2)) {
        errors.push(`Linha ${lineNum}: Decisão "renomear" exige coluna "novo_nome" com pelo menos 2 caracteres.`);
        continue;
      }

      // Buscar alimento global
      const existingRes = await dbClient.query<{
        id: string;
        name: string;
        active: boolean;
      }>(
        `SELECT id, name, active FROM foods WHERE id = $1 AND user_id IS NULL`,
        [id]
      );

      if (existingRes.rows.length === 0) {
        errors.push(`Linha ${lineNum}: Alimento com ID "${id}" não encontrado no catálogo global.`);
        continue;
      }

      const current = existingRes.rows[0];
      let targetActive = current.active;
      let targetName = current.name;

      if (decisao === 'ocultar' || decisao === 'desativar') {
        targetActive = false;
      } else if (decisao === 'reativar' || decisao === 'ativar') {
        targetActive = true;
      } else if (decisao === 'renomear') {
        targetName = novoNome;
      }

      // Idempotência: verificar se há mudança real
      if (targetActive === current.active && targetName === current.name) {
        unchanged++;
        continue;
      }

      modified++;

      if (!options.dryRun) {
        await dbClient.query(
          `UPDATE foods
           SET name = $1,
               active = $2,
               admin_edited_at = NOW(),
               updated_at = NOW()
           WHERE id = $3`,
          [targetName, targetActive, id]
        );

        await recordAuditLog(dbClient, {
          actor_user_id: null,
          actor_type: 'cli',
          action: 'catalog_curation_apply',
          entity_type: 'food',
          entity_id: id,
          before: { name: current.name, active: current.active },
          after: { name: targetName, active: targetActive, admin_edited_at: true },
        });
      }
    }

    if (!options.dryRun) {
      await dbClient.query('COMMIT');
    }
  } catch (err: unknown) {
    if (!options.dryRun) {
      try {
        await dbClient.query('ROLLBACK');
      } catch {
        // ignora
      }
    }
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Erro de banco de dados durante aplicação: ${msg}`);
  } finally {
    if (shouldRelease) {
      dbClient.release();
    }
  }

  return {
    totalRows: dataRows.length,
    withDecisions,
    modified,
    unchanged,
    errors,
  };
}

/**
 * Importa alimentos curados a partir de JSON com validação estrita (B9, B12).
 * Por padrão roda em simulação; apenas grava no banco quando options.dryRun === false.
 */
export async function importCuratedFoods(
  jsonContent: string,
  options: { dryRun: boolean; client?: PoolClient }
): Promise<CuratedImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (err) {
    return {
      total: 0,
      inserted: 0,
      updated: 0,
      reviewWarnings: [],
      errors: [`JSON inválido: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      total: 0,
      inserted: 0,
      updated: 0,
      reviewWarnings: [],
      errors: ['O arquivo de alimentos curados deve conter um array JSON no nível raiz.'],
    };
  }

  const reviewWarnings: string[] = [];
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;

  const validItems: z.infer<typeof curatedFoodItemSchema>[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const raw = parsed[i];
    const validation = curatedFoodItemSchema.safeParse(raw);
    if (!validation.success) {
      const issueMsgs = validation.error.issues.map((iss) => `${iss.path.join('.')}: ${iss.message}`).join(', ');
      errors.push(`Item [${i}] "${raw?.name || 'sem nome'}": ${issueMsgs}`);
      continue;
    }

    const item = validation.data;
    const itemWarnings = calculateCaloricWarnings(item.calories, item.proteins, item.carbs, item.fats);
    for (const w of itemWarnings) {
      reviewWarnings.push(`[REVISAR] Item "${item.name}": ${w}`);
    }

    validItems.push(item);
  }

  if (errors.length > 0 && validItems.length === 0) {
    return {
      total: parsed.length,
      inserted: 0,
      updated: 0,
      reviewWarnings,
      errors,
    };
  }

  const dbClient = options.client ?? (await pool.connect());
  const shouldRelease = !options.client;

  try {
    if (!options.dryRun) {
      await dbClient.query('BEGIN');
    }

    for (const food of validItems) {
      const extId = food.external_id || `curated-${food.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50)}`;

      if (options.dryRun) {
        const check = await dbClient.query<{ id: string }>(
          `SELECT id FROM foods WHERE source = $1 AND external_id = $2`,
          [food.source, extId]
        );
        if (check.rows.length > 0) {
          updated++;
        } else {
          inserted++;
        }
      } else {
        // Desativa alimentos legados/não-curados com mesmo nome normalizado para satisfazer idx_foods_catalog_unique_name
        await dbClient.query(
          `UPDATE foods
           SET active = false,
               updated_at = NOW()
           WHERE active = true
             AND user_id IS NULL
             AND f_unaccent(lower(name)) = f_unaccent(lower($1))
             AND (source IS NULL OR NOT (source = $2 AND external_id = $3))`,
          [food.name, food.source, extId]
        );

        const query = `
          INSERT INTO foods (
            name, calories, proteins, carbs, fats, base_unit, serving_weight,
            unit_name, unit_weight, source, source_ref, external_id, active, admin_edited_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW()
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
            source_ref = EXCLUDED.source_ref,
            active = true,
            admin_edited_at = NOW(),
            updated_at = NOW()
          RETURNING (xmax = 0) AS is_inserted, id;
        `;

        const values = [
          food.name, food.calories, food.proteins, food.carbs, food.fats,
          food.base_unit, food.serving_weight, food.unit_name || null, food.unit_weight || null,
          food.source, food.source_ref, extId,
        ];

        const res = await dbClient.query<{ is_inserted: boolean; id: string }>(query, values);
        const row = res.rows[0];

        if (row.is_inserted) {
          inserted++;
        } else {
          updated++;
        }

        await recordAuditLog(dbClient, {
          actor_user_id: null,
          actor_type: 'cli',
          action: 'catalog_curated_import',
          entity_type: 'food',
          entity_id: row.id,
          before: null,
          after: { name: food.name, source: food.source, source_ref: food.source_ref, calories: food.calories },
        });
      }
    }

    if (!options.dryRun) {
      await dbClient.query('COMMIT');
    }
  } catch (err: unknown) {
    if (!options.dryRun) {
      try {
        await dbClient.query('ROLLBACK');
      } catch {
        // ignora
      }
    }
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Erro durante importação de curados: ${msg}`);
  } finally {
    if (shouldRelease) {
      dbClient.release();
    }
  }

  return {
    total: parsed.length,
    inserted,
    updated,
    reviewWarnings,
    errors,
  };
}
