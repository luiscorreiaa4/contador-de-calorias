import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { registerUserSchema, updateUserSchema } from '@caloriesync/shared';
import * as AuthService from '../../src/services/auth.service.js';

describe('Password Security Policy & Dummy Bcrypt Timing Attack Mitigation (PC-08 / SEC-004 / SEC-005)', () => {
  closeTestPool();
  it('registerUserSchema: deve rejeitar senhas com menos de 8 caracteres', () => {
    const res = registerUserSchema.safeParse({
      name: 'Tester',
      email: 'test@example.com',
      password: 'pass12', // 6 caracteres
      acceptTerms: true
    });
    assert.strictEqual(res.success, false);
    if (!res.success) {
      assert.match(res.error.format().password?._errors[0] || '', /8 caracteres/);
    }
  });

  it('registerUserSchema: deve rejeitar senhas com 8+ caracteres que contenham apenas letras', () => {
    const res = registerUserSchema.safeParse({
      name: 'Tester',
      email: 'test@example.com',
      password: 'somenteletras',
      acceptTerms: true
    });
    assert.strictEqual(res.success, false);
    if (!res.success) {
      assert.match(res.error.format().password?._errors[0] || '', /letra e.*número/i);
    }
  });

  it('registerUserSchema: deve rejeitar senhas com 8+ caracteres que contenham apenas números', () => {
    const res = registerUserSchema.safeParse({
      name: 'Tester',
      email: 'test@example.com',
      password: '123456789',
      acceptTerms: true
    });
    assert.strictEqual(res.success, false);
    if (!res.success) {
      assert.match(res.error.format().password?._errors[0] || '', /letra e.*número/i);
    }
  });

  it('registerUserSchema: deve aceitar senha forte com 8+ caracteres, letra e número', () => {
    const res = registerUserSchema.safeParse({
      name: 'Tester',
      email: 'test@example.com',
      password: 'senhaSegura123', // gitleaks:allow
      acceptTerms: true
    });
    assert.strictEqual(res.success, true);
  });

  it('updateUserSchema: deve exigir política de senha forte em newPassword', () => {
    const invalidRes = updateUserSchema.safeParse({
      currentPassword: 'currentPassword123', // gitleaks:allow
      newPassword: 'fraca'
    });
    assert.strictEqual(invalidRes.success, false);

    const validRes = updateUserSchema.safeParse({
      currentPassword: 'currentPassword123', // gitleaks:allow
      newPassword: 'novaSenhaForte123' // gitleaks:allow
    });
    assert.strictEqual(validRes.success, true);
  });

  it('login: deve rejeitar usuário inexistente com status 401 e mensagem genérica', async () => {
    await assert.rejects(
      async () => {
        await AuthService.login({
          email: 'nao_existe_mesmo@example.com',
          password: 'qualquerSenha123'
        });
      },
      (err: { statusCode?: number; message?: string }) => {
        assert.strictEqual(err.statusCode, 401);
        assert.strictEqual(err.message, 'E-mail ou senha incorretos.');
        return true;
      }
    );
  });
});
