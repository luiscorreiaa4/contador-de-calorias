// E2E (#22): semeia o usuário no banco `_test` e roda o Playwright, com teto de tempo.
import { resolve } from 'node:path';
import { runBounded } from './run-bounded.mjs';

const root = resolve(import.meta.dirname, '..');
const env = {
  ...process.env,
  NODE_ENV: 'test',
  DB_NAME: 'contador_calorias_test',
  CAPTCHA_SECRET_KEY: '',
};
const backend = resolve(root, 'backend');
const seed = await runBounded(process.execPath, ['--import', 'tsx', 'scripts/e2e-seed.ts'], {
  cwd: backend,
  env,
});
if (seed.code !== 0) process.exit(seed.code);
const cli = resolve(root, 'frontend/node_modules/@playwright/test/cli.js');
const result = await runBounded(process.execPath, [cli, 'test'], {
  cwd: resolve(root, 'frontend'),
  env,
});
process.exitCode = result.code;
