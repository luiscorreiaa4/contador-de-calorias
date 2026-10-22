import fs from 'fs';
import path from 'path';
import { pool } from '../src/database/pool.js';
import { applyCatalogDecisions } from '../src/services/catalog-curation.service.js';

async function runApply() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');
  const filePathIndex = args.findIndex((a) => !a.startsWith('--'));

  if (filePathIndex === -1) {
    console.error('Uso: npx tsx scripts/catalog-apply.ts [--apply] <caminho-para-csv>');
    console.error('Sem a flag --apply, o comando roda em modo SIMULAÇÃO.');
    process.exit(1);
  }

  const filePath = path.resolve(args[filePathIndex]);
  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(filePath, 'utf-8');

  console.log(`Processando decisões de curadoria do arquivo: ${filePath}`);
  if (!isApply) {
    console.log('>>> MODO SIMULAÇÃO: Nenhuma alteração será gravada no banco. Use --apply para efetivar.');
  } else {
    console.log('>>> MODO EFETIVAÇÃO (--apply): Gravando alterações e auditoria no banco de dados...');
  }

  try {
    const result = await applyCatalogDecisions(csvContent, { dryRun: !isApply });

    console.log('Relatório de Processamento:');
    console.log(`- Total de linhas analisadas: ${result.totalRows}`);
    console.log(`- Linhas com decisões preenchidas: ${result.withDecisions}`);
    console.log(`- Modificações ${isApply ? 'executadas' : 'simuladas'}: ${result.modified}`);
    console.log(`- Registros inalterados (idempotência): ${result.unchanged}`);

    if (result.errors.length > 0) {
      console.warn(`- Erros / Avisos encontrados (${result.errors.length}):`);
      for (const err of result.errors) {
        console.warn(`  * ${err}`);
      }
    } else {
      console.log('- Nenhum erro encontrado.');
    }
  } catch (err) {
    console.error('Falha na execução de apply:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runApply();
