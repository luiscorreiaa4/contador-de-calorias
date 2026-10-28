import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/database/pool.js';
import { exportCatalogToCsv } from '../src/services/catalog-curation.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runExport() {
  const dataDir = path.resolve(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, 'catalog-review.csv');
  console.log(`Exportando catálogo global para revisão: ${outputPath}`);

  try {
    const result = await exportCatalogToCsv();
    fs.writeFileSync(outputPath, result.csvContent, { encoding: 'utf-8' });

    console.log('Exportação concluída com sucesso!');
    console.log(`- Total de alimentos: ${result.total}`);
    console.log(`- Alimentos inativos: ${result.inactiveCount}`);
    console.log(`- Sugestões de duplicata detectadas: ${result.suggestionCount}`);
    console.log(`Arquivo salvo em: ${outputPath}`);
  } catch (err) {
    console.error('Erro ao exportar catálogo:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runExport();
