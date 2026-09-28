import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  registerUserSchema,
  loginUserSchema,
  updateUserSchema,
  deleteUserSchema,
  completeOnboardingSchema,
} from '../src/schemas/user.schema.js';

describe('User Schema Validation (registerUserSchema)', () => {
  it('deve validar com sucesso um cadastro com dados válidos', () => {
    const validData = {
      name: 'Maria Silva',
      email: 'maria@example.com',
      password: 'senhaSegura123',
    };

    const result = registerUserSchema.safeParse(validData);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.name, 'Maria Silva');
      assert.strictEqual(result.data.email, 'maria@example.com');
      assert.strictEqual(result.data.password, 'senhaSegura123');
    }
  });

  it('deve rejeitar e-mail em formato inválido', () => {
    const invalidData = {
      name: 'Ana',
      email: 'email_invalido',
      password: 'senhaSegura123',
    };

    const result = registerUserSchema.safeParse(invalidData);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.strictEqual(result.error.format().email?._errors[0], 'Digite um e-mail válido.');
    }
  });

  it('deve rejeitar senha com menos de 6 caracteres', () => {
    const invalidData = {
      name: 'Ana',
      email: 'ana@example.com',
      password: '123',
    };

    const result = registerUserSchema.safeParse(invalidData);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.strictEqual(result.error.format().password?._errors[0], 'A senha deve ter no mínimo 6 caracteres.');
    }
  });
});

describe('User Schema Validation (completeOnboardingSchema)', () => {
  it('deve aceitar "masculino", "feminino" e "prefiro_nao_responder" no campo sexo', () => {
    const sexos = ['masculino', 'feminino', 'prefiro_nao_responder'] as const;

    for (const sex of sexos) {
      const result = completeOnboardingSchema.safeParse({
        sex,
        birthDate: '1995-10-20',
        goal: 'perder_peso',
        weight: 70,
        height: 175,
        activity_level: 'moderadamente_ativo',
      });
      assert.strictEqual(result.success, true, `Falhou para o sexo: ${sex}`);
    }
  });

  it('deve rejeitar valor de sexo não permitido', () => {
    const invalidData = {
      sex: 'outro_valor_invalido',
      birthDate: '2000-01-01',
      goal: 'manter_peso',
      weight: 65,
      height: 168,
      activity_level: 'sedentario',
    };

    const result = completeOnboardingSchema.safeParse(invalidData);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      const fieldError = result.error.format().sex?._errors[0];
      assert.strictEqual(fieldError, 'Selecione o sexo.');
    }
  });

  it('deve rejeitar data de nascimento vazia ou menor que 10 caracteres', () => {
    const invalidData = {
      sex: 'masculino',
      birthDate: '1990',
      goal: 'manter_peso',
      weight: 80,
      height: 180,
      activity_level: 'muito_ativo',
    };

    const result = completeOnboardingSchema.safeParse(invalidData);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.strictEqual(result.error.format().birthDate?._errors[0], 'A data de nascimento é obrigatória.');
    }
  });
});

describe('User Schema Validation (loginUserSchema)', () => {
  it('deve validar dados corretos de login', () => {
    const result = loginUserSchema.safeParse({
      email: 'teste@example.com',
      password: '123456',
    });
    assert.strictEqual(result.success, true);
  });

  it('deve rejeitar e-mail inválido no login', () => {
    const result = loginUserSchema.safeParse({
      email: 'invalido',
      password: '123456',
    });
    assert.strictEqual(result.success, false);
  });
});

describe('User Schema Validation (updateUserSchema)', () => {
  it('deve permitir atualização parcial de nome e objetivo', () => {
    const result = updateUserSchema.safeParse({
      name: 'Novo Nome',
      goal: 'ganhar_massa',
    });
    assert.strictEqual(result.success, true);
  });

  it('deve exigir senha atual quando nova senha for enviada', () => {
    const result = updateUserSchema.safeParse({
      newPassword: 'novaSenha123',
    });
    assert.strictEqual(result.success, false);
  });

  it('deve aceitar troca de senha quando senha atual e nova forem fornecidas', () => {
    const result = updateUserSchema.safeParse({
      currentPassword: 'senhaAntiga123',
      newPassword: 'novaSenha123',
    });
    assert.strictEqual(result.success, true);
  });

  it('deve permitir alterar apenas o nome de usuário', () => {
    const result = updateUserSchema.safeParse({
      name: 'Luis Correia',
    });
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.name, 'Luis Correia');
    }
  });
});

describe('User Schema Validation (deleteUserSchema)', () => {
  it('deve validar requisição de exclusão de conta com senha', () => {
    const result = deleteUserSchema.safeParse({
      password: 'minhaSenha123',
    });
    assert.strictEqual(result.success, true);
  });

  it('deve rejeitar exclusão de conta sem informar a senha', () => {
    const result = deleteUserSchema.safeParse({});
    assert.strictEqual(result.success, false);
  });
});
