import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';

interface StructuredLogLine {
  level: string;
  time: string;
  requestId: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
}

function parseLogLines(lines: string[]): StructuredLogLine[] {
  return lines
    .map((line) => {
      try {
        return JSON.parse(line) as StructuredLogLine;
      } catch {
        return null;
      }
    })
    .filter((value): value is StructuredLogLine => value !== null && typeof value.requestId === 'string');
}

describe('Logging HTTP estruturado (BL-08 / ARCH-020)', () => {
  closeTestPool();

  it('deve propagar o correlation id recebido e emitir log JSON com método, status e duração', async () => {
    const originalLog = console.log;
    const captured: string[] = [];
    console.log = (...args: unknown[]) => {
      captured.push(args.map((arg) => String(arg)).join(' '));
    };

    try {
      const res = await request(app).get('/health').set('X-Request-Id', 'req-teste-123');
      assert.strictEqual(res.headers['x-request-id'], 'req-teste-123');

      // Sincronização determinística aguardando a emissão do log assíncrono (A-120)
      const start = Date.now();
      while (Date.now() - start < 1500) {
        if (parseLogLines(captured).some((entry) => entry.requestId === 'req-teste-123')) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } finally {
      console.log = originalLog;
    }

    const line = parseLogLines(captured).find((entry) => entry.requestId === 'req-teste-123');

    assert.ok(line, 'Esperado um log JSON contendo o correlation id enviado');
    assert.strictEqual(line.method, 'GET');
    assert.strictEqual(line.url, '/health');
    assert.strictEqual(line.status, 200);
    assert.strictEqual(typeof line.durationMs, 'number');
    assert.ok(line.durationMs >= 0, 'Duração deve ser um número não negativo');
    assert.strictEqual(typeof line.time, 'string');
  });

  it('deve gerar um correlation id próprio quando o header não é enviado', async () => {
    const res = await request(app).get('/health');

    assert.match(String(res.headers['x-request-id']), /^[0-9a-f-]{36}$/);
  });
});
