import { spawn } from 'node:child_process';

export function runBounded(command, args, options = {}) {
  const timeout = Number(options.timeout ?? process.env.TEST_PROCESS_TIMEOUT_MS ?? 300000);
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 3600000) {
    throw new Error('TEST_PROCESS_TIMEOUT_MS deve estar entre 1 e 3600000 ms.');
  }
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const child = spawn(command, args, {
      cwd: options.cwd, env: options.env ?? process.env,
      stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      detached: process.platform !== 'win32', windowsHide: true,
    });
    let output = '';
    child.stdout?.on('data', chunk => { output += chunk; });
    child.stderr?.on('data', chunk => { output += chunk; });
    let timedOut = false;
    let killer;
    const stop = () => {
      if (!child.pid) return;
      if (process.platform === 'win32') {
        killer ??= new Promise(done => {
          const taskkill = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
          taskkill.once('error', () => { child.kill('SIGKILL'); done(); });
          taskkill.once('exit', done);
        });
      } else {
        try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') reject(error); }
      }
    };
    const timer = setTimeout(() => {
      timedOut = true;
      console.error(`Tempo limite de ${timeout} ms excedido; encerrando árvore de processos (PID ${child.pid}).`);
      stop();
    }, timeout);
    const interrupt = () => { timedOut = true; stop(); };
    process.on('SIGINT', interrupt);
    process.on('SIGTERM', interrupt);
    const cleanup = () => {
      clearTimeout(timer);
      process.off('SIGINT', interrupt);
      process.off('SIGTERM', interrupt);
    };
    child.once('error', error => { cleanup(); reject(error); });
    child.once('close', async code => {
      await killer;
      cleanup();
      resolve({ code: timedOut ? 124 : (code ?? 1), timedOut, durationMs: Date.now() - started, output });
    });
  });
}
