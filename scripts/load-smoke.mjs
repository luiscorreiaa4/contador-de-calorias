// Sobe a API, espera /health, roda a carga e derruba a API (#23). Usa o ambiente atual.
import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const port = process.env.PORT || '3001';
const base = `http://127.0.0.1:${port}`;
const backend = resolve(import.meta.dirname, '../backend');
const server = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
  cwd: backend,
  env: { ...process.env, PORT: port },
  stdio: ['ignore', 'ignore', 'inherit'], // sem o log de cada requisição
});

const healthy = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${base}/health`)).ok) return true;
    } catch {
      /* ainda subindo */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
};

let code = 1;
try {
  if (!(await healthy())) throw new Error('API não ficou saudável em 60 s.');
  const r = spawnSync(process.execPath, ['tests/load/autocannon.js'], {
    cwd: backend,
    env: { ...process.env, API_URL: base },
    stdio: 'inherit',
  });
  code = r.status ?? 1;
} catch (e) {
  console.error(e.message);
} finally {
  server.kill();
}
process.exitCode = code;
