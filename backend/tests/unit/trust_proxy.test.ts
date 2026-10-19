import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseTrustProxy } from '../../src/config/trustProxy.js';

describe('trust proxy (BL-01 / D-19)', () => {
  it('deve retornar false quando não configurado ou desabilitado explicitamente', () => {
    assert.strictEqual(parseTrustProxy(undefined), false);
    assert.strictEqual(parseTrustProxy(''), false);
    assert.strictEqual(parseTrustProxy('   '), false);
    assert.strictEqual(parseTrustProxy('false'), false);
    assert.strictEqual(parseTrustProxy('0'), false);
  });

  it('deve retornar o número de saltos quando configurado', () => {
    assert.strictEqual(parseTrustProxy('1'), 1);
    assert.strictEqual(parseTrustProxy('3'), 3);
  });

  it('deve rejeitar valores booleanos textuais (nunca trust proxy "true")', () => {
    assert.throws(() => parseTrustProxy('true'), /número inteiro de saltos/i);
    assert.throws(() => parseTrustProxy('sim'), /número inteiro de saltos/i);
  });
});
