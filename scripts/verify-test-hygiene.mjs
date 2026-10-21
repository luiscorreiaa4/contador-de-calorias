import { readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runBounded } from './run-bounded.mjs';

const root = resolve(import.meta.dirname, '..');
const backend = resolve(root, 'backend');
const npm = resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const env = { ...process.env, DB_HOST: '127.0.0.1', DB_PORT: '5432' };
const results = [];
async function check(name, args, options = {}) {
  const result = await runBounded(process.execPath, args, { cwd: root, env, timeout: 300000, capture: true, ...options });
  results.push({ name, ...result });
  await writeFile(resolve(root, 'docs/test-hygiene-verification.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(name, 'code=' + result.code, result.durationMs + 'ms');
  if (result.code && !name.startsWith('negative')) console.log(result.output.slice(-5000));
  return result;
}
for (let iteration = 1; iteration <= 5; iteration++) {
  await check(`npm test #${iteration}`, [npm, 'run', 'test']);
  await check(`npm run test:strict #${iteration}`, [npm, 'run', 'test:strict']);
}
// Modificação temporária de um arquivo real; restaurada mesmo se a verificação falhar.
const target = resolve(backend, 'tests/unit/db_cleanup.test.ts');
const original = await readFile(target, 'utf8');
try {
  await writeFile(target, original.replace('  closeTestPool();', '  // closeTestPool(); removido temporariamente pela verificação negativa'));
  await check('negative missing helper: guard', [resolve(root, 'scripts/check-test-hygiene.mjs')]);
  await check('negative missing helper: strict', [npm, 'run', 'test:strict', '--', 'tests/unit/db_cleanup.test.ts'], { env: { ...env, TEST_PROCESS_TIMEOUT_MS: '4000' } });
} finally { await writeFile(target, original); }
const probe = resolve(backend, 'tests/config-probe.tmp.ts');
try {
  await writeFile(probe, "import { pool } from '../src/database/pool.js';\ntry { const r = await pool.query('SELECT current_database() AS db'); console.log(r.rows[0].db); } finally { await pool.end(); }\n");
  const args = ['--import', pathToFileURL(resolve(backend, 'node_modules/tsx/dist/loader.mjs')).href, probe];
  const testEnv = { ...env, NODE_ENV: 'test', DB_NAME: 'contador_calorias_test' };
  await check('CWD root with valid environment', args, { env: testEnv, timeout: 5000 });
  await check('negative CWD root with DB_PASSWORD empty', args, { env: { ...testEnv, DB_PASSWORD: '' }, timeout: 5000 });
  await check('negative authentication: PostgreSQL 28P01', args, { env: { ...testEnv, DB_PASSWORD: 'invalid-test-hygiene-probe' }, timeout: 5000 });
} finally { await unlink(probe); }
await check('npm run lint', [npm, 'run', 'lint']);
await check('npm run build', [npm, 'run', 'build']);
await check('npm run test:frontend', [npm, 'run', 'test:frontend']);
process.exitCode = results.some(r => r.name.startsWith('negative') ? r.code === 0 : r.code !== 0) ? 1 : 0;
