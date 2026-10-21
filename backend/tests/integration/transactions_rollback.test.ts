import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { pool } from '../../src/database/pool.js';
import * as UserService from '../../src/services/user.service.js';
import * as UserModel from '../../src/models/user.model.js';
import { cleanupTestData } from '../helpers/db.js';

describe('Atomic Transactions & Rollback on Failure (PC-17 / ARCH-002 / TST-012)', () => {
  closeTestPool(async () => {
      await pool.query('ALTER TABLE body_measurements DROP CONSTRAINT IF EXISTS check_test_onboarding_fail');
      await pool.query('ALTER TABLE body_measurements DROP CONSTRAINT IF EXISTS check_test_profile_fail');
      await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS check_test_goals_fail');
      await cleanupTestData('tester-tx-%');
  });

  it('completeOnboarding: deve fazer rollback total se falhar ao salvar body_measurement', async () => {
    const email = `tester-tx-onboard-${Date.now()}@example.com`;
    const auth = await UserService.register({
      name: 'Tester Rollback Onboard',
      email,
      password: 'senhaForte123', // gitleaks:allow
      acceptTerms: true
    });
    const userId = auth.user.id;

    // Adiciona restrição no PostgreSQL para forçar falha na 3ª etapa (insertBodyMeasurement)
    await pool.query('ALTER TABLE body_measurements ADD CONSTRAINT check_test_onboarding_fail CHECK (weight <= 300) NOT VALID');

    try {
      await assert.rejects(
        async () => {
          await UserService.completeOnboarding(userId, {
            sex: 'masculino',
            birthDate: '1990-05-15',
            goal: 'perder_peso',
            weight: 350, // viola check_test_onboarding_fail
            height: 180,
            activity_level: 'moderadamente_ativo'
          });
        },
        /check_test_onboarding_fail/
      );
    } finally {
      await pool.query('ALTER TABLE body_measurements DROP CONSTRAINT IF EXISTS check_test_onboarding_fail');
    }

    // Com rollback transacional, o usuário NÃO deve ficar com onboarding_completed = true
    const user = await UserModel.findFullUserById(userId);
    assert.strictEqual(user?.onboarding_completed, false, 'onboarding_completed deve permanecer false após rollback');
    assert.strictEqual(user?.weight, null, 'weight deve permanecer null após rollback');

    const goalsRes = await pool.query('SELECT * FROM user_goals WHERE user_id = $1', [userId]);
    assert.strictEqual(goalsRes.rows.length, 0, 'Nenhuma meta deve ser gravada após rollback');

    const measuresRes = await pool.query('SELECT * FROM body_measurements WHERE user_id = $1', [userId]);
    assert.strictEqual(measuresRes.rows.length, 0, 'Nenhuma medida deve ser gravada após rollback');
  });

  it('updateGoals: deve fazer rollback total se a atualização do usuário falhar', async () => {
    const email = `tester-tx-goals-${Date.now()}@example.com`;
    const auth = await UserService.register({
      name: 'Tester Goals Rollback',
      email,
      password: 'senhaForte123', // gitleaks:allow
      acceptTerms: true
    });
    const userId = auth.user.id;

    // Adiciona restrição no PostgreSQL para forçar falha no UPDATE users (2ª etapa)
    await pool.query('ALTER TABLE users ADD CONSTRAINT check_test_goals_fail CHECK (daily_calories_goal <= 5000) NOT VALID');

    try {
      await assert.rejects(
        async () => {
          await UserService.updateGoals(userId, {
            calories: 6000, // viola check_test_goals_fail na tabela users
            proteins: 180,
            carbs: 250,
            fats: 70,
            mode: 'manual'
          });
        },
        /check_test_goals_fail/
      );
    } finally {
      await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS check_test_goals_fail');
    }

    // Com rollback transacional, user_goals não deve ter a meta inserida
    const goalsRes = await pool.query('SELECT * FROM user_goals WHERE user_id = $1', [userId]);
    assert.strictEqual(goalsRes.rows.length, 0, 'Meta em user_goals deve ter sofrido rollback');
  });

  it('updateProfile: deve fazer rollback total se a inserção da medida corporal falhar', async () => {
    const email = `tester-tx-prof-${Date.now()}@example.com`;
    const auth = await UserService.register({
      name: 'Tester Profile Original',
      email,
      password: 'senhaForte123', // gitleaks:allow
      acceptTerms: true
    });
    const userId = auth.user.id;

    // Adiciona restrição no PostgreSQL para forçar falha no insertBodyMeasurement (2ª etapa)
    await pool.query('ALTER TABLE body_measurements ADD CONSTRAINT check_test_profile_fail CHECK (weight <= 300) NOT VALID');

    try {
      await assert.rejects(
        async () => {
          await UserService.updateProfile(userId, {
            name: 'Nome Alterado Que Nao Deve Persistir',
            weight: 350 // viola check_test_profile_fail
          });
        },
        /check_test_profile_fail/
      );
    } finally {
      await pool.query('ALTER TABLE body_measurements DROP CONSTRAINT IF EXISTS check_test_profile_fail');
    }

    // Com rollback transacional, a alteração de nome no UPDATE users deve ser revertida
    const user = await UserModel.findFullUserById(userId);
    assert.strictEqual(user?.name, 'Tester Profile Original', 'Nome deve ser revertido após rollback');
    assert.strictEqual(user?.weight, null, 'Peso não deve ter sido persistido após rollback');
  });
});
