import { describe, it } from 'node:test';
import assert from 'node:assert';
import { pool } from '../../src/database/pool.js';
import { closeTestPool } from '../helpers/lifecycle.js';
import {
  exportCatalogToCsv,
  applyCatalogDecisions,
  importCuratedFoods,
} from '../../src/services/catalog-curation.service.js';
import { importFoodsFromJson } from '../../scripts/import-foods.js';

describe('Ferramentas de Curadoria do Catálogo (D-22 / Fase 5)', () => {
  closeTestPool(async () => {
    // Limpeza de registros de teste
    await pool.query("DELETE FROM foods WHERE source IN ('test-curation', 'test-taco') OR name LIKE 'Curated Test%'");
    await pool.query("DELETE FROM admin_audit_log WHERE action LIKE 'catalog_%'");
  });

  it('catalog:export gera CSV com cabeçalho e estrutura válidos', async () => {
    const result = await exportCatalogToCsv();
    assert.strictEqual(typeof result.csvContent, 'string');
    assert.ok(result.csvContent.startsWith('\uFEFF'), 'CSV deve conter BOM UTF-8');
    assert.ok(result.csvContent.includes('id;external_id;source;nome;kcal;proteina;carboidrato;gordura;ativo;sugestao;decisao;novo_nome'));
    assert.ok(result.total >= 0);
  });

  it('catalog:apply em modo simulação não altera o banco de dados', async () => {
    // Inserir alimento para o teste
    const ins = await pool.query<{ id: string }>(
      `INSERT INTO foods (name, calories, proteins, carbs, fats, base_unit, serving_weight, source, external_id, active)
       VALUES ('Curated Test Alimento Simula', 100, 5, 10, 2, 'g', 100, 'test-curation', 'sim-01', true)
       RETURNING id`
    );
    const testFoodId = ins.rows[0].id;

    const csvToSimulate = [
      'id;external_id;source;nome;kcal;proteina;carboidrato;gordura;ativo;sugestao;decisao;novo_nome',
      `${testFoodId};sim-01;test-curation;Curated Test Alimento Simula;100;5;10;2;sim;;ocultar;`,
    ].join('\r\n');

    const result = await applyCatalogDecisions(csvToSimulate, { dryRun: true });
    assert.strictEqual(result.totalRows, 1);
    assert.strictEqual(result.withDecisions, 1);
    assert.strictEqual(result.modified, 1);
    assert.strictEqual(result.errors.length, 0);

    // Conferir que o banco NÃO foi alterado
    const check = await pool.query<{ active: boolean }>(
      'SELECT active FROM foods WHERE id = $1',
      [testFoodId]
    );
    assert.strictEqual(check.rows[0].active, true, 'Banco não deve mudar no dryRun');
  });

  it('catalog:apply grava alterações, marca curado (admin_edited_at) e é idempotente', async () => {
    const ins = await pool.query<{ id: string }>(
      `INSERT INTO foods (name, calories, proteins, carbs, fats, base_unit, serving_weight, source, external_id, active)
       VALUES ('Curated Test Alimento Real', 100, 5, 10, 2, 'g', 100, 'test-curation', 'real-01', true)
       RETURNING id`
    );
    const testFoodId = ins.rows[0].id;

    const csvToApply = [
      'id;external_id;source;nome;kcal;proteina;carboidrato;gordura;ativo;sugestao;decisao;novo_nome',
      `${testFoodId};real-01;test-curation;Curated Test Alimento Real;100;5;10;2;sim;;ocultar;`,
    ].join('\r\n');

    // 1ª execução com apply: deve modificar e gravar log
    const run1 = await applyCatalogDecisions(csvToApply, { dryRun: false });
    assert.strictEqual(run1.modified, 1);
    assert.strictEqual(run1.unchanged, 0);

    const check1 = await pool.query<{ active: boolean; admin_edited_at: Date | null }>(
      'SELECT active, admin_edited_at FROM foods WHERE id = $1',
      [testFoodId]
    );
    assert.strictEqual(check1.rows[0].active, false, 'Alimento deve estar inativo');
    assert.ok(check1.rows[0].admin_edited_at !== null, 'admin_edited_at deve estar preenchido');

    // Auditoria gravada
    const audit = await pool.query(
      `SELECT * FROM admin_audit_log WHERE entity_id = $1 AND action = 'catalog_curation_apply'`,
      [testFoodId]
    );
    assert.strictEqual(audit.rows.length, 1);

    // 2ª execução com o mesmo CSV: deve ser idempotente (unchanged)
    const run2 = await applyCatalogDecisions(csvToApply, { dryRun: false });
    assert.strictEqual(run2.modified, 0, 'Não deve modificar novamente');
    assert.strictEqual(run2.unchanged, 1, 'Deve detectar que já está inalterado');
  });

  it('catalog:apply relata erro para ID desconhecido ou decisão inválida', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const csvWithErrors = [
      'id;external_id;source;nome;kcal;proteina;carboidrato;gordura;ativo;sugestao;decisao;novo_nome',
      `${fakeId};;;Inexistente;100;5;10;2;sim;;ocultar;`,
      `${fakeId};;;Inválido;100;5;10;2;sim;;decisao_maluca;`,
    ].join('\r\n');

    const result = await applyCatalogDecisions(csvWithErrors, { dryRun: true });
    assert.strictEqual(result.withDecisions, 2);
    assert.ok(result.errors.length >= 2);
    assert.ok(result.errors.some((e) => e.includes('Decisão desconhecida')));
    assert.ok(result.errors.some((e) => e.includes('não encontrado no catálogo global')));
  });

  it('catalog:import-curated rejeita item sem source/source_ref e importa com marcador de curadoria', async () => {
    // 1. Rejeição de item sem source_ref (B9)
    const invalidJson = JSON.stringify([
      {
        name: 'Curated Test Sem Fonte',
        calories: 100,
        proteins: 5,
        carbs: 10,
        fats: 2,
        base_unit: 'g',
        serving_weight: 100,
        source: 'TACO',
        // faltando source_ref!
      },
    ]);

    const resInvalid = await importCuratedFoods(invalidJson, { dryRun: true });
    assert.ok(resInvalid.errors.length > 0, 'Deve rejeitar alimento sem source_ref');
    assert.ok(resInvalid.errors[0].includes('source_ref'));

    // 2. Importação válida com divergência calórica (aviso informativo sem bloquear)
    const validJson = JSON.stringify([
      {
        name: 'Curated Test Válido Com Aviso',
        calories: 250, // 4*5 + 4*10 + 9*2 = 78 kcal -> divergência > 25%
        proteins: 5,
        carbs: 10,
        fats: 2,
        base_unit: 'g',
        serving_weight: 100,
        source: 'test-curation',
        source_ref: 'Tabela de Teste, p. 12',
        external_id: 'curated-diverg-01',
      },
    ]);

    const resValid = await importCuratedFoods(validJson, { dryRun: false });
    assert.strictEqual(resValid.errors.length, 0);
    assert.strictEqual(resValid.inserted, 1);
    assert.ok(resValid.reviewWarnings.length > 0, 'Deve reportar warning de divergência para REVISAR');

    // Verificar se no banco ficou com admin_edited_at
    const saved = await pool.query<{ admin_edited_at: Date | null }>(
      "SELECT admin_edited_at FROM foods WHERE source = 'test-curation' AND external_id = 'curated-diverg-01'"
    );
    assert.ok(saved.rows[0].admin_edited_at !== null, 'Item curado deve ter admin_edited_at preenchido');
  });

  it('reimportar TACO (import-foods.ts) nunca reativa inativos nem sobrescreve curados (B10)', async () => {
    // Criar dois alimentos:
    // 1. Um desativado (active = false)
    // 2. Um curado (admin_edited_at IS NOT NULL) com nome customizado
    const res1 = await pool.query<{ id: string }>(
      `INSERT INTO foods (name, calories, proteins, carbs, fats, base_unit, serving_weight, source, external_id, active, admin_edited_at)
       VALUES ('Curated Test Taco Inativo', 100, 2, 20, 1, 'g', 100, 'test-taco', 'taco-01', false, NULL)
       RETURNING id`
    );
    const deactivatedFoodId = res1.rows[0].id;

    const res2 = await pool.query<{ id: string }>(
      `INSERT INTO foods (name, calories, proteins, carbs, fats, base_unit, serving_weight, source, external_id, active, admin_edited_at)
       VALUES ('Curated Test Taco Curado Nome Protegido', 150, 10, 10, 5, 'g', 100, 'test-taco', 'taco-02', true, NOW())
       RETURNING id`
    );
    const curatedFoodId = res2.rows[0].id;

    // Simular carga de TACO com os mesmos external_ids
    const tacoBatch = [
      {
        name: 'Taco 01 Novo Nome',
        calories: 120,
        proteins: 3,
        carbs: 22,
        fats: 1.5,
        base_unit: 'g',
        serving_weight: 100,
        source: 'test-taco',
        external_id: 'taco-01',
      },
      {
        name: 'Taco 02 Nome Sobrescrito Tentado',
        calories: 999, // não deve sobrescrever!
        proteins: 50,
        carbs: 50,
        fats: 50,
        base_unit: 'g',
        serving_weight: 100,
        source: 'test-taco',
        external_id: 'taco-02',
      },
    ];

    const importRes = await importFoodsFromJson(tacoBatch, { isDryRun: false });
    assert.strictEqual(importRes.skipped, 1, 'O item curado deve ter sido pulado (B10)');
    assert.strictEqual(importRes.updated, 1, 'O item desativado é atualizado sem reativação');

    // 1. Verificar se o inativo CONTINUA inativo
    const checkInativo = await pool.query<{ active: boolean; calories: string }>(
      'SELECT active, calories FROM foods WHERE id = $1',
      [deactivatedFoodId]
    );
    assert.strictEqual(checkInativo.rows[0].active, false, 'Alimento desativado NÃO pode ser reativado');
    assert.strictEqual(Number(checkInativo.rows[0].calories), 120, 'Nutrientes foram atualizados');

    // 2. Verificar se o curado NÃO FOI MODIFICADO
    const checkCurado = await pool.query<{ name: string; calories: string }>(
      'SELECT name, calories FROM foods WHERE id = $1',
      [curatedFoodId]
    );
    assert.strictEqual(checkCurado.rows[0].name, 'Curated Test Taco Curado Nome Protegido', 'Nome protegido pelo marcador');
    assert.strictEqual(Number(checkCurado.rows[0].calories), 150, 'Calorias protegidas');
  });
});
