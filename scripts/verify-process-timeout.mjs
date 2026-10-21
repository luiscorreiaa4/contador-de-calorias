import assert from 'node:assert/strict';
import { runBounded } from './run-bounded.mjs';

const childSource = `
  const { spawn } = require('node:child_process');
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'inherit', windowsHide: true });
  console.log('DESCENDANT=' + child.pid);
  setInterval(() => {}, 1000);
`;
const result = await runBounded(process.execPath, ['-e', childSource], { timeout: 1500, capture: true });
assert.equal(result.code, 124);
assert.equal(result.timedOut, true);
assert.ok(result.durationMs < 10000, `Encerramento demorou ${result.durationMs} ms`);
const pid = Number(/DESCENDANT=(\d+)/.exec(result.output)?.[1]);
assert.ok(pid, 'O processo filho precisa iniciar antes do timeout.');
assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
const success = await runBounded(process.execPath, ['-e', 'process.exit(0)'], { timeout: 5000, capture: true });
assert.equal(success.code, 0);
assert.equal(success.timedOut, false);
const failure = await runBounded(process.execPath, ['-e', 'process.exit(7)'], { timeout: 5000, capture: true });
assert.equal(failure.code, 7);
await assert.rejects(() => runBounded('test-hygiene-command-that-does-not-exist', [], { timeout: 1000, capture: true }), { code: 'ENOENT' });
console.log(JSON.stringify({ timeoutMs: result.durationMs, descendantPid: pid, descendantStopped: true, success: success.code, failure: failure.code }));
