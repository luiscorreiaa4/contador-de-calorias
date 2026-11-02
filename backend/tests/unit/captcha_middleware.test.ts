import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import type { Request, Response } from 'express';
import { createCaptchaMiddleware } from '../../src/middlewares/captcha.js';

function run(secret: string | undefined, body: object, siteverify?: { success: boolean } | Error) {
  const fetchMock = mock.method(globalThis, 'fetch', async () => {
    if (siteverify instanceof Error) throw siteverify;
    return { json: async () => siteverify } as Response;
  });
  let status = 0;
  let payload: { code?: string } = {};
  let nexted = false;
  const res = {
    status(code: number) {
      status = code;
      return this;
    },
    json(data: { code?: string }) {
      payload = data;
    },
  } as unknown as Response;
  return createCaptchaMiddleware(secret)({ body, ip: '1.2.3.4' } as Request, res, () => {
    nexted = true;
  }).then(() => {
    fetchMock.mock.restore();
    return { status, payload, nexted, calls: fetchMock.mock.callCount() };
  });
}

describe('Captcha Turnstile (#6)', () => {
  it('desligado sem secret: segue sem consultar a Cloudflare', async () => {
    const r = await run(undefined, {});
    assert.ok(r.nexted);
    assert.strictEqual(r.calls, 0);
  });

  it('token válido segue; inválido, ausente ou erro de rede respondem 400 CAPTCHA_FAILED', async () => {
    assert.ok((await run('s', { captcha_token: 't' }, { success: true })).nexted);
    for (const [body, verify] of [
      [{ captcha_token: 't' }, { success: false }],
      [{}, { success: true }],
      [{ captcha_token: 't' }, new Error('rede')],
    ] as const) {
      const r = await run('s', body, verify);
      assert.strictEqual(r.status, 400);
      assert.strictEqual(r.payload.code, 'CAPTCHA_FAILED');
      assert.strictEqual(r.nexted, false);
    }
  });
});
