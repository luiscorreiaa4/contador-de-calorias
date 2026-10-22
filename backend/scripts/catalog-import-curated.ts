import fs from 'fs';
import path from 'path';
import { pool } from '../src/database/pool.js';
import { importCuratedFoods } from '../src/services/catalog-curation.service.js';

async function runImportCurated() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');
  const filePathIndex = args.findIndex((a) => !a.startsWith('--'));

  if (filePathIndex === -1) {
    console.error('Uso: npx tsx scripts/catalog-import-curated.ts [--apply] <caminho-para-json>');
    console.error('Sem a flag --apply, o comando roda em modo SIMULAÇÃO.');
    process.exit(1);
  }

  const filePath = path.resolve(args[filePathIndex]);
  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const jsonContent = fs.readFileSync(filePath, 'utf-8');

  console.log(`Processando importação de alimentos curados: ${filePath}`);
  if (!isApply) {
    console.log('>>> MODO SIMULAÇÃO: Nenhuma alteração será gravada no banco. Use --apply para efetivar.');
  } else {
    console.log('>>> MODO EFETIVAÇÃO (--apply): Gravando no banco com marcador de curadoria e auditoria...');
  }

  try {
    const result = await importCuratedFoods(jsonContent, { dryRun: !isApply });

    console.log('Relatório de Importação Curada:');
    console.log(`- Total de itens no arquivo: ${result.total}`);
    console.log(`- Novos inseridos ${isApply ? '' : '(simulado)'}: ${result.inserted}`);
    console.log(`- Atualizados ${isApply ? '' : '(simulado)'}: ${result.updated}`);

    if (result.reviewWarnings.length > 0) {
      console.log(`- Itens para REVISAR (divergência calórica > 25%): ${result.reviewWarnings.length}`);
      for (const w of result.reviewWarnings) {
        console.log(`  ${w}`);
      }
    }

    if (result.errors.length > 0) {
      console.warn(`- Erros de validação encontrados (${result.errors.length}):`);
      for (const err of result.errors) {
        console.warn(`  * ${err}`);
      }
    } else {
      console.log('- Nenhum erro de validação.');
    }
  } catch (err) {
    console.error('Falha na importação curada:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runImportCurated();
