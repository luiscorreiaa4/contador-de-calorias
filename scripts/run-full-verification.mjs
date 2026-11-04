// Espelha os passos de .github/workflows/ci.yml, na mesma ordem. Ao mudar o CI, mude aqui.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { runBounded } from './run-bounded.mjs';

const root = resolve(import.meta.dirname, '..');
const win = process.platform === 'win32';
const available = (cmd, args) => spawnSync(cmd, args, { stdio: 'ignore' }).status === 0;
const npm = (...args) => ({
  cmd: win ? 'cmd.exe' : 'npm',
  args: win ? ['/c', 'npm', ...args] : args,
});

const steps = [
  { name: 'Security Audit (raiz)', ...npm('audit', '--audit-level=high') },
  {
    name: 'Security Audit (backend)',
    ...npm('--prefix', 'backend', 'audit', '--audit-level=high'),
  },
  {
    name: 'Security Audit (frontend)',
    ...npm('--prefix', 'frontend', 'audit', '--audit-level=high'),
  },
  {
    name: 'Gitleaks (histórico completo)',
    cmd: 'gitleaks',
    args: ['git', '--redact', '--no-banner', '.'],
    skip: () => !available('gitleaks', ['version']) && 'gitleaks não instalado',
  },
  { name: 'Typecheck Shared', ...npm('--prefix', 'shared', 'run', 'typecheck') },
  { name: 'Typecheck Backend', ...npm('--prefix', 'backend', 'run', 'typecheck') },
  { name: 'Format check', ...npm('run', 'format:check') },
  { name: 'Dead code (knip)', ...npm('run', 'knip') },
  { name: 'Lint', ...npm('run', 'lint') },
  { name: 'Testes do Backend com cobertura', ...npm('run', 'test:coverage') },
  { name: 'Rollback de migrações', ...npm('run', 'test:rollback') },
  // Porta própria para não colidir com o backend de desenvolvimento em :3001.
  { name: 'Carga (smoke)', ...npm('run', 'test:load'), env: { PORT: '3201', DURATION: '10' } },
  { name: 'E2E (Playwright)', ...npm('run', 'test:e2e') },
  {
    name: 'Testes do Frontend com cobertura',
    ...npm('--prefix', 'frontend', 'run', 'test:coverage'),
  },
  { name: 'Build do Frontend', ...npm('--prefix', 'frontend', 'run', 'build') },
  {
    name: 'Build da imagem Docker da API',
    cmd: 'docker',
    args: ['build', '-t', 'caloriesync-api:ci', '.'],
    skip: () => !available('docker', ['info']) && 'Docker não está rodando',
  },
  {
    // Só importa os módulos (sem banco): pega dependência faltando na imagem.
    name: 'Smoke da imagem Docker da API (imports)',
    cmd: 'docker',
    args: [
      'run',
      '--rm',
      ...Object.entries({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgres://postgres:x@localhost:5432/contador_calorias_test',
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_USER: 'postgres',
        DB_PASSWORD: 'x',
        DB_NAME: 'contador_calorias_test',
        JWT_SECRET: 'super_secret_test_key_with_at_least_32_chars_123!',
        CORS_ORIGIN: 'http://localhost:5173',
        APP_BASE_URL: 'http://localhost:5173',
        MAIL_FROM: 'CalorieSync <no-reply@caloriesync.local>',
        MAIL_TRANSPORT: 'memory',
        AUTH_TOKEN_PEPPER: 'super_secret_test_pepper_with_at_least_32_chars_456!',
      }).flatMap(([k, v]) => ['-e', `${k}=${v}`]),
      'caloriesync-api:ci',
      'node',
      '--import',
      'tsx',
      '-e',
      "await import('./src/app.ts'); console.log('imports OK'); process.exit(0)",
    ],
    skip: () => !available('docker', ['info']) && 'Docker não está rodando',
  },
];

const started = Date.now();
const skipped = [];
for (const [i, step] of steps.entries()) {
  const label = `[${i + 1}/${steps.length}] ${step.name}`;
  const reason = step.skip?.();
  if (reason) {
    console.warn(`\n⚠ ${label}: PULADO (${reason}).`);
    skipped.push(step.name);
    continue;
  }
  console.log(`\n▶ ${label}`);
  const result = await runBounded(step.cmd, step.args, {
    cwd: root,
    env: { ...process.env, ...step.env },
    timeout: 600000,
  });
  if (result.code !== 0) {
    console.error(`\n❌ FALHA em "${step.name}" (código ${result.code}). Corrija antes do push.`);
    process.exit(result.code || 1);
  }
  console.log(`✔ ${step.name} (${(result.durationMs / 1000).toFixed(1)}s)`);
}

const total = ((Date.now() - started) / 1000).toFixed(1);
console.log(`\n🎉 Passos do CI aprovados em ${total}s.`);
if (skipped.length) console.warn(`⚠ Pulados (rodam só no CI): ${skipped.join(', ')}.`);
