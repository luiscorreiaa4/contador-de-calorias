import { describe, it } from 'node:test';
import assert from 'node:assert';
import { UV_THREADPOOL_SIZE } from '../../src/config/threadpool.js';

describe('UV_THREADPOOL_SIZE (BL-17 / PERF-011)', () => {
  it('deve dimensionar o pool de threads do libuv com um inteiro positivo', () => {
    assert.ok(Number.isInteger(UV_THREADPOOL_SIZE), 'Esperado inteiro');
    assert.ok(UV_THREADPOOL_SIZE > 0, 'Esperado valor positivo');
    assert.ok(UV_THREADPOOL_SIZE <= 1024, 'Esperado valor dentro do limite do libuv');
    assert.strictEqual(process.env.UV_THREADPOOL_SIZE, String(UV_THREADPOOL_SIZE));
  });
});
