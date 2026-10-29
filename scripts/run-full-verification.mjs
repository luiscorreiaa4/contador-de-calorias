import { resolve } from 'node:path';
import { runBounded } from './run-bounded.mjs';

const root = resolve(import.meta.dirname, '..');

const steps = [
  {
    name: '1. Security Audit (npm audit)',
    args: ['audit', '--audit-level=high'],
  },
  {
    name: '2. Typecheck Shared (@caloriesync/shared)',
    args: ['--prefix', 'shared', 'run', 'typecheck'],
  },
  {
    name: '3. Typecheck Backend (TypeScript)',
    args: ['--prefix', 'backend', 'run', 'typecheck'],
  },
  {
    name: '4. Lint & Estilo (ESLint, Higiene de Testes e Guarda de Cores)',
    args: ['run', 'lint'],
  },
  {
    name: '5. Testes do Backend em Modo Estrito (node:test + PostgreSQL)',
    args: ['run', 'test:strict'],
  },
  {
    name: '6. Testes do Frontend com Cobertura (Vitest + RTL + MSW)',
    args: ['--prefix', 'frontend', 'run', 'test:coverage'],
  },
  {
    name: '7. Build de Produção do Frontend (Vite + tsc)',
    args: ['run', 'build'],
  },
];

console.log('='.repeat(70));
console.log('🚀 INICIANDO BATERIA COMPLETA DE VERIFICAÇÃO CI');
console.log('='.repeat(70));

const totalStarted = Date.now();

for (let i = 0; i < steps.length; i++) {
  const step = steps[i];
  console.log(`\n[${i + 1}/${steps.length}] ▶ Executando: ${step.name}...`);

  const cmd = process.platform === 'win32' ? 'cmd.exe' : 'npm';
  const cmdArgs = process.platform === 'win32' ? ['/c', 'npm', ...step.args] : step.args;

  const result = await runBounded(cmd, cmdArgs, { cwd: root });

  if (result.code !== 0) {
    console.error(`\n❌ FALHA na etapa "${step.name}" (código ${result.code}, duração: ${(result.durationMs / 1000).toFixed(1)}s).`);
    console.error('Interrompendo verificação completa antes do push.');
    process.exit(result.code);
  }

  console.log(`✔ Etapa "${step.name}" concluída com sucesso em ${(result.durationMs / 1000).toFixed(1)}s.`);
}

const totalDuration = ((Date.now() - totalStarted) / 1000).toFixed(1);
console.log('\n' + '='.repeat(70));
console.log(`🎉 TODAS AS ETAPAS DE CI FORAM APROVADAS COM SUCESSO! (${totalDuration}s)`);
console.log('Repositório 100% íntegro e seguro para Push / Pull Request.');
console.log('='.repeat(70));

