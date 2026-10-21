import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  MAX_RESET_REQUESTS_PER_HOUR,
  MAX_VERIFICATION_ATTEMPTS,
  MAX_VERIFICATION_SENDS_PER_HOUR,
  PASSWORD_RESET_TTL_MS,
  RESEND_COOLDOWN_MS,
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_TTL_MS,
  generateResetToken,
  generateVerificationCode,
  hashResetToken,
  hashVerificationCode,
  normalizeEmail,
  safeCompareHex,
} from '../../src/utils/authTokens.js';

describe('Utilitários de autenticação por e-mail (D-21)', () => {
  it('gera códigos de 6 dígitos, inclusive com zeros à esquerda', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateVerificationCode();
      assert.match(code, /^\d{6}$/);
      assert.strictEqual(code.length, VERIFICATION_CODE_LENGTH);
      assert.ok(Number(code) >= 0 && Number(code) <= 999999);
    }
  });

  it('calcula HMAC-SHA256 determinístico e dependente da pepera', () => {
    const pepperA = 'a'.repeat(32);
    const pepperB = 'b'.repeat(32);
    const code = '123456';

    const hashA = hashVerificationCode(code, pepperA);
    const hashA2 = hashVerificationCode(code, pepperA);
    const hashB = hashVerificationCode(code, pepperB);

    assert.match(hashA, /^[0-9a-f]{64}$/);
    assert.strictEqual(hashA, hashA2);
    assert.notStrictEqual(hashA, hashB);
    assert.notStrictEqual(hashA, code);
  });

  it('gera token de reset com 32 bytes em base64url e hash SHA-256', () => {
    const token = generateResetToken();
    assert.match(token, /^[A-Za-z0-9_-]{43}$/);
    assert.strictEqual(Buffer.from(token, 'base64url').length, 32);

    const hash = hashResetToken(token);
    assert.match(hash, /^[0-9a-f]{64}$/);
    assert.strictEqual(hash, hashResetToken(token));
    assert.notStrictEqual(hash, token);
    assert.notStrictEqual(hashResetToken(generateResetToken()), hash);
  });

  it('compara hashes em tempo constante e rejeita entradas inválidas', () => {
    const a = 'a'.repeat(64);
    const b = 'b'.repeat(64);
    assert.strictEqual(safeCompareHex(a, a), true);
    assert.strictEqual(safeCompareHex(a, b), false);
    assert.strictEqual(safeCompareHex(a, 'a'.repeat(62)), false);
    assert.strictEqual(safeCompareHex('zz', 'zz'), false);
    assert.strictEqual(safeCompareHex('', ''), false);
    assert.strictEqual(safeCompareHex('abc', 'abc'), false);
  });

  it('normaliza e-mail com trim e minúsculas, preservando +tag (A11)', () => {
    assert.strictEqual(normalizeEmail('  User+Tag@Example.COM '), 'user+tag@example.com');
    assert.strictEqual(normalizeEmail('TESTE@TESTE.COM'), 'teste@teste.com');
  });

  it('expõe os limites e validades acordados em A2/A3/A9', () => {
    assert.strictEqual(VERIFICATION_CODE_TTL_MS, 15 * 60 * 1000);
    assert.strictEqual(PASSWORD_RESET_TTL_MS, 30 * 60 * 1000);
    assert.strictEqual(RESEND_COOLDOWN_MS, 60 * 1000);
    assert.strictEqual(MAX_VERIFICATION_ATTEMPTS, 5);
    assert.strictEqual(MAX_VERIFICATION_SENDS_PER_HOUR, 5);
    assert.strictEqual(MAX_RESET_REQUESTS_PER_HOUR, 5);
  });
});
