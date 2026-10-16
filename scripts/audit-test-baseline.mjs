import { readdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runBounded } from './run-bounded.mjs';

const root = resolve(import.meta.dirname, '..');
const backend = resolve(root, 'backend');
const loader = pathToFileURL(resolve(backend, 'node_modules/tsx/dist/loader.mjs')).href;
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(resolve(dir, e.name)) : resolve(dir, e.name)))).flat();
}
const tests = (await files(resolve(backend, 'tests'))).filter(p => p.endsWith('.test.ts')).sort();
const env = { ...process.env, NODE_ENV: 'test', DB_NAME: 'contador_calorias_test', DB_HOST: '127.0.0.1', DB_PORT: process.env.DB_PORT ?? '5432', TZ: 'America/Sao_Paulo' };
const rows = [];
for (const file of tests) {
  const source = await readFile(file, 'utf8');
  const result = await runBounded(process.execPath, ['--import', loader, '--test', file], { cwd: backend, env, timeout: 45000, capture: true });
  rows.push({ file: file.slice(root.length + 1).replaceAll('\\', '/'), pool: /pool/.test(source), app: /src\/app/.test(source), closes: /pool\.end\(/.test(source), hooks: /after(?:Each)?\(/.test(source), timers: /set(?:Interval|Timeout)\(/.test(source), ...result });
  console.log(rows.at(-1).file, result.code, result.durationMs);
}
const probe = resolve(backend, 'tests/leak-probe.tmp.ts');
try {
  await writeFile(probe, "import { pool } from '../src/database/pool.js';\nconst client = await pool.connect();\nconsole.log('CONNECTED', (await client.query('SELECT current_database() AS db')).rows[0].db);\nclient.release();\n");
  for (const cwd of [backend, root]) {
    const result = await runBounded(process.execPath, ['--import', loader, probe], { cwd, env, timeout: 5000, capture: true });
    rows.push({ file: 'R1/R2 ' + (cwd === root ? 'root' : 'backend'), ...result });
    console.log(rows.at(-1).file, result.code, result.durationMs, result.output.slice(-400));
  }
} finally { await unlink(probe); }
await writeFile(resolve(root, 'docs/test-hygiene-baseline.json'), JSON.stringify(rows, null, 2) + '\n');
