import { resolve, relative, isAbsolute } from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { runBounded } from './run-bounded.mjs';

const root = resolve(import.meta.dirname, '..');
const [mode = 'backend', ...requested] = process.argv.slice(2);
const frontend = mode === 'frontend' || mode === 'frontend:file';
if (!['backend', 'strict', 'file', 'frontend', 'frontend:file'].includes(mode)) throw new Error('Modo de teste inválido.');
const cwd = resolve(root, frontend ? 'frontend' : 'backend');
async function findTests(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? findTests(resolve(dir, e.name)) : resolve(dir, e.name)))).flat().filter(p => p.endsWith('.test.ts'));
}
if (mode === 'file' && requested.length !== 1) throw new Error('Uso: npm run test:file -- tests/unit/arquivo.test.ts');
if (mode === 'frontend:file' && requested.length === 0) throw new Error('Uso: npm run test:frontend:file <caminho>');
const files = frontend ? requested : requested.length ? requested.map(p => resolve(cwd, p)) : await findTests(resolve(cwd, 'tests'));
for (const file of frontend ? [] : files) {
  const rel = relative(resolve(cwd, 'tests'), file);
  if (rel.startsWith('..') || isAbsolute(rel) || !file.endsWith('.test.ts') || !(await stat(file)).isFile()) throw new Error('Informe um arquivo .test.ts dentro de backend/tests.');
}
const testDefaults = {
  APP_BASE_URL: 'http://localhost:5173',
  MAIL_FROM: 'CalorieSync <no-reply@caloriesync.local>',
  MAIL_TRANSPORT: 'memory',
  AUTH_TOKEN_PEPPER: 'super_secret_test_pepper_with_at_least_32_chars_456!',
};
const env = { ...testDefaults, ...process.env, NODE_ENV: 'test', TZ: 'America/Sao_Paulo', DB_NAME: 'contador_calorias_test' };
// Sem force-exit, sockets ociosos também precisam permanecer visíveis ao diagnóstico.
env.TEST_STRICT = mode === 'backend' ? '0' : '1';
const args = frontend
  ? [resolve(cwd, 'node_modules/vitest/vitest.mjs'), 'run', ...files]
  : ['--import', pathToFileURL(resolve(cwd, 'node_modules/tsx/dist/loader.mjs')).href, '--test', '--test-timeout=30000', '--test-concurrency=1', ...(mode === 'backend' ? ['--test-force-exit'] : []), ...files];
const result = await runBounded(process.execPath, args, { cwd, env });
console.log(`Testes ${mode}: ${result.durationMs} ms; código ${result.code}.`);
process.exitCode = result.code;
